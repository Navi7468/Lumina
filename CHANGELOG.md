# Changelog

All notable changes to Lumina will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-04-03

### Fixed

- **Receiver: race condition on `DoubleBuffer::back` pointer** — `back` was a plain
  (non-atomic) pointer accessed from two threads. The network thread read it via
  `getBack()` before writing packet data; the main thread modified it (and the pointer
  itself) in `swap()`. Added `std::mutex back_mutex` to `DoubleBuffer`; `swap()` now
  acquires this mutex internally, and every caller that accesses the back buffer (network
  write, `fadeToBlack`) must hold it via `std::lock_guard`.

- **Receiver: data race between `fadeToBlack()` and network writes** — the main thread
  iterated over `back->data` applying a fade multiplier while the network thread could
  simultaneously `memcpy` new RGB data into the same memory. `fadeToBlack()` now acquires
  `back_mutex` before touching the buffer.

- **Receiver: network thread writing directly to the front buffer** — `UdpServer::poll()`
  accepted an optional `frontBuffer` pointer and wrote to it for `PACKET_TYPE_STATIC_FRAME`
  packets, racing with the main thread reading that same buffer for rendering. The front
  buffer parameter has been removed from `poll()`. Instead, the main thread checks an
  atomic `staticFramePending` flag after each `swap()` and safely copies the new front
  buffer into the new back buffer under `back_mutex`, achieving the same flicker-free
  scrubbing behavior without cross-thread front-buffer writes.

### Added

- Tauri-based desktop application with React + TypeScript
- C++ UDP receiver for Raspberry Pi with WS2811 support
- Visual timeline editor with track-based layer rendering
- Real-time LED preview system
- UDP streaming to Raspberry Pi receiver with robust protocol:
  - Packet header with magic number, version, sequence tracking
  - Multiple packet types (frame, static frame, timeout configuration)
  - Dropped packet detection via sequence numbers
  - Automatic fade-to-black on connection timeout
- Performance monitoring system for receiver:
  - Frame rate and render time tracking
  - Packet loss and latency statistics
  - Configurable logging interval
- Drag-and-drop layer reordering
- Tension handles for envelope curves with power function interpolation
- Adjustment layers with envelope-controlled modifiers (brightness, blur, saturation, gamma)
- Keyframe animation system with multiple interpolation modes (linear, step, ease, bezier)
- Effect and modifier registry system
- Double-buffered rendering on both studio and receiver
- Multi-stop gradient editor with 8 built-in presets
- Global color palette system
- LED selection tools for targeting specific LED ranges

### Changed

- Switched from quadratic Bézier to power function for tension curves
- Increased tension curve smoothness with adaptive segment rendering
- Improved timeline rendering performance with double buffering
- Enhanced adjustment layer header visuals and interaction

### Fixed

- Fixed adjustment layer modifier ID mismatch preventing effects from applying
- Fixed timeline track order not affecting rendering (now sorts by track index)
- Fixed tension handles creating keyframes instead of allowing drag
- Fixed tension handle positioning to stay on the actual curve
- Fixed tension handle click detection and priority ordering

### Known Issues

- Networking code (UdpServer.cpp) currently uses Unix-specific socket APIs without platform abstraction. This will be addressed in a future update with proper cross-platform support.

## [0.1.0-alpha] - 2026-03-06

### Initial Release

- Basic project structure with Studio and Receiver
- Core timeline and layer system
- Simple LED rendering and UDP transmission
- Proof of concept for networked LED control

---

[Unreleased]: https://github.com/Navi7468/lumina/compare/v0.1.0-alpha...HEAD
[0.1.0-alpha]: https://github.com/Navi7468/lumina/releases/tag/v0.1.0-alpha
