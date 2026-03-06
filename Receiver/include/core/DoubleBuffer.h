#pragma once
#include <atomic>
#include "Frame.h"

class DoubleBuffer {
public:
  DoubleBuffer() {
    front = &bufferA;
    back  = &bufferB;
  }
  
  Frame* getFront() { return front.load(); }
  Frame* getBack()  { return back; }

  void swap() {
    Frame* oldFront = front.load();
    front.store(back);
    back = oldFront;
  }

private:
  Frame bufferA;
  Frame bufferB;

  std::atomic<Frame*> front;
  Frame* back;
};