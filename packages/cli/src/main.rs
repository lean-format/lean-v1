use clap::{Parser, Subcommand};
use std::fs;
use std::io::{self, Read};
use std::path::Path;

#[derive(Parser)]
#[command(name = "leanfmt", about = "LEAN Format CLI")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Parse a .lean file and output the AST as JSON
    Parse {
        /// Path to .lean file (or - for stdin)
        input: String,
    },
    /// Validate a .lean file and print diagnostics
    Validate {
        /// Path to .lean file (or - for stdin)
        input: String,
    },
    /// Format a .lean file and print the formatted output
    Format {
        /// Path to .lean file (or - for stdin)
        input: String,
        /// Write formatted output back to the file instead of stdout
        #[arg(short, long)]
        in_place: bool,
    },
}

fn read_input(input: &str) -> Result<String, String> {
    if input == "-" {
        let mut buf = String::new();
        io::stdin()
            .read_to_string(&mut buf)
            .map_err(|e| format!("Failed to read stdin: {}", e))?;
        Ok(buf)
    } else {
        let path = Path::new(input);
        fs::read_to_string(path).map_err(|e| format!("Failed to read '{}': {}", input, e))
    }
}

fn cmd_parse(source: &str) -> Result<String, String> {
    // Simulated WASM parse via JSON
    let tokens: Vec<&str> = source
        .lines()
        .filter(|l| {
            let t = l.trim();
            !t.is_empty() && !t.starts_with("//") && !t.starts_with("/*")
        })
        .collect();

    let mut ast: Vec<serde_json::Value> = Vec::new();
    let mut i = 0;
    while i < tokens.len() {
        let line = tokens[i].trim();
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.is_empty() {
            i += 1;
            continue;
        }
        match parts[0] {
            "model" | "enum" | "relation" | "constraint" | "type" => {
                let block_type = parts[0];
                let name = parts.get(1).copied().unwrap_or("unnamed");
                ast.push(serde_json::json!({
                    "type": block_type,
                    "name": name,
                    "loc": { "line": i + 1, "column": 1 }
                }));
            }
            _ => {}
        }
        i += 1;
    }

    serde_json::to_string_pretty(&serde_json::json!({
        "success": true,
        "ast": ast,
        "errors": []
    }))
    .map_err(|e| format!("JSON serialization error: {}", e))
}

fn cmd_validate(source: &str) -> Result<Vec<String>, String> {
    let mut diagnostics: Vec<String> = Vec::new();
    let mut model_names: Vec<&str> = Vec::new();

    for (i, line) in source.lines().enumerate() {
        let trimmed = line.trim();
        if trimmed.starts_with("//") || trimmed.starts_with("/*") || trimmed.is_empty() {
            continue;
        }
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() >= 2 && parts[0] == "model" {
            let name = parts[1];
            if model_names.contains(&name) {
                diagnostics.push(format!(
                    "error:{}:1:Duplicate model name '{}'",
                    i + 1,
                    name
                ));
            } else {
                model_names.push(name);
            }
        }
    }

    Ok(diagnostics)
}

fn cmd_format(source: &str) -> Result<String, String> {
    let mut out = String::new();
    let mut indent: usize = 0;

    for line in source.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            out.push('\n');
            continue;
        }
        if trimmed.starts_with("//") || trimmed.starts_with("/*") || trimmed == "*/" {
            out.push_str(&"  ".repeat(indent));
            out.push_str(trimmed);
            out.push('\n');
            continue;
        }
        if trimmed.ends_with('}') || trimmed == "}" {
            indent = indent.saturating_sub(1);
        }
        out.push_str(&"  ".repeat(indent));
        out.push_str(trimmed);
        out.push('\n');
        if trimmed.ends_with('{') || trimmed.ends_with('{') || trimmed.starts_with("model")
            || trimmed.starts_with("enum") || trimmed.starts_with("relation")
            || trimmed.starts_with("constraint") || trimmed.starts_with("type")
        {
            if trimmed.contains('{') {
                indent += 1;
            }
        }
    }

    Ok(out)
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Parse { input } => {
            let source = match read_input(input) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("Error: {}", e);
                    std::process::exit(1);
                }
            };
            match cmd_parse(&source) {
                Ok(json) => println!("{}", json),
                Err(e) => {
                    eprintln!("Error: {}", e);
                    std::process::exit(1);
                }
            }
        }
        Commands::Validate { input } => {
            let source = match read_input(input) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("Error: {}", e);
                    std::process::exit(1);
                }
            };
            match cmd_validate(&source) {
                Ok(diagnostics) => {
                    if diagnostics.is_empty() {
                        println!("✓ No validation issues found.");
                    } else {
                        for d in &diagnostics {
                            println!("{}", d);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Error: {}", e);
                    std::process::exit(1);
                }
            }
        }
        Commands::Format { input, in_place } => {
            let source = match read_input(input) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("Error: {}", e);
                    std::process::exit(1);
                }
            };
            match cmd_format(&source) {
                Ok(formatted) => {
                    if *in_place && input != "-" {
                        match fs::write(input, &formatted) {
                            Ok(_) => eprintln!("Formatted '{}' in place.", input),
                            Err(e) => {
                                eprintln!("Error writing to '{}': {}", input, e);
                                std::process::exit(1);
                            }
                        }
                    } else {
                        print!("{}", formatted);
                    }
                }
                Err(e) => {
                    eprintln!("Error: {}", e);
                    std::process::exit(1);
                }
            }
        }
    }
}
