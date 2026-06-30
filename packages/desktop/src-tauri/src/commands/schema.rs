use tauri::command;

#[command]
pub fn validate_schema(source: String, data: String) -> Result<Vec<String>, String> {
    let result = std::panic::catch_unwind(|| -> Vec<String> {
        let mut errors = Vec::new();
        let schema_lines: Vec<&str> = source.lines().collect();
        let data_lines: Vec<&str> = data.lines().collect();

        let schema_items: Vec<&str> = schema_lines
            .iter()
            .filter(|l| l.trim().starts_with('-'))
            .copied()
            .collect();

        if schema_items.is_empty() {
            errors.push("No schema definitions found".to_string());
            return errors;
        }

        for (i, line) in data_lines.iter().enumerate() {
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.starts_with('#') {
                continue;
            }
            if trimmed.starts_with('-') {
                let has_match = schema_items.iter().any(|s| {
                    let s_clean = s.trim().trim_start_matches('-').trim();
                    let d_clean = trimmed.trim_start_matches('-').trim();
                    d_clean.starts_with(s_clean) || s_clean == "*"
                });
                if !has_match {
                    errors.push(format!("Line {}: no matching schema for '{}'", i + 1, trimmed));
                }
            }
        }

        errors
    });

    match result {
        Ok(e) => Ok(e),
        Err(e) => Err(format!("Schema validation panicked: {:?}", e)),
    }
}
