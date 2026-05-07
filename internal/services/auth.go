package services

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"rest-api/internal/config"
	"rest-api/internal/email"
	"rest-api/internal/repositories"
	"rest-api/pkg/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/supabase-community/supabase-go"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo           *repositories.UserRepository
	tokenRepo          *repositories.TokenRepository
	db                 *config.DB
	email              *email.Client
	supabase           *supabase.Client
	supabaseURL        string
	supabaseServiceKey string
}

func NewAuthService(userRepo *repositories.UserRepository, tokenRepo *repositories.TokenRepository, db *config.DB, emailClient *email.Client, supabaseURL, supabaseKey, supabaseServiceKey string) *AuthService {
	client, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		return &AuthService{
			userRepo:           userRepo,
			tokenRepo:          tokenRepo,
			db:                 db,
			email:              emailClient,
			supabaseURL:        supabaseURL,
			supabaseServiceKey: supabaseServiceKey,
		}
	}
	return &AuthService{
		userRepo:           userRepo,
		tokenRepo:          tokenRepo,
		db:                 db,
		email:              emailClient,
		supabase:           client,
		supabaseURL:        supabaseURL,
		supabaseServiceKey: supabaseServiceKey,
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
	if s.supabaseURL == "" || s.supabaseServiceKey == "" {
		return "", errors.New("supabase admin credentials not configured")
	}

	url := fmt.Sprintf("%s/auth/admin/users", s.supabaseURL)

	payload := map[string]interface{}{
		"email":          email,
		"password":       password,
		"email_confirm":  true,
		"user_metadata":  map[string]string{"from_flowstate": "true"},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.supabaseServiceKey)
	req.Header.Set("apikey", s.supabaseServiceKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("supabase admin api error: status %d, body: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.ID, nil
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

func (s *AuthService) GetUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return uuid.Nil, errors.New("missing authorization header")
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")
	if token == authHeader {
		return uuid.Nil, errors.New("invalid authorization format")
	}

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return uuid.Nil, errors.New("invalid token format")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return uuid.Nil, err
	}

	var claims struct {
		Sub string `json:"sub"`
	}
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return uuid.Nil, err
	}

	return uuid.Parse(claims.Sub)
}