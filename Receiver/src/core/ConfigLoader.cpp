#include "core/ConfigLoader.h"
#include "config.h"

#include <nlohmann/json.hpp>
#include <fstream>
#include <iostream>

using json = nlohmann::json;

bool ConfigLoader::load(const std::string& path, Config& out) {
  // Populate with compile-time defaults so any missing key is already covered.
  out.udpPort          = UDP_PORT;
  out.ledCount         = LED_COUNT;
  out.gpioPin          = LED_GPIO_PIN;
  out.targetFps        = TARGET_FPS;
  out.packetTimeoutMs  = PACKET_TIMEOUT_MS;
  out.fadeSteps        = FADE_STEPS;

  std::ifstream file(path);
  if (!file.is_open()) {
    std::cout << "Config file not found at '" << path
              << "'. Using compiled-in defaults.\n";
    return false;
  }

  json j;
  try {
    file >> j;
  } catch (const json::parse_error& e) {
    std::cerr << "Config parse error in '" << path << "': " << e.what()
              << ". Using compiled-in defaults.\n";
    return false;
  }

  if (j.contains("udp_port"))           out.udpPort         = j["udp_port"].get<int>();
  if (j.contains("led_count"))          out.ledCount        = j["led_count"].get<int>();
  if (j.contains("gpio_pin"))           out.gpioPin         = j["gpio_pin"].get<int>();
  if (j.contains("target_fps"))         out.targetFps       = j["target_fps"].get<int>();
  if (j.contains("packet_timeout_ms"))  out.packetTimeoutMs = j["packet_timeout_ms"].get<int>();
  if (j.contains("fade_steps"))         out.fadeSteps       = j["fade_steps"].get<int>();

  // Clamp led_count to the compiled-in buffer size.
  if (out.ledCount > LED_COUNT) {
    std::cerr << "Warning: led_count " << out.ledCount
              << " exceeds compiled maximum of " << LED_COUNT
              << ". Capping to " << LED_COUNT << ".\n";
    out.ledCount = LED_COUNT;
  }
  if (out.ledCount <= 0) {
    std::cerr << "Warning: led_count must be > 0. Resetting to default ("
              << LED_COUNT << ").\n";
    out.ledCount = LED_COUNT;
  }
  if (out.targetFps <= 0) {
    std::cerr << "Warning: target_fps must be > 0. Resetting to default ("
              << TARGET_FPS << ").\n";
    out.targetFps = TARGET_FPS;
  }

  std::cout << "Config loaded from '" << path << "'.\n";
  return true;
}
