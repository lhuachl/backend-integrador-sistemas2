package model

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Name     string `json:"name" validate:"required,min=1,max=100"`
}

type VerifyEmailRequest struct {
	Code string `json:"code" validate:"required,len=6"`
}

type GoogleAuthRequest struct {
	IDToken string `json:"id_token" validate:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

type AuthResponse struct {
	User                 *User     `json:"user"`
	Tokens               *TokenPair `json:"tokens"`
	RequiresVerification bool       `json:"requires_verification,omitempty"`
}
