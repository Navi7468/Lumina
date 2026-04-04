# Lumina

A desktop application for creating, sequencing, and controlling LED strip animations via UDP. Built with Tauri, React, and TypeScript for the editor, with a lightweight C++ receiver for Raspberry Pi.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.2.4--alpha-red.svg)

## What is this?

A visual timeline editor for creating LED animations, similar to video editing software or music production software. The goal is to create something that's both simple enough for beginners but powerful enough for complex animations. Design lighting sequences with layers, keyframe animations, and real-time effects, then send them to your LED strips over the network.

**What Actually Works Right Now:**

- Timeline-based editing with visual layers and keyframe animation
- Real-time preview - see your changes as you make them
- Adjustment layers for applying effects like brightness, blur, saturation with envelope curves
- Tension handles for smooth or dramatic curve transitions
- Effect system that lets you chain multiple modifiers
- UDP streaming to Raspberry Pi LED controller
- Multi-stop gradient editor with 8 built-in presets
- Global color palette system
- LED selection tools for targeting specific LED ranges
- **Save and load projects** as `.lumina` files via the File menu

**What Doesn't Work Yet:**

- Creating new projects (there's a button but it doesn't do anything yet)
- Undo/redo is limited
- No audio import or reactivity (Future implementation)
- Most of the menu items don't do anything yet

This is a very early alpha - expect things to break or not work at all.

## Project Structure

```
led-sequencer/
├── Studio/           # Desktop application (Tauri + React + TypeScript)
│                     # Main app source - see Studio/README.md
├── Receiver/         # Raspberry Pi UDP receiver (C++)
│                     # See Receiver/README.md for setup
├── .vscode/          # Shared VS Code configuration
└── README.md         # You are here
```

## Getting Started

**Quick Setup:**

For detailed setup instructions, check the individual README files:

- [Studio Setup](Studio/README.md) - Desktop app development and building
- [Receiver Setup](Receiver/README.md) - Raspberry Pi receiver installation

```bash
# Studio (Desktop)
cd Studio
npm install
npm run tauri dev

# Receiver (Raspberry Pi)
cd Receiver
mkdir build && cd build
cmake ..
make
sudo ./udpleds
```

## Usage

1. Launch the Studio app (it starts with a default project)
2. Add layers to your timeline (LED layers or adjustment layers)
3. Create animations by adding keyframes and adjusting curves
4. Configure network settings to point to your Raspberry Pi
5. Hit play and watch your LEDs react

**Timeline Tips:**

- Ctrl+scroll zoom (horizontal), alt+scroll zoom (vertical), (drag to pan will be implemented later)
- Click on envelope curves to add keyframes
- Drag the blue tension handles to adjust curve shapes
- Lower tracks render first, higher tracks composite on top
- Adjustment layers apply effects to everything above them

## Configuration

The receiver is configured at **runtime** via a JSON file. Copy
`Receiver/config/config.json` to the build directory and edit it before running
`./udpleds`. If the file is absent the receiver falls back to compiled-in defaults.

Available keys:

| Key | Default | Description |
|-----|---------|-------------|
| `udp_port` | 7777 | UDP port the receiver listens on |
| `led_count` | 60 | Number of LEDs on the strip |
| `gpio_pin` | 18 | GPIO pin for data signal |
| `target_fps` | 60 | Render loop frame rate |
| `packet_timeout_ms` | 1000 | Fade-to-black timeout (ms) |
| `fade_steps` | 30 | Number of frames to fade over |

`led_count` is capped at the compile-time `LED_COUNT` value in `config.h` (the
buffer-size ceiling). To support more than 60 LEDs, rebuild with an updated
`config.h`.

See [Receiver/README.md](Receiver/README.md) for full setup instructions.

Note: Studio network settings (IP and port) connect to the receiver. Projects can
be saved and loaded via **File › Save Project** / **File › Open Project**.

## Known Issues

- Limited undo/redo functionality
- Some UI elements are just placeholders
- Performance needs work for almost everything currently
- Only supports WS2811/WS2812 LED strips currently
- App icons are placeholders - custom icons planned for future release

See [CHANGELOG.md](CHANGELOG.md) for full details.

## Roadmap

Things I'm working on or planning to add. No promises on timelines since this is a hobby project.

**Soon:**

- New Project dialog
- Improved theme system for app
- Custom title bar with proper window controls
- Drag selection in timeline
- Better undo/redo system

**Eventually:**

- More LED strip types (APA102, SK6812, etc.)
- Enhanced color picker with color harmony suggestions and eyedropper tool
- Audio reactivity:
  - Import audio files (MP3, WAV, OGG) with waveform visualization
  - Audio analysis to detect beats, frequency ranges, amplitude
  - Mark points of interest automatically
  - Maybe even generate base animation templates from audio (way later)
- 2D/3D LED Layout Editor:
  - Define physical LED positions in space
  - Virtual LED sectioning
  - Multiple strip support
  - Better spatial preview
- Performance optimizations across the board

**Maybe Someday:**

- Plugin system for custom effects and features (easier for some people that dont want to modify the core code, shareable with the community)
- Multi-output support (control multiple LED strips/controllers)
- Cloud sync for projects
- Mobile companion app for live control
- DMX/Art-Net protocol support
- Extend beyond just LEDs (who knows what)

## Contributing

Contributions are welcome! This is a hobby project, so things might not always be stable or fully polished at this stage.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on development process.

**Quick Start:**

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details. Use it however you want.

## Acknowledgments

- Timeline inspired by FL Studio's Playlist window
- Built with [Tauri](https://tauri.app/), [React](https://react.dev/), and probably too much coffee

## Notes

This is a hobby project built primarily for my own setup (WS2812 LED strips on a Raspberry Pi 4, controlled from Windows 11). The current focus is on getting the core features solid before expanding to other platforms and LED types.

Expect things to be unstable, incomplete, or occasionally broken. That's just how it goes with early alpha software. If you find bugs or have ideas for features, feel free to open an issue or submit a pull request.
