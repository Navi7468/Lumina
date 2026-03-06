# Studio Refactoring & Technical Debt

This document tracks planned architectural improvements and refactoring work for the Studio app.

## Tauri Backend (Rust)

### src-tauri/src/main.rs

**Priority: Medium**

Current issues:
- Menu creation is repetitive and verbose (150+ lines of boilerplate)
- Packet building code duplicated across `send_frame`, `send_static_frame`, and `set_timeout`
- Menu event handlers are a large match statement with repetitive pattern
- Using `String` for errors instead of proper error types
- All UDP logic in main.rs instead of separate module

Planned improvements:
- [ ] Extract menu creation into separate module with builder pattern or macro
- [ ] Create `PacketBuilder` struct to handle protocol serialization
- [ ] Extract menu event handlers to dedicated handler functions
- [ ] Add proper error types (e.g., `UdpError`, `PacketError`)
- [ ] Extract UDP communication to `src-tauri/src/udp.rs` module
- [ ] Consider creating `src-tauri/src/protocol.rs` for packet format definitions

Example PacketBuilder API:
```rust
let packet = PacketBuilder::new(PACKET_TYPE_FRAME)
    .sequence(sequence)
    .payload(&rgb_data)
    .build();
```

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
  - Current icons in `src-tauri/icons/` are Tauri defaults
  - Need: 32x32, 128x128, 256x256, icon.icns (macOS), icon.ico (Windows)
  - Design should reflect LED/lighting theme

## Notes

- Custom title bar planned - menu system will still be needed
- Most optimizations are non-breaking and can be done incrementally
