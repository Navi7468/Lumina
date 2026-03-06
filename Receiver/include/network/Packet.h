#pragma once
#include "../core/Type.h"

#pragma pack(push, 1)

// Protocol version history:
// V1: Initial version with sequence, timestamp, type, payloadSize
constexpr u16 PACKET_MAGIC = 0xFEED;  // Magic number for validation

enum PacketType : u16 {
  PACKET_TYPE_FRAME = 0,       // Full RGB frame data (streaming, writes to back buffer)
  PACKET_TYPE_EFFECT = 1,      // Effect parameters (future)
  PACKET_TYPE_CONFIG = 2,      // Configuration (future)
  PACKET_TYPE_PING = 3,        // Keep-alive/latency test
  PACKET_TYPE_SET_TIMEOUT = 4, // Set packet timeout duration
  PACKET_TYPE_STATIC_FRAME = 5 // Static frame (scrubbing, writes to BOTH buffers)
};

struct PacketHeader {
  u16 magic;         // Magic number (0xFEED)
  u16 version;       // Protocol version
  u32 sequence;      // Sequence number (for dropped packet detection)
  u32 timestamp;     // Sender timestamp in microseconds
  u16 type;          // PacketType
  u16 payloadSize;   // Size of payload in bytes
};

struct FramePacket {
  PacketHeader header;
  u8 rgbData[600 * 3];
  
  // Helper to validate packet
  bool isValid(u16 expectedVersion) const {
    return header.magic == PACKET_MAGIC && 
           header.version == expectedVersion &&
           header.type == PACKET_TYPE_FRAME;
  }
};

// Future: Effect parameters packet
struct EffectPacket {
  PacketHeader header;
  u32 effectId;
  float speed;
  float hue;
  float intensity;
  u8 reserved[32];  // For future parameters
};

// Timeout configuration packet
struct TimeoutPacket {
  PacketHeader header;
  u32 timeoutMs;  // New timeout duration in milliseconds
  
  bool isValid(u16 expectedVersion) const {
    return header.magic == PACKET_MAGIC && 
           header.version == expectedVersion &&
           header.type == PACKET_TYPE_SET_TIMEOUT;
  }
};

#pragma pack(pop)