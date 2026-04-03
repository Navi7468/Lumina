#pragma once
#include <atomic>
#include <mutex>
#include "Frame.h"

class DoubleBuffer {
public:
  DoubleBuffer() {
    front = &bufferA;
    back  = &bufferB;
  }

  Frame* getFront() { return front.load(); }

  // Callers must hold back_mutex before calling getBack() and accessing the
  // returned pointer. Use a std::lock_guard<std::mutex> at the call site.
  Frame* getBack() { return back; }

  // back_mutex must be held when writing to the back buffer or calling swap().
  // It is acquired internally by swap(), so callers must NOT hold it when
  // calling swap() -- do that as a separate lock/unlock.
  std::mutex back_mutex;

  void swap() {
    std::lock_guard<std::mutex> lock(back_mutex);
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