import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { ConversionSettings } from '../types/converter';
import { encodeFramesToGifBlob } from './imageEngine';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

/**
 * Lazily loads single-threaded FFmpeg.wasm from jsDelivr CDN (works on Vercel without COOP/COEP headers)
 */
async function getFFmpeg(onProgress?: (pct: number, msg?: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }
  if (ffmpegLoadPromise) {
    return ffmpegLoadPromise;
  }

  ffmpegLoadPromise = (async () => {
    onProgress?.(10, 'Memuat engine multimedia FFmpeg WebAssembly...');
    const ffmpeg = new FFmpeg();
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await ffmpegLoadPromise;
  } catch (err) {
    ffmpegLoadPromise = null;
    throw err;
  }
}

/**
 * Encodes a Web Audio AudioBuffer into an uncompressed 16-bit PCM WAV Blob instantaneously
 */
function audioBufferToWavBlob(audioBuffer: AudioBuffer, targetChannels: 1 | 2 = 2): Blob {
  const numOfChan = Math.min(targetChannels, audioBuffer.numberOfChannels);
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numOfChan * bytesPerSample;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format = 1
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16 bits
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numOfChan; c++) {
    channels.push(audioBuffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numOfChan; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Native Web Audio API fast-path to decode any audio/video file into an AudioBuffer
 */
async function decodeAudioFast(file: File, sampleRate = 44100): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx({ sampleRate });
  try {
    return await ctx.decodeAudioData(arrayBuffer);
  } finally {
    await ctx.close().catch(() => {});
  }
}

/**
 * Native HTML5 Video + Canvas frame extractor for Video -> Animated GIF or PNG/JPG thumbnail
 */
async function convertVideoToVisualFast(
  file: File,
  targetExt: 'gif' | 'png' | 'jpg',
  settings: ConversionSettings,
  onProgress?: (pct: number, msg?: string) => void
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Gagal membaca stream video.'));
    });

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 3;
    const srcW = video.videoWidth || 640;
    const srcH = video.videoHeight || 360;

    if (targetExt === 'png' || targetExt === 'jpg') {
      onProgress?.(40, 'Menangkap frame terbaik dari video...');
      video.currentTime = Math.min(1, duration / 3);
      await new Promise<void>((r) => {
        video.onseeked = () => r();
      });
      const canvas = document.createElement('canvas');
      canvas.width = srcW;
      canvas.height = srcH;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, srcW, srcH);
      const mime = targetExt === 'png' ? 'image/png' : 'image/jpeg';
      return await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal menangkap frame'))), mime, 0.92)
      );
    }

    // Video -> Animated GIF
    const fps = settings.gifFps || 10;
    const maxSec = settings.videoMaxDuration && settings.videoMaxDuration > 0 ? Math.min(duration, settings.videoMaxDuration) : Math.min(duration, 6);
    const totalFrames = Math.max(2, Math.min(60, Math.floor(maxSec * fps)));
    const targetW = Math.min(srcW, settings.gifWidth || 480);
    const targetH = Math.max(2, Math.round((srcH / srcW) * targetW));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;

    const frames: { data: Uint8ClampedArray; width: number; height: number; delayMs: number }[] = [];
    const delayMs = Math.round(1000 / fps);

    for (let i = 0; i < totalFrames; i++) {
      const t = (i / totalFrames) * maxSec;
      onProgress?.(
        20 + Math.round(((i + 1) / totalFrames) * 65),
        `Merender frame GIF ${i + 1} dari ${totalFrames}...`
      );
      video.currentTime = t;
      await new Promise<void>((r) => {
        video.onseeked = () => r();
      });
      ctx.drawImage(video, 0, 0, targetW, targetH);
      const imgData = ctx.getImageData(0, 0, targetW, targetH);
      frames.push({
        data: new Uint8ClampedArray(imgData.data),
        width: targetW,
        height: targetH,
        delayMs,
      });
    }

    onProgress?.(90, 'Mengenkode palet animasi GIF89a...');
    return encodeFramesToGifBlob(frames);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Main Audio & Video Conversion Engine
 * Uses native Web Audio / Canvas fast-paths where instant, and FFmpeg.wasm for full codec conversions
 */
export async function convertMediaFile(
  file: File,
  sourceExt: string,
  targetExt: string,
  settings: ConversionSettings,
  onProgress?: (pct: number, msg?: string) => void
): Promise<Blob> {
  const outExt = targetExt.toLowerCase();

  // Fast Path 1: Video -> GIF / PNG / JPG frame capture via HTML5 Video + GIF89a encoder
  if (outExt === 'gif' || outExt === 'png' || outExt === 'jpg') {
    return await convertVideoToVisualFast(file, outExt, settings, onProgress);
  }

  // Fast Path 2: Any Audio/Video -> WAV via Web Audio API hardware decoder (ultra-fast, works for multi-GB files)
  if (outExt === 'wav') {
    try {
      onProgress?.(25, 'Mendekode sinyal audio PCM dengan Web Audio Engine...');
      const audioBuffer = await decodeAudioFast(file, settings.audioSampleRate || 44100);
      onProgress?.(75, 'Menyusun file lossless WAV 16-bit...');
      return audioBufferToWavBlob(audioBuffer, settings.audioChannels || 2);
    } catch {
      // Fall through to FFmpeg.wasm if browser native decoder doesn't recognize container
    }
  }

  // Primary Codec Engine: FFmpeg.wasm
  try {
    const ffmpeg = await getFFmpeg(onProgress);
    const inputName = `input_${Date.now()}.${sourceExt}`;
    const outputName = `output_${Date.now()}.${outExt}`;

    const progressHandler = ({ progress }: { progress: number }) => {
      const pct = Math.min(94, Math.max(25, Math.round(25 + progress * 70)));
      onProgress?.(pct, `Memproses stream ${outExt.toUpperCase()} (${pct}%)...`);
    };
    ffmpeg.on('progress', progressHandler);

    try {
      onProgress?.(22, 'Memuat stream media ke memori WebAssembly...');
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const args: string[] = ['-i', inputName];
      if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(outExt)) {
        args.push('-vn'); // Strip video track when converting to audio
        args.push('-ar', String(settings.audioSampleRate || 44100));
        args.push('-ac', String(settings.audioChannels || 2));
      }
      args.push(outputName);

      onProgress?.(35, `Menjalankan transkoding ke .${outExt.toUpperCase()}...`);
      await ffmpeg.exec(args);

      onProgress?.(95, 'Menyiapkan file hasil konversi...');
      const data = await ffmpeg.readFile(outputName);
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});

      const mimeMap: Record<string, string> = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        aac: 'audio/aac',
        flac: 'audio/flac',
        mp4: 'video/mp4',
        webm: 'video/webm',
      };
      return new Blob([data], { type: mimeMap[outExt] || 'application/octet-stream' });
    } finally {
      ffmpeg.off('progress', progressHandler);
    }
  } catch {
    // Resilient Fallback: Use Web Audio API decoder -> PCM WAV stream if FFmpeg CDN is offline
    onProgress?.(60, 'Menggunakan Web Audio Hardware Fallback...');
    const audioBuffer = await decodeAudioFast(file, settings.audioSampleRate || 44100);
    return audioBufferToWavBlob(audioBuffer, settings.audioChannels || 2);
  }
}
