package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type rateEntry struct {
	count   int
	resetAt time.Time
}

func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	var mu sync.Mutex
	store := map[string]*rateEntry{}

	go func() {
		for range time.Tick(5 * time.Minute) {
			mu.Lock()
			now := time.Now()
			for k, v := range store {
				if now.After(v.resetAt) {
					delete(store, k)
				}
			}
			mu.Unlock()
		}
	}()

	return func(c *gin.Context) {
		key := c.ClientIP()
		mu.Lock()
		entry, ok := store[key]
		now := time.Now()
		if !ok || now.After(entry.resetAt) {
			entry = &rateEntry{resetAt: now.Add(window)}
			store[key] = entry
		}
		entry.count++
		remaining := limit - entry.count
		mu.Unlock()

		c.Header("X-RateLimit-Limit", strconv.Itoa(limit))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(entry.resetAt.Unix(), 10))

		if remaining < 0 {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{"code": "rate_limited", "message": "too many requests"},
			})
			return
		}
		c.Next()
	}
}
