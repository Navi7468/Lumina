#pragma once
#include "DoubleBuffer.h"
#include "PerformanceMonitor.h"
#include "../network/UdpServer.h"
#include "../led/LedDriver.h"
#include <thread>
#include <chrono>
#include <atomic>

class Application {
public:
  Application();
  ~Application();

  bool initialize();
  void run();
  void stop();

private:
  void networkLoop();
  void handleTimeout();
  void fadeToBlack();

  DoubleBuffer buffers;
  UdpServer udp;
  LedDriver* driver;
  PerformanceMonitor perfMonitor;

  std::thread networkThread;
  std::atomic<bool> running;
  
  // Timeout tracking
  std::chrono::steady_clock::time_point lastPacketTime;
  std::atomic<bool> hasReceivedPacket;
  std::atomic<int> fadeStep;  // For gradual fade to black
  std::atomic<int> currentTimeoutMs;  // Configurable timeout duration
};