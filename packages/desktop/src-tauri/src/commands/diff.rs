use crate::utils::DiffEntry;
use tauri::command;

#[command]
pub fn diff_lean(left: String, right: String) -> Result<Vec<DiffEntry>, String> {
    let result = std::panic::catch_unwind(|| -> Vec<DiffEntry> {
        let left_lines: Vec<&str> = left.lines().collect();
        let right_lines: Vec<&str> = right.lines().collect();
        let mut diffs = Vec::new();
        let max = std::cmp::max(left_lines.len(), right_lines.len());

        for i in 0..max {
            let l = left_lines.get(i).copied().unwrap_or("");
            let r = right_lines.get(i).copied().unwrap_or("");

            if l != r {
                diffs.push(DiffEntry {
                    kind: if l.is_empty() { "added".to_string() } else if r.is_empty() { "removed".to_string() } else { "changed".to_string() },
                    line: i + 1,
                    left: if l.is_empty() { None } else { Some(l.to_string()) },
                    right: if r.is_empty() { None } else { Some(r.to_string()) },
                });
            }
        }

        diffs
    });

    match result {
        Ok(d) => Ok(d),
        Err(e) => Err(format!("Diff panicked: {:?}", e)),
    }
}
