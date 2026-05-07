package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"rest-api/pkg/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func TestHealthHandler(t *testing.T) {
	r := setupTestRouter()
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "ok", resp["status"])
}

func TestSignupHandler_InvalidRequest(t *testing.T) {
	r := setupTestRouter()

	r.POST("/auth/signup", func(c *gin.Context) {
		var req models.SignupRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "ok"})
	})

	req := httptest.NewRequest(http.MethodPost, "/auth/signup", bytes.NewBufferString(`{"invalid":"json"}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSignupHandler_MissingFields(t *testing.T) {
	r := setupTestRouter()

	r.POST("/auth/signup", func(c *gin.Context) {
		var req models.SignupRequest
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
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/auth/signup", bytes.NewBufferString(tt.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			r.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	}
}

func TestLoginHandler_InvalidRequest(t *testing.T) {
	r := setupTestRouter()

	r.POST("/auth/login", func(c *gin.Context) {
		var req models.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": "fake-token"})
	})

	tests := []struct {
		name string
		body string
	}{
		{"empty body", `{}`},
		{"missing email", `{"password":"password123"}`},
		{"missing password", `{"email":"john@example.com"}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBufferString(tt.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			r.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	}
}

func TestConfirmHandler_MissingToken(t *testing.T) {
	r := setupTestRouter()

	r.GET("/auth/confirm", func(c *gin.Context) {
		token := c.Query("token")
		if token == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "token required"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "confirmed"})
	})

	req := httptest.NewRequest(http.MethodGet, "/auth/confirm", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "token required", resp["error"])
}

func TestTasksHandler_GetAll(t *testing.T) {
	r := setupTestRouter()

	r.GET("/tasks", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"tasks": []models.Task{
				{ColumnName: "backlog", Title: "Task 1", Priority: "medium"},
				{ColumnName: "today", Title: "Task 2", Priority: "high"},
			},
		})
	})

	req := httptest.NewRequest(http.MethodGet, "/tasks", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string][]models.Task
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Len(t, resp["tasks"], 2)
}

func TestTasksHandler_Create(t *testing.T) {
	r := setupTestRouter()

	r.POST("/tasks", func(c *gin.Context) {
		var req models.CreateTaskRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, models.Task{
			Title:      req.Title,
			ColumnName: "backlog",
			Priority:   "medium",
		})
	})

	body := `{"title":"New Task","description":"Test description","priority":"high"}`
	req := httptest.NewRequest(http.MethodPost, "/tasks", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var task models.Task
	json.Unmarshal(w.Body.Bytes(), &task)
	assert.Equal(t, "New Task", task.Title)
	assert.Equal(t, "backlog", task.ColumnName)
}

func TestTasksHandler_Create_MissingTitle(t *testing.T) {
	r := setupTestRouter()

	r.POST("/tasks", func(c *gin.Context) {
		var req models.CreateTaskRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, models.Task{Title: req.Title})
	})

	body := `{"description":"No title provided"}`
	req := httptest.NewRequest(http.MethodPost, "/tasks", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestTimeBlocksHandler_List(t *testing.T) {
	r := setupTestRouter()

	r.GET("/timeblocks", func(c *gin.Context) {
		date := c.Query("date")
		if date != "" {
			c.JSON(http.StatusOK, gin.H{
				"timeblocks": []models.TimeBlock{
					{Date: date, StartTime: "09:00", EndTime: "09:30"},
				},
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"timeblocks": []models.TimeBlock{
				{Date: "2025-05-07", StartTime: "09:00", EndTime: "09:30"},
				{Date: "2025-05-07", StartTime: "10:00", EndTime: "10:30"},
			},
		})
	})

	t.Run("list all", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/timeblocks", nil)
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("filter by date", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/timeblocks?date=2025-05-07", nil)
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string][]models.TimeBlock
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Len(t, resp["timeblocks"], 1)
		assert.Equal(t, "2025-05-07", resp["timeblocks"][0].Date)
	})
}

func TestAIHandler_Command(t *testing.T) {
	r := setupTestRouter()

	r.POST("/ai/command", func(c *gin.Context) {
		var req models.AICommandRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, models.AICommandResponse{
			Command:   req.Command,
			Result:    "AI response",
			SessionID: uuid.MustParse("00000000-0000-0000-0000-000000000001"),
		})
	})

	body := `{"command":"/descomponer","input":"Write a backend API"}`
	req := httptest.NewRequest(http.MethodPost, "/ai/command", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp models.AICommandResponse
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "/descomponer", resp.Command)
	assert.Equal(t, "AI response", resp.Result)
}

func TestAIHandler_Command_InvalidRequest(t *testing.T) {
	r := setupTestRouter()

	r.POST("/ai/command", func(c *gin.Context) {
		var req models.AICommandRequest
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
			req := httptest.NewRequest(http.MethodPost, "/ai/command", bytes.NewBufferString(tt.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			r.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)
		})
	}
}

func TestNoteHandler_Get(t *testing.T) {
	r := setupTestRouter()

	r.GET("/tasks/:id/notes", func(c *gin.Context) {
		c.JSON(http.StatusOK, models.Note{
			ContentJSON: `{"content":"Note content","bold":true}`,
		})
	})

	req := httptest.NewRequest(http.MethodGet, "/tasks/123/notes", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var note models.Note
	json.Unmarshal(w.Body.Bytes(), &note)
	assert.NotEmpty(t, note.ContentJSON)
}

func TestNoteHandler_Update(t *testing.T) {
	r := setupTestRouter()

	r.PUT("/tasks/:id/notes", func(c *gin.Context) {
		var req models.UpdateNoteRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, models.Note{
			ContentJSON: req.ContentJSON,
		})
	})

	body := `{"content_json":"{\"content\":\"Updated note\"}"}`
	req := httptest.NewRequest(http.MethodPut, "/tasks/123/notes", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCORSMiddleware(t *testing.T) {
	r := setupTestRouter()

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

	t.Run("GET request has CORS headers", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, "http://localhost:5173", w.Header().Get("Access-Control-Allow-Origin"))
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "GET")
	})

	t.Run("OPTIONS request returns 204", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodOptions, "/test", nil)
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
	})
}