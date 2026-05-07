package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"rest-api/internal/config"
	"rest-api/internal/db"
	"rest-api/internal/email"
	"rest-api/internal/handlers"
	"rest-api/internal/middleware"
	"rest-api/internal/repositories"
	"rest-api/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()

	ctx := context.Background()

	connString := os.Getenv("DATABASE_URL")
	if connString == "" {
		connString = fmt.Sprintf("postgres://postgres:postgres@localhost:5432/flowstate?sslmode=disable")
	}

	database, err := config.NewDB(ctx, connString)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	queries := db.New(database.Pool)

	userRepo := repositories.NewUserRepository(queries)
	tokenRepo := repositories.NewTokenRepository(queries)
	taskRepo := repositories.NewTaskRepository(queries)
	noteRepo := repositories.NewNoteRepository(queries)
	timeblockRepo := repositories.NewTimeBlockRepository(queries)

	emailClient := email.NewClient(cfg.ResendAPIKey, cfg.EmailFrom)
	emailClient.LoadTemplate("confirmation", "internal/email/templates/layouts/base.html", "internal/email/templates/confirmation.html")

	authSvc := services.NewAuthService(userRepo, tokenRepo, database, emailClient)
	taskSvc := services.NewTaskService(taskRepo)
	noteSvc := services.NewNoteService(noteRepo)
	timeblockSvc := services.NewTimeBlockService(timeblockRepo)
	aiSvc := services.NewAIService(cfg.OpenAIAPIKey, cfg.OpenAIBaseURL)

	authHandler := handlers.NewAuthHandler(authSvc)
	taskHandler := handlers.NewTaskHandler(taskSvc)
	noteHandler := handlers.NewNoteHandler(noteSvc)
	timeblockHandler := handlers.NewTimeBlockHandler(timeblockSvc)
	aiHandler := handlers.NewAIHandler(aiSvc)

	r := gin.Default()

	r.Use(middleware.CORSMiddleware(cfg.FrontendURL))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now().Format(time.RFC3339)})
	})

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.GET("/confirm", authHandler.Confirm)
			auth.POST("/login", authHandler.Login)
		}

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(database.Pool))
		{
			tasks := protected.Group("/tasks")
			{
				tasks.GET("", taskHandler.List)
				tasks.POST("", taskHandler.Create)
				tasks.GET("/:id", taskHandler.Get)
				tasks.PUT("/:id", taskHandler.Update)
				tasks.PATCH("/:id/position", taskHandler.UpdatePosition)
				tasks.DELETE("/:id", taskHandler.Delete)
				tasks.GET("/:id/notes", noteHandler.Get)
				tasks.PUT("/:id/notes", noteHandler.Save)
			}

			timeblocks := protected.Group("/timeblocks")
			{
				timeblocks.GET("", timeblockHandler.List)
				timeblocks.POST("", timeblockHandler.Create)
				timeblocks.PUT("/:id", timeblockHandler.Update)
				timeblocks.DELETE("/:id", timeblockHandler.Delete)
			}

			protected.POST("/ai/command", aiHandler.Command)
		}
	}

	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}