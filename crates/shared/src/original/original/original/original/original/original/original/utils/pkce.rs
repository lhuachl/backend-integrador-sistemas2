use rand::Rng;
use sha2::{Digest, Sha256};
use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;

const VERIFIER_MIN_LEN: usize = 43;
const VERIFIER_MAX_LEN: usize = 128;
const VERIFIER_CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

pub fn generate_code_verifier() -> String {
    let mut rng = rand::thread_rng();
    let len = rng.gen_range(VERIFIER_MIN_LEN..=VERIFIER_MAX_LEN);

    (0..len)
        .map(|_| {
            let idx = rng.gen_range(0..VERIFIER_CHARSET.len());
            VERIFIER_CHARSET[idx] as char
        })
        .collect()
}

pub fn generate_code_challenge(verifier: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(verifier.as_bytes());
    let hash = hasher.finalize();
    URL_SAFE_NO_PAD.encode(hash)
}

pub struct PkcePair {
    pub verifier: String,
    pub challenge: String,
}

impl PkcePair {
    pub fn new() -> Self {
        let verifier = generate_code_verifier();
        let challenge = generate_code_challenge(&verifier);
        Self { verifier, challenge }
    }
}
