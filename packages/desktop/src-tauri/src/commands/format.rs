use tauri::command;

#[command]
pub fn format_lean(source: String) -> Result<String, String> {
    let result = std::panic::catch_unwind(|| -> String {
        let mut formatted = String::new();
        let mut in_block = false;

        for line in source.lines() {
            let trimmed = line.trim();

            if trimmed == "```" {
                in_block = !in_block;
                formatted.push_str(line);
                formatted.push('\n');
                continue;
            }

            if in_block {
                formatted.push_str(line);
                formatted.push('\n');
                continue;
            }

            if trimmed.is_empty() {
                formatted.push('\n');
                continue;
            }

            if trimmed.starts_with('#') || trimmed.starts_with("---") {
                formatted.push_str(trimmed);
                formatted.push('\n');
                continue;
            }

            if trimmed.starts_with('-') {
                let indent = line.len() - line.trim_start().len();
                formatted.push_str(&" ".repeat(indent));
                formatted.push_str("- ");
                if let Some(content) = trimmed.strip_prefix('-') {
                    formatted.push_str(content.trim());
                }
                formatted.push('\n');
                continue;
            }

            formatted.push_str(trimmed);
            formatted.push('\n');
        }

        formatted
    });

    match result {
        Ok(f) => Ok(f),
        Err(e) => Err(format!("Format panicked: {:?}", e)),
    }
}
