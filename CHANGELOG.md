# Changelog

All notable changes to Lumina will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2026-04-04

### Fixed

- **Studio: undo/redo now correctly restores class instances** — history snapshots
  were previously stored with `structuredClone`, which strips the prototype chain
  from class instances (`EffectLayer`, `AdjustmentLayer`, `IEffect`, `IModifier`).
  After an undo the layers became plain objects and the render engine crashed.
  Snapshots are now stored as `SerializedProject` DTOs (via `serializeProject`) and
  reconstructed as proper class instances (via `deserializeProject`) on restore.

- **Studio: undo snapshot no longer contains the post-mutation state** — `updateLayer`
  mutates the layer instance in-place via `Object.assign`. Previously the snapshot
  was taken *after* `updater(state)` ran, so the "before" snapshot already contained
  the new value. The snapshot is now taken in `setWithHistory` *before* the updater
  runs, so undo correctly reverts the change.

### Changed

- **Studio: `projectStore` history type changed to `SerializedProject[]`** — `past`
  and `future` arrays now hold serialized DTOs rather than live `Project` objects,
  keeping the history stack JSON-safe and decoupled from the live object graph.

## [0.2.1] - 2026-04-03

### Added

- **Studio: `NewProjectDialog`** — **File › New Project** (and Ctrl+N) now opens a
  dialog instead of silently wiping the current project. Fields: project name, LED
  count, FPS, and duration (in seconds). If the current project has content, the
  dialog shows a warning and changes the confirm button label to "Discard & Create".
  A FilePlus2 toolbar button in `AppHeader` also triggers the dialog.

### Changed

- **Studio: `useKeyboardShortcuts` extended with file commands** — `file.new`
  (Ctrl+N), `file.save` (Ctrl+S), and `file.open` (Ctrl+O) are now wired in
  `App.tsx`. `file.new` emits the `new-project` event (picked up by the dialog);
  `file.save` and `file.open` call the existing `useProjectFile` actions directly.

- **Studio: `NewProjectDialog` owns the `new-project` event** — the temporary
  `handleNewProject` callback in `App.tsx` has been removed; the dialog subscribes
  to the `new-project` Tauri event internally, consistent with the `SettingsDialog`
  pattern.

## [0.2.0] - 2026-04-03

### Added

- **Studio: Project Save / Load (`.lumina` format)** — projects can now be saved to
  and loaded from disk via **File › Save Project**, **File › Save As…**, and
  **File › Open Project**. Files are stored as `.lumina` JSON documents.

- **Studio: `src/lib/projectSerializer.ts`** — pure serialization layer that converts
  the live object graph (class instances of `EffectLayer`, `AdjustmentLayer`, `IEffect`,
  `IModifier`) to a plain, JSON-safe `SerializedProject` DTO and back. Effect and
  modifier instances are represented as registry-ID strings; parameters, envelopes,
  modifiers, and all layer geometry are fully round-tripped. Throws descriptive errors
  if an unknown effect/modifier ID is encountered during load.

- **Studio: `src/hooks/useProjectFile.ts`** — React hook that wraps the Tauri native
  file-dialog and fs APIs (`@tauri-apps/api/dialog` + `@tauri-apps/api/fs`). Tracks
  the current file path so "Save" skips the dialog on subsequent saves. Exposes
  `save(forceSaveAs?)` and `open()` callbacks.

### Changed

- **Studio: `useMenuEvents` extended with file-menu handlers** — optional
  `newProject`, `openProject`, `saveProject`, and `saveProjectAs` callbacks added to
  the `MenuEventHandlers` interface; the existing playback handlers are unchanged.

- **Tauri: enable `fs` and `dialog` allowlist APIs** — `tauri.conf.json` now enables
  `fs.readFile`, `fs.writeFile` (scoped to `$HOME`, `$DOCUMENT`, `$DESKTOP`), and
  `dialog.open`, `dialog.save`. Corresponding Cargo features `dialog-open`,
  `dialog-save`, `fs-read-file`, `fs-write-file` added to `Cargo.toml`.

## [0.1.10] - 2026-04-03

### Changed

- **Studio: extract `TimelineToolbar` from `Timeline.tsx`** — all playback controls
  (stop, step back/forward, play/pause, skip-to-end, loop toggle, zoom in/out, time
  display) moved to `TimelineToolbar.tsx`. Reads `useProjectStore` and
  `usePlaybackStore` directly; accepts `zoom` and `onZoomChange` as props.

- **Studio: extract `useClipInteraction` hook** — clip drag-move and resize logic
  (mouse down handler + document mousemove/mouseup effect) moved to
  `src/hooks/useClipInteraction.ts`. `Timeline.tsx` trimmed from 438 → 258 lines.

## [0.1.9] - 2026-04-03

### Changed

- **Studio: extract `AppHeader` from `App.tsx`** — header markup (title, project name,
  LED count/FPS stats, all dialog buttons) moved to `AppHeader.tsx`. Reports its
  rendered height via an `onHeightChange` callback so sash overlay positioning is
  unaffected.

- **Studio: extract menu event bridge to `useMenuEvents`** — the `useEffect` that
  subscribed to Tauri `playback-play/pause/stop` events is now a dedicated hook in
  `src/hooks/useMenuEvents.ts`, keeping `App.tsx` free of `listen` boilerplate.

- **Studio: add `ErrorBoundary` component** — class component in
  `src/components/common/ErrorBoundary.tsx` catches unhandled render errors and
  displays a recoverable error screen. Wired in `main.tsx` wrapping `<App />`.

## [0.1.8] - 2026-04-03

### Changed

- **Studio: split `projectStore.ts` into three domain stores** — `playbackStore.ts`
  owns `isPlaying` and `play`/`pause`/`stop` actions; `piStore.ts` owns
  `isPiConnected`, `isStreamingOnPlayback`, `isStreamingOnScrub` and their setters;
  `projectStore.ts` retains project data, undo/redo history, and all layer/modifier/
  envelope actions. `App.tsx`, `PiConnectionDialog.tsx`, and `Timeline.tsx` updated
  to import from the correct store. Components that only use project data are
  unaffected. Reduces unnecessary re-renders from unrelated state changes.

## [0.1.7] - 2026-04-03

### Changed

- **Studio: extract menu into `src-tauri/src/menu.rs`** — `build_menu()` builds the
  full application menu; `handle_menu_event()` handles all menu events. Both are
  standalone functions, removing the 150-line inline closure from `main.rs`. Menu
  event handlers now emit frontend events for every item (previously several just
  called `println!`) so all items are wired for future frontend listeners.

- **Studio: `main.rs` reduced to 24 lines** — only module declarations, state setup,
  and command registration remain.

### Docs

- **`README.md` version badge** updated from `0.1.0-alpha` to `0.1.7-alpha`.
- **`README.md` Configuration section** rewritten to document the runtime `config.json`
  approach (introduced in v0.1.4) and its available keys, replacing the outdated
  "edit `config.h` before building" instructions.
- **`Studio/REFACTORING.md`** — menu extraction items marked done.

## [0.1.6] - 2026-04-03

### Changed

- **Studio: extract UDP commands into `src-tauri/src/udp.rs`** — all five Tauri
  commands (`connect_to_pi`, `send_frame`, `send_static_frame`, `set_timeout`,
  `disconnect`) and the `UdpState` type moved out of `main.rs` into a dedicated
  `udp` module. `main.rs` now only handles app setup + command registration.

### Docs

- **`Studio/REFACTORING.md` updated** — backend items completed in v0.1.5/v0.1.6
  are marked done; remaining frontend and menu tasks are preserved.
## [0.1.6] - 2026-04-03

### Refactored

- **Studio: extract `udp.rs` module** — `UdpState` struct and all five Tauri UDP commands
  (`connect_to_pi`, `send_frame`, `send_static_frame`, `set_timeout`, `disconnect`) have
  been moved from `main.rs` to `src-tauri/src/udp.rs`. `main.rs` now only holds the Tauri
  app setup (menu and builder chain) and is ~170 lines vs the original ~300.

## [0.1.5] - 2026-04-03

### Refactored

- **Studio: extract `protocol.rs` + `PacketBuilder`** — packet building code was
  duplicated verbatim across `send_frame`, `send_static_frame`, and `set_timeout` in
  `main.rs` (~75 lines of repetition). All protocol constants (`PACKET_MAGIC`,
  `PROTOCOL_VERSION`, packet type values) and a new `PacketBuilder` fluent struct have
  been moved to `src-tauri/src/protocol.rs`. Each command now calls:
  `PacketBuilder::new(type).sequence(n).payload(&data).build()`.

## [0.1.4] - 2026-04-03

### Added

- **Receiver: runtime JSON config file** — `config.h` compile-time constants are now
  overridable at startup by placing a `config.json` file in the working directory.
  A reference file with all available keys is provided at `Receiver/config/config.json`.
  If the file is absent or unparseable the receiver falls back to the compiled-in defaults
  seamlessly. Configurable fields: `udp_port`, `led_count`, `gpio_pin`, `target_fps`,
  `packet_timeout_ms`, `fade_steps`. Runtime `led_count` is capped to the compile-time
  `LED_COUNT` (the `Frame` buffer size limit) with a logged warning.

- **Receiver: `nlohmann/json` dependency** — added as a header-only FetchContent
  dependency in `CMakeLists.txt` (tag v3.11.3, `GIT_SHALLOW TRUE`). Requires internet
  access on first `cmake ..` run; subsequent builds use the cached clone.

## [0.1.3] - 2026-04-03

### Fixed

- **Receiver: `const_cast` antipattern in `PerformanceMonitor::logStats()`** — `lastLogTime`
  was updated from a `const` method using `const_cast<PerformanceMonitor*>(this)`, which
  is undefined behaviour if the object was originally declared `const`. Marked `lastLogTime`
  as `mutable` in the header; the `const_cast` is removed.

- **Receiver: `Frame` buffer wastes ~1.5 KB per buffer** — `MAX_LEDS` was hardcoded to 600
  while `config.h` defines `LED_COUNT` as 60, meaning each `Frame::data` array was
  10× larger than needed (1800 bytes vs 180 bytes). Removed the standalone `MAX_LEDS`
  constant; `Frame::data` is now sized `LED_COUNT * 3`, derived directly from `config.h`.

## [0.1.2] - 2026-04-03

### Fixed

- **Receiver: UDP socket never closed** — `UdpServer` had no destructor; the socket
  file descriptor was leaked for the lifetime of the process. Added `UdpServer()`
  constructor (initialises `sockfd` to -1) and `~UdpServer()` destructor that calls
  `close(sockfd)` when the fd is valid.

- **Receiver: driver memory leak on initialisation failure** — `Application::initialize()`
  allocated a `WS2811Driver` with `new` and returned `false` on failure without deleting
  it. The driver pointer is now deleted and set to `nullptr` before returning `false`.

- **Receiver: `ws2811_render()` return value silently ignored** — hardware DMA errors
  would go unnoticed. `WS2811Driver::render()` now captures the `ws2811_return_t` result
  and logs an error via `ws2811_get_return_t_str()` when the render fails.



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
