use crate::utils::ParsedResult;
use tauri::command;

#[command]
pub fn parse_lean(source: String) -> Result<ParsedResult, String> {
    let result = std::panic::catch_unwind(|| {
        let lines: Vec<&str> = source.lines().collect();
        let errors: Vec<String> = Vec::new();
        let tokens = source.split_whitespace().count();

        ParsedResult {
            ast: serde_json::json!({
                "type": "document",
                "children": [],
                "lineCount": lines.len(),
            }),
            errors,
            tokens,
        }
    });

    match result {
        Ok(r) => Ok(r),
        Err(e) => Err(format!("Parse panicked: {:?}", e)),
    }
}
