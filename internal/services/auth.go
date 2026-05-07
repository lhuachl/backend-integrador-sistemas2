package services

import (
	"context"
	"errors"
	"time"

	"rest-api/internal/config"
	"rest-api/internal/email"
	"rest-api/internal/repositories"
	"rest-api/pkg/models"

	"github.com/google/uuid"
	"github.com/supabase-community/supabase-go"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo  *repositories.UserRepository
	tokenRepo *repositories.TokenRepository
	db        *config.DB
	email     *email.Client
	supabase  *supabase.Client
}

func NewAuthService(userRepo *repositories.UserRepository, tokenRepo *repositories.TokenRepository, db *config.DB, emailClient *email.Client, supabaseURL, supabaseKey string) *AuthService {
	client, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		return &AuthService{
			userRepo:  userRepo,
			tokenRepo: tokenRepo,
			db:        db,
			email:     emailClient,
		}
	}
	return &AuthService{
		userRepo:  userRepo,
		tokenRepo: tokenRepo,
		db:        db,
		email:     emailClient,
		supabase:  client,
	}
}

func (s *AuthService) Signup(ctx context.Context, req *models.SignupRequest) error {
	existing, _ := s.userRepo.GetByEmail(ctx, req.Email)
	if existing != nil {
		return errors.New("email already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	token := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour)

	_, err = s.userRepo.Create(ctx, req.Email, req.Name, string(hashedPassword), "")
	if err != nil {
		return err
	}

	_, err = s.tokenRepo.Create(ctx, req.Email, token, expiresAt)
	if err != nil {
		return err
	}

	confirmURL := "http://localhost:8080/api/auth/confirm?token=" + token
	return s.email.SendConfirmation(ctx, req.Email, req.Name, confirmURL)
}

func (s *AuthService) Confirm(ctx context.Context, tokenStr string) error {
	token, err := s.tokenRepo.GetByToken(ctx, tokenStr)
	if err != nil {
		return errors.New("invalid token")
	}

	if token.Used {
		return errors.New("token already used")
	}

	if time.Now().After(token.ExpiresAt) {
		return errors.New("token expired")
	}

	user, err := s.userRepo.GetByEmail(ctx, token.Email)
	if err != nil {
		return errors.New("user not found")
	}

	supabaseUserID, err := s.createSupabaseUser(ctx, token.Email, user.PasswordHash)
	if err != nil {
		return err
	}

	err = s.userRepo.UpdateSupabaseID(ctx, user.ID, supabaseUserID)
	if err != nil {
		return err
	}

	err = s.userRepo.UpdateEmailConfirmed(ctx, supabaseUserID)
	if err != nil {
		return err
	}

	return s.tokenRepo.MarkUsed(ctx, token.ID)
}

func (s *AuthService) createSupabaseUser(ctx context.Context, email, password string) (string, error) {
	return "", nil
}

func (s *AuthService) Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error) {
	if s.supabase == nil {
		return nil, errors.New("supabase client not initialized")
	}

	resp, err := s.supabase.SignInWithEmailPassword(req.Email, req.Password)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	name := ""
	if resp.User.UserMetadata != nil {
		if n, ok := resp.User.UserMetadata["name"].(string); ok {
			name = n
		}
	}

	return &models.AuthResponse{
		Token:     resp.AccessToken,
		ExpiresIn: int(resp.ExpiresIn),
		User: &models.User{
			Email: resp.User.Email,
			Name:  name,
		},
	}, nil
}

func (s *AuthService) GetUserByID(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	return s.userRepo.GetByID(ctx, userID)
}