#pragma once
#include "../core/Frame.h"

enum class PollResult {
  NO_DATA,           // No packet available
  SUCCESS,           // Valid frame packet received (back buffer)
  STATIC_FRAME,      // Valid static frame received (both buffers)
  TIMEOUT_SET,       // Timeout configuration received
  INVALID_MAGIC,     // Wrong magic number
  INVALID_VERSION,   // Unsupported protocol version
  INVALID_TYPE,      // Wrong packet type
  INVALID_SIZE       // Wrong packet size
};

struct PacketInfo {
  PollResult result;
  u32 sequence;
  u32 timestamp;
  u32 timeoutMs;  // For TIMEOUT_SET result
};

class UdpServer {
public:
  bool initialize(int port);
  PacketInfo poll(Frame* backBuffer, Frame* frontBuffer = nullptr);

private:
  int sockfd;
};