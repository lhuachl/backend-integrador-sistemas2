use crate::api::client::InsForgeClient;
use crate::utils::pkce::{generate_code_verifier, generate_code_challenge};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthStartResponse {
    pub url: String,
    pub state: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenExchangeRequest {
    pub code: String,
    pub state: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthTokens {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
    pub token_type: String,
}

pub struct AuthService {
    client: InsForgeClient,
    verifiers: Mutex<HashMap<String, String>>, // state -> verifier
}

impl AuthService {
    pub fn new(client: InsForgeClient) -> Self {
        Self {
            client,
            verifiers: Mutex::new(HashMap::new()),
        }
    }

    pub fn base_url(&self) -> &str {
        &self.client.base_url
    }

    pub fn start_oauth(&self, provider: &str, redirect_uri: &str) -> Result<OAuthStartResponse, String> {
        let (auth_url, client_id) = match provider {
            "github" => (
                "https://github.com/login/oauth/authorize",
                std::env::var("GITHUB_CLIENT_ID").unwrap_or_else(|_| "github_client_id".to_string()),
            ),
            "google" => (
                "https://accounts.google.com/o/oauth2/v2/auth",
                std::env::var("GOOGLE_CLIENT_ID").unwrap_or_else(|_| "google_client_id".to_string()),
            ),
            _ => return Err(format!("Unsupported provider: {}", provider)),
        };

        let verifier = generate_code_verifier();
        let challenge = generate_code_challenge(&verifier);
        let state = generate_code_verifier(); // Use verifier as state (random string)

        // Store verifier for later exchange
        let mut verifiers = self.verifiers.lock().map_err(|e| e.to_string())?;
        verifiers.insert(state.clone(), verifier);

        let url = format!(
            "{}?client_id={}&redirect_uri={}&scope={}&state={}&code_challenge={}&code_challenge_method=S256&response_type=code",
            auth_url,
            client_id,
            urlencoding::encode(redirect_uri),
            urlencoding::encode("read:user user:email"),
            state,
            challenge
        );

        Ok(OAuthStartResponse { url, state })
    }

    pub fn exchange_code(&self, code: &str, state: &str) -> Result<AuthTokens, String> {
        // Retrieve and remove verifier
        let mut verifiers = self.verifiers.lock().map_err(|e| e.to_string())?;
        let verifier = verifiers.remove(state)
            .ok_or_else(|| "Invalid or expired state".to_string())?;

        // In a real implementation, this would call InsForge API
        // For now, return a simulated response
        Ok(AuthTokens {
            access_token: format!("access_{}", code),
            refresh_token: format!("refresh_{}", code),
            expires_in: 3600,
            token_type: "bearer".to_string(),
        })
    }

    pub fn get_verifier(&self, state: &str) -> Option<String> {
        let verifiers = self.verifiers.lock().ok()?;
        verifiers.get(state).cloned()
    }

    pub fn signup(&self, email: &str, password: &str) -> Result<(), String> {
        // Validate inputs
        if email.is_empty() || !email.contains('@') {
            return Err("Invalid email".to_string());
        }
        if password.len() < 6 {
            return Err("Password too short".to_string());
        }

        // In a real implementation, this would call InsForge API
        Ok(())
    }

    pub fn login(&self, email: &str, password: &str) -> Result<AuthTokens, String> {
        // Validate inputs
        if email.is_empty() || !email.contains('@') {
            return Err("Invalid email".to_string());
        }
        if password.is_empty() {
            return Err("Password required".to_string());
        }

        // In a real implementation, this would call InsForge API
        Ok(AuthTokens {
            access_token: format!("access_{}", email),
            refresh_token: format!("refresh_{}", email),
            expires_in: 3600,
            token_type: "bearer".to_string(),
        })
    }

    pub fn logout(&self, _access_token: &str) -> Result<(), String> {
        // In a real implementation, this would call InsForge API
        Ok(())
    }

    pub fn refresh_token(&self, refresh_token: &str) -> Result<AuthTokens, String> {
        if refresh_token.is_empty() {
            return Err("Refresh token required".to_string());
        }

        // In a real implementation, this would call InsForge API
        Ok(AuthTokens {
            access_token: format!("access_refreshed_{}", refresh_token),
            refresh_token: format!("refresh_refreshed_{}", refresh_token),
            expires_in: 3600,
            token_type: "bearer".to_string(),
        })
    }
}
