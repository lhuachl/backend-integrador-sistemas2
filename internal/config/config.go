package config

import (
	"os"
)

type Config struct {
	Port                string
	FrontendURL         string
	SupabaseURL         string
	SupabaseAnonKey     string
	SupabaseServiceKey  string
	ResendAPIKey        string
	EmailFrom           string
	OpenAIAPIKey        string
	OpenAIBaseURL       string
}

func Load() *Config {
	return &Config{
		Port:               getEnv("PORT", "8080"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:5173"),
		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		SupabaseAnonKey:    getEnv("SUPABASE_ANON_KEY", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		ResendAPIKey:       getEnv("RESEND_API_KEY", ""),
		EmailFrom:          getEnv("EMAIL_FROM", "FLOWSTATE <noreply@flowstate.app>"),
		OpenAIAPIKey:       getEnv("OPENAI_API_KEY", ""),
		OpenAIBaseURL:      getEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}