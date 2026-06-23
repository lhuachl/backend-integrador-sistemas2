package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"strings"
	"time"

	"flowstate/api/internal/model"
	"flowstate/api/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo       repository.UserRepository
	jwtSecret      string
	accessTTL      time.Duration
	refreshTTL     time.Duration
	googleClientID string
}

func NewAuthService(
	userRepo repository.UserRepository,
	jwtSecret string,
	accessTTL, refreshTTL time.Duration,
	googleClientID string,
) *AuthService {
	return &AuthService{userRepo: userRepo, jwtSecret: jwtSecret, accessTTL: accessTTL, refreshTTL: refreshTTL, googleClientID: googleClientID}
}

func (s *AuthService) Register(ctx context.Context, req model.RegisterRequest) (*model.AuthResponse, error) {
	exists, err := s.userRepo.CheckEmailExists(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("check email: %w", err)
	}
	if exists {
		return nil, model.ErrConflict
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user, err := s.userRepo.Create(ctx, req.Email, req.Name, string(hash))
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	if err := s.userRepo.MarkVerified(ctx, user.ID); err != nil {
		return nil, fmt.Errorf("mark verified: %w", err)
	}
	user.Verified = true

	tokens, err := s.issueTokens(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		User:                 user,
		Tokens:               tokens,
		RequiresVerification: false,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req model.LoginRequest) (*model.AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, model.ErrUnauthorized
	}
	if user.PasswordHash == nil {
		return nil, model.ErrUnauthorized
	}
	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, model.ErrUnauthorized
	}
	if !user.Verified {
		return &model.AuthResponse{User: user, RequiresVerification: true}, nil
	}
	tokens, err := s.issueTokens(user.ID, user.Email)
	if err != nil {
		return nil, err
	}
	return &model.AuthResponse{User: user, Tokens: tokens}, nil
}

func (s *AuthService) VerifyEmail(ctx context.Context, userID, code string) (*model.AuthResponse, error) {
	if len(code) != 6 {
		return nil, model.ErrValidation
	}
	for _, c := range code {
		if c < '0' || c > '9' {
			return nil, model.ErrValidation
		}
	}

	if err := s.userRepo.MarkVerified(ctx, userID); err != nil {
		return nil, fmt.Errorf("mark verified: %w", err)
	}
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	tokens, err := s.issueTokens(user.ID, user.Email)
	if err != nil {
		return nil, err
	}
	return &model.AuthResponse{User: user, Tokens: tokens}, nil
}

func (s *AuthService) GoogleAuth(ctx context.Context, req model.GoogleAuthRequest) (*model.AuthResponse, error) {
	if s.googleClientID == "" {
		return nil, fmt.Errorf("google client ID not configured")
	}
	// ponytail: Google id_token validation simplified. Production needs JWKS fetch.
	parts := strings.Split(req.IDToken, ".")
	if len(parts) != 3 {
		return nil, model.ErrUnauthorized
	}

	var claims struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	data, _ := jwt.NewParser().DecodeSegment(parts[1])
	if data != nil {
		json.Unmarshal(data, &claims)
	}

	if claims.Email == "" {
		return nil, model.ErrUnauthorized
	}

	user, err := s.userRepo.GetByEmail(ctx, claims.Email)
	if err != nil {
		name := claims.Name
		if name == "" {
			name = strings.Split(claims.Email, "@")[0]
		}
		user, err = s.userRepo.Create(ctx, claims.Email, name, "")
		if err != nil {
			return nil, fmt.Errorf("create user: %w", err)
		}
		if err := s.userRepo.MarkVerified(ctx, user.ID); err != nil {
			return nil, err
		}
		user.Verified = true
	}
	tokens, err := s.issueTokens(user.ID, user.Email)
	if err != nil {
		return nil, err
	}
	return &model.AuthResponse{User: user, Tokens: tokens}, nil
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*model.TokenPair, error) {
	claims, err := jwt.ParseWithClaims(refreshToken, &jwt.RegisteredClaims{},
		func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(s.jwtSecret), nil
		})
	if err != nil || !claims.Valid {
		return nil, model.ErrUnauthorized
	}
	userID := claims.Claims.(*jwt.RegisteredClaims).Subject
	if userID == "" {
		return nil, model.ErrUnauthorized
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, model.ErrUnauthorized
	}
	return s.issueTokens(user.ID, user.Email)
}

func (s *AuthService) issueTokens(userID, email string) (*model.TokenPair, error) {
	now := time.Now()

	accessClaims := jwt.MapClaims{
		"sub":   userID,
		"email": email,
		"iat":   now.Unix(),
		"exp":   now.Add(s.accessTTL).Unix(),
	}
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, fmt.Errorf("sign access token: %w", err)
	}

	refreshClaims := jwt.MapClaims{
		"sub": userID,
		"iat": now.Unix(),
		"exp": now.Add(s.refreshTTL).Unix(),
		"typ": "refresh",
	}
	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, fmt.Errorf("sign refresh token: %w", err)
	}

	return &model.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int(s.accessTTL.Seconds()),
	}, nil
}

func (s *AuthService) Logout(_ context.Context) error {
	return nil
}

func generateCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(999999))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}
