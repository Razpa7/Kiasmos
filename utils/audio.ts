export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Float32 audio from AudioContext to Int16 (16kHz) for Gemini
export function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

/**
 * Downsamples audio data from an input sample rate to a target sample rate.
 * Uses simple linear interpolation.
 */
export function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (outputRate === inputRate) {
    return buffer;
  }
  
  const sampleRateRatio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const nextItem = i * sampleRateRatio;
    const index = Math.floor(nextItem);
    const fraction = nextItem - index;
    
    // Linear interpolation
    if (index + 1 < buffer.length) {
        result[i] = buffer[index] * (1 - fraction) + buffer[index + 1] * fraction;
    } else {
        result[i] = buffer[index];
    }
  }
  return result;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  // Gemini sends raw PCM 16-bit little-endian. 
  // We need to convert it to Float32 for the AudioContext.
  const dataView = new DataView(data.buffer);
  const float32Data = new Float32Array(data.length / 2);
  
  for (let i = 0; i < float32Data.length; i++) {
    const int16 = dataView.getInt16(i * 2, true); // true = little-endian
    float32Data[i] = int16 / 32768.0;
  }

  const audioBuffer = ctx.createBuffer(1, float32Data.length, sampleRate);
  audioBuffer.copyToChannel(float32Data, 0);
  
  return audioBuffer;
}