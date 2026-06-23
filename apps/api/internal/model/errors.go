package model

import "errors"

var (
	ErrValidation   = errors.New("validation_error")
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
	ErrNotFound     = errors.New("not_found")
	ErrConflict     = errors.New("conflict")
	ErrInternal     = errors.New("internal_error")
)

type ValidationDetail struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type APIError struct {
	Code    string             `json:"code"`
	Message string             `json:"message"`
	Details []ValidationDetail `json:"details,omitempty"`
}
