use shared::api::auth::AuthService;
use shared::api::client::InsForgeClient;
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_store::StoreExt;
use serde::Serialize;

#[derive(Clone, Serialize)]
struct AuthResponse {
    access_token: String,
    refresh_token: String,
    expires_in: i64,
    token_type: String,
}

#[derive(Clone, Serialize)]
struct OAuthStartResponse {
    url: String,
    state: String,
}

#[tauri::command]
async fn oauth_start(
    app: tauri::AppHandle,
    provider: String,
) -> Result<OAuthStartResponse, String> {
    let insforge_url = std::env::var("INSFORGE_URL")
        .unwrap_or_else(|_| "https://7qhn2rg2.us-east.insforge.app".to_string());
    let insforge_anon_key = std::env::var("INSFORGE_ANON_KEY")
        .unwrap_or_else(|_| "anon_key".to_string());

    let client = InsForgeClient::new(&insforge_url, &insforge_anon_key);
    let auth = AuthService::new(client);

    let redirect_uri = "flowstate://oauth/callback";
    let response = auth.start_oauth(&provider, redirect_uri)
        .map_err(|e| e.to_string())?;

    // Store the verifier in the app state
    let store = app.store("auth_store").map_err(|e| e.to_string())?;
    store.set(format!("oauth_state_{}", response.state), response.state.clone());

    Ok(OAuthStartResponse {
        url: response.url,
        state: response.state,
    })
}

#[tauri::command]
async fn oauth_callback(
    app: tauri::AppHandle,
    code: String,
    state: String,
) -> Result<AuthResponse, String> {
    let insforge_url = std::env::var("INSFORGE_URL")
        .unwrap_or_else(|_| "https://7qhn2rg2.us-east.insforge.app".to_string());
    let insforge_anon_key = std::env::var("INSFORGE_ANON_KEY")
        .unwrap_or_else(|_| "anon_key".to_string());

    let client = InsForgeClient::new(&insforge_url, &insforge_anon_key);
    let auth = AuthService::new(client);

    // Get the stored verifier
    let store = app.store("auth_store").map_err(|e| e.to_string())?;
    let _stored_state = store.get(format!("oauth_state_{}", state))
        .ok_or("Invalid or expired state")?;

    // Exchange the code for tokens
    let tokens = auth.exchange_code(&code, &state)
        .map_err(|e| e.to_string())?;

    // Store the tokens
    store.set("access_token", tokens.access_token.clone());
    store.set("refresh_token", tokens.refresh_token.clone());

    // Clean up the state
    store.delete(format!("oauth_state_{}", state));

    Ok(AuthResponse {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        token_type: tokens.token_type,
    })
}

#[tauri::command]
async fn get_stored_token(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let store = app.store("auth_store").map_err(|e| e.to_string())?;
    Ok(store.get("access_token").map(|v| v.to_string()))
}

#[tauri::command]
async fn logout(app: tauri::AppHandle) -> Result<(), String> {
    let store = app.store("auth_store").map_err(|e| e.to_string())?;
    store.delete("access_token");
    store.delete("refresh_token");
    Ok(())
}

#[tauri::command]
async fn open_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    app.opener().open_url(&url, None::<&str>).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            oauth_start,
            oauth_callback,
            get_stored_token,
            logout,
            open_url,
        ])
        .setup(|app| {
            // Set up deep link handler
            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                let urls = event.urls();
                for url in urls {
                    if url.scheme() == "flowstate" && url.host_str() == Some("oauth") {
                        if let Some(code) = url.query_pairs().find(|(k, _)| k == "code").map(|(_, v)| v.to_string()) {
                            if let Some(state) = url.query_pairs().find(|(k, _)| k == "state").map(|(_, v)| v.to_string()) {
                                let handle = handle.clone();
                                tauri::async_runtime::spawn(async move {
                                    let _ = oauth_callback(handle, code, state).await;
                                });
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
