#pragma once
#include "Type.h"
#include <chrono>
#include <string>

struct PerformanceStats {
  // Frame stats
  u32 totalFrames = 0;
  float averageFps = 0.0f;
  float averageRenderTimeMs = 0.0f;
  
  // Network stats
  u32 totalPacketsReceived = 0;
  u32 packetsDropped = 0;
  u32 packetsOutOfOrder = 0;
  u32 packetsInvalid = 0;
  float packetLossRate = 0.0f;
  
  // Latency stats
  float averageLatencyMs = 0.0f;
  float maxLatencyMs = 0.0f;
  
  // Timeout stats
  u32 timeoutEvents = 0;
  
  std::string toString() const;
};

class PerformanceMonitor {
public:
  PerformanceMonitor();
  
  // Frame tracking
  void startFrame();
  void endFrame();
  
  // Network tracking
  void recordPacketReceived(u32 sequence, u32 timestampUs);
  void recordPacketDropped();
  void recordPacketOutOfOrder();
  void recordPacketInvalid();
  void recordTimeout();
  
  // Stats
  PerformanceStats getStats() const;
  void reset();
  
  // Logging
  bool shouldLog() const;
  void logStats() const;
  
private:
  using Clock = std::chrono::steady_clock;
  using TimePoint = std::chrono::time_point<Clock>;
  
  // Start time
  TimePoint startTime;
  mutable TimePoint lastLogTime;  // updated in logStats() (const method)
  
  // Frame tracking
  TimePoint frameStartTime;
  u32 frameCount;
  float totalRenderTimeMs;
  
  // Network tracking
  u32 packetsReceived;
  u32 packetsDropped;
  u32 packetsOutOfOrder;
  u32 packetsInvalid;
  u32 lastSequence;
  bool receivedFirstPacket;
  
  // Latency tracking
  float totalLatencyMs;
  float maxLatencyMs;
  u32 latencySamples;
  
  // Timeout tracking
  u32 timeoutEvents;
  
  // Helper functions
  float getElapsedSeconds() const;
  float getSecondsSinceLog() const;
};
