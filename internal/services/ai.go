package services

import (
	"context"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

type AIService struct {
	client openai.Client
}

func NewAIService(apiKey, baseURL string) *AIService {
	client := openai.NewClient(
		option.WithAPIKey(apiKey),
		option.WithBaseURL(baseURL),
	)
	return &AIService{client: client}
}

func (s *AIService) Command(ctx context.Context, command, input string) (string, error) {
	resp, err := s.client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Model: openai.ChatModelGPT4oMini,
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage("You are a productivity assistant. Commands: /descomponer (break into subtasks), /estimar (estimate time), /planificar (create daily plan)."),
			openai.UserMessage(command + " " + input),
		},
	})
	if err != nil {
		return "", err
	}
	return resp.Choices[0].Message.Content, nil
}