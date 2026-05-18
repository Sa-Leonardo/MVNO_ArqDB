package main

import (
	"context"
	"github.com/gin-gonic/gin"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/config"
	"github.com/Sa-Leonardo/MVNO_ArqDB/internal/database"
	"github.com/Sa-Leonardo/MVNO_ArqDB/pkg/logger"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// 1. Carrega configuração
	cfg := config.Load()

	// 2. Inicializa logger
	logger.Init(cfg.AppEnv)
	defer logger.Sync()

	// 3. Conecta ao MongoDB
	db := database.Connect(cfg.MongoURI, cfg.MongoDB)
	defer db.Disconnect()

	// 4. Configura o Gin
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

	// 6. Sobe o servidor com graceful shutdown
	srv := &http.Server{
		Addr:    ":" + cfg.AppPort,
		Handler: router,
	}

	go func() {
		log.Printf("servidor rodando na porta %s", cfg.AppPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("erro ao subir servidor: %v", err)
		}
	}()

	// Aguarda sinal de encerramento (Ctrl+C)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("encerrando servidor...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("erro no shutdown: %v", err)
	}

	log.Println("servidor encerrado")
}


