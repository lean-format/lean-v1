use tauri::command;

#[command]
pub fn fuzz_lean(input: String, iterations: u32) -> Result<Vec<String>, String> {
    let result = std::panic::catch_unwind(|| -> Vec<String> {
        let mut results = Vec::new();
        let base_len = input.len();

        for i in 0..iterations {
            let mut mutated = input.clone();

            match i % 5 {
                0 => {
                    if !mutated.is_empty() {
                        let idx = (i as usize) % mutated.len();
                        mutated.remove(idx);
                        results.push(format!("Iteration {}: delete char at {} -> OK", i + 1, idx));
                    }
                }
                1 => {
                    let idx = if mutated.is_empty() {
                        0
                    } else {
                        (i as usize) % (mutated.len() + 1)
                    };
                    let c = char::from(b'a' + (i % 26) as u8);
                    mutated.insert(idx, c);
                    results.push(format!("Iteration {}: insert '{}' at {} -> OK", i + 1, c, idx));
                }
                2 => {
                    if mutated.len() > 1 {
                        let idx = (i as usize) % (mutated.len() - 1);
                        let bytes = unsafe { mutated.as_bytes_mut() };
                        bytes.swap(idx, idx + 1);
                        results.push(format!("Iteration {}: swap at {} -> OK", i + 1, idx));
                    }
                }
                3 => {
                    if mutated.len() > 2 {
                        let start = (i as usize) % (mutated.len() - 1);
                        let end = std::cmp::min(start + 2, mutated.len());
                        let section = mutated[start..end].to_string();
                        mutated.push_str(&section);
                        results.push(format!("Iteration {}: repeat section -> OK", i + 1));
                    }
                }
                4 => {
                    if !mutated.is_empty() {
                        let idx = (i as usize) % mutated.len();
                        let c = char::from(b'0' + (i % 10) as u8);
                        mutated.replace_range(idx..idx + 1, &c.to_string());
                        results.push(format!("Iteration {}: replace at {} with '{}' -> OK", i + 1, idx, c));
                    }
                }
                _ => {}
            }

            if results.len() as u32 >= iterations {
                break;
            }
        }

        if results.is_empty() {
            results.push("No mutations applied (input too short)".to_string());
        }

        results.push(format!("Fuzz completed: {} iterations on {} chars", iterations, base_len));
        results
    });

    match result {
        Ok(r) => Ok(r),
        Err(e) => Err(format!("Fuzz panicked: {:?}", e)),
    }
}
