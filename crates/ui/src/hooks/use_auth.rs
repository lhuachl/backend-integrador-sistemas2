use dioxus::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AuthTokens {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
    pub token_type: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum AuthState {
    Loading,
    Authenticated(AuthTokens),
    Unauthenticated,
    Error(String),
}

#[derive(Debug, Clone, PartialEq)]
pub enum AuthAction {
    Login(String, String),
    SignUp(String, String),
    OAuthStart(String),
    Logout,
}

pub fn use_auth() -> (Signal<AuthState>, EventHandler<AuthAction>) {
    let auth_state = use_signal(|| AuthState::Unauthenticated);

    let auth_action = use_callback(move |action: AuthAction| {
        let mut state = auth_state.clone();

        spawn(async move {
            match action {
                AuthAction::Login(email, _password) => {
                    state.set(AuthState::Loading);
                    // Simulate login for now
                    state.set(AuthState::Authenticated(AuthTokens {
                        access_token: format!("access_{}", email),
                        refresh_token: format!("refresh_{}", email),
                        expires_in: 3600,
                        token_type: "bearer".to_string(),
                    }));
                }
                AuthAction::SignUp(_email, _password) => {
                    state.set(AuthState::Loading);
                    // Simulate signup for now
                    state.set(AuthState::Unauthenticated);
                }
                AuthAction::OAuthStart(_provider) => {
                    state.set(AuthState::Loading);
                    // TODO: Open OAuth URL
                    state.set(AuthState::Error("OAuth not implemented yet".to_string()));
                }
                AuthAction::Logout => {
                    state.set(AuthState::Unauthenticated);
                }
            }
        });
    });

    (auth_state, auth_action)
}
