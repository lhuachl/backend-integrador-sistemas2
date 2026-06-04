use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use shared::api::auth::{AuthService, OAuthStartResponse, AuthTokens};
use shared::api::client::InsForgeClient;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

#[derive(Clone)]
struct AppState {
    auth: Arc<AuthService>,
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    message: String,
}

#[derive(Deserialize)]
struct OAuthStartQuery {
    provider: String,
    redirect_uri: Option<String>,
}

#[derive(Deserialize)]
struct OAuthCallbackQuery {
    code: Option<String>,
    state: Option<String>,
    error: Option<String>,
}

#[derive(Deserialize)]
struct SignupRequest {
    email: String,
    password: String,
}

#[derive(Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Deserialize)]
struct RefreshRequest {
    refresh_token: String,
}

#[tokio::main]
async fn main() {
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)
        .expect("Failed to set subscriber");

    let insforge_url = std::env::var("INSFORGE_URL")
        .unwrap_or_else(|_| "https://7qhn2rg2.us-east.insforge.app".to_string());
    let insforge_anon_key = std::env::var("INSFORGE_ANON_KEY")
        .unwrap_or_else(|_| "anon_key".to_string());

    let client = InsForgeClient::new(&insforge_url, &insforge_anon_key);
    let auth_service = AuthService::new(client);

    let state = AppState {
        auth: Arc::new(auth_service),
    };

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/auth/oauth/:provider/start", get(oauth_start))
        .route("/auth/callback", get(oauth_callback))
        .route("/auth/signup", post(signup))
        .route("/auth/login", post(login))
        .route("/auth/logout", post(logout))
        .route("/auth/refresh", post(refresh))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3100".to_string());
    let addr = format!("127.0.0.1:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind");

    info!("Server running on http://{}", addr);

    axum::serve(listener, app)
        .await
        .expect("Failed to serve");
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        message: "FlowState Auth Server".to_string(),
    })
}

async fn oauth_start(
    State(state): State<AppState>,
    Query(query): Query<OAuthStartQuery>,
) -> Result<Json<OAuthStartResponse>, StatusCode> {
    let redirect_uri = query.redirect_uri
        .unwrap_or_else(|| "http://localhost:3100/auth/callback".to_string());

    match state.auth.start_oauth(&query.provider, &redirect_uri) {
        Ok(response) => Ok(Json(response)),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

async fn oauth_callback(
    State(state): State<AppState>,
    Query(query): Query<OAuthCallbackQuery>,
) -> Result<Json<AuthTokens>, StatusCode> {
    if let Some(error) = query.error {
        info!("OAuth error: {}", error);
        return Err(StatusCode::BAD_REQUEST);
    }

    let code = query.code.ok_or(StatusCode::BAD_REQUEST)?;
    let oauth_state = query.state.ok_or(StatusCode::BAD_REQUEST)?;

    match state.auth.exchange_code(&code, &oauth_state) {
        Ok(tokens) => Ok(Json(tokens)),
        Err(e) => {
            info!("Token exchange failed: {}", e);
            Err(StatusCode::BAD_REQUEST)
        }
    }
}

async fn signup(
    State(state): State<AppState>,
    Json(request): Json<SignupRequest>,
) -> Result<StatusCode, StatusCode> {
    match state.auth.signup(&request.email, &request.password) {
        Ok(_) => Ok(StatusCode::CREATED),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

async fn login(
    State(state): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<AuthTokens>, StatusCode> {
    match state.auth.login(&request.email, &request.password) {
        Ok(tokens) => Ok(Json(tokens)),
        Err(_) => Err(StatusCode::UNAUTHORIZED),
    }
}

async fn logout(
    State(_state): State<AppState>,
) -> StatusCode {
    StatusCode::OK
}

async fn refresh(
    State(state): State<AppState>,
    Json(request): Json<RefreshRequest>,
) -> Result<Json<AuthTokens>, StatusCode> {
    match state.auth.refresh_token(&request.refresh_token) {
        Ok(tokens) => Ok(Json(tokens)),
        Err(_) => Err(StatusCode::UNAUTHORIZED),
    }
}
