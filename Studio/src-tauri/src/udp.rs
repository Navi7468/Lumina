// UDP socket management and Tauri commands for communicating with the receiver.

use crate::protocol::{PacketBuilder, PACKET_TYPE_FRAME, PACKET_TYPE_STATIC_FRAME, PACKET_TYPE_SET_TIMEOUT};
use std::net::UdpSocket;
use std::sync::Mutex;
use tauri::State;

/// Managed Tauri state holding the connected UDP socket.
pub struct UdpState(pub Mutex<Option<UdpSocket>>);

#[tauri::command]
pub fn connect_to_pi(state: State<UdpState>, ip: String, port: u16) -> Result<String, String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to create socket: {}", e))?;

    socket.connect(format!("{}:{}", ip, port))
        .map_err(|e| format!("Failed to connect: {}", e))?;

    *state.0.lock().unwrap() = Some(socket);
    Ok(format!("Connected to {}:{}", ip, port))
}

#[tauri::command]
pub fn send_frame(state: State<UdpState>, sequence: u32, rgb_data: Vec<u8>) -> Result<(), String> {
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
pub fn send_static_frame(state: State<UdpState>, sequence: u32, rgb_data: Vec<u8>) -> Result<(), String> {
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
pub fn set_timeout(state: State<UdpState>, timeout_ms: u32) -> Result<(), String> {
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
pub fn disconnect(state: State<UdpState>) -> Result<(), String> {
    *state.0.lock().unwrap() = None;
    Ok(())
}
