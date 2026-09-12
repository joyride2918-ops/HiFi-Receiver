export type AudioSourceType = 'radio' | 'trial' | 'custom' | 'airplay' | 'dlna';

export interface AudioTrack {
  id: string;
  name: string;
  category: 'radio' | 'trial';
  description: string;
  url: string;
  codec: 'MP3' | 'AAC' | 'FLAC' | 'WAV' | 'Opus';
  bitrate?: string;
  sampleRate?: string;
  isSynthetic?: boolean; // For precision calibration tones (1kHz, 50Hz)
  freq?: number;
}

export interface DspEqState {
  bass: number;     // -12dB to +12dB (100 Hz low shelf / peaking)
  mid: number;      // -12dB to +12dB (1000 Hz peaking)
  treble: number;   // -12dB to +12dB (10000 Hz high shelf / peaking)
  preamp: number;   // -6dB to +6dB
  selectedPreset: string;
  enabled: boolean;
}

export interface EqPreset {
  name: string;
  bass: number;
  mid: number;
  treble: number;
  description: string;
}

export interface LiveServicesState {
  airplay2: {
    running: boolean;
    activeStreaming: boolean;
    clientName?: string;
    clientIp?: string;
    codec: string;
    port: number;
    latencyMs: number;
  };
  dlna: {
    running: boolean;
    activeStreaming: boolean;
    rendererName: string;
    clientIp?: string;
    uri?: string;
    port: number;
  };
  httpStream: {
    active: boolean;
    url?: string;
    codec?: string;
    bitrate?: string;
    bufferedKb: number;
    bufferPercent: number;
  };
  wifi: {
    apEnabled: boolean;
    apSsid: string;
    apIp: string;
    apClientsCount: number;
    staConnected: boolean;
    staSsid: string;
    staIp: string;
    staRssi: number; // dBm
    mdnsHost: string; // e.g. "esp32-audio.local"
  };
  dac: {
    model: string; // "UDA1334A"
    interface: string; // "I2S Standard"
    sampleRate: number; // 44100, 48000, 96000
    bitDepth: number; // 16, 24, 32
    dmaBuffers: number;
    dmaBufferSize: number;
    pinBclk: number; // GPIO 14
    pinWsel: number; // GPIO 15
    pinDin: number;  // GPIO 16
    clipping: boolean;
  };
  hardware: {
    chip: string; // "ESP32-S3 (revision v0.2)"
    cores: number; // 2 @ 240MHz
    flashSizeMb: number; // 16
    psramSizeMb: number; // 8 (Octal SPI @ 80MHz)
    psramFreeKb: number;
    heapFreeKb: number;
    cpuTempC: number;
    uptimeSeconds: number;
  };
}

export interface WiFiConfig {
  staSsid: string;
  staPassword: string;
  apSsid: string;
  apPassword: string;
  apKeepOpen: boolean;
  mdnsHost: string;
  useDhcp: boolean;
  staticIp?: string;
}

export interface OTAState {
  currentPartition: 'ota_0' | 'ota_1';
  nextPartition: 'ota_0' | 'ota_1';
  partitionSizeMb: number;
  isUpdating: boolean;
  progressPercent: number;
  statusMessage: string;
  firmwareVersion: string;
  lastUpdateDate?: string;
  fileSizeKb?: number;
  sha256?: string;
}

export interface GitHubFile {
  path: string;
  name: string;
  type: 'file' | 'dir';
  language?: string;
  content?: string;
  children?: GitHubFile[];
}
