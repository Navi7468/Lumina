#include "core/PerformanceMonitor.h"
#include "config.h"
#include <iostream>
#include <iomanip>
#include <sstream>

PerformanceMonitor::PerformanceMonitor() 
  : startTime(Clock::now())
  , lastLogTime(Clock::now())
  , frameCount(0)
  , totalRenderTimeMs(0.0f)
  , packetsReceived(0)
  , packetsDropped(0)
  , packetsOutOfOrder(0)
  , packetsInvalid(0)
  , lastSequence(0)
  , receivedFirstPacket(false)
  , totalLatencyMs(0.0f)
  , maxLatencyMs(0.0f)
  , latencySamples(0)
  , timeoutEvents(0)
{}

void PerformanceMonitor::startFrame() {
  frameStartTime = Clock::now();
}

void PerformanceMonitor::endFrame() {
  auto now = Clock::now();
  auto duration = std::chrono::duration_cast<std::chrono::microseconds>(now - frameStartTime);
  totalRenderTimeMs += duration.count() / 1000.0f;
  frameCount++;
}

void PerformanceMonitor::recordPacketReceived(u32 sequence, u32 timestampUs) {
  packetsReceived++;
  
  // Check for dropped packets
  if (receivedFirstPacket) {
    u32 expectedSequence = lastSequence + 1;
    
    if (sequence < lastSequence) {
      // Out of order packet
      packetsOutOfOrder++;
    } else if (sequence > expectedSequence) {
      // Dropped packets detected
      u32 dropped = sequence - expectedSequence;
      packetsDropped += dropped;
    }
  } else {
    receivedFirstPacket = true;
  }
  
  lastSequence = sequence;
  
  // Calculate latency if timestamp is valid
  if (timestampUs > 0) {
    auto now = Clock::now();
    auto nowUs = std::chrono::duration_cast<std::chrono::microseconds>(
      now.time_since_epoch()).count();
    
    float latencyMs = (nowUs - timestampUs) / 1000.0f;
    
    // Sanity check (ignore negative or unreasonably large latencies)
    if (latencyMs >= 0 && latencyMs < 10000.0f) {
      totalLatencyMs += latencyMs;
      latencySamples++;
      
      if (latencyMs > maxLatencyMs) {
        maxLatencyMs = latencyMs;
      }
    }
  }
}

void PerformanceMonitor::recordPacketDropped() {
  packetsDropped++;
}

void PerformanceMonitor::recordPacketOutOfOrder() {
  packetsOutOfOrder++;
}

void PerformanceMonitor::recordPacketInvalid() {
  packetsInvalid++;
}

void PerformanceMonitor::recordTimeout() {
  timeoutEvents++;
}

PerformanceStats PerformanceMonitor::getStats() const {
  PerformanceStats stats;
  
  float elapsed = getElapsedSeconds();
  
  // Frame stats
  stats.totalFrames = frameCount;
  stats.averageFps = (elapsed > 0) ? (frameCount / elapsed) : 0.0f;
  stats.averageRenderTimeMs = (frameCount > 0) ? (totalRenderTimeMs / frameCount) : 0.0f;
  
  // Network stats
  stats.totalPacketsReceived = packetsReceived;
  stats.packetsDropped = packetsDropped;
  stats.packetsOutOfOrder = packetsOutOfOrder;
  stats.packetsInvalid = packetsInvalid;
  
  u32 totalExpectedPackets = packetsReceived + packetsDropped;
  stats.packetLossRate = (totalExpectedPackets > 0) 
    ? (static_cast<float>(packetsDropped) / totalExpectedPackets) 
    : 0.0f;
  
  // Latency stats
  stats.averageLatencyMs = (latencySamples > 0) ? (totalLatencyMs / latencySamples) : 0.0f;
  stats.maxLatencyMs = maxLatencyMs;
  
  // Timeout stats
  stats.timeoutEvents = timeoutEvents;
  
  return stats;
}

void PerformanceMonitor::reset() {
  startTime = Clock::now();
  lastLogTime = Clock::now();
  frameCount = 0;
  totalRenderTimeMs = 0.0f;
  packetsReceived = 0;
  packetsDropped = 0;
  packetsOutOfOrder = 0;
  packetsInvalid = 0;
  receivedFirstPacket = false;
  totalLatencyMs = 0.0f;
  maxLatencyMs = 0.0f;
  latencySamples = 0;
  timeoutEvents = 0;
}

bool PerformanceMonitor::shouldLog() const {
  return ENABLE_PERF_LOGGING && (getSecondsSinceLog() >= PERF_LOG_INTERVAL_SEC);
}

void PerformanceMonitor::logStats() const {
  auto stats = getStats();
  std::cout << "\n" << stats.toString() << std::endl;
  
  // Warning for high packet loss
  if (stats.packetLossRate > PACKET_LOSS_WARNING_THRESHOLD) {
    std::cerr << "⚠️  WARNING: High packet loss rate: " 
              << std::fixed << std::setprecision(1) 
              << (stats.packetLossRate * 100.0f) << "%\n";
  }
  
  // Update last log time
  lastLogTime = Clock::now();
}

float PerformanceMonitor::getElapsedSeconds() const {
  auto now = Clock::now();
  auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(now - startTime);
  return duration.count() / 1000.0f;
}

float PerformanceMonitor::getSecondsSinceLog() const {
  auto now = Clock::now();
  auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastLogTime);
  return duration.count() / 1000.0f;
}

std::string PerformanceStats::toString() const {
  std::ostringstream ss;
  ss << std::fixed << std::setprecision(2);
  
  ss << "========== Performance Stats ==========\n";
  ss << "Render:  " << averageFps << " fps | " 
     << averageRenderTimeMs << " ms avg\n";
  ss << "Network: " << totalPacketsReceived << " pkts | " 
     << packetsDropped << " dropped (" 
     << (packetLossRate * 100.0f) << "%) | "
     << packetsOutOfOrder << " OOO\n";
  ss << "Latency: " << averageLatencyMs << " ms avg | " 
     << maxLatencyMs << " ms max\n";
  
  if (timeoutEvents > 0) {
    ss << "Timeouts: " << timeoutEvents << "\n";
  }
  
  ss << "=======================================";
  
  return ss.str();
}
