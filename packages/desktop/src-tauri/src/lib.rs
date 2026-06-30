mod commands;
mod menu;
mod tray;
mod updater;
mod utils;

use std::sync::Mutex;

#[allow(dead_code)]
struct AppState {
    dark_mode: Mutex<bool>,
    sidebar_visible: Mutex<bool>,
    minimap_visible: Mutex<bool>,
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(AppState {
            dark_mode: Mutex::new(false),
            sidebar_visible: Mutex::new(true),
            minimap_visible: Mutex::new(true),
        })
        .invoke_handler(tauri::generate_handler![
            commands::parse::parse_lean,
            commands::validate::validate_lean,
            commands::format::format_lean,
            commands::diff::diff_lean,
            commands::query::query_lean,
            commands::schema::validate_schema,
            commands::watch::watch_files,
            commands::fuzz::fuzz_lean,
        ])
        .setup(|app| {
            let handle = app.handle();
            tray::create_tray(handle)?;
            menu::create_menu(handle)?;
            updater::check_for_updates(handle);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running LEAN Studio");
}
