package repositories

import (
	"context"
	"time"

	"rest-api/internal/db"
	"rest-api/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type TimeBlockRepository struct {
	q *db.Queries
}

func NewTimeBlockRepository(q *db.Queries) *TimeBlockRepository {
	return &TimeBlockRepository{q: q}
}

func (r *TimeBlockRepository) GetByUserDate(ctx context.Context, userID uuid.UUID, date string) ([]*models.TimeBlock, error) {
	parsedDate, _ := time.Parse("2006-01-02", date)
	blocks, err := r.q.GetTimeBlocksByUserDate(ctx, db.GetTimeBlocksByUserDateParams{
		UserID: pgtype.UUID{Bytes: userID},
		Date:   pgtype.Date{Time: parsedDate, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return toTimeBlocks(blocks), nil
}

func (r *TimeBlockRepository) GetByUser(ctx context.Context, userID uuid.UUID) ([]*models.TimeBlock, error) {
	blocks, err := r.q.GetTimeBlocksByUser(ctx, pgtype.UUID{Bytes: userID})
	if err != nil {
		return nil, err
	}
	return toTimeBlocks(blocks), nil
}

func (r *TimeBlockRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TimeBlock, error) {
	b, err := r.q.GetTimeBlockByID(ctx, pgtype.UUID{Bytes: id})
	if err != nil {
		return nil, err
	}
	return toTimeBlock(b), nil
}

func (r *TimeBlockRepository) Create(ctx context.Context, userID uuid.UUID, taskID *uuid.UUID, date, startTime, endTime string) (*models.TimeBlock, error) {
	parsedDate, _ := time.Parse("2006-01-02", date)
	startMicro := parseTimeToMicroseconds(startTime)
	endMicro := parseTimeToMicroseconds(endTime)

	var taskIDParam pgtype.UUID
	if taskID != nil {
		taskIDParam = pgtype.UUID{Bytes: *taskID}
	}

	b, err := r.q.CreateTimeBlock(ctx, db.CreateTimeBlockParams{
		UserID:    pgtype.UUID{Bytes: userID},
		TaskID:    taskIDParam,
		Date:      pgtype.Date{Time: parsedDate, Valid: true},
		StartTime: pgtype.Time{Microseconds: startMicro, Valid: true},
		EndTime:   pgtype.Time{Microseconds: endMicro, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return toTimeBlock(b), nil
}

func (r *TimeBlockRepository) Update(ctx context.Context, id uuid.UUID, taskID *uuid.UUID, startTime, endTime string, completed bool) (*models.TimeBlock, error) {
	startMicro := parseTimeToMicroseconds(startTime)
	endMicro := parseTimeToMicroseconds(endTime)

	var taskIDParam pgtype.UUID
	if taskID != nil {
		taskIDParam = pgtype.UUID{Bytes: *taskID}
	}

	b, err := r.q.UpdateTimeBlock(ctx, db.UpdateTimeBlockParams{
		ID:        pgtype.UUID{Bytes: id},
		TaskID:    taskIDParam,
		StartTime: pgtype.Time{Microseconds: startMicro, Valid: true},
		EndTime:   pgtype.Time{Microseconds: endMicro, Valid: true},
		Completed: pgtype.Bool{Bool: completed, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return toTimeBlock(b), nil
}

func (r *TimeBlockRepository) MarkCompleted(ctx context.Context, id uuid.UUID) error {
	return r.q.MarkTimeBlockCompleted(ctx, pgtype.UUID{Bytes: id})
}

func (r *TimeBlockRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.q.DeleteTimeBlock(ctx, pgtype.UUID{Bytes: id})
}

func parseTimeToMicroseconds(t string) int64 {
	parsed, err := time.Parse("15:04", t)
	if err != nil {
		return 0
	}
	h, m, s := parsed.Clock()
	return int64(h)*3600*1e6 + int64(m)*60*1e6 + int64(s)*1e6
}

func formatMicrosecondsToTimeString(us int64) string {
	h := us / 3600000000
	m := (us % 3600000000) / 60000000
	s := (us % 60000000) / 1000000
	return time.Date(0, 1, 1, int(h), int(m), int(s), 0, time.UTC).Format("15:04")
}

func toTimeBlock(b db.TimeBlock) *models.TimeBlock {
	block := &models.TimeBlock{
		ID:        b.ID.Bytes,
		UserID:    b.UserID.Bytes,
		Date:      b.Date.Time.Format("2006-01-02"),
		StartTime: formatMicrosecondsToTimeString(b.StartTime.Microseconds),
		EndTime:   formatMicrosecondsToTimeString(b.EndTime.Microseconds),
		Completed: b.Completed.Bool,
		CreatedAt: b.CreatedAt.Time,
	}
	if b.TaskID.Valid {
		taskID := uuid.UUID(b.TaskID.Bytes)
		block.TaskID = &taskID
	}
	return block
}

func toTimeBlocks(blocks []db.TimeBlock) []*models.TimeBlock {
	result := make([]*models.TimeBlock, len(blocks))
	for i, b := range blocks {
		result[i] = toTimeBlock(b)
	}
	return result
}