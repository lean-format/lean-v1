use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct ParsedResult {
    pub ast: serde_json::Value,
    pub errors: Vec<String>,
    pub tokens: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationError {
    pub line: usize,
    pub column: usize,
    pub message: String,
    pub code: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiffEntry {
    pub kind: String,
    pub line: usize,
    pub left: Option<String>,
    pub right: Option<String>,
}

#[derive(Debug, Error)]
pub enum LeanError {
    #[error("Parse error: {0}")]
    Parse(String),
    #[error("Validation error: {0}")]
    Validate(String),
    #[error("Format error: {0}")]
    Format(String),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
}

impl From<LeanError> for String {
    fn from(e: LeanError) -> String {
        e.to_string()
    }
}

#[allow(dead_code)]
pub fn result_to_command<T: Serialize>(
    result: Result<T, LeanError>,
) -> Result<T, String> {
    result.map_err(|e| e.to_string())
}
