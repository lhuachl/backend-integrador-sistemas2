package config

import (
	"errors"
	"os"
	"strings"
	"time"
)

type Config struct {
	Port            string
	DatabaseURL     string
	JWTSecret       string
	AccessTTL       time.Duration
	RefreshTTL      time.Duration
	GoogleClientID  string
	OpenRouterKey   string
	OpenRouterModel string
	LogLevel        string
	CORSOrigins     []string
	Env             string
}

func Load() (*Config, error) {
	accessTTL, err := time.ParseDuration(getEnv("ACCESS_TTL", "15m"))
	if err != nil {
		return nil, err
	}
	refreshTTL, err := time.ParseDuration(getEnv("REFRESH_TTL", "168h"))
	if err != nil {
		return nil, err
	}

	cfg := &Config{
		Port:            getEnv("PORT", "8080"),
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		JWTSecret:       os.Getenv("JWT_SECRET"),
		AccessTTL:       accessTTL,
		RefreshTTL:      refreshTTL,
		GoogleClientID:  os.Getenv("GOOGLE_CLIENT_ID"),
		OpenRouterKey:   os.Getenv("OPENROUTER_API_KEY"),
		OpenRouterModel: getEnv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
		LogLevel:        getEnv("LOG_LEVEL", "info"),
		CORSOrigins:     parseOrigins(getEnv("CORS_ORIGINS", "")),
		Env:             getEnv("ENV", "dev"),
	}

	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, errors.New("JWT_SECRET is required")
	}
	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseOrigins(raw string) []string {
	if raw == "" {
		return []string{"http://localhost:3000"}
	}
	return strings.Split(raw, ",")
}
