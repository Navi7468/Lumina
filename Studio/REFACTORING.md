# Studio Refactoring & Technical Debt

This document tracks planned architectural improvements and refactoring work for the Studio app.

## Tauri Backend (Rust)

### src-tauri/src/main.rs

**Priority: Medium**

- [x] Create `PacketBuilder` struct to handle protocol serialization — extracted to `src-tauri/src/protocol.rs` (v0.1.5)
- [x] Extract UDP communication to `src-tauri/src/udp.rs` module — done (v0.1.6)
- [x] Create `src-tauri/src/protocol.rs` for packet format definitions — done (v0.1.5)
- [x] Extract menu creation into separate `src-tauri/src/menu.rs` module — done (v0.1.7)
- [x] Extract menu event handlers to dedicated handler functions — done (v0.1.7)
- [ ] Add proper error types (e.g., `UdpError`, `PacketError`) instead of `String`

## Frontend (TypeScript/React)

### Performance

- [ ] Investigate canvas rendering bottlenecks
- [ ] Profile timeline scrolling performance
- [ ] Consider virtualizing long layer lists

### State Management

- [ ] Review Zustand store organization (currently one large store)
- [ ] Consider splitting into domain-specific stores
- [ ] Audit history implementation for memory leaks

### Component Architecture

- [ ] Break down large components (Timeline, CanvasTimeline)
- [ ] Extract common hooks patterns
- [ ] Consider lazy loading for panels

## General

- [ ] Add comprehensive error boundaries
- [ ] Improve error messages (more user-friendly)
- [ ] Add loading states for async operations
- [ ] Audit accessibility (keyboard navigation, ARIA labels)

## Design & Assets

- [ ] Replace placeholder app icons with custom branded icons
  - Need: 32x32, 128x128, 256x256, icon.icns (macOS), icon.ico (Windows)
  - Design should reflect LED/lighting theme

## Notes

- Custom title bar planned - menu system will still be needed
- Most optimizations are non-breaking and can be done incrementally
