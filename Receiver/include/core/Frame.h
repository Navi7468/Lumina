#pragma once
#include "Type.h"
#include "config.h"

struct Frame {
  u32 ledCount;
  u8  data[LED_COUNT * 3]; // RGB packed

  void clear() {
    for (u32 i = 0; i < ledCount * 3; ++i)
      data[i] = 0;
  }
};