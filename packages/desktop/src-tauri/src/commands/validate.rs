use crate::utils::ValidationError;
use tauri::command;

#[command]
pub fn validate_lean(source: String) -> Result<Vec<ValidationError>, String> {
    let result = std::panic::catch_unwind(|| -> Vec<ValidationError> {
        let mut errors = Vec::new();

        for (i, line) in source.lines().enumerate() {
            if line.trim().is_empty() || line.trim().starts_with('#') {
                continue;
            }
            if line.trim().starts_with('-') && !line.trim().starts_with("---") {
                if let Some(content) = line.trim().strip_prefix('-') {
                    if content.trim().is_empty() {
                        errors.push(ValidationError {
                            line: i + 1,
                            column: 1,
                            message: "Empty list item".to_string(),
                            code: "E001".to_string(),
                        });
                    }
                }
            }
        }

        errors
    });

    match result {
        Ok(errors) => Ok(errors),
        Err(e) => Err(format!("Validation panicked: {:?}", e)),
    }
}
