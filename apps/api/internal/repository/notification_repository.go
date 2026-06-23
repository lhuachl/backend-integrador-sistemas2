package repository

import (
	"context"
	db "flowstate/api/internal/db"
	"flowstate/api/internal/model"
)

type NotificationRepository interface {
	Create(ctx context.Context, userID, notifType, title, body string) (*model.Notification, error)
	ListByUser(ctx context.Context, userID string) ([]model.Notification, error)
	MarkRead(ctx context.Context, userID, notifID string) error
	MarkAllRead(ctx context.Context, userID string) error
	MarkReadByIDs(ctx context.Context, userID string, ids []string) error
}

func NewNotificationRepository(q *db.Queries) NotificationRepository {
	return &notificationRepo{q: q}
}

type notificationRepo struct{ q *db.Queries }

func (r *notificationRepo) Create(ctx context.Context, userID, notifType, title, body string) (*model.Notification, error) {
	row, err := r.q.CreateNotification(ctx, &db.CreateNotificationParams{
		Column1: userID,
		Column2: notifType,
		Column3: title,
		Column4: body,
	})
	if err != nil {
		return nil, err
	}
	return &model.Notification{
		ID:        row.ID,
		UserID:    row.UserID,
		Type:      row.Type,
		Title:     row.Title,
		Body:      row.Body,
		Read:      row.Read,
		CreatedAt: row.CreatedAt,
	}, nil
}

func (r *notificationRepo) ListByUser(ctx context.Context, userID string) ([]model.Notification, error) {
	rows, err := r.q.ListUserNotifications(ctx, userID)
	if err != nil {
		return nil, err
	}
	notifs := make([]model.Notification, len(rows))
	for i, row := range rows {
		notifs[i] = model.Notification{
			ID:        row.ID,
			UserID:    row.UserID,
			Type:      row.Type,
			Title:     row.Title,
			Body:      row.Body,
			Read:      row.Read,
			CreatedAt: row.CreatedAt,
		}
	}
	return notifs, nil
}

func (r *notificationRepo) MarkRead(ctx context.Context, userID, notifID string) error {
	return r.q.MarkNotificationRead(ctx, &db.MarkNotificationReadParams{
		Column1: notifID,
		Column2: userID,
	})
}

func (r *notificationRepo) MarkAllRead(ctx context.Context, userID string) error {
	return r.q.MarkAllNotificationsRead(ctx, userID)
}

func (r *notificationRepo) MarkReadByIDs(ctx context.Context, userID string, ids []string) error {
	return r.q.MarkNotificationsReadByIDs(ctx, &db.MarkNotificationsReadByIDsParams{
		Column1: ids,
		Column2: userID,
	})
}
