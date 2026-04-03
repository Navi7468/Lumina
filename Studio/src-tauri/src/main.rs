// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// NOTE: Planned refactoring tracked in Studio/REFACTORING.md
// Main areas: menu builder pattern, separate UDP module

mod protocol;

use protocol::{PacketBuilder, PACKET_TYPE_FRAME, PACKET_TYPE_STATIC_FRAME, PACKET_TYPE_SET_TIMEOUT};
use tauri::{Menu, Submenu, MenuItem, CustomMenuItem, Manager};
use std::net::UdpSocket;
use std::sync::Mutex;
use tauri::State;

// UDP State
struct UdpState(Mutex<Option<UdpSocket>>);

#[tauri::command]
fn connect_to_pi(state: State<UdpState>, ip: String, port: u16) -> Result<String, String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to create socket: {}", e))?;
    
    socket.connect(format!("{}:{}", ip, port))
        .map_err(|e| format!("Failed to connect: {}", e))?;
    
    *state.0.lock().unwrap() = Some(socket);
    Ok(format!("Connected to {}:{}", ip, port))
}

#[tauri::command]
fn send_frame(state: State<UdpState>, sequence: u32, rgb_data: Vec<u8>) -> Result<(), String> {
    let socket_guard = state.0.lock().unwrap();

    if let Some(socket) = socket_guard.as_ref() {
        let packet = PacketBuilder::new(PACKET_TYPE_FRAME)
            .sequence(sequence)
            .payload(&rgb_data)
            .build();

        socket.send(&packet)
            .map_err(|e| format!("Failed to send: {}", e))?;
        Ok(())
    } else {
        Err("Not connected to Pi".to_string())
    }
}

#[tauri::command]
fn send_static_frame(state: State<UdpState>, sequence: u32, rgb_data: Vec<u8>) -> Result<(), String> {
    let socket_guard = state.0.lock().unwrap();

    if let Some(socket) = socket_guard.as_ref() {
        let packet = PacketBuilder::new(PACKET_TYPE_STATIC_FRAME)
            .sequence(sequence)
            .payload(&rgb_data)
            .build();

        socket.send(&packet)
            .map_err(|e| format!("Failed to send: {}", e))?;
        Ok(())
    } else {
        Err("Not connected to Pi".to_string())
    }
}

#[tauri::command]
fn set_timeout(state: State<UdpState>, timeout_ms: u32) -> Result<(), String> {
    let socket_guard = state.0.lock().unwrap();

    if let Some(socket) = socket_guard.as_ref() {
        let packet = PacketBuilder::new(PACKET_TYPE_SET_TIMEOUT)
            .sequence(0) // timeout packets don't need sequence tracking
            .payload(&timeout_ms.to_le_bytes())
            .build();

        socket.send(&packet)
            .map_err(|e| format!("Failed to send timeout: {}", e))?;
        Ok(())
    } else {
        Err("Not connected to Pi".to_string())
    }
}

#[tauri::command]
fn disconnect(state: State<UdpState>) -> Result<(), String> {
    *state.0.lock().unwrap() = None;
    Ok(())
}

fn main() {
    // Create menu items
    let new_project = CustomMenuItem::new("new".to_string(), "New Project");
    let open_project = CustomMenuItem::new("open".to_string(), "Open Project");
    let save_project = CustomMenuItem::new("save".to_string(), "Save Project");
    let save_as = CustomMenuItem::new("save-as".to_string(), "Save As...");
    let settings = CustomMenuItem::new("settings".to_string(), "Settings");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    
    let undo = CustomMenuItem::new("undo".to_string(), "Undo");
    let redo = CustomMenuItem::new("redo".to_string(), "Redo");
    let cut = CustomMenuItem::new("cut".to_string(), "Cut");
    let copy = CustomMenuItem::new("copy".to_string(), "Copy");
    let paste = CustomMenuItem::new("paste".to_string(), "Paste");
    let preferences = CustomMenuItem::new("preferences".to_string(), "Preferences");
    let palettes = CustomMenuItem::new("palettes".to_string(), "Color Palettes...");
    
    let about = CustomMenuItem::new("about".to_string(), "About");
    let docs = CustomMenuItem::new("docs".to_string(), "Documentation");
    
    let play = CustomMenuItem::new("play".to_string(), "Play");
    let pause = CustomMenuItem::new("pause".to_string(), "Pause");
    let stop = CustomMenuItem::new("stop".to_string(), "Stop");
    let connect_pi = CustomMenuItem::new("connect-pi".to_string(), "Connect to Pi");
    let disconnect_pi = CustomMenuItem::new("disconnect-pi".to_string(), "Disconnect from Pi");
    
    // Create submenus
    let file_menu = Submenu::new(
        "File",
        Menu::new()
            .add_item(new_project)
            .add_item(open_project)
            .add_item(save_project)
            .add_item(save_as)
            .add_native_item(MenuItem::Separator)
            .add_item(settings)
            .add_native_item(MenuItem::Separator)
            .add_item(quit)
    );
    
    let edit_menu = Submenu::new(
        "Edit",
        Menu::new()
            .add_item(undo)
            .add_item(redo)
            .add_native_item(MenuItem::Separator)
            .add_item(cut)
            .add_item(copy)
            .add_item(paste)
            .add_native_item(MenuItem::Separator)
            .add_item(preferences)
            .add_item(palettes)
    );
    
    let help_menu = Submenu::new(
        "Help",
        Menu::new()
            .add_item(about)
            .add_item(docs)
    );
    
    let playback_menu = Submenu::new(
        "Playback",
        Menu::new()
            .add_item(play)
            .add_item(pause)
            .add_item(stop)
            .add_native_item(MenuItem::Separator)
            .add_item(connect_pi)
            .add_item(disconnect_pi)
    );
    
    // Build the main menu
    let menu = Menu::new()
        .add_submenu(file_menu)
        .add_submenu(edit_menu)
        .add_submenu(playback_menu)
        .add_submenu(help_menu);

    tauri::Builder::default()
        .menu(menu)
        .on_menu_event(|event| {
            let window = event.window();
            match event.menu_item_id() {
                "new" => {
                    println!("New project");
                }
                "open" => {
                    println!("Open project");
                }
                "save" => {
                    println!("Save project");
                }
                "save-as" => {
                    println!("Save as...");
                }
                "settings" => {
                    window.emit("open-settings", ()).unwrap();
                }
                "quit" => {
                    std::process::exit(0);
                }
                "undo" => {
                    println!("Undo");
                }
                "redo" => {
                    println!("Redo");
                }
                "cut" => {
                    println!("Cut");
                }
                "copy" => {
                    println!("Copy");
                }
                "paste" => {
                    println!("Paste");
                }
                "preferences" => {
                    window.emit("open-preferences", ()).unwrap();
                }
                "palettes" => {
                    window.emit("open-palettes", ()).unwrap();
                }
                "play" => {
                    window.emit("playback-play", ()).unwrap();
                }
                "pause" => {
                    window.emit("playback-pause", ()).unwrap();
                }
                "stop" => {
                    window.emit("playback-stop", ()).unwrap();
                }
                "connect-pi" => {
                    window.emit("open-pi-connect", ()).unwrap();
                }
                "disconnect-pi" => {
                    window.emit("pi-disconnect", ()).unwrap();
                }
                "about" => {
                    println!("About");
                }
                "docs" => {
                    println!("Documentation");
                }
                _ => {}
            }
        })
        .manage(UdpState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            connect_to_pi,
            send_frame,
            send_static_frame,
            set_timeout,
            disconnect
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
