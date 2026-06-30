use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{command, AppHandle, Emitter};

#[command]
pub fn watch_files(app: AppHandle, dirs: Vec<String>) -> Result<(), String> {
    let running = Arc::new(AtomicBool::new(true));
    let _r = running.clone();

    let (tx, rx) = mpsc::channel::<Result<Event, notify::Error>>();

    let mut watcher = RecommendedWatcher::new(
        move |res| {
            let _ = tx.send(res);
        },
        Config::default(),
    )
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    for dir in &dirs {
        let path = Path::new(dir);
        if path.exists() {
            watcher
                .watch(path, RecursiveMode::Recursive)
                .map_err(|e| format!("Failed to watch {}: {}", dir, e))?;
        }
    }

    std::thread::spawn(move || {
        while running.load(Ordering::SeqCst) {
            match rx.recv() {
                Ok(Ok(event)) => {
                    let kind = match event.kind {
                        EventKind::Create(_) => "created",
                        EventKind::Modify(_) => "modified",
                        EventKind::Remove(_) => "removed",
                        _ => "unknown",
                    };

                    let paths: Vec<String> = event
                        .paths
                        .iter()
                        .map(|p| p.to_string_lossy().to_string())
                        .collect();

                    let _ = app.emit("file-changed", serde_json::json!({
                        "kind": kind,
                        "paths": paths,
                    }));
                }
                Ok(Err(e)) => {
                    eprintln!("Watch error: {}", e);
                }
                Err(_) => break,
            }
        }
    });

    std::mem::forget(watcher);

    Ok(())
}
