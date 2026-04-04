// Application menu construction and event handling.

use tauri::{CustomMenuItem, Manager, Menu, MenuItem, Submenu, WindowMenuEvent};

/// Builds and returns the full application menu.
pub fn build_menu() -> Menu {
    let new_project  = CustomMenuItem::new("new",          "New Project");
    let open_project = CustomMenuItem::new("open",         "Open Project");
    let save_project = CustomMenuItem::new("save",         "Save Project");
    let save_as      = CustomMenuItem::new("save-as",      "Save As...");
    let settings     = CustomMenuItem::new("settings",     "Settings");
    let quit         = CustomMenuItem::new("quit",         "Quit");

    let undo         = CustomMenuItem::new("undo",         "Undo");
    let redo         = CustomMenuItem::new("redo",         "Redo");
    let cut          = CustomMenuItem::new("cut",          "Cut");
    let copy         = CustomMenuItem::new("copy",         "Copy");
    let paste        = CustomMenuItem::new("paste",        "Paste");
    let preferences  = CustomMenuItem::new("preferences",  "Preferences");
    let palettes     = CustomMenuItem::new("palettes",     "Color Palettes...");

    let play         = CustomMenuItem::new("play",         "Play");
    let pause        = CustomMenuItem::new("pause",        "Pause");
    let stop         = CustomMenuItem::new("stop",         "Stop");
    let connect_pi   = CustomMenuItem::new("connect-pi",   "Connect to Pi");
    let disconnect_pi= CustomMenuItem::new("disconnect-pi","Disconnect from Pi");

    let about        = CustomMenuItem::new("about",        "About");
    let docs         = CustomMenuItem::new("docs",         "Documentation");

    let file_menu = Submenu::new("File", Menu::new()
        .add_item(new_project)
        .add_item(open_project)
        .add_item(save_project)
        .add_item(save_as)
        .add_native_item(MenuItem::Separator)
        .add_item(settings)
        .add_native_item(MenuItem::Separator)
        .add_item(quit));

    let edit_menu = Submenu::new("Edit", Menu::new()
        .add_item(undo)
        .add_item(redo)
        .add_native_item(MenuItem::Separator)
        .add_item(cut)
        .add_item(copy)
        .add_item(paste)
        .add_native_item(MenuItem::Separator)
        .add_item(preferences)
        .add_item(palettes));

    let playback_menu = Submenu::new("Playback", Menu::new()
        .add_item(play)
        .add_item(pause)
        .add_item(stop)
        .add_native_item(MenuItem::Separator)
        .add_item(connect_pi)
        .add_item(disconnect_pi));

    let help_menu = Submenu::new("Help", Menu::new()
        .add_item(about)
        .add_item(docs));

    Menu::new()
        .add_submenu(file_menu)
        .add_submenu(edit_menu)
        .add_submenu(playback_menu)
        .add_submenu(help_menu)
}

/// Handles all menu events, emitting frontend events where needed.
pub fn handle_menu_event(event: WindowMenuEvent) {
    let window = event.window();
    match event.menu_item_id() {
        "new"           => { window.emit("new-project",      ()).unwrap(); }
        "open"          => { window.emit("open-project",     ()).unwrap(); }
        "save"          => { window.emit("save-project",     ()).unwrap(); }
        "save-as"       => { window.emit("save-project-as",  ()).unwrap(); }
        "settings"      => { window.emit("open-settings",    ()).unwrap(); }
        "quit"          => { std::process::exit(0); }
        "undo"          => { window.emit("edit-undo",        ()).unwrap(); }
        "redo"          => { window.emit("edit-redo",        ()).unwrap(); }
        "preferences"   => { window.emit("open-preferences", ()).unwrap(); }
        "palettes"      => { window.emit("open-palettes",    ()).unwrap(); }
        "play"          => { window.emit("playback-play",    ()).unwrap(); }
        "pause"         => { window.emit("playback-pause",   ()).unwrap(); }
        "stop"          => { window.emit("playback-stop",    ()).unwrap(); }
        "connect-pi"    => { window.emit("open-pi-connect",  ()).unwrap(); }
        "disconnect-pi" => { window.emit("pi-disconnect",    ()).unwrap(); }
        "about"         => { window.emit("open-about",       ()).unwrap(); }
        "docs"          => { window.emit("open-docs",        ()).unwrap(); }
        _ => {}
    }
}
