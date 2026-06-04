use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtClaims {
    pub sub: String,
    pub email: Option<String>,
    pub exp: Option<i64>,
}

pub fn decode_jwt_no_verify(token: &str) -> Option<JwtClaims> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return None;
    }

    let payload = parts[1];
    let decoded = URL_SAFE_NO_PAD.decode(payload).ok()?;
    let json_str = String::from_utf8(decoded).ok()?;

    let raw: serde_json::Value = serde_json::from_str(&json_str).ok()?;

    let sub = raw.get("sub")?.as_str()?.to_string();
    if sub.is_empty() {
        return None;
    }

    let email = raw.get("email").and_then(|v| v.as_str()).map(|s| s.to_string());
    let exp = raw.get("exp").and_then(|v| v.as_i64());

    Some(JwtClaims { sub, email, exp })
}
