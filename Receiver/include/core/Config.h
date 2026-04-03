#pragma once

// Runtime configuration loaded from config.json at startup.
// All fields default to the compile-time values defined in config.h.
struct Config {
  int  udpPort;
  int  ledCount;         // capped at compile-time LED_COUNT
  int  gpioPin;
  int  targetFps;
  int  packetTimeoutMs;
  int  fadeSteps;
};
