// ESP32-S3 Hi-Fi Audio Hardware REST API Client

const DEVICE_IP_KEY = 'esp32_device_ip';

export function getStoredDeviceIp(): string {
  try {
    const saved = localStorage.getItem(DEVICE_IP_KEY);
    if (saved) return saved;
  } catch {}
  // Default to station IP observed on user network or local relative
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && !host.includes('run.app') && !host.includes('webcontainer')) {
      return ''; // Same host (when loaded directly from ESP32 web server)
    }
  }
  return 'http://192.168.254.112'; // Default to user's station IP
}

export function saveDeviceIp(ip: string): void {
  try {
    localStorage.setItem(DEVICE_IP_KEY, ip);
  } catch {}
}

export interface EspStatus {
  sta_connected: boolean;
  sta_ip: string;
  sta_rssi: number;
  volume: number;
  eq_bass: number;
  eq_mid: number;
  eq_treble: number;
  airplay_active: boolean;
  dlna_active: boolean;
  http_playing: boolean;
  stream_url: string;
  free_heap: number;
  free_psram: number;
  buffer_bytes: number;
}

function normalizeUrl(baseUrl: string, endpoint: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return endpoint;
  const prefix = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `http://${trimmed}`;
  return `${prefix}${endpoint}`;
}

export async function fetchEspStatus(baseUrl: string): Promise<EspStatus> {
  const url = normalizeUrl(baseUrl, '/api/status');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function sendEspVolume(baseUrl: string, volume: number): Promise<void> {
  const url = normalizeUrl(baseUrl, '/api/volume');
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volume: Math.round(volume) })
  });
}

export async function sendEspEq(baseUrl: string, bass: number, mid: number, treble: number): Promise<void> {
  const url = normalizeUrl(baseUrl, '/api/eq');
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bass, mid, treble })
  });
}

export async function sendEspPlayStream(baseUrl: string, streamUrl: string): Promise<void> {
  const url = normalizeUrl(baseUrl, '/api/stream');
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: streamUrl })
  });
}

export async function sendEspStopStream(baseUrl: string): Promise<void> {
  const url = normalizeUrl(baseUrl, '/api/stop');
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function sendEspWifiConfig(baseUrl: string, ssid: string, password: string): Promise<void> {
  const url = normalizeUrl(baseUrl, '/api/wifi');
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ssid, password })
  });
}
