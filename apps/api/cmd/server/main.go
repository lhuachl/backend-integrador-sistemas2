package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"flowstate/api/internal/config"
	dbpkg "flowstate/api/internal/db"
	"flowstate/api/internal/handler"
	"flowstate/api/internal/middleware"
	"flowstate/api/internal/platform/postgres"
	"flowstate/api/internal/repository"
	"flowstate/api/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	_ = godotenv.Load()
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	logger, err := zap.NewProduction()
	if cfg.LogLevel == "debug" {
		logger, err = zap.NewDevelopment()
	}
	if err != nil {
		log.Fatalf("logger: %v", err)
	}
	defer logger.Sync()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := postgres.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("database connection failed", zap.Error(err))
	}
	defer pool.Close()

	queries := dbpkg.New(pool)

	userRepo := repository.NewUserRepository(queries)
	teamRepo := repository.NewTeamRepository(queries)
	noteRepo := repository.NewNoteRepository(queries)
	goalRepo := repository.NewGoalRepository(queries)
	taskRepo := repository.NewTaskRepository(queries)
	notifRepo := repository.NewNotificationRepository(queries)
	graphRepo := repository.NewGraphRepository(pool)

	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret, cfg.AccessTTL, cfg.RefreshTTL, cfg.GoogleClientID)
	noteSvc := service.NewNoteService(noteRepo, teamRepo)
	teamSvc := service.NewTeamService(teamRepo)
	goalSvc := service.NewGoalService(goalRepo)
	taskSvc := service.NewTaskService(taskRepo)
	notifSvc := service.NewNotificationService(notifRepo)
	graphSvc := service.NewGraphService(graphRepo)
	userSvc := service.NewUserService(userRepo)

	if cfg.Env == "dev" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(middleware.RequestID())
	r.Use(middleware.Logger(logger))
	r.Use(middleware.Recovery(logger))
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.CORS(cfg.CORSOrigins))
	r.Use(middleware.RateLimit(60, time.Minute))

	handler.RegisterRoutes(r, authSvc, noteSvc, teamSvc, goalSvc, taskSvc, notifSvc, graphSvc, userSvc, cfg.JWTSecret, logger)
	handler.RegisterSwagger(r)

	go func() {
		logger.Info("server starting", zap.String("port", cfg.Port))
		if err := r.Run(":" + cfg.Port); err != nil {
			logger.Fatal("server failed", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("shutting down gracefully")
}
