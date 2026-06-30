use tauri::{
    AppHandle, Runtime, Manager,
    menu::{Menu, MenuItem, Submenu, PredefinedMenuItem},
    Emitter,
};

macro_rules! menu_item {
    ($app:expr, $id:expr, $text:expr) => {
        MenuItem::with_id($app, $id, $text, true, None::<&str>)?
    };
}

pub fn create_menu<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let export_submenu = Submenu::with_items(app, "Export", true, &[
        &menu_item!(app, "export_json", "JSON"),
        &menu_item!(app, "export_yaml", "YAML"),
        &menu_item!(app, "export_typescript", "TypeScript"),
    ])?;

    let file_menu = Submenu::with_items(app, "File", true, &[
        &menu_item!(app, "file_new", "New\t⌘N"),
        &menu_item!(app, "file_open", "Open...\t⌘O"),
        &menu_item!(app, "file_save", "Save\t⌘S"),
        &menu_item!(app, "file_save_as", "Save As...\t⇧⌘S"),
        &menu_item!(app, "file_close", "Close\t⌘W"),
        &PredefinedMenuItem::separator(app)?,
        &export_submenu,
        &PredefinedMenuItem::separator(app)?,
        &menu_item!(app, "file_quit", "Quit\t⌘Q"),
    ])?;

    let edit_menu = Submenu::with_items(app, "Edit", true, &[
        &menu_item!(app, "edit_undo", "Undo\t⌘Z"),
        &menu_item!(app, "edit_redo", "Redo\t⇧⌘Z"),
        &PredefinedMenuItem::separator(app)?,
        &menu_item!(app, "edit_cut", "Cut\t⌘X"),
        &menu_item!(app, "edit_copy", "Copy\t⌘C"),
        &menu_item!(app, "edit_paste", "Paste\t⌘V"),
        &menu_item!(app, "edit_select_all", "Select All\t⌘A"),
    ])?;

    let view_menu = Submenu::with_items(app, "View", true, &[
        &menu_item!(app, "view_toggle_sidebar", "Toggle Sidebar"),
        &menu_item!(app, "view_toggle_minimap", "Toggle Minimap"),
        &PredefinedMenuItem::separator(app)?,
        &menu_item!(app, "view_zoom_in", "Zoom In\t⌘+"),
        &menu_item!(app, "view_zoom_out", "Zoom Out\t⌘-"),
        &menu_item!(app, "view_reset_zoom", "Reset Zoom\t⌘0"),
        &PredefinedMenuItem::separator(app)?,
        &menu_item!(app, "view_toggle_dark_mode", "Toggle Dark Mode"),
    ])?;

    let tools_menu = Submenu::with_items(app, "Tools", true, &[
        &menu_item!(app, "tools_format", "Format"),
        &menu_item!(app, "tools_validate", "Validate"),
        &menu_item!(app, "tools_diff", "Diff"),
        &menu_item!(app, "tools_query", "Query"),
        &menu_item!(app, "tools_schema", "Schema Validator"),
        &PredefinedMenuItem::separator(app)?,
        &menu_item!(app, "tools_fuzz", "Fuzz Testing"),
    ])?;

    let help_menu = Submenu::with_items(app, "Help", true, &[
        &menu_item!(app, "help_docs", "Documentation"),
        &menu_item!(app, "help_shortcuts", "Keyboard Shortcuts"),
        &PredefinedMenuItem::separator(app)?,
        &menu_item!(app, "help_check_updates", "Check for Updates"),
        &menu_item!(app, "help_about", "About LEAN Studio"),
    ])?;

    let menu = Menu::with_items(app, &[
        &file_menu,
        &edit_menu,
        &view_menu,
        &tools_menu,
        &help_menu,
    ])?;

    app.set_menu(menu)?;

    app.on_menu_event(move |app, event| {
        let id = event.id().0.as_str();
        match id {
            "file_new" => { let _ = app.emit("menu-file-new", ()); }
            "file_open" => { let _ = app.emit("menu-file-open", ()); }
            "file_save" => { let _ = app.emit("menu-file-save", ()); }
            "file_save_as" => { let _ = app.emit("menu-file-save-as", ()); }
            "file_close" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.close();
                }
            }
            "file_quit" => { app.exit(0); }
            "export_json" => { let _ = app.emit("menu-export-json", ()); }
            "export_yaml" => { let _ = app.emit("menu-export-yaml", ()); }
            "export_typescript" => { let _ = app.emit("menu-export-typescript", ()); }
            "edit_undo" => { let _ = app.emit("menu-edit-undo", ()); }
            "edit_redo" => { let _ = app.emit("menu-edit-redo", ()); }
            "edit_cut" => { let _ = app.emit("menu-edit-cut", ()); }
            "edit_copy" => { let _ = app.emit("menu-edit-copy", ()); }
            "edit_paste" => { let _ = app.emit("menu-edit-paste", ()); }
            "edit_select_all" => { let _ = app.emit("menu-edit-select-all", ()); }
            "view_toggle_sidebar" => { let _ = app.emit("menu-view-toggle-sidebar", ()); }
            "view_toggle_minimap" => { let _ = app.emit("menu-view-toggle-minimap", ()); }
            "view_zoom_in" => { let _ = app.emit("menu-view-zoom-in", ()); }
            "view_zoom_out" => { let _ = app.emit("menu-view-zoom-out", ()); }
            "view_reset_zoom" => { let _ = app.emit("menu-view-reset-zoom", ()); }
            "view_toggle_dark_mode" => { let _ = app.emit("menu-view-toggle-dark-mode", ()); }
            "tools_format" => { let _ = app.emit("menu-tools-format", ()); }
            "tools_validate" => { let _ = app.emit("menu-tools-validate", ()); }
            "tools_diff" => { let _ = app.emit("menu-tools-diff", ()); }
            "tools_query" => { let _ = app.emit("menu-tools-query", ()); }
            "tools_schema" => { let _ = app.emit("menu-tools-schema", ()); }
            "tools_fuzz" => { let _ = app.emit("menu-tools-fuzz", ()); }
            "help_docs" => { let _ = app.emit("menu-help-docs", ()); }
            "help_shortcuts" => { let _ = app.emit("menu-help-shortcuts", ()); }
            "help_check_updates" => { let _ = app.emit("menu-check-updates", ()); }
            "help_about" => { let _ = app.emit("menu-help-about", ()); }
            _ => {}
        }
    });

    Ok(())
}
