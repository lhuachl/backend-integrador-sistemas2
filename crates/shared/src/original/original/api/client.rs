pub struct InsForgeClient {
    pub base_url: String,
    pub anon_key: String,
}

impl InsForgeClient {
    pub fn new(base_url: &str, anon_key: &str) -> Self {
        Self {
            base_url: base_url.to_string(),
            anon_key: anon_key.to_string(),
        }
    }
}
