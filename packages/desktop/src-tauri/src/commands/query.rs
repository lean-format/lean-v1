use serde_json::Value;
use tauri::command;

#[command]
pub fn query_lean(source: String, path: String) -> Result<Value, String> {
    let result = std::panic::catch_unwind(|| -> Value {
        let lines: Vec<&str> = source.lines().collect();
        let segments: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
        let mut current = serde_json::json!({
            "type": "document",
            "lines": lines,
            "lineCount": lines.len(),
        });

        for seg in segments {
            match seg {
                "lines" => {
                    current = serde_json::json!(lines);
                }
                "lineCount" => {
                    current = serde_json::json!(lines.len());
                }
                _ => {
                    if let Ok(idx) = seg.parse::<usize>() {
                        if idx < lines.len() {
                            current = serde_json::json!(lines[idx]);
                        }
                    }
                }
            }
        }

        current
    });

    match result {
        Ok(v) => Ok(v),
        Err(e) => Err(format!("Query panicked: {:?}", e)),
    }
}
