#pragma once

// Protocol Version
constexpr int PROTOCOL_VERSION = 1;

// Network
constexpr int UDP_PORT = 7777;
constexpr int UDP_RECV_BUFFER_SIZE = 1024 * 1024;  // 1MB receive buffer

// LED Configuration
constexpr int LED_COUNT = 60;
constexpr int LED_GPIO_PIN = 18;
constexpr int LED_DMA = 10;
constexpr int LED_BRIGHTNESS = 255;

// Render
constexpr int TARGET_FPS = 60;

// Timeout & Safety
constexpr int PACKET_TIMEOUT_MS = 1000;       // Fade to black after 1 second
constexpr int FADE_STEPS = 30;                // Fade over 30 frames (~500ms at 60fps)

// Performance Monitoring
constexpr bool ENABLE_PERF_LOGGING = true;
constexpr int PERF_LOG_INTERVAL_SEC = 5;      // Log stats every 5 seconds
constexpr float PACKET_LOSS_WARNING_THRESHOLD = 0.05f;  // Warn if >5% loss