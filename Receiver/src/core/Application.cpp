#include "core/Application.h"
#include "led/WS2811Driver.h"
#include "config.h"

#include <chrono>
#include <cstring>
#include <iostream>

Application::Application() 
  : driver(nullptr)
  , running(false)
  , hasReceivedPacket(false)
  , fadeStep(0)
  , currentTimeoutMs(PACKET_TIMEOUT_MS)
  , staticFramePending(false)
{}

Application::~Application() {
  stop();
  if (driver) {
    delete driver;
    driver = nullptr;
  }
}

bool Application::initialize() {
  std::cout << "Initializing UDP LED Controller V1...\n";
  std::cout << "Protocol Version: " << PROTOCOL_VERSION << "\n";

  // Initialize LED driver
  driver = new WS2811Driver(LED_COUNT, LED_GPIO_PIN);
  if (!driver->initialize()) {
    std::cerr << "LED Driver initialization failed.\n";
    return false;
  }
  std::cout << "LED Driver initialized (" << LED_COUNT << " LEDs)\n";
  
  // Initialize UDP
  if (!udp.initialize(UDP_PORT)) {
    std::cerr << "UDP initialization failed.\n";
    return false;
  }

  // Set LED count in buffers and clear them
  buffers.getFront()->ledCount = LED_COUNT;
  buffers.getBack()->ledCount = LED_COUNT;
  buffers.getFront()->clear();
  buffers.getBack()->clear();

  // Initialize timeout tracking
  lastPacketTime = std::chrono::steady_clock::now();
  
  running = true;

  // Start network thread
  networkThread = std::thread(&Application::networkLoop, this);

  std::cout << "Application initialized successfully.\n";
  std::cout << "Packet timeout: " << PACKET_TIMEOUT_MS << " ms\n";
  
  if (ENABLE_PERF_LOGGING) {
    std::cout << "Performance logging enabled (interval: " 
              << PERF_LOG_INTERVAL_SEC << "s)\n";
  }
  
  std::cout << "\nWaiting for UDP packets...\n\n";
  
  return true;
}

void Application::run() {
  using clock = std::chrono::steady_clock;
  const std::chrono::milliseconds frameTime(1000 / TARGET_FPS);

  while (running) {
    perfMonitor.startFrame();
    auto start = clock::now();

    // Check for timeout
    handleTimeout();

    // Swap buffers
    buffers.swap();

    // If a static frame was received, mirror the new front buffer into the new
    // back buffer so the frame remains visible across future swaps without the
    // network thread ever writing directly to the front buffer.
    if (staticFramePending.exchange(false)) {
      std::lock_guard<std::mutex> lock(buffers.back_mutex);
      Frame* f = buffers.getFront();
      Frame* b = buffers.getBack();
      b->ledCount = f->ledCount;
      std::memcpy(b->data, f->data, f->ledCount * 3);
    }

    // Render front buffer
    driver->render(buffers.getFront());

    perfMonitor.endFrame();

    // Log stats periodically
    if (perfMonitor.shouldLog()) {
      perfMonitor.logStats();
    }

    auto end = clock::now();
    auto elapsed = end - start;

    if (elapsed < frameTime)
      std::this_thread::sleep_for(frameTime - elapsed);
  }
}

void Application::stop() {
  std::cout << "\nShutting down...\n";
  running = false;

  // Join network thread
  if (networkThread.joinable()) 
    networkThread.join();

  // Clear LEDs
  buffers.getFront()->clear();
  buffers.getBack()->clear();
  driver->render(buffers.getFront());

  // Final stats
  std::cout << "\nFinal Statistics:\n";
  perfMonitor.logStats();
  std::cout << "\nShutdown complete.\n";
}

void Application::networkLoop() {
  while (running) {
    PacketInfo info;
    {
      std::lock_guard<std::mutex> lock(buffers.back_mutex);
      info = udp.poll(buffers.getBack());
    }

    switch (info.result) {
      case PollResult::SUCCESS:
        // Normal frame - written to back buffer only
        // Update timeout tracking
        lastPacketTime = std::chrono::steady_clock::now();
        hasReceivedPacket = true;
        fadeStep = 0;  // Reset fade
        
        // Record packet stats
        perfMonitor.recordPacketReceived(info.sequence, info.timestamp);
        break;

      case PollResult::STATIC_FRAME:
        // Static frame written to back buffer; the main thread will mirror it
        // to the new back buffer after swap() via staticFramePending.
        lastPacketTime = std::chrono::steady_clock::now();
        hasReceivedPacket = true;
        fadeStep = 0;  // Reset fade
        staticFramePending = true;

        // Record packet stats
        perfMonitor.recordPacketReceived(info.sequence, info.timestamp);
        break;

      case PollResult::TIMEOUT_SET:
        // Update timeout configuration
        currentTimeoutMs.store(info.timeoutMs);
        std::cout << "Timeout updated to " << info.timeoutMs << " ms\n";
        break;

      case PollResult::INVALID_MAGIC:
      case PollResult::INVALID_VERSION:
      case PollResult::INVALID_TYPE:
      case PollResult::INVALID_SIZE:
        perfMonitor.recordPacketInvalid();
        break;

      case PollResult::NO_DATA:
        // No packet available, continue
        break;
    }
    
    // Small sleep to prevent busy-wait
    std::this_thread::sleep_for(std::chrono::microseconds(100));
  }
}

void Application::handleTimeout() {
  if (!hasReceivedPacket) {
    return;  // Haven't received first packet yet
  }

  auto now = std::chrono::steady_clock::now();
  auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
    now - lastPacketTime).count();

  int timeoutMs = currentTimeoutMs.load();
  if (elapsed > timeoutMs) {
    // Timeout occurred - fade to black
    int currentFade = fadeStep.load();
    
    if (currentFade == 0) {
      // First timeout
      perfMonitor.recordTimeout();
      std::cerr << "\n⚠️  Packet timeout! No data for " << elapsed << " ms (timeout: " << timeoutMs << " ms). Fading to black...\n";
    }
    
    if (currentFade < FADE_STEPS) {
      fadeToBlack();
      fadeStep++;
    }
  }
}

void Application::fadeToBlack() {
  std::lock_guard<std::mutex> lock(buffers.back_mutex);
  Frame* frame = buffers.getBack();
  int currentFade = fadeStep.load();
  
  // Calculate fade factor (1.0 -> 0.0)
  float fadeFactor = 1.0f - (static_cast<float>(currentFade) / FADE_STEPS);
  
  // Apply fade to all LEDs
  for (u32 i = 0; i < frame->ledCount * 3; ++i) {
    frame->data[i] = static_cast<u8>(frame->data[i] * fadeFactor);
  }
}