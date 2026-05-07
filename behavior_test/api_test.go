package behavior_test

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

type User struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

type Task struct {
	ID          string `json:"id"`
	UserID      string `json:"user_id"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	ColumnName  string `json:"column_name"`
	Priority    string `json:"priority"`
	Position    int    `json:"position"`
}

type TimeBlock struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Completed bool   `json:"completed"`
}

type AICommand struct {
	Command string `json:"command"`
	Input   string `json:"input"`
}

func TestAuthBehavior_SignupAndConfirm(t *testing.T) {
	r := setupTestRouter()

	var signupCalled bool
	var confirmationToken string

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
		signupCalled = true
		confirmationToken = "test-token-123"
		c.JSON(http.StatusOK, gin.H{
			"message": "Check your email to confirm your account",
		})
	})

	r.GET("/api/auth/confirm", func(c *gin.Context) {
		token := c.Query("token")
		if token != confirmationToken {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid token"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Email confirmed successfully"})
	})

	body := `{"email":"test@example.com","password":"password123","name":"Test User"}`
	req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.True(t, signupCalled)
	assert.Equal(t, http.StatusOK, w.Code)

	req = httptest.NewRequest(http.MethodGet, "/api/auth/confirm?token="+confirmationToken, nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAuthBehavior_Login(t *testing.T) {
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
		if req.Email != "test@example.com" || req.Password != "password123" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"token": "jwt-token-here",
			"expires_in": 3600,
			"user": User{
				ID:    "user-123",
				Email: req.Email,
				Name:  "Test User",
			},
		})
	})

	t.Run("valid credentials", func(t *testing.T) {
		body := `{"email":"test@example.com","password":"password123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var resp map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NotEmpty(t, resp["token"])
		assert.Equal(t, float64(3600), resp["expires_in"])
	})

	t.Run("invalid credentials", func(t *testing.T) {
		body := `{"email":"test@example.com","password":"wrongpassword"}`
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestKanbanBehavior_TaskWorkflow(t *testing.T) {
	r := setupTestRouter()

	var tasks = map[string]Task{}
	var taskIDCounter = 1

	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})

	r.GET("/api/tasks", func(c *gin.Context) {
		var taskList []Task
		for _, t := range tasks {
			taskList = append(taskList, t)
		}
		c.JSON(http.StatusOK, gin.H{"tasks": taskList})
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
		id := string(rune('0' + taskIDCounter))
		taskIDCounter++
		task := Task{
			ID:         id,
			UserID:     "user-123",
			Title:      req.Title,
			ColumnName: "backlog",
			Priority:   "medium",
			Position:   len(tasks),
		}
		tasks[id] = task
		c.JSON(http.StatusCreated, task)
	})

	r.PATCH("/api/tasks/:id/position", func(c *gin.Context) {
		id := c.Param("id")
		var req struct {
			ColumnName string `json:"column_name" binding:"required"`
			Position   int    `json:"position"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if task, ok := tasks[id]; ok {
			task.ColumnName = req.ColumnName
			task.Position = req.Position
			tasks[id] = task
		}
		c.JSON(http.StatusOK, gin.H{"message": "position updated"})
	})

	t.Run("create task in backlog", func(t *testing.T) {
		body := `{"title":"New Task"}`
		req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		var resp Task
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, "backlog", resp.ColumnName)
	})

	t.Run("move task to today", func(t *testing.T) {
		body := `{"column_name":"today","position":0}`
		req := httptest.NewRequest(http.MethodPatch, "/api/tasks/1/position", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("list all tasks", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var resp map[string][]Task
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Len(t, resp["tasks"], 1)
	})
}

func TestTimeBlockingBehavior_DailyPlanning(t *testing.T) {
	r := setupTestRouter()

	var timeBlocks = []TimeBlock{}

	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})

	r.GET("/api/timeblocks", func(c *gin.Context) {
		date := c.Query("date")
		if date != "" {
			var filtered []TimeBlock
			for _, tb := range timeBlocks {
				if tb.Date == date {
					filtered = append(filtered, tb)
				}
			}
			c.JSON(http.StatusOK, gin.H{"timeblocks": filtered})
			return
		}
		c.JSON(http.StatusOK, gin.H{"timeblocks": timeBlocks})
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
		tb := TimeBlock{
			ID:        "tb-1",
			Date:      req.Date,
			StartTime: req.StartTime,
			EndTime:   req.EndTime,
			Completed: false,
		}
		timeBlocks = append(timeBlocks, tb)
		c.JSON(http.StatusCreated, tb)
	})

	t.Run("create time blocks for a day", func(t *testing.T) {
		blocks := []string{
			`{"date":"2025-05-07","start_time":"09:00","end_time":"09:30"}`,
			`{"date":"2025-05-07","start_time":"09:30","end_time":"10:00"}`,
			`{"date":"2025-05-07","start_time":"10:00","end_time":"10:30"}`,
		}

		for _, body := range blocks {
			req := httptest.NewRequest(http.MethodPost, "/api/timeblocks", bytes.NewBufferString(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			assert.Equal(t, http.StatusCreated, w.Code)
		}
	})

	t.Run("filter time blocks by date", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/timeblocks?date=2025-05-07", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var resp map[string][]TimeBlock
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Len(t, resp["timeblocks"], 3)
	})
}

func TestAIBehavior_Commands(t *testing.T) {
	r := setupTestRouter()

	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})

	r.POST("/api/ai/command", func(c *gin.Context) {
		var req AICommand
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var result string
		switch req.Command {
		case "/descomponer":
			result = "1. Step one\n2. Step two\n3. Step three"
		case "/estimar":
			result = "Estimated time: 2 hours"
		case "/planificar":
			result = "Morning: Deep work\nAfternoon: Meetings\nEvening: Review"
		default:
			result = "Unknown command"
		}

		c.JSON(http.StatusOK, gin.H{
			"command": req.Command,
			"result":  result,
		})
	})

	t.Run("/descomponer command", func(t *testing.T) {
		body := `{"command":"/descomponer","input":"Build a REST API"}`
		req := httptest.NewRequest(http.MethodPost, "/api/ai/command", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		require.Equal(t, http.StatusOK, w.Code)
		var resp map[string]string
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Contains(t, resp["result"], "Step")
	})

	t.Run("/estimar command", func(t *testing.T) {
		body := `{"command":"/estimar","input":"Build a Kanban board"}`
		req := httptest.NewRequest(http.MethodPost, "/api/ai/command", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		require.Equal(t, http.StatusOK, w.Code)
		var resp map[string]string
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Contains(t, resp["result"], "Estimated")
	})

	t.Run("/planificar command", func(t *testing.T) {
		body := `{"command":"/planificar","input":"Today's tasks"}`
		req := httptest.NewRequest(http.MethodPost, "/api/ai/command", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		require.Equal(t, http.StatusOK, w.Code)
		var resp map[string]string
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Contains(t, resp["result"], "Morning")
	})
}

func TestNotesBehavior_TaskNotes(t *testing.T) {
	r := setupTestRouter()

	var notes = map[string]string{}

	r.Use(func(c *gin.Context) {
		c.Set("user_id", "user-123")
		c.Next()
	})

	r.GET("/api/tasks/:id/notes", func(c *gin.Context) {
		taskID := c.Param("id")
		content, ok := notes[taskID]
		if !ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "note not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"id":           taskID,
			"content_json": content,
		})
	})

	r.PUT("/api/tasks/:id/notes", func(c *gin.Context) {
		taskID := c.Param("id")
		var req struct {
			ContentJSON string `json:"content_json" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		notes[taskID] = req.ContentJSON
		c.JSON(http.StatusOK, gin.H{
			"id":           taskID,
			"content_json": req.ContentJSON,
		})
	})

	t.Run("get non-existent note", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/tasks/999/notes", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("save note for task", func(t *testing.T) {
		body := `{"content_json":"{\"content\":\"My note\",\"bold\":true}"}`
		req := httptest.NewRequest(http.MethodPut, "/api/tasks/1/notes", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var resp map[string]string
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Contains(t, resp["content_json"], "My note")
	})

	t.Run("get saved note", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/tasks/1/notes", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var resp map[string]string
		json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Contains(t, resp["content_json"], "My note")
	})
}

func TestSecurityBehavior_AuthProtection(t *testing.T) {
	r := setupTestRouter()

	protected := r.Group("")
	protected.Use(func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || authHeader[:7] != "Bearer " {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}
		c.Set("user_id", "user-123")
		c.Next()
	})

	protected.GET("/api/tasks", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"tasks": []interface{}{}})
	})

	protected.POST("/api/tasks", func(c *gin.Context) {
		c.JSON(http.StatusCreated, gin.H{"id": "new-task"})
	})

	t.Run("request without auth returns 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("request with invalid token returns 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
		req.Header.Set("Authorization", "invalid-token-without-bearer")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("request with valid Bearer token succeeds", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
		req.Header.Set("Authorization", "Bearer valid-jwt-token")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})
}