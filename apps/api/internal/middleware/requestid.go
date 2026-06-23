package middleware

import (
	"context"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const requestIDKey = "request_id"

type ctxKey string

const ctxRequestID ctxKey = "request-id"

func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := uuid.NewString()
		c.Set(requestIDKey, id)
		c.Header("X-Request-ID", id)
		ctx := context.WithValue(c.Request.Context(), ctxRequestID, id)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

func GetRequestID(c *gin.Context) string {
	if id, ok := c.Get(requestIDKey); ok {
		return id.(string)
	}
	return ""
}
