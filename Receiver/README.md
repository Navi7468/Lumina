# Receiver - Raspberry Pi LED Controller

A lightweight C++ UDP server that receives LED frame data from the Studio app and controls WS2811/WS2812 LED strips via GPIO.

## Prerequisites

- Raspberry Pi (tested on Pi 4, should work on 3/Zero)
- Raspbian/Raspberry Pi OS
- CMake 3.10 or higher
- C++17 compatible compiler (g++ 7+)
- WS2811 library (rpi_ws281x)

## Hardware Setup

This is my current setup while developing and testing the receiver and Studio app.

**LED Strip Connection:**

- Connect LED strip data line to GPIO 18 (PWM0)
- Connect LED strip ground to Pi ground
- Connect LED strip power Pi 5V pin
  - **Important:** Don't power the strip directly from the Pi! I am only doing this for testing with a small number of LEDs. (60 LEDs)
  - Use a separate power supply rated for your LED count
  - Common ground between Pi and power supply

**Typical WS2812 wiring:**

```
Pi GPIO 18 (Pin 12) ──→ LED Strip Data (DIN)
Pi GND (Pin 6)      ──→ LED Strip GND
5V Power Supply +   ──→ LED Strip 5V
5V Power Supply -   ──→ LED Strip GND (common ground)
```

## Installation

### 1. Install Dependencies

```bash
sudo apt update
sudo apt install build-essential cmake git

# Install WS2811 library
cd ~
git clone https://github.com/jgarff/rpi_ws281x.git
cd rpi_ws281x
mkdir build && cd build
cmake -D BUILD_SHARED=OFF ..
make
sudo make install
```

### 2. Build the Receiver

```bash
cd Receiver
mkdir build && cd build
cmake ..
make
```

This creates the `udpleds` executable.

## Configuration

Edit `config/config.h` before building to configure:

```cpp
// Protocol Version
constexpr int PROTOCOL_VERSION = 1;

// Network
constexpr int UDP_PORT = 7777;                          // Port to listen on
constexpr int UDP_RECV_BUFFER_SIZE = 1024 * 1024;       // 1MB receive buffer

// LED Configuration
constexpr int LED_COUNT = 60;                           // Number of LEDs
constexpr int LED_GPIO_PIN = 18;                        // GPIO pin (PWM0)
constexpr int LED_DMA = 10;                             // DMA channel
constexpr int LED_BRIGHTNESS = 255;                     // Max brightness (0-255)

// Render
constexpr int TARGET_FPS = 60;                          // Target frame rate

// Timeout & Safety
constexpr int PACKET_TIMEOUT_MS = 1000;                 // Fade to black after 1s
constexpr int FADE_STEPS = 30;                          // Fade duration in frames

// Performance Monitoring
constexpr bool ENABLE_PERF_LOGGING = true;              // Enable performance logs
constexpr int PERF_LOG_INTERVAL_SEC = 5;                // Log interval
constexpr float PACKET_LOSS_WARNING_THRESHOLD = 0.05f;  // Warn if >5% loss
```

**Note:** LED strip type and color order are configured via the WS2811 library. The current implementation uses WS2811/WS2812 strips (typically GRB color order).

## Running

The receiver needs root privileges for GPIO access:

```bash
sudo ./udpleds
```

You'll see output like:

```
Initializing UDP LED Controller V1...
Protocol Version: 1
LED Driver initialized (60 LEDs)
UDP Server listening on port 7777
Receive buffer size: 1024 KB
Application initialized successfully.
Packet timeout: 1000 ms
Performance logging enabled (interval: 5s)

Waiting for UDP packets...
```

**Run on boot (systemd service):**

Create `/etc/systemd/system/ledcontroller.service`:

```ini
[Unit]
Description=LED Controller UDP Receiver
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/pi/Receiver/build
ExecStart=/home/pi/Receiver/build/udpleds
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable ledcontroller
sudo systemctl start ledcontroller
sudo systemctl status ledcontroller
```

## Project Structure

```
Receiver/
├── include/
│   ├── core/
│   │   ├── Application.h         # Main app loop
│   │   ├── DoubleBuffer.h        # Thread-safe frame buffer
│   │   ├── Frame.h               # LED frame data structure
│   │   ├── PerformanceMonitor.h  # Performance tracking
│   │   └── Type.h                # Common type definitions
│   ├── led/
│   │   ├── LedDriver.h           # Abstract LED driver interface
│   │   └── WS2811Driver.h        # WS2811/2 implementation
│   └── network/
│       ├── Packet.h              # UDP packet format
│       └── UdpServer.h           # UDP receiver
├── src/
│   ├── main.cpp                  # Entry point
│   ├── core/
│   │   ├── Application.cpp       # Application implementation
│   │   └── PerformanceMonitor.cpp # Performance tracking implementation
│   ├── led/
│   │   └── WS2811Driver.cpp      # WS2811 driver implementation
│   └── network/
│       └── UdpServer.cpp         # UDP server implementation
├── config/
│   └── config.h                  # Configuration defines
└── CMakeLists.txt                # Build configuration
```

## Network Protocol

The receiver expects UDP packets on port 7777 (configurable) with the following format:

***Note:** Expect possible breaking changes to the network protocol before the 1.0 release.*

**Packet Header (16 bytes):**

```cpp
struct PacketHeader {
  u16 magic;         // Magic number (0xFEED)
  u16 version;       // Protocol version (currently 1)
  u32 sequence;      // Sequence number (for dropped packet detection)
  u32 timestamp;     // Sender timestamp in microseconds
  u16 type;          // Packet type (see below)
  u16 payloadSize;   // Size of payload in bytes
};
```

**Packet Types:**


- `PACKET_TYPE_FRAME = 0` - Full RGB frame data (streaming, writes to back buffer)
- `PACKET_TYPE_STATIC_FRAME = 5` - Static frame (scrubbing, writes to both buffers)
- `PACKET_TYPE_SET_TIMEOUT = 4` - Set packet timeout duration
- `PACKET_TYPE_PING = 3` - Keep-alive/latency test
- `PACKET_TYPE_EFFECT = 1` - Effect parameters (future)
- `PACKET_TYPE_CONFIG = 2` - Configuration (future)

**Frame Packet:**

```
[PacketHeader: 16 bytes] + [RGB Data: LED_COUNT * 3 bytes]
```

Example for 60 LEDs: 16 + (60 * 3) = 196 bytes per frame

**Features:**

- Sequence tracking for dropped packet detection
- Double buffering prevents visual tearing
- Automatic fade-to-black on timeout (configurable)
- Performance monitoring with packet loss tracking

## Adding Support for Other LED Types

To add a new LED strip type:

1. Create a new driver in `include/led/` that implements `LedDriver` interface
2. Implement `initialize()`, `setPixel()`, `show()`, and `cleanup()`
3. Modify `config/config.h` to select your driver
4. Rebuild

Example drivers that could be added:

- APA102/DotStar (SPI-based)
- SK6812 RGBW
- WS2813
- etc.

## Performance Notes

- Current testing target is 60 FPS (16.6ms per frame)
- Double buffering prevents tearing during network thread updates
- UDP is connectionless - some frame drops are normal
- Network latency typically 1-5ms on local network (wired Ethernet)
- Built-in performance monitoring tracks:
  - Frame rate and render time
  - Packet loss, drops, and out-of-order packets
  - Network latency statistics
  - Timeout events
- Performance stats logged every 5 seconds (configurable)
- Automatic fade-to-black on packet timeout prevents LEDs getting stuck

## Troubleshooting

**LEDs don't light up:**

- Check wiring (data pin on GPIO 18)
- Verify strip type in config.h
- Try lower brightness first
- Check power supply (LEDs need significant current)
- Run with sudo (GPIO requires root)

**Colors are wrong:**

- Check LED_STRIP_TYPE in config.h
- Try different color orders (RGB vs GRB vs BGR)
- Some strips have different configurations

**Connection issues:**

- Verify Pi IP address: `hostname -I`
- Check firewall: `sudo ufw status`
- Test UDP connection: `nc -u RASPBERRY_PI_IP 7777`
- Ping from desktop: `ping RASPBERRY_PI_IP`
- Check Studio app settings for correct IP and port (7777)

**Permission denied:**

- Must run with sudo for GPIO access
- Or add user to gpio group: `sudo usermod -a -G gpio $USER`

**Build errors:**

- Install build tools: `sudo apt install build-essential cmake`
- Update CMake: `sudo apt install cmake`
- Check WS2811 library is installed

## Development

**Viewing logs:**

```bash
# If running manually
sudo ./udpleds

# If running as service
sudo journalctl -u ledcontroller -f
```

**Testing without LEDs:**

- Comment out actual LED updates in WS2811Driver
- Add console output to verify frame data
- Use virtual environment for development

## Platform Note

The receiver currently uses Unix-specific networking code (sys/socket.h, arpa/inet.h) and is designed for Linux systems (Raspberry Pi, Ubuntu, etc.). Cross-platform support with proper abstraction is planned for a future update.

## Need Help?

- Check the main [README](../README.md)
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines
- WS2811 library docs: <https://github.com/jgarff/rpi_ws281x>
- Open an issue on GitHub
