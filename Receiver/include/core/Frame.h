#pragma once
#include "Type.h"

constexpr u32 MAX_LEDS = 600;

struct Frame {
  u32 ledCount;
  u8  data[MAX_LEDS * 3]; // RGB packed

  void clear() {
    for (u32 i = 0; i < ledCount * 3; ++i)
      data[i] = 0;
  }
};