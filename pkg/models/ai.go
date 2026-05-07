package models

type UpdateNoteRequest struct {
	ContentJSON string `json:"content_json" binding:"required"`
}

type AICommandRequest struct {
	Command string `json:"command" binding:"required"`
	Input   string `json:"input" binding:"required"`
}

type AICommandResponse struct {
	Command   string `json:"command"`
	Result    string `json:"result"`
	SessionID string `json:"session_id"`
}