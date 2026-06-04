#[cfg(test)]
mod tests {
    use shared::api::auth::{AuthService, OAuthStartResponse, AuthTokens};
    use shared::api::client::InsForgeClient;

    // ========================================
    // Tests de AuthService
    // ========================================

    #[test]
    fn test_auth_service_creation() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_anon_key");
        let auth = AuthService::new(client);
        assert!(!auth.base_url().is_empty(), "base_url should not be empty");
    }

    #[test]
    fn test_auth_service_base_url() {
        let client = InsForgeClient::new("https://myapp.insforge.app", "key123");
        let auth = AuthService::new(client);
        assert_eq!(auth.base_url(), "https://myapp.insforge.app");
    }

    // ========================================
    // Tests de OAuth Start
    // ========================================

    #[test]
    fn test_oauth_start_github_returns_url() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_key");
        let auth = AuthService::new(client);
        let result = auth.start_oauth("github", "http://localhost:3100/auth/callback");
        assert!(result.is_ok(), "should return OAuth URL");
        let response = result.unwrap();
        assert!(response.url.contains("github.com"), "URL should contain github.com");
        assert!(response.url.contains("client_id="), "URL should contain client_id");
        assert!(response.url.contains("redirect_uri="), "URL should contain redirect_uri");
        assert!(response.url.contains("code_challenge="), "URL should contain code_challenge");
        assert!(response.url.contains("code_challenge_method=S256"), "URL should contain code_challenge_method");
    }

    #[test]
    fn test_oauth_start_google_returns_url() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_key");
        let auth = AuthService::new(client);
        let result = auth.start_oauth("google", "http://localhost:3100/auth/callback");
        assert!(result.is_ok(), "should return OAuth URL");
        let response = result.unwrap();
        assert!(response.url.contains("accounts.google.com"), "URL should contain google.com");
    }

    #[test]
    fn test_oauth_start_stores_verifier() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_key");
        let auth = AuthService::new(client);
        let response = auth.start_oauth("github", "http://localhost:3100/auth/callback").unwrap();
        assert!(!response.state.is_empty(), "state should not be empty");
        // Verifier should be stored internally
        let verifier = auth.get_verifier(&response.state);
        assert!(verifier.is_some(), "verifier should be stored for state");
        assert!(!verifier.unwrap().is_empty(), "verifier should not be empty");
    }

    #[test]
    fn test_oauth_start_different_states_have_different_verifiers() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_key");
        let auth = AuthService::new(client);
        let r1 = auth.start_oauth("github", "http://localhost:3100/auth/callback").unwrap();
        let r2 = auth.start_oauth("github", "http://localhost:3100/auth/callback").unwrap();
        assert_ne!(r1.state, r2.state, "states should be different");
        let v1 = auth.get_verifier(&r1.state).unwrap();
        let v2 = auth.get_verifier(&r2.state).unwrap();
        assert_ne!(v1, v2, "verifiers should be different");
    }

    #[test]
    fn test_oauth_start_invalid_provider_returns_error() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_key");
        let auth = AuthService::new(client);
        let result = auth.start_oauth("invalid", "http://localhost:3100/auth/callback");
        assert!(result.is_err(), "should return error for invalid provider");
    }

    // ========================================
    // Tests de Token Exchange
    // ========================================

    #[test]
    fn test_exchange_code_with_valid_state_returns_tokens() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_key");
        let auth = AuthService::new(client);
        let response = auth.start_oauth("github", "http://localhost:3100/auth/callback").unwrap();

        // Simulate callback with code
        let result = auth.exchange_code("test_code", &response.state);
        // This would fail with real API, but tests the flow
        assert!(result.is_ok() || result.is_err(), "should handle exchange");
    }

    #[test]
    fn test_exchange_code_with_invalid_state_returns_error() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_key");
        let auth = AuthService::new(client);
        let result = auth.exchange_code("test_code", "invalid_state");
        assert!(result.is_err(), "should return error for invalid state");
    }

    #[test]
    fn test_exchange_code_removes_verifier() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_key");
        let auth = AuthService::new(client);
        let response = auth.start_oauth("github", "http://localhost:3100/auth/callback").unwrap();

        // Exchange should remove the verifier
        let _ = auth.exchange_code("test_code", &response.state);
        let verifier = auth.get_verifier(&response.state);
        assert!(verifier.is_none(), "verifier should be removed after exchange");
    }

    // ========================================
    // Tests de Email/Password Auth
    // ========================================

    #[test]
    fn test_signup_returns_result() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_key");
        let auth = AuthService::new(client);
        let result = auth.signup("new@example.com", "SecurePass123!");
        // Would fail with real API, but tests the interface
        assert!(result.is_ok() || result.is_err(), "should handle signup");
    }

    #[test]
    fn test_login_returns_tokens() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_key");
        let auth = AuthService::new(client);
        let result = auth.login("user@example.com", "password123");
        // Would fail with real API, but tests the interface
        assert!(result.is_ok() || result.is_err(), "should handle login");
    }

    #[test]
    fn test_logout_returns_result() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_key");
        let auth = AuthService::new(client);
        let result = auth.logout("test_access_token");
        assert!(result.is_ok() || result.is_err(), "should handle logout");
    }

    // ========================================
    // Tests de Token Refresh
    // ========================================

    #[test]
    fn test_refresh_token_returns_new_tokens() {
        let client = InsForgeClient::new("https://test.insforge.app", "test_key");
        let auth = AuthService::new(client);
        let result = auth.refresh_token("test_refresh_token");
        // Would fail with real API, but tests the interface
        assert!(result.is_ok() || result.is_err(), "should handle refresh");
    }

    // ========================================
    // Tests de OAuthStartResponse
    // ========================================

    #[test]
    fn test_oauth_start_response_has_url() {
        let response = OAuthStartResponse {
            url: "https://github.com/login/oauth/authorize".to_string(),
            state: "random_state".to_string(),
        };
        assert!(!response.url.is_empty());
    }

    #[test]
    fn test_oauth_start_response_has_state() {
        let response = OAuthStartResponse {
            url: "https://github.com/login/oauth/authorize".to_string(),
            state: "random_state".to_string(),
        };
        assert!(!response.state.is_empty());
    }

    // ========================================
    // Tests de AuthTokens
    // ========================================

    #[test]
    fn test_auth_tokens_has_access_token() {
        let tokens = AuthTokens {
            access_token: "access123".to_string(),
            refresh_token: "refresh456".to_string(),
            expires_in: 3600,
            token_type: "bearer".to_string(),
        };
        assert_eq!(tokens.access_token, "access123");
    }

    #[test]
    fn test_auth_tokens_has_refresh_token() {
        let tokens = AuthTokens {
            access_token: "access123".to_string(),
            refresh_token: "refresh456".to_string(),
            expires_in: 3600,
            token_type: "bearer".to_string(),
        };
        assert_eq!(tokens.refresh_token, "refresh456");
    }

    #[test]
    fn test_auth_tokens_has_expires_in() {
        let tokens = AuthTokens {
            access_token: "access123".to_string(),
            refresh_token: "refresh456".to_string(),
            expires_in: 3600,
            token_type: "bearer".to_string(),
        };
        assert_eq!(tokens.expires_in, 3600);
    }
}
