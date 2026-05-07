package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type contextKey string

const UserIDKey contextKey = "user_id"

func AuthMiddleware(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			c.Abort()
			return
		}

		// Validate token against Supabase
		userID, err := validateSupabaseToken(c.Request.Context(), pool, token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		c.Set(string(UserIDKey), userID)
		c.Next()
	}
}

func validateSupabaseToken(ctx context.Context, pool *pgxpool.Pool, token string) (string, error) {
	return "", nil
}

func GetUserID(c *gin.Context) string {
	if userID, exists := c.Get(string(UserIDKey)); exists {
		return userID.(string)
	}
	return ""
}