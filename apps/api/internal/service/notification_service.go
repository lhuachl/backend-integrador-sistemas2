package service

import (
	"context"
	"fmt"

	"flowstate/api/internal/model"
	"flowstate/api/internal/repository"
)

type NotificationService struct {
	repo repository.NotificationRepository
}

func NewNotificationService(repo repository.NotificationRepository) *NotificationService {
	return &NotificationService{repo: repo}
}

func (s *NotificationService) Create(ctx context.Context, userID, notifType, title, body string) (*model.Notification, error) {
	notif, err := s.repo.Create(ctx, userID, notifType, title, body)
	if err != nil {
		return nil, fmt.Errorf("create notification: %w", err)
	}
	return notif, nil
}

func (s *NotificationService) ListByUser(ctx context.Context, userID string) ([]model.Notification, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *NotificationService) MarkRead(ctx context.Context, userID, notifID string) error {
	return s.repo.MarkRead(ctx, userID, notifID)
}

func (s *NotificationService) MarkAllRead(ctx context.Context, userID string) error {
	return s.repo.MarkAllRead(ctx, userID)
}

func (s *NotificationService) MarkReadByIDs(ctx context.Context, userID string, ids []string) error {
	return s.repo.MarkReadByIDs(ctx, userID, ids)
}
