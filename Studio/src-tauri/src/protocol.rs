// Protocol constants and packet serialisation for the Lumina UDP protocol (V1).
//
// Packet header layout (16 bytes, little-endian):
//   magic       u16   0xFEED
//   version     u16   1
//   sequence    u32
//   timestamp   u32   microseconds since UNIX epoch (wraps ~every 71 minutes)
//   packet_type u16
//   payload_sz  u16
//
// Followed immediately by `payload_sz` bytes of payload.

pub const PACKET_MAGIC: u16 = 0xFEED;
pub const PROTOCOL_VERSION: u16 = 1;

pub const PACKET_TYPE_FRAME: u16 = 0;        // Streaming frame (back buffer only)
pub const PACKET_TYPE_SET_TIMEOUT: u16 = 4;  // Reconfigure receiver timeout
pub const PACKET_TYPE_STATIC_FRAME: u16 = 5; // Scrub frame (persists across swaps)

/// Builds a complete UDP packet ready to send.
///
/// ```rust
/// let packet = PacketBuilder::new(PACKET_TYPE_FRAME)
///     .sequence(seq)
///     .payload(&rgb_data)
///     .build();
/// ```
pub struct PacketBuilder {
    packet_type: u16,
    sequence: u32,
    payload: Vec<u8>,
}

impl PacketBuilder {
    pub fn new(packet_type: u16) -> Self {
        Self {
            packet_type,
            sequence: 0,
            payload: Vec::new(),
        }
    }

    pub fn sequence(mut self, seq: u32) -> Self {
        self.sequence = seq;
        self
    }

    pub fn payload(mut self, data: &[u8]) -> Self {
        self.payload = data.to_vec();
        self
    }

    /// Serialises the packet with a freshly-sampled timestamp.
    pub fn build(self) -> Vec<u8> {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_micros() as u32;

        let payload_size = self.payload.len() as u16;

        let mut packet = Vec::with_capacity(16 + self.payload.len());
        packet.extend_from_slice(&PACKET_MAGIC.to_le_bytes());
        packet.extend_from_slice(&PROTOCOL_VERSION.to_le_bytes());
        packet.extend_from_slice(&self.sequence.to_le_bytes());
        packet.extend_from_slice(&timestamp.to_le_bytes());
        packet.extend_from_slice(&self.packet_type.to_le_bytes());
        packet.extend_from_slice(&payload_size.to_le_bytes());
        packet.extend_from_slice(&self.payload);
        packet
    }
}
