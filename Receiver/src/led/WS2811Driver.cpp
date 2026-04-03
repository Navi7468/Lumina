#include "led/WS2811Driver.h"
#include "config.h"

#include <cstring>
#include <iostream>

WS2811Driver::WS2811Driver(int ledCount, int gpioPin) : ledCount(ledCount), gpioPin(gpioPin) {
  std::memset(&ledstring, 0, sizeof(ledstring));
}
WS2811Driver::~WS2811Driver() {
  // Clear all LEDs before shutdown
  ws2811_channel_t* channel = &ledstring.channel[0];
  for (int i = 0; i < ledCount; ++i) {
    channel->leds[i] = 0;
  }
  ws2811_render(&ledstring);
  ws2811_fini(&ledstring);
}

bool WS2811Driver::initialize() {
  ledstring.freq = WS2811_TARGET_FREQ;
  ledstring.dmanum = LED_DMA;

  ledstring.channel[0].gpionum = gpioPin;
  ledstring.channel[0].count = ledCount;
  ledstring.channel[0].invert = 0;
  ledstring.channel[0].brightness = LED_BRIGHTNESS;
  ledstring.channel[0].strip_type = WS2811_STRIP_GRB;

  if (ws2811_init(&ledstring) != WS2811_SUCCESS) {
    std::cerr << "ws2811_init failed\n";
    return false;
  }

  return true;
}

void WS2811Driver::render(Frame* frame) {
  ws2811_channel_t* channel = &ledstring.channel[0];

  for (int i = 0; i < ledCount; ++i) {
    int idx = i * 3;

    uint32_t r = frame->data[idx];
    uint32_t g = frame->data[idx + 1];
    uint32_t b = frame->data[idx + 2];

    channel->leds[i] = 
      (r << 16) |
      (g << 8)  |
      (b);
  }
  
  // Render to hardware
  ws2811_return_t ret = ws2811_render(&ledstring);
  if (ret != WS2811_SUCCESS) {
    std::cerr << "ws2811_render failed: " << ws2811_get_return_t_str(ret) << "\n";
  }
}