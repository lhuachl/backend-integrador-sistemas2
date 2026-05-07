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
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "rest-api/docs"
)

// @title FLOWSTATE API
// @version 1.0
// @description API for task management with Kanban + Timeboxing + AI commands
// @host localhost:8080
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
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
	aiSessionRepo := repositories.NewAISessionRepository(queries)

	emailClient := email.NewClient(cfg.ResendAPIKey, cfg.EmailFrom)
	emailClient.LoadTemplate("confirmation", "internal/email/templates/layouts/base.html", "internal/email/templates/confirmation.html")

	authSvc := services.NewAuthService(userRepo, tokenRepo, database, emailClient, cfg.SupabaseURL, cfg.SupabaseAnonKey, cfg.SupabaseServiceKey)
	taskSvc := services.NewTaskService(taskRepo)
	noteSvc := services.NewNoteService(noteRepo)
	timeblockSvc := services.NewTimeBlockService(timeblockRepo)
	aiSvc := services.NewAIService(cfg.OpenAIAPIKey, cfg.OpenAIBaseURL, aiSessionRepo)

	authHandler := handlers.NewAuthHandler(authSvc)
	taskHandler := handlers.NewTaskHandler(taskSvc)
	noteHandler := handlers.NewNoteHandler(noteSvc, taskSvc)
	timeblockHandler := handlers.NewTimeBlockHandler(timeblockSvc)
	aiHandler := handlers.NewAIHandler(aiSvc)
	dashboardHandler := handlers.NewDashboardHandler(taskSvc, timeblockSvc)

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.RequestIDMiddleware())

	r.Use(middleware.CORSMiddleware(cfg.FrontendURL))

	r.Static("/static", "./static")

	r.GET("/docs", func(c *gin.Context) {
		c.File("./static/swagger-synthwave.html")
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now().Format(time.RFC3339)})
	})

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.GET("/confirm", authHandler.Confirm)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", authHandler.Me)
		}

		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.SupabaseURL, cfg.SupabaseAnonKey))
		{
			tasks := protected.Group("/tasks")
			{
				tasks.GET("", taskHandler.List)
				tasks.POST("", taskHandler.Create)
				tasks.GET("/:id", taskHandler.Get)
				tasks.PUT("/:id", taskHandler.Update)
				tasks.PATCH("/:id/position", taskHandler.UpdatePosition)
				tasks.DELETE("/:id", taskHandler.Delete)
				tasks.POST("/:id/complete", taskHandler.Complete)
				tasks.GET("/:id/note", noteHandler.Get)
				tasks.PUT("/:id/note", noteHandler.Save)
			}

			timeblocks := protected.Group("/timeblocks")
			{
				timeblocks.GET("", timeblockHandler.List)
				timeblocks.GET("/today", timeblockHandler.GetToday)
				timeblocks.POST("", timeblockHandler.Create)
				timeblocks.PUT("/:id", timeblockHandler.Update)
				timeblocks.DELETE("/:id", timeblockHandler.Delete)
				timeblocks.POST("/:id/start", timeblockHandler.StartBlock)
				timeblocks.POST("/:id/complete", timeblockHandler.CompleteBlock)
			}

			ai := protected.Group("/ai")
			{
				ai.POST("/command", aiHandler.Command)
				ai.GET("/sessions", aiHandler.ListSessions)
				ai.GET("/sessions/:id", aiHandler.GetSession)
			}

			protected.GET("/dashboard", dashboardHandler.GetDashboard)
			protected.GET("/today", dashboardHandler.GetToday)
			protected.GET("/focus", dashboardHandler.GetFocus)
		}
	}

	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on :%s", port)
	log.Printf("Swagger UI: http://localhost:%s/swagger/index.html (or /docs for synthwave theme)", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}