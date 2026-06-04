#[cfg(test)]
mod tests {
    use shared::utils::jwt::{decode_jwt_no_verify, JwtClaims};

    // ========================================
    // Tests de decode_jwt_no_verify
    // ========================================

    #[test]
    fn test_decode_valid_jwt_returns_claims() {
        // Header: {"alg":"HS256","typ":"JWT"}
        // Payload: {"sub":"user123","email":"user@example.com","exp":9999999999}
        // This is a valid JWT structure (not cryptographically verified)
        let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature";
        let claims = decode_jwt_no_verify(token);
        assert!(claims.is_some(), "should decode valid JWT");
        let claims = claims.unwrap();
        assert_eq!(claims.sub, "user123");
        assert_eq!(claims.email, Some("user@example.com".to_string()));
        assert_eq!(claims.exp, Some(9999999999));
    }

    #[test]
    fn test_decode_jwt_with_only_sub() {
        // Minimal JWT with only sub claim
        let token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyNDU2In0.signature";
        let claims = decode_jwt_no_verify(token);
        assert!(claims.is_some(), "should decode JWT with only sub");
        let claims = claims.unwrap();
        assert_eq!(claims.sub, "user456");
        assert_eq!(claims.email, None);
        assert_eq!(claims.exp, None);
    }

    #[test]
    fn test_decode_jwt_with_no_sub_returns_none() {
        // JWT without sub claim
        let token = "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20ifQ.signature";
        let claims = decode_jwt_no_verify(token);
        assert!(claims.is_none(), "should return None when sub is missing");
    }

    #[test]
    fn test_decode_jwt_with_empty_sub_returns_none() {
        // JWT with empty sub
        let token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIifQ.signature";
        let claims = decode_jwt_no_verify(token);
        assert!(claims.is_none(), "should return None when sub is empty");
    }

    #[test]
    fn test_decode_expired_jwt_returns_claims() {
        // JWT with exp in the past (should still decode - we don't verify exp)
        let token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxfQ.signature";
        let claims = decode_jwt_no_verify(token);
        assert!(claims.is_some(), "should decode expired JWT (no-verify mode)");
        let claims = claims.unwrap();
        assert_eq!(claims.sub, "user");
        assert_eq!(claims.exp, Some(1));
    }

    #[test]
    fn test_decode_jwt_with_invalid_base64_returns_none() {
        // Invalid base64 in payload
        let token = "eyJhbGciOiJIUzI1NiJ9.!!!invalid!!!.signature";
        let claims = decode_jwt_no_verify(token);
        assert!(claims.is_none(), "should return None for invalid base64");
    }

    #[test]
    fn test_decode_jwt_with_invalid_json_returns_none() {
        // Valid base64 but invalid JSON
        let token = "eyJhbGciOiJIUzI1NiJ9.aW52YWxpZA.signature";
        let claims = decode_jwt_no_verify(token);
        assert!(claims.is_none(), "should return None for invalid JSON");
    }

    #[test]
    fn test_decode_jwt_with_wrong_number_of_parts_returns_none() {
        // JWT must have 3 parts
        let token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0";
        let claims = decode_jwt_no_verify(token);
        assert!(claims.is_none(), "should return None for JWT with 2 parts");
    }

    #[test]
    fn test_decode_jwt_with_4_parts_returns_none() {
        // JWT with 4 parts
        let token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.sig.extra";
        let claims = decode_jwt_no_verify(token);
        assert!(claims.is_none(), "should return None for JWT with 4 parts");
    }

    #[test]
    fn test_decode_empty_string_returns_none() {
        let claims = decode_jwt_no_verify("");
        assert!(claims.is_none(), "should return None for empty string");
    }

    #[test]
    fn test_decode_jwt_preserves_email() {
        let token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIn0.signature";
        let claims = decode_jwt_no_verify(token);
        assert!(claims.is_some());
        let claims = claims.unwrap();
        assert_eq!(claims.email, Some("test@test.com".to_string()));
    }

    #[test]
    fn test_decode_jwt_with_long_sub() {
        let long_sub = "a]".repeat(100);
        let payload = format!(r#"{{"sub":"{}"}}"#, long_sub);
        use base64::Engine;
        use base64::engine::general_purpose::URL_SAFE_NO_PAD;
        let encoded = URL_SAFE_NO_PAD.encode(payload.as_bytes());
        let token = format!("eyJhbGciOiJIUzI1NiJ9.{}.signature", encoded);
        let claims = decode_jwt_no_verify(&token);
        assert!(claims.is_some(), "should handle long sub");
    }

    // ========================================
    // Tests de JwtClaims
    // ========================================

    #[test]
    fn test_jwt_claims_has_sub_field() {
        let claims = JwtClaims {
            sub: "test".to_string(),
            email: None,
            exp: None,
        };
        assert_eq!(claims.sub, "test");
    }

    #[test]
    fn test_jwt_claims_has_email_field() {
        let claims = JwtClaims {
            sub: "test".to_string(),
            email: Some("test@example.com".to_string()),
            exp: None,
        };
        assert_eq!(claims.email, Some("test@example.com".to_string()));
    }

    #[test]
    fn test_jwt_claims_has_exp_field() {
        let claims = JwtClaims {
            sub: "test".to_string(),
            email: None,
            exp: Some(1234567890),
        };
        assert_eq!(claims.exp, Some(1234567890));
    }
}
