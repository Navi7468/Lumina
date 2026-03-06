# Contributing to Lumina

Thanks for thinking about contributing!

## Code of Conduct

Be nice. Be respectful. Don't be a jerk. That's it.

## How to Contribute

### Reporting Bugs

**Before submitting a bug report:**

- Check the [existing issues](../../issues) to see if it's already reported
- Try to reproduce the issue with the latest version

**When submitting a bug report:**

- Use a clear, descriptive title
- Describe the exact steps to reproduce the problem
- Explain what you expected to happen vs. what actually happened
- Include screenshots if relevant
- Mention your OS, hardware, and LED strip type if applicable
  - Worth noting that I've only tested receiver with WS2812 LED strips on a Raspberry Pi 4, and studio with Windows 11.

### Suggesting Features

Feature requests are welcome! Please:

- Use a clear, descriptive title
- Explain the problem you're trying to solve
- Describe how you envision the feature working
- If you've seen it in other software, mention that (inspiration is good and really helpful!)

### Code Contributions

#### Development Setup

**Studio (Desktop App):**

```bash
cd Studio
npm install
npm run tauri dev
```

**Receiver:**

```bash
cd Receiver
mkdir build && cd build
cmake ..
make
./udpleds
```

#### Coding Standards

**TypeScript/React/Rust (Studio):**

- Use TypeScript for type safety
- Follow the existing code style (2 spaces, semicolons)
- Use functional components and hooks
- Try to keep components small and focused
- Add comments for complex logic

**C++ (Receiver):**

- Follow modern C++17 practices
- Use CMake for build configuration
- Keep platform-specific code isolated
  - Note: Current networking code (UdpServer.cpp) uses Unix-specific APIs. This is temporary and will be abstracted in a future update.
- Comment your intentions, not just what the code does

#### Pull Request Process

1. **Fork & Branch**: Create a feature branch from `main`

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**: Write your code, add tests if applicable

3. **Teceivert**: Make sure everything works
   - Studio: `npm run tauri dev` and test manually
   - Receiver: Build and test on actual hardware if possible

4. **Commit**: Use clear commit messages

   ```
   Fix timeline zoom resetting when adding keyframes
   
   - Store zoom level in state instead of local variable
   - Persist zoom when switching between layers
   - Fixes issue where zoom would reset to 100% unexpectedly
   ```

5. **Push & PR**: Push to your fork and open a Pull Request
   - Reference any related issues (#123)
   - Describe what changed and why
   - Include screenshots/videos for UI changes

6. **Review**: Be patient! This is a hobby project, so reviews might take a bit

#### What to Work On

Not sure where to start? Check out:

- Issues labeled [`good first issue`](../../labels/good%20first%20issue)
- Issues labeled [`help wanted`](../../labels/help%20wanted)
- The roadmap in [README.md](README.md)

## Project Structure

```
Studio/
├── src/
│   ├── components/     # React components
│   │   ├── panels/     # Main UI panels (Timeline, Properties, etc.)
│   │   └── ui/         # Reusable UI components
│   ├── engine/         # Core rendering and layer engine
│   ├── store/          # Zustand state management
│   └── types/          # TypeScript type definitions
├── src-tauri/          # Tauri backend (Rust)
└── public/             # Static assets

Receiver/
├── include/            # Header files
│   ├── core/          # Core application logic
│   ├── led/           # LED driver interfaces
│   └── network/       # UDP server
├── src/               # Implementation files
└── config/            # Configuration headers
```

## Development Tips

### Studio Development

- Use React DevTools for debugging
- The timeline uses canvas for performance - check `canvasRenderers.ts`
- State management is in `projectStore.ts` (Zustand)
- Hot reload works, but sometimes you need to restart for Tauri changes
- **Code TODOs:** Use inline `TODO:` comments for small, localized improvements directly in the code
- **Architecture/Refactoring:** See `Studio/REFACTORING.md` for planned architectural improvements

### Receiver Development

- Test on actual hardware when possible (emulation doesn't test GPIO)
- **Code TODOs:** Use inline `TODO:` comments for small, localized improvements directly in the code
- **Architecture/Refactoring:** Track larger changes in external documentation or GitHub issues
- The UDP protocol is simple - see `network/UdpServer.h`
- LED driver abstraction allows adding new strip types easily

## Questions?

Feel free to open an issue with the `question` label. I'm happy to help when I have time.

---

Thanks for contributing!
