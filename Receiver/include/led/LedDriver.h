#pragma once
#include "../core/Frame.h"

class LedDriver {
public:
  virtual bool initialize() = 0;
  virtual void render(Frame* frame) = 0;
  virtual ~LedDriver() = default;
};