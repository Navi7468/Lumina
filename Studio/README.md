# Studio - Lumina Desktop App

The main desktop application for creating and editing LED animations. Built with Tauri, React, and TypeScript.

## Prerequisites

- Node.js 18+ and npm
- Rust and Cargo (for Tauri)
  - Windows: Download from [rustup.rs](https://rustup.rs/)
  - Linux/Mac: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

## Installation

```bash
cd Studio
npm install
```

## Development

Run the app in development mode with hot reload:

```bash
npm run tauri dev
```

The app will open automatically. Changes to React code will hot reload, but Rust changes require a restart.

## Building

Create a production build:

```bash
npm run tauri build
```

The built application will be in `Studio/src-tauri/target/release/`.

**Platform-specific builds:**
- Windows: Creates `.exe` and `.msi` installer
- Linux: Creates `.AppImage` and `.deb`
- Mac: Creates `.app` and `.dmg`

## Project Structure

```
Studio/
├── src/                    # React application source
│   ├── components/         # React components
│   │   ├── panels/         # Main UI panels
│   │   └── ui/             # Reusable components
│   ├── engine/             # Core rendering and layer logic
│   ├── store/              # Zustand state management
│   └── types/              # TypeScript definitions
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/                # Rust source
│   ├── icons/              # App icons
│   └── tauri.conf.json     # Tauri configuration
├── public/                 # Static assets
└── package.json            # Dependencies and scripts
```

## Configuration

### App Settings

Edit `src-tauri/tauri.conf.json` to configure:
- Window size and appearance
- App name and version
- Build targets and icons

### Network Settings

Default UDP settings can be changed in the app's settings panel:
- Target IP: `192.168.1.x` (your Raspberry Pi)
- Port: `8888`
- Frame rate: `60 FPS`

## Development Tips

**State Management:**
- Global state is in `src/store/projectStore.ts` using Zustand
- Has undo/redo history built in
- Persists to localStorage (when save/load is implemented)

**Timeline Rendering:**
- Uses HTML5 Canvas for performance
- Rendering logic in `src/components/panels/canvas/canvasRenderers.ts`
- Handlers in `src/components/panels/canvas/canvasHandlers.ts`

**Adding New Effects:**
- Register in `src/engine/modifierRegistry.ts`
- Implement processing logic in the modifier
- Add UI controls in `src/components/panels/PropertiesPanel.tsx`

**Debugging:**
- React DevTools: Install browser extension
- Tauri DevTools: Automatically opens in dev mode
- Console logs: Check both browser console and terminal

## Common Issues

**Tauri build fails:**
- Make sure Rust is installed: `rustc --version`
- Update Rust: `rustup update`
- Clear cache: `rm -rf src-tauri/target`

**Hot reload not working:**
- Restart dev server
- Check for TypeScript errors
- Rust changes always need restart

**App won't connect to Pi:**
- Check IP address in settings
- Verify Pi receiver is running
- Check firewall settings (port 8888)

## Scripts

```bash
npm run dev          # Start Vite dev server only
npm run build        # Build web assets
npm run tauri dev    # Run Tauri app in dev mode
npm run tauri build  # Build production app
npm run preview      # Preview production build
```

## Need Help?

- Check the main [README](../README.md) for general info
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines
- Open an issue on GitHub
