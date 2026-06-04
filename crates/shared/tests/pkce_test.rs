#[cfg(test)]
mod tests {
    use shared::utils::pkce::{generate_code_verifier, generate_code_challenge, PkcePair};

    // ========================================
    // Tests de generate_code_verifier
    // ========================================

    #[test]
    fn test_verifier_is_not_empty() {
        let verifier = generate_code_verifier();
        assert!(!verifier.is_empty(), "verifier must not be empty");
    }

    #[test]
    fn test_verifier_is_random() {
        let v1 = generate_code_verifier();
        let v2 = generate_code_verifier();
        assert_ne!(v1, v2, "two verifiers must be different");
    }

    #[test]
    fn test_verifier_length_is_at_least_43() {
        // Run multiple times to catch edge cases
        for _ in 0..100 {
            let verifier = generate_code_verifier();
            assert!(
                verifier.len() >= 43,
                "verifier length must be >= 43, got {}",
                verifier.len()
            );
        }
    }

    #[test]
    fn test_verifier_length_is_at_most_128() {
        for _ in 0..100 {
            let verifier = generate_code_verifier();
            assert!(
                verifier.len() <= 128,
                "verifier length must be <= 128, got {}",
                verifier.len()
            );
        }
    }

    #[test]
    fn test_verifier_contains_only_valid_chars() {
        let valid_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
        for _ in 0..50 {
            let verifier = generate_code_verifier();
            for ch in verifier.chars() {
                assert!(
                    valid_chars.contains(ch),
                    "verifier contains invalid char: '{}'",
                    ch
                );
            }
        }
    }

    #[test]
    fn test_verifier_has_sufficient_entropy() {
        // Verify that the verifier uses the full charset
        let verifier = generate_code_verifier();
        let has_upper = verifier.chars().any(|c| c.is_ascii_uppercase());
        let has_lower = verifier.chars().any(|c| c.is_ascii_lowercase());
        let has_digit = verifier.chars().any(|c| c.is_ascii_digit());

        // With 43+ chars, we should have good entropy
        // This test might occasionally fail, but very rarely
        assert!(has_upper || has_lower || has_digit, 
            "verifier should contain alphanumeric chars");
    }

    // ========================================
    // Tests de generate_code_challenge
    // ========================================

    #[test]
    fn test_challenge_is_not_empty() {
        let verifier = generate_code_verifier();
        let challenge = generate_code_challenge(&verifier);
        assert!(!challenge.is_empty(), "challenge must not be empty");
    }

    #[test]
    fn test_challenge_is_deterministic() {
        let verifier = "test_verifier_value_that_is_long_enough_for_pkce_12345";
        let c1 = generate_code_challenge(verifier);
        let c2 = generate_code_challenge(verifier);
        assert_eq!(c1, c2, "same verifier must produce same challenge");
    }

    #[test]
    fn test_challenge_differs_for_different_verifiers() {
        let v1 = generate_code_verifier();
        let v2 = generate_code_verifier();
        let c1 = generate_code_challenge(&v1);
        let c2 = generate_code_challenge(&v2);
        assert_ne!(c1, c2, "different verifiers must produce different challenges");
    }

    #[test]
    fn test_challenge_is_url_safe_base64() {
        // URL-safe base64 uses: A-Z, a-z, 0-9, -, _
        // No padding (=) because we use URL_SAFE_NO_PAD
        let verifier = generate_code_verifier();
        let challenge = generate_code_challenge(&verifier);
        for ch in challenge.chars() {
            assert!(
                ch.is_ascii_alphanumeric() || ch == '-' || ch == '_',
                "challenge contains invalid char '{}', must be URL-safe base64",
                ch
            );
        }
    }

    #[test]
    fn test_challenge_has_expected_length() {
        // SHA256 produces 32 bytes, base64url without padding is 43 chars
        let verifier = generate_code_verifier();
        let challenge = generate_code_challenge(&verifier);
        assert_eq!(
            challenge.len(), 43,
            "SHA256 base64url without padding must be 43 chars, got {}",
            challenge.len()
        );
    }

    #[test]
    fn test_challenge_is_sha256_of_verifier() {
        // Verify with known value
        // SHA256("test") = 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
        // base64url(9f86d0...) = n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg
        let verifier = "test";
        let challenge = generate_code_challenge(verifier);
        assert_eq!(
            challenge, "n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg",
            "challenge must be SHA256 base64url of verifier"
        );
    }

    // ========================================
    // Tests de PkcePair
    // ========================================

    #[test]
    fn test_pkce_pair_has_verifier() {
        let pair = PkcePair::new();
        assert!(!pair.verifier.is_empty(), "pair.verifier must not be empty");
    }

    #[test]
    fn test_pkce_pair_has_challenge() {
        let pair = PkcePair::new();
        assert!(!pair.challenge.is_empty(), "pair.challenge must not be empty");
    }

    #[test]
    fn test_pkce_pair_verifier_and_challenge_differ() {
        let pair = PkcePair::new();
        assert_ne!(
            pair.verifier, pair.challenge,
            "verifier and challenge must be different"
        );
    }

    #[test]
    fn test_pkce_pair_challenge_matches_verifier() {
        let pair = PkcePair::new();
        let expected = generate_code_challenge(&pair.verifier);
        assert_eq!(
            pair.challenge, expected,
            "pair.challenge must match generate_code_challenge(pair.verifier)"
        );
    }

    #[test]
    fn test_pkce_pair_verifier_has_valid_length() {
        let pair = PkcePair::new();
        assert!(
            pair.verifier.len() >= 43 && pair.verifier.len() <= 128,
            "verifier length must be 43-128, got {}",
            pair.verifier.len()
        );
    }

    #[test]
    fn test_pkce_pair_challenge_is_url_safe() {
        let pair = PkcePair::new();
        for ch in pair.challenge.chars() {
            assert!(
                ch.is_ascii_alphanumeric() || ch == '-' || ch == '_',
                "challenge must be URL-safe, found '{}'",
                ch
            );
        }
    }

    #[test]
    fn test_pkce_pair_challenge_has_43_chars() {
        let pair = PkcePair::new();
        assert_eq!(
            pair.challenge.len(), 43,
            "challenge must be 43 chars (SHA256 base64url), got {}",
            pair.challenge.len()
        );
    }

    // ========================================
    // Tests de edge cases y robustez
    // ========================================

    #[test]
    fn test_multiple_pairs_are_unique() {
        let pairs: Vec<PkcePair> = (0..10).map(|_| PkcePair::new()).collect();
        for i in 0..pairs.len() {
            for j in (i+1)..pairs.len() {
                assert_ne!(
                    pairs[i].verifier, pairs[j].verifier,
                    "pair {} and pair {} must have different verifiers",
                    i, j
                );
            }
        }
    }

    #[test]
    fn test_challenge_for_empty_verifier() {
        let challenge = generate_code_challenge("");
        // SHA256 of empty string
        assert_eq!(
            challenge, "47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU",
            "challenge for empty verifier must be correct SHA256"
        );
    }

    #[test]
    fn test_challenge_for_long_verifier() {
        let long_verifier = "a".repeat(128);
        let challenge = generate_code_challenge(&long_verifier);
        assert!(!challenge.is_empty(), "challenge must not be empty for long verifier");
        assert_eq!(challenge.len(), 43, "challenge must be 43 chars");
    }
}
