package main

import (
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/config"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/database"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/domain/repository"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/domain/service"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/handler"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/middleware"
	"github.com/Sa-Leonardo/MVNO_ArqDB/pkg/jwtutil"
	"github.com/Sa-Leonardo/MVNO_ArqDB/pkg/logger"
	"go.mongodb.org/mongo-driver/bson"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
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
	authSvc := service.NewAuthService(userRepo, jwt)
	authHandler := handler.NewAuthHandler(authSvc)

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