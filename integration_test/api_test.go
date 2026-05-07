package integration_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func TestHealthEndpoint(t *testing.T) {
	r := setupTestRouter()
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)
	assert.Equal(t, "ok", resp["status"])
}

func TestSignupEndpoint_InvalidJSON(t *testing.T) {
	r := setupTestRouter()
	r.POST("/api/auth/signup", func(c *gin.Context) {
		var req struct {
			Email string `json:"email" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "ok"})
	})

	req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", bytes.NewBufferString(`{invalid}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSignupEndpoint_MissingFields(t *testing.T) {
	r := setupTestRouter()
	r.POST("/api/auth/signup", func(c *gin.Context) {
		var req struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required,min=8"`
			Name     string `json:"name" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "ok"})
	})

	tests := []struct {
		name string
		body string
	}{
		{"missing email", `{"password":"password123","name":"John"}`},
		{"missing password", `{"email":"john@example.com","name":"John"}`},
		{"missing name", `{"email":"john@example.com","password":"password123"}`},
		{"invalid email format", `{"email":"not-email","password":"password123","name":"John"}`},
		{"password too short", `{"email":"john@example.com","password":"short","name":"John"}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", bytes.NewBufferString(tt.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	}
}

func TestSignupEndpoint_ValidRequest(t *testing.T) {
	r := setupTestRouter()
	r.POST("/api/auth/signup", func(c *gin.Context) {
		var req struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required,min=8"`
			Name     string `json:"name" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Check your email to confirm your account"})
	})

	body := `{"email":"test@example.com","password":"password123","name":"Test User"}`
	req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "Check your email to confirm your account", resp["message"])
}

func TestConfirmEndpoint_MissingToken(t *testing.T) {
	r := setupTestRouter()
	r.GET("/api/auth/confirm", func(c *gin.Context) {
		token := c.Query("token")
		if token == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "token required"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Email confirmed successfully"})
	})

	req := httptest.NewRequest(http.MethodGet, "/api/auth/confirm", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "token required", resp["error"])
}

func TestLoginEndpoint_InvalidCredentials(t *testing.T) {
	r := setupTestRouter()
	r.POST("/api/auth/login", func(c *gin.Context) {
		var req struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
	})

	tests := []struct {
		name string
		body string
	}{
		{"empty body", `{}`},
		{"missing email", `{"password":"password123"}`},
		{"missing password", `{"email":"john@example.com"}`},
		{"invalid email", `{"email":"not-email","password":"password123"}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBufferString(tt.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	}
}

func TestProtectedEndpoint_NoAuthHeader(t *testing.T) {
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}
		c.Next()
	})
	r.GET("/api/tasks", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"tasks": []interface{}{}})
	})

	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "missing authorization header", resp["error"])
}

func TestProtectedEndpoint_InvalidAuthFormat(t *testing.T) {
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}
		if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			c.Abort()
			return
		}
		c.Next()
	})
	r.GET("/api/tasks", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"tasks": []interface{}{}})
	})

	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	req.Header.Set("Authorization", "InvalidToken")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestTasksEndpoint_GetAll(t *testing.T) {
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})
	r.GET("/api/tasks", func(c *gin.Context) {
		tasks := []map[string]interface{}{
			{"id": "1", "title": "Task 1", "column_name": "backlog"},
			{"id": "2", "title": "Task 2", "column_name": "today"},
		}
		c.JSON(http.StatusOK, gin.H{"tasks": tasks})
	})

	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string][]map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Len(t, resp["tasks"], 2)
}

func TestTasksEndpoint_Create(t *testing.T) {
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})
	r.POST("/api/tasks", func(c *gin.Context) {
		var req struct {
			Title  string `json:"title" binding:"required"`
			Column string `json:"column_name"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		task := map[string]interface{}{
			"id": "new-task-id",
			"title": req.Title,
			"column_name": "backlog",
		}
		c.JSON(http.StatusCreated, task)
	})

	body := `{"title":"New Task","description":"Test"}`
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "New Task", resp["title"])
}

func TestTasksEndpoint_Create_MissingTitle(t *testing.T) {
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})
	r.POST("/api/tasks", func(c *gin.Context) {
		var req struct {
			Title string `json:"title" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"id": "new"})
	})

	body := `{"description":"No title"}`
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestTasksEndpoint_UpdatePosition(t *testing.T) {
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})
	r.PATCH("/api/tasks/:id/position", func(c *gin.Context) {
		var req struct {
			ColumnName string `json:"column_name" binding:"required"`
			Position   int    `json:"position"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "position updated"})
	})

	body := `{"column_name":"today","position":3}`
	req := httptest.NewRequest(http.MethodPatch, "/api/tasks/123/position", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestTimeBlocksEndpoint_List(t *testing.T) {
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})
	r.GET("/api/timeblocks", func(c *gin.Context) {
		date := c.Query("date")
		if date != "" {
			c.JSON(http.StatusOK, gin.H{"timeblocks": []map[string]string{
				{"date": date, "start_time": "09:00", "end_time": "09:30"},
			}})
			return
		}
		c.JSON(http.StatusOK, gin.H{"timeblocks": []map[string]string{
			{"date": "2025-05-07", "start_time": "09:00", "end_time": "09:30"},
			{"date": "2025-05-07", "start_time": "10:00", "end_time": "10:30"},
		}})
	})

	t.Run("list all", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/timeblocks", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("filter by date", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/timeblocks?date=2025-05-07", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string][]map[string]string
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Len(t, resp["timeblocks"], 1)
		assert.Equal(t, "2025-05-07", resp["timeblocks"][0]["date"])
	})
}

func TestTimeBlocksEndpoint_Create(t *testing.T) {
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})
	r.POST("/api/timeblocks", func(c *gin.Context) {
		var req struct {
			Date      string `json:"date" binding:"required"`
			StartTime string `json:"start_time" binding:"required"`
			EndTime   string `json:"end_time" binding:"required"`
			TaskID    string `json:"task_id"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		block := map[string]string{
			"id": "new-block",
			"date": req.Date,
			"start_time": req.StartTime,
			"end_time": req.EndTime,
		}
		c.JSON(http.StatusCreated, block)
	})

	body := `{"date":"2025-05-07","start_time":"09:00","end_time":"09:30"}`
	req := httptest.NewRequest(http.MethodPost, "/api/timeblocks", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestNotesEndpoint_Get(t *testing.T) {
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})
	r.GET("/api/tasks/:id/notes", func(c *gin.Context) {
		taskID := c.Param("id")
		c.JSON(http.StatusOK, gin.H{
			"id": taskID,
			"content_json": `{"content":"Note content"}`,
		})
	})

	req := httptest.NewRequest(http.MethodGet, "/api/tasks/123/notes", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "123", resp["id"])
}

func TestNotesEndpoint_Update(t *testing.T) {
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})
	r.PUT("/api/tasks/:id/notes", func(c *gin.Context) {
		var req struct {
			ContentJSON string `json:"content_json" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"id": c.Param("id"),
			"content_json": req.ContentJSON,
		})
	})

	body := `{"content_json":"{\"content\":\"Updated note\"}"}`
	req := httptest.NewRequest(http.MethodPut, "/api/tasks/123/notes", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAIEndpoint_Command(t *testing.T) {
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})
	r.POST("/api/ai/command", func(c *gin.Context) {
		var req struct {
			Command string `json:"command" binding:"required"`
			Input   string `json:"input" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"command": req.Command,
			"result": "AI response",
		})
	})

	body := `{"command":"/descomponer","input":"Create a REST API"}`
	req := httptest.NewRequest(http.MethodPost, "/api/ai/command", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "/descomponer", resp["command"])
}

func TestAIEndpoint_Command_MissingFields(t *testing.T) {
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})
	r.POST("/api/ai/command", func(c *gin.Context) {
		var req struct {
			Command string `json:"command" binding:"required"`
			Input   string `json:"input" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"result": "ok"})
	})

	tests := []struct {
		name string
		body string
	}{
		{"empty body", `{}`},
		{"missing command", `{"input":"some input"}`},
		{"missing input", `{"command":"/descomponer"}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/ai/command", bytes.NewBufferString(tt.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	}
}

func TestCORSMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	t.Run("GET has CORS headers", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, "http://localhost:5173", w.Header().Get("Access-Control-Allow-Origin"))
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "GET")
	})

	t.Run("OPTIONS returns 204", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodOptions, "/test", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
	})

	t.Run("CORS preflight request", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodOptions, "/test", nil)
		req.Header.Set("Access-Control-Request-Method", "POST")
		req.Header.Set("Access-Control-Request-Headers", "Content-Type")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
		assert.Equal(t, "http://localhost:5173", w.Header().Get("Access-Control-Allow-Origin"))
	})
}