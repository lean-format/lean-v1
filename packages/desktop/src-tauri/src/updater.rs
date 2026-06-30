use tauri::{AppHandle, Emitter};
use tauri_plugin_updater::UpdaterExt;

pub fn check_for_updates(app: &AppHandle) {
    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        match handle.updater().unwrap().check().await {
            Ok(Some(update)) => {
                let _ = handle.emit("update-available", serde_json::json!({
                    "version": update.version,
                    "date": update.date,
                    "body": update.body,
                }));
            }
            Ok(None) => {
                let _ = handle.emit("update-not-available", ());
            }
            Err(e) => {
                eprintln!("Update check failed: {}", e);
                let _ = handle.emit("update-error", serde_json::json!({
                    "error": e.to_string(),
                }));
            }
        }
    });
}
