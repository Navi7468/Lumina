import { invoke } from '@tauri-apps/api/tauri';
import type { LEDFrame } from '@/engine/types';

const PACKET_MAGIC = 0xFEED;
const PROTOCOL_VERSION = 1;

let sequence = 0;
let isConnected = false;

export async function connect(ip: string, port: number): Promise<void> {
  try {
    await invoke('connect_to_pi', { ip, port });
    isConnected = true;
    sequence = 0;
  } catch (error) {
    isConnected = false;
    throw new Error(`Failed to connect: ${error}`);
  }
}

export async function disconnect(): Promise<void> {
  try{
    await invoke('disconnect');
    isConnected = false;
  } catch (error) {
    console.error('Failed to disconnect:', error);
  }
}

export async function sendFrame(frame: LEDFrame): Promise<void> {
  if (!isConnected) {
    throw new Error('Not connected to Pi');
  }
  
  // Build packet according to V1 protocol
  const packetData = buildPacket(frame);
  
  try {
    await invoke('send_frame', {
      sequence: sequence++,
      data: Array.from(packetData),
    });
  } catch (error) {
    throw new Error(`Failed to send frame: ${error}`);
  }
}

function buildPacket(frame: LEDFrame): Uint8Array {
  const rgbDataSize = frame.ledCount * 3;
  const headerSize = 16; // 2+2+4+4+2+2 bytes
  const packet = new Uint8Array(headerSize + rgbDataSize);
  const view = new DataView(packet.buffer);
  
  let offset = 0;
  
  // Magic number (2 bytes)
  view.setUint16(offset, PACKET_MAGIC, true);
  offset += 2;
  
  // Protocol version (2 bytes)
  view.setUint16(offset, PROTOCOL_VERSION, true);
  offset += 2;
  
  // Sequence (4 bytes)
  view.setUint32(offset, sequence, true);
  offset += 4;
  
  // Timestamp (4 bytes) - microseconds
  const timestamp = Math.floor(performance.now() * 1000) & 0xFFFFFFFF;
  view.setUint32(offset, timestamp, true);
  offset += 4;
  
  // Type (2 bytes) - 0 = frame data
  view.setUint16(offset, 0, true);
  offset += 2;
  
  // Payload size (2 bytes)
  view.setUint16(offset, rgbDataSize, true);
  offset += 2;
  
  // RGB data
  for (let i = 0; i < frame.ledCount; i++) {
    const [r, g, b] = frame.data[i];
    packet[offset++] = r;
    packet[offset++] = g;
    packet[offset++] = b;
  }
  
  return packet;
}

export function isConnectedToPi(): boolean {
  return isConnected;
}
