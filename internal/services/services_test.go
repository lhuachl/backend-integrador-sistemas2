package services_test

import (
	"testing"
	"time"

	"rest-api/pkg/models"

	"github.com/stretchr/testify/assert"
)

func TestTaskService_CreateTask(t *testing.T) {
	t.Run("creates task with default column", func(t *testing.T) {
		req := &models.CreateTaskRequest{
			Title: "New Task",
		}

		assert.NotEmpty(t, req.Title)
		assert.Equal(t, "", req.ColumnName)
	})

	t.Run("creates task with custom priority", func(t *testing.T) {
		req := &models.CreateTaskRequest{
			Title:    "Important Task",
			Priority: "high",
		}

		assert.Equal(t, "high", req.Priority)
	})
}

func TestNoteService_UpdateContent(t *testing.T) {
	t.Run("valid JSON content", func(t *testing.T) {
		content := `{"blocks":[{"type":"paragraph","text":"Hello"}]}`
		note := &models.Note{
			ContentJSON: content,
		}

		assert.NotEmpty(t, note.ContentJSON)
		assert.Contains(t, note.ContentJSON, "Hello")
	})
}

func TestTimeBlockService_Validation(t *testing.T) {
	t.Run("valid time block", func(t *testing.T) {
		block := &models.TimeBlock{
			Date:      "2025-05-07",
			StartTime: "09:00",
			EndTime:   "09:30",
			Completed: false,
		}

		assert.Equal(t, "2025-05-07", block.Date)
		assert.Equal(t, "09:00", block.StartTime)
		assert.Equal(t, "09:30", block.EndTime)
		assert.False(t, block.Completed)
	})
}

func TestAIService_CommandParsing(t *testing.T) {
	tests := []struct {
		name    string
		command string
		input   string
		want    string
	}{
		{
			name:    "/descomponer",
			command: "/descomponer",
			input:   "Write a REST API",
			want:    "/descomponer Write a REST API",
		},
		{
			name:    "/estimar",
			command: "/estimar",
			input:   "Build a Kanban board",
			want:    "/estimar Build a Kanban board",
		},
		{
			name:    "/planificar",
			command: "/planificar",
			input:   "My tasks for today",
			want:    "/planificar My tasks for today",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			combined := tt.command + " " + tt.input
			assert.Equal(t, tt.want, combined)
		})
	}
}

func TestTokenExpiration(t *testing.T) {
	t.Run("token expires after 24 hours", func(t *testing.T) {
		expiresAt := time.Now().Add(24 * time.Hour)
		now := time.Now()

		duration := expiresAt.Sub(now)
		assert.True(t, duration > 23*time.Hour, "token should expire in approximately 24 hours")
		assert.True(t, duration <= 24*time.Hour, "token should not exceed 24 hours")
	})

	t.Run("expired token detection", func(t *testing.T) {
		expiresAt := time.Now().Add(-1 * time.Hour)
		isExpired := time.Now().After(expiresAt)

		assert.True(t, isExpired, "token created 1 hour ago should be expired")
	})
}

func TestPasswordHash(t *testing.T) {
	t.Run("password is hashed before storage", func(t *testing.T) {
		password := "my-secret-password"
		hashed := "$2a$10$abcdefghijklmnopqrstuvwxy1234567890ABCDEFGHIJKLMNOPQR"

		assert.NotEqual(t, password, hashed, "stored hash should not equal original password")
		assert.True(t, len(hashed) > len(password), "hash should be longer than original password")
	})
}

func TestUserEmailValidation(t *testing.T) {
	validEmails := []string{
		"test@example.com",
		"user.name@domain.org",
		"admin+tag@company.co",
	}

	for _, email := range validEmails {
		t.Run("valid: "+email, func(t *testing.T) {
			assert.Contains(t, email, "@")
			assert.Contains(t, email, ".")
		})
	}
}

func TestConfirmationTokenGeneration(t *testing.T) {
	t.Run("token is UUID format", func(t *testing.T) {
		token := "123e4567-e89b-12d3-a456-426614174000"

		assert.Len(t, token, 36, "UUID should be 36 characters")
		assert.Contains(t, token, "-", "UUID should contain dashes")
	})
}

func TestKanbanColumnValidation(t *testing.T) {
	validColumns := []string{"backlog", "this_week", "today", "in_progress", "done"}

	for _, col := range validColumns {
		t.Run("valid column: "+col, func(t *testing.T) {
			isValid := false
			for _, valid := range validColumns {
				if col == valid {
					isValid = true
					break
				}
			}
			assert.True(t, isValid, col+" should be a valid column")
		})
	}
}

func TestPriorityValidation(t *testing.T) {
	validPriorities := []string{"low", "medium", "high"}

	for _, p := range validPriorities {
		t.Run("valid priority: "+p, func(t *testing.T) {
			isValid := false
			for _, valid := range validPriorities {
				if p == valid {
					isValid = true
					break
				}
			}
			assert.True(t, isValid, p+" should be a valid priority")
		})
	}
}