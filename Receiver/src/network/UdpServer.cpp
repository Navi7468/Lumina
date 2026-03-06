#include "network/UdpServer.h"
#include "network/Packet.h"
#include "config.h"

#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <cstring>
#include <iostream>

bool UdpServer::initialize(int port) {
  sockfd = socket(AF_INET, SOCK_DGRAM, 0);
  if (sockfd < 0) {
    std::cerr << "Failed to create socket\n";
    return false;
  }

  // Socket optimization: Reuse address
  int flags = 1;
  setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &flags, sizeof(flags));

  // Socket optimization: Increase receive buffer size
  int bufferSize = UDP_RECV_BUFFER_SIZE;
  if (setsockopt(sockfd, SOL_SOCKET, SO_RCVBUF, &bufferSize, sizeof(bufferSize)) < 0) {
    std::cerr << "Warning: Failed to set SO_RCVBUF\n";
  }

  // Socket optimization: Set receive timeout (for graceful shutdown)
  struct timeval tv;
  tv.tv_sec = 0;
  tv.tv_usec = 10000;  // 10ms timeout
  setsockopt(sockfd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

  // Bind to port
  sockaddr_in addr{};
  addr.sin_family = AF_INET;
  addr.sin_port = htons(port);
  addr.sin_addr.s_addr = INADDR_ANY;

  if (bind(sockfd, (sockaddr*)&addr, sizeof(addr)) < 0) {
    std::cerr << "Failed to bind to port " << port << "\n";
    return false;
  }

  std::cout << "UDP Server listening on port " << port << "\n";
  std::cout << "Receive buffer size: " << (UDP_RECV_BUFFER_SIZE / 1024) << " KB\n";
  
  return true;
}

PacketInfo UdpServer::poll(Frame* backBuffer, Frame* frontBuffer) {
  PacketInfo info;
  info.result = PollResult::NO_DATA;
  info.sequence = 0;
  info.timestamp = 0;
  info.timeoutMs = 0;

  // Buffer large enough for any packet type
  u8 buffer[sizeof(FramePacket)];
  ssize_t len = recv(sockfd, buffer, sizeof(buffer), MSG_DONTWAIT);

  if (len <= 0) {
    return info;  // No data available
  }

  // Validate packet size
  if (len < static_cast<ssize_t>(sizeof(PacketHeader))) {
    info.result = PollResult::INVALID_SIZE;
    return info;
  }

  // Cast to header first to check type
  PacketHeader* header = reinterpret_cast<PacketHeader*>(buffer);

  // Validate magic number
  if (header->magic != PACKET_MAGIC) {
    info.result = PollResult::INVALID_MAGIC;
    return info;
  }

  // Validate protocol version
  if (header->version != PROTOCOL_VERSION) {
    info.result = PollResult::INVALID_VERSION;
    std::cerr << "Unsupported protocol version: " << header->version 
              << " (expected " << PROTOCOL_VERSION << ")\n";
    return info;
  }

  // Handle different packet types
  if (header->type == PACKET_TYPE_FRAME) {
    // Frame packet - writes to back buffer only
    if (len < static_cast<ssize_t>(sizeof(PacketHeader))) {
      info.result = PollResult::INVALID_SIZE;
      return info;
    }

    FramePacket* packet = reinterpret_cast<FramePacket*>(buffer);
    
    if (!packet->isValid(PROTOCOL_VERSION)) {
      info.result = PollResult::INVALID_SIZE;
      return info;
    }

    // Copy RGB data to back buffer
    size_t copySize = std::min(
      static_cast<size_t>(backBuffer->ledCount * 3),
      static_cast<size_t>(packet->header.payloadSize)
    );
    std::memcpy(backBuffer->data, packet->rgbData, copySize);

    // Return success with packet info
    info.result = PollResult::SUCCESS;
    info.sequence = packet->header.sequence;
    info.timestamp = packet->header.timestamp;

    return info;
  }
  else if (header->type == PACKET_TYPE_STATIC_FRAME) {
    // Static frame packet - writes to BOTH buffers for flicker-free scrubbing
    if (len < static_cast<ssize_t>(sizeof(PacketHeader))) {
      info.result = PollResult::INVALID_SIZE;
      return info;
    }

    FramePacket* packet = reinterpret_cast<FramePacket*>(buffer);
    
    // Validate packet size (we already validated magic and version in header)
    if (packet->header.payloadSize > sizeof(packet->rgbData)) {
      info.result = PollResult::INVALID_SIZE;
      return info;
    }

    // Copy RGB data to back buffer
    size_t copySize = std::min(
      static_cast<size_t>(backBuffer->ledCount * 3),
      static_cast<size_t>(packet->header.payloadSize)
    );
    std::memcpy(backBuffer->data, packet->rgbData, copySize);

    // Also copy to front buffer if provided
    if (frontBuffer) {
      size_t frontCopySize = std::min(
        static_cast<size_t>(frontBuffer->ledCount * 3),
        static_cast<size_t>(packet->header.payloadSize)
      );
      std::memcpy(frontBuffer->data, packet->rgbData, frontCopySize);
    }

    // Return static frame result
    info.result = PollResult::STATIC_FRAME;
    info.sequence = packet->header.sequence;
    info.timestamp = packet->header.timestamp;

    return info;
  } 
  else if (header->type == PACKET_TYPE_SET_TIMEOUT) {
    // Timeout configuration packet
    if (len < static_cast<ssize_t>(sizeof(TimeoutPacket))) {
      info.result = PollResult::INVALID_SIZE;
      return info;
    }

    TimeoutPacket* packet = reinterpret_cast<TimeoutPacket*>(buffer);
    
    if (!packet->isValid(PROTOCOL_VERSION)) {
      info.result = PollResult::INVALID_SIZE;
      return info;
    }

    // Return timeout configuration
    info.result = PollResult::TIMEOUT_SET;
    info.timeoutMs = packet->timeoutMs;
    info.sequence = packet->header.sequence;
    info.timestamp = packet->header.timestamp;

    return info;
  }
  else {
    // Unknown packet type
    info.result = PollResult::INVALID_TYPE;
    return info;
  }
}