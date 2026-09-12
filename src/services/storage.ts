import { DspEqState, WiFiConfig, OTAState } from '../types';

const STORAGE_KEYS = {
  VOLUME: 'esp32_audio_volume',
  MUTED: 'esp32_audio_muted',
  LAST_TRACK_ID: 'esp32_audio_last_track_id',
  CUSTOM_URL: 'esp32_audio_custom_url',
  DSP_EQ: 'esp32_audio_dsp_eq',
  WIFI_CFG: 'esp32_audio_wifi_cfg',
  OTA_STATE: 'esp32_audio_ota_state'
};

export const DEFAULT_EQ: DspEqState = {
  bass: 0,
  mid: 0,
  treble: 0,
  preamp: 0,
  selectedPreset: 'Flat',
  enabled: true
};

export const DEFAULT_WIFI: WiFiConfig = {
  staSsid: 'Home-WiFi-5G',
  staPassword: '••••••••',
  apSsid: 'ESP32-Audio-AP',
  apPassword: '',
  apKeepOpen: true,
  mdnsHost: 'esp32-audio',
  useDhcp: true,
  staticIp: '192.168.1.142'
};

export const DEFAULT_OTA: OTAState = {
  currentPartition: 'ota_0',
  nextPartition: 'ota_1',
  partitionSizeMb: 6.5,
  isUpdating: false,
  progressPercent: 0,
  statusMessage: 'Ready. Booted from partition ota_0 (ESP-IDF v5.2.1-audio)',
  firmwareVersion: 'v2.4.0-production'
};

export function loadSavedVolume(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.VOLUME);
    return v !== null ? parseFloat(v) : 0.8;
  } catch {
    return 0.8;
  }
}

export function saveVolume(vol: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VOLUME, vol.toString());
  } catch {
    // Storage quota or private mode
  }
}

export function loadSavedMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.MUTED) === 'true';
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MUTED, muted ? 'true' : 'false');
  } catch {
    // Storage quota
  }
}

export function loadSavedLastTrackId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_TRACK_ID) || 'radio-somafm-groovesalad';
  } catch {
    return 'radio-somafm-groovesalad';
  }
}

export function saveLastTrackId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_TRACK_ID, id);
  } catch {
    // ignore
  }
}

export function loadSavedCustomUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_URL) || '';
  } catch {
    return '';
  }
}

export function saveCustomUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_URL, url);
  } catch {
    // ignore
  }
}

export function loadSavedEq(): DspEqState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DSP_EQ);
    if (raw) {
      return { ...DEFAULT_EQ, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_EQ;
}

export function saveEq(eq: DspEqState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DSP_EQ, JSON.stringify(eq));
  } catch {
    // ignore
  }
}

export function loadSavedWiFi(): WiFiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WIFI_CFG);
    if (raw) {
      return { ...DEFAULT_WIFI, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_WIFI;
}

export function saveWiFi(cfg: WiFiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WIFI_CFG, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

export function loadSavedOta(): OTAState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OTA_STATE);
    if (raw) {
      return { ...DEFAULT_OTA, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_OTA;
}

export function saveOta(ota: OTAState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OTA_STATE, JSON.stringify(ota));
  } catch {
    // ignore
  }
}
