package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/config"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/database"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/domain/repository"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/domain/service"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/handler"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/middleware"
	"github.com/Sa-Leonardo/MVNO_ArqDB/pkg/jwtutil"
	"github.com/Sa-Leonardo/MVNO_ArqDB/pkg/logger"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func main() {

	cfg := config.Load()
	logger.Init(cfg.AppEnv)
	defer logger.Sync()

	db := database.Connect(cfg.MongoURI, cfg.MongoDB)
	defer db.Disconnect()

	collections, err := db.DB.ListCollectionNames(context.Background(), bson.M{})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("BANCO EM USO:", db.DB.Name())
	fmt.Println("COLLECTIONS:", collections)

	// Dependências
	jwt := jwtutil.New(cfg.JWTSecret, cfg.JWTExpiryHours)
	userRepo := repository.NewUserRepository(db.DB)
	if err := userRepo.EnsureIndexes(context.Background()); err != nil {
		log.Fatalf("erro ao criar indices da collection users: %v", err)
	}
	mvnoRepo := repository.NewMVNORepository(db.DB)
	if err := mvnoRepo.EnsureIndexes(context.Background()); err != nil {
		log.Fatalf("erro ao criar indices das collections MVNO: %v", err)
	}
	authSvc := service.NewAuthService(userRepo, jwt)
	mvnoSvc := service.NewMVNOService(mvnoRepo)
	authHandler := handler.NewAuthHandler(authSvc)
	mvnoHandler := handler.NewMVNOHandler(mvnoSvc)

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// 5. Health check
	router.GET("/health", func(c *gin.Context) {
		// Tenta pingar o MongoDB
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		mongoStatus := "ok"
		if err := db.Client.Ping(ctx, nil); err != nil {
			mongoStatus = "erro: " + err.Error()
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"version": "v1",
			"env":     cfg.AppEnv,
			"database": gin.H{
				"status": mongoStatus,
				"name":   cfg.MongoDB,
			},
		})
	})

	// Rotas públicas
	auth := router.Group("/auth")
	{
		auth.POST("/login", authHandler.Login)
	}

	// Rotas protegidas
	api := router.Group("/api/v1")
	api.Use(middleware.Auth(jwt))
	{
		api.GET("/auth/me", authHandler.Me)

		// Só admin pode criar usuários
		users := api.Group("/users")
		users.Use(middleware.RequireRole("admin"))
		{
			users.POST("", authHandler.CreateUser)

			users.GET("", authHandler.ListUsers)

			users.GET("/:id", authHandler.GetUser)

			users.PUT("/:id", authHandler.UpdateUser)

			users.PATCH("/:id/deactivate", authHandler.DeactivateUser)

			users.PATCH("/:id/reactivate", authHandler.ReactivateUser)

			users.PATCH("/:id/password", authHandler.ChangePassword)
		}

		clientes := api.Group("/clientes")
		{
			clientes.GET("", mvnoHandler.ListClientes)
			clientes.POST("", middleware.RequireRole("admin", "operator"), mvnoHandler.CreateCliente)
			clientes.PUT("/:id", middleware.RequireRole("admin", "operator"), mvnoHandler.UpdateCliente)
			clientes.DELETE("/:id", middleware.RequireRole("admin"), mvnoHandler.DeleteCliente)
		}

		planos := api.Group("/planos")
		{
			planos.GET("", mvnoHandler.ListPlanos)
			planos.POST("", middleware.RequireRole("admin"), mvnoHandler.CreatePlano)
			planos.PUT("/:id", middleware.RequireRole("admin"), mvnoHandler.UpdatePlano)
		}

		chips := api.Group("/chips")
		{
			chips.GET("", mvnoHandler.ListChips)
			chips.POST("", middleware.RequireRole("admin", "operator"), mvnoHandler.CreateChip)
			chips.GET("/lotes", middleware.RequireRole("admin", "operator"), mvnoHandler.ListLotes)
			chips.POST("/lotes", middleware.RequireRole("admin", "operator"), mvnoHandler.CreateLoteChips)
			chips.POST("/import-demo", middleware.RequireRole("admin"), mvnoHandler.ImportDemoChips)
			chips.GET("/:iccid", mvnoHandler.GetChip)
			chips.POST("/:iccid/ativar", middleware.RequireRole("admin", "operator"), mvnoHandler.ActivateChip)
			chips.GET("/:iccid/recargas", mvnoHandler.ListRecargas)
			chips.POST("/:iccid/recargas", middleware.RequireRole("admin", "operator"), mvnoHandler.CreateRecarga)
			chips.GET("/:iccid/assinaturas", mvnoHandler.ListAssinaturas)
		}
	}

	srv := &http.Server{Addr: ":" + cfg.AppPort, Handler: router}

	go func() {
		log.Printf("servidor rodando na porta %s", cfg.AppPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("erro: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
	log.Println("servidor encerrado")

}

// funcção de teste de hash de senha para o usuário admin com senha "123456"

// func hashPassword() {
// 	hash, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
// 	fmt.Println("o seu hash é: ",string(hash))
// }
