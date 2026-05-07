package services

import (
	"context"
	"fmt"

	"rest-api/internal/repositories"
	"rest-api/pkg/models"

	"github.com/google/uuid"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

const (
	MaxContextSessions = 5
	CompactionThreshold = 6
)

type AIService struct {
	client    openai.Client
	sessionRepo *repositories.AISessionRepository
}

func NewAIService(apiKey, baseURL string, sessionRepo *repositories.AISessionRepository) *AIService {
	client := openai.NewClient(
		option.WithAPIKey(apiKey),
		option.WithBaseURL(baseURL),
	)
	return &AIService{client: client, sessionRepo: sessionRepo}
}

func (s *AIService) Command(ctx context.Context, userID uuid.UUID, command, input string) (*models.AICommandResponse, error) {
	contextStr, err := s.buildContext(ctx, userID, command, input)
	if err != nil {
		return nil, err
	}

	resp, err := s.client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Model: openai.ChatModelGPT4oMini,
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage("You are a productivity assistant. Commands: /descomponer (break into subtasks), /estimar (estimate time), /planificar (create daily plan). Always be concise and actionable."),
			openai.UserMessage(contextStr),
		},
	})
	if err != nil {
		return nil, err
	}

	result := resp.Choices[0].Message.Content

	count, err := s.sessionRepo.CountByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	if count >= CompactionThreshold {
		if err := s.compactSessions(ctx, userID); err != nil {
			return nil, err
		}
	}

	session, err := s.sessionRepo.Create(ctx, userID, command, input, result)
	if err != nil {
		return nil, err
	}

	return &models.AICommandResponse{
		Command:   command,
		Result:    result,
		SessionID: session.ID,
	}, nil
}

func (s *AIService) buildContext(ctx context.Context, userID uuid.UUID, command, input string) (string, error) {
	sessions, err := s.sessionRepo.GetByUser(ctx, userID, MaxContextSessions)
	if err != nil {
		return command + " " + input, nil
	}

	if len(sessions) == 0 {
		return command + " " + input, nil
	}

	contextStr := "Previous sessions:\n"
	for _, session := range sessions {
		summary := session.Command
		if session.InputSummary != nil {
			summary += " - " + *session.InputSummary
		}
		if session.OutputSummary != nil {
			summary += " → " + *session.OutputSummary
		}
		if len(summary) > 100 {
			summary = summary[:100] + "..."
		}
		contextStr += "- " + summary + "\n"
	}
	contextStr += "\nCurrent: " + command + " " + input
	return contextStr, nil
}

func (s *AIService) compactSessions(ctx context.Context, userID uuid.UUID) error {
	sessions, err := s.sessionRepo.GetByUser(ctx, userID, CompactionThreshold)
	if err != nil {
		return err
	}

	if len(sessions) < CompactionThreshold {
		return nil
	}

	sessionsToCompact := sessions[:MaxContextSessions]

	summaryInput := ""
	for _, session := range sessionsToCompact {
		summaryInput += fmt.Sprintf("- Command: %s", session.Command)
		if session.InputSummary != nil {
			summaryInput += fmt.Sprintf(", Input: %s", *session.InputSummary)
		}
		if session.OutputSummary != nil {
			summaryInput += fmt.Sprintf(", Output: %s", *session.OutputSummary)
		}
		summaryInput += "\n"
	}

	resp, err := s.client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Model: openai.ChatModelGPT4oMini,
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage("Summarize the following AI assistant sessions into a brief context (2-3 sentences max) that captures the user's main goals and patterns. Be concise."),
			openai.UserMessage(summaryInput),
		},
	})
	if err != nil {
		return err
	}

	summary := resp.Choices[0].Message.Content

	_, err = s.sessionRepo.Create(ctx, userID, "/compact", fmt.Sprintf("Summarized %d sessions", MaxContextSessions), summary)
	if err != nil {
		return err
	}

	return nil
}

func (s *AIService) GetSessions(ctx context.Context, userID uuid.UUID) ([]*models.AISession, error) {
	return s.sessionRepo.GetByUser(ctx, userID, MaxContextSessions+1)
}

func (s *AIService) GetSession(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) (*models.AISession, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if session.UserID != userID {
		return nil, fmt.Errorf("unauthorized")
	}
	return session, nil
}