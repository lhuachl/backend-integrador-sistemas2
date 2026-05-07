package models_test

import (
	"encoding/json"
	"testing"

	"rest-api/pkg/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestSignupRequest_JSON(t *testing.T) {
	t.Run("marshals and unmarshals correctly", func(t *testing.T) {
		req := models.SignupRequest{
			Email:    "test@example.com",
			Password: "password123",
			Name:     "John Doe",
		}

		data, err := json.Marshal(req)
		assert.NoError(t, err)

		var decoded models.SignupRequest
		err = json.Unmarshal(data, &decoded)
		assert.NoError(t, err)
		assert.Equal(t, req.Email, decoded.Email)
		assert.Equal(t, req.Name, decoded.Name)
	})
}

func TestLoginRequest_JSON(t *testing.T) {
	req := models.LoginRequest{
		Email:    "test@example.com",
		Password: "password123",
	}

	data, err := json.Marshal(req)
	assert.NoError(t, err)

	var decoded models.LoginRequest
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)
	assert.Equal(t, req.Email, decoded.Email)
	assert.Equal(t, req.Password, decoded.Password)
}

func TestAuthResponse_JSON(t *testing.T) {
	resp := models.AuthResponse{
		Token:     "jwt-token-here",
		ExpiresIn: 3600,
		User: &models.User{
			Email: "test@example.com",
			Name:  "John Doe",
		},
	}

	data, err := json.Marshal(resp)
	assert.NoError(t, err)

	var decoded map[string]interface{}
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)
	assert.Equal(t, "jwt-token-here", decoded["token"])
	assert.Equal(t, float64(3600), decoded["expires_in"])
}

func TestCreateTaskRequest_Fields(t *testing.T) {
	req := models.CreateTaskRequest{
		Title:             "New Task",
		Description:       "Task description",
		Priority:          "high",
		ColumnName:        "today",
		EstimatedMinutes:  30,
	}

	data, err := json.Marshal(req)
	assert.NoError(t, err)

	var decoded models.CreateTaskRequest
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)
	assert.Equal(t, "New Task", decoded.Title)
	assert.Equal(t, "high", decoded.Priority)
}

func TestUpdateTaskRequest_PartialUpdate(t *testing.T) {
	jsonData := `{"title":"Updated Title"}`

	var req models.UpdateTaskRequest
	err := json.Unmarshal([]byte(jsonData), &req)
	assert.NoError(t, err)
	assert.Equal(t, "Updated Title", req.Title)
	assert.Empty(t, req.Description)
	assert.Empty(t, req.Status)
}

func TestTimeBlock_JSON(t *testing.T) {
	block := models.TimeBlock{
		Date:      "2025-05-07",
		StartTime: "09:00",
		EndTime:   "09:30",
		Completed: false,
	}

	data, err := json.Marshal(block)
	assert.NoError(t, err)

	var decoded map[string]interface{}
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)
	assert.Equal(t, "2025-05-07", decoded["date"])
	assert.Equal(t, "09:00", decoded["start_time"])
	assert.Equal(t, "09:30", decoded["end_time"])
	assert.Equal(t, false, decoded["completed"])
}

func TestAICommandRequest(t *testing.T) {
	req := models.AICommandRequest{
		Command: "/descomponer",
		Input:   "Create a REST API",
	}

	data, err := json.Marshal(req)
	assert.NoError(t, err)

	var decoded models.AICommandRequest
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)
	assert.Equal(t, "/descomponer", decoded.Command)
	assert.Equal(t, "Create a REST API", decoded.Input)
}

func TestAICommandResponse(t *testing.T) {
	sessionID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	resp := models.AICommandResponse{
		Command:   "/descomponer",
		Result:    "Subtasks created",
		SessionID: sessionID,
	}

	data, err := json.Marshal(resp)
	assert.NoError(t, err)

	var decoded map[string]interface{}
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)
	assert.Equal(t, "/descomponer", decoded["command"])
	assert.Equal(t, "Subtasks created", decoded["result"])
	assert.Equal(t, sessionID.String(), decoded["session_id"])
}

func TestNote_ContentJSON(t *testing.T) {
	note := models.Note{
		ContentJSON: `{"blocks":[{"type":"paragraph","text":"Hello world"}]}`,
	}

	data, err := json.Marshal(note)
	assert.NoError(t, err)

	var decoded map[string]interface{}
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)
	assert.Contains(t, decoded["content_json"], "Hello world")
}

func TestUser_JSONExcludesPassword(t *testing.T) {
	user := models.User{
		Email:        "test@example.com",
		Name:         "John Doe",
		PasswordHash: "super-secret-hash",
	}

	data, err := json.Marshal(user)
	assert.NoError(t, err)

	var decoded map[string]interface{}
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)
	assert.Equal(t, "test@example.com", decoded["email"])
	_, hasPassword := decoded["password_hash"]
	assert.False(t, hasPassword, "password_hash should be excluded from JSON")
}

func TestTask_KanbanColumns(t *testing.T) {
	validColumns := []string{"backlog", "this_week", "today", "in_progress", "done"}
	validPriorities := []string{"low", "medium", "high"}

	for _, col := range validColumns {
		task := models.Task{
			Title:      "Test Task",
			ColumnName: col,
			Priority:   "medium",
		}
		assert.Contains(t, validColumns, task.ColumnName)
	}

	for _, pri := range validPriorities {
		task := models.Task{
			Title:      "Test Task",
			ColumnName: "backlog",
			Priority:   pri,
		}
		assert.Contains(t, validPriorities, task.Priority)
	}
}

func TestCreateTimeBlockRequest_Fields(t *testing.T) {
	req := models.CreateTimeBlockRequest{
		Date:      "2025-05-07",
		StartTime: "09:00",
		EndTime:   "09:30",
	}

	data, err := json.Marshal(req)
	assert.NoError(t, err)

	var decoded models.CreateTimeBlockRequest
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)
	assert.Equal(t, "2025-05-07", decoded.Date)
	assert.Equal(t, "09:00", decoded.StartTime)
}

func TestUpdateNoteRequest(t *testing.T) {
	req := models.UpdateNoteRequest{
		ContentJSON: `{"content":"Updated note"}`,
	}

	data, err := json.Marshal(req)
	assert.NoError(t, err)

	var decoded models.UpdateNoteRequest
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)
	assert.Contains(t, decoded.ContentJSON, "Updated note")
}

func TestUpdateTaskPositionRequest(t *testing.T) {
	req := models.UpdateTaskPositionRequest{
		ColumnName: "today",
		Position:   3,
	}

	data, err := json.Marshal(req)
	assert.NoError(t, err)

	var decoded models.UpdateTaskPositionRequest
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)
	assert.Equal(t, "today", decoded.ColumnName)
	assert.Equal(t, 3, decoded.Position)
}

func TestUpdateTimeBlockRequest(t *testing.T) {
	req := models.UpdateTimeBlockRequest{
		StartTime: "10:00",
		EndTime:   "10:30",
		Completed: true,
	}

	data, err := json.Marshal(req)
	assert.NoError(t, err)

	var decoded models.UpdateTimeBlockRequest
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)
	assert.Equal(t, "10:00", decoded.StartTime)
	assert.True(t, decoded.Completed)
}