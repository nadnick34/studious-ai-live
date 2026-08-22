import { transcribeAudioChunk } from "@/lib/ai";

function isAudioFile(file: File) {
  return file.type.startsWith("audio/") || /\.(mp3|m4a|wav|aac|mp4)$/i.test(file.name);
}

function mixMono(buffer: AudioBuffer): Float32Array {
  const len = buffer.length;
  const out = new Float32Array(len);
  const channels = buffer.numberOfChannels;
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < len; i++) out[i] += data[i] / channels;
  }
  return out;
}

function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outLen = Math.max(1, Math.round(input.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = i * ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(input.length - 1, i0 + 1);
    const t = src - i0;
    out[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return out;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([bytes], { type: "audio/wav" });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function transcribeLectureFile(
  file: File,
  onStatus?: (msg: string) => void,
): Promise<string> {
  onStatus?.(`Decoding ${file.name}…`);
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  try {
    const raw = await file.arrayBuffer();
    let decoded: AudioBuffer;
    try {
      decoded = await ctx.decodeAudioData(raw.slice(0));
    } catch {
      throw new Error(
        `This browser could not decode ${file.name}. Open Chrome on your computer, or export the lecture as MP3 / upload a .txt transcript.`,
      );
    }
    const mono = mixMono(decoded);
    const sampled = resample(mono, decoded.sampleRate, 16000);
    const quarters = 4;
    const quarterLen = Math.ceil(sampled.length / quarters);
    const minuteSize = 16000 * 60;
    const parts: string[] = [];
    for (let q = 0; q < quarters; q++) {
      const qStart = q * quarterLen;
      const qEnd = Math.min(sampled.length, qStart + quarterLen);
      if (qStart >= sampled.length) break;
      const quarterSamples = sampled.subarray(qStart, qEnd);
      const minutesInQuarter = Math.max(1, Math.ceil(quarterSamples.length / minuteSize));
      onStatus?.(`Quarter ${q + 1} of ${quarters} — starting (${file.name})…`);
      for (let m = 0; m < minutesInQuarter; m++) {
        const mStart = m * minuteSize;
        const mEnd = Math.min(quarterSamples.length, mStart + minuteSize);
        const slice = quarterSamples.subarray(mStart, mEnd);
        if (!slice.length) continue;
        onStatus?.(`Quarter ${q + 1} of ${quarters} — minute ${m + 1} of ${minutesInQuarter}…`);
        const wav = encodeWav(slice, 16000);
        let text = "";
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            text = await transcribeAudioChunk({
              data: {
                name: `${file.name.replace(/\.[^.]+$/, "")}-q${q + 1}-m${m + 1}.wav`,
                type: "audio/wav",
                size: wav.size,
                base64: await blobToBase64(wav),
              },
            });
            break;
          } catch (err) {
            if (attempt === 2) {
              const kept = parts.join("\n").trim();
              throw new Error(
                `Stopped in quarter ${q + 1} of ${quarters}, minute ${m + 1}. ${kept ? "Earlier quarters were captured — try again or upload a transcript for the rest." : ""} ${err instanceof Error ? err.message : "chunk failed"}`,
              );
            }
            await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
          }
        }
        if (text) parts.push(text);
      }
      onStatus?.(`Quarter ${q + 1} of ${quarters} complete.`);
    }
    const joined = parts.join("\n").trim();
    if (!joined) throw new Error(`No speech was recovered from ${file.name}.`);
    return `LECTURE TRANSCRIPT from ${file.name}:\n${joined}`;
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

export function fileIsAudio(file: File) {
  return isAudioFile(file);
}
