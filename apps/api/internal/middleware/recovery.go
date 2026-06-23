package middleware

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"net/http"
)

func Recovery(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				logger.Error("panic recovered",
					zap.Any("panic", err),
					zap.String("path", c.Request.URL.Path),
					zap.String("request_id", GetRequestID(c)),
				)
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error": gin.H{"code": "internal_error", "message": "internal server error"},
				})
			}
		}()
		c.Next()
	}
}
