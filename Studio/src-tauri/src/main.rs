// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod menu;
mod protocol;
mod udp;

use std::sync::Mutex;
use udp::UdpState;

fn main() {
    tauri::Builder::default()
        .menu(menu::build_menu())
        .on_menu_event(menu::handle_menu_event)
        .manage(UdpState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            udp::connect_to_pi,
            udp::send_frame,
            udp::send_static_frame,
            udp::set_timeout,
            udp::disconnect
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

