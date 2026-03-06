#pragma once

#include "LedDriver.h"
#include <ws2811.h>

class WS2811Driver : public LedDriver {
public:
  WS2811Driver(int ledCount, int gpioPin);
  ~WS2811Driver();

  bool initialize() override;
  void render(Frame* frame) override;

private:
  ws2811_t ledstring;
  int ledCount;
  int gpioPin;
};