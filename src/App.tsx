import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Github, 
  Wifi, 
  Cpu, 
  UploadCloud, 
  Activity,
  Terminal,
  X,
  Sliders,
  Airplay,
  Cast
} from 'lucide-react';

import { 
  AudioTrack, 
  DspEqState, 
  EqPreset, 
  WiFiConfig, 
  OTAState, 
  LiveServicesState 
} from './types';
import { CURATED_TRACKS } from './data/radiosAndTrials';
import { GITHUB_REPO_FILES } from './data/githubRepoFiles';
import { audioEngine } from './services/audioEngine';
import { 
  fetchEspStatus, 
  sendEspVolume, 
  sendEspEq, 
  sendEspPlayStream, 
  sendEspStopStream, 
  sendEspWifiConfig,
  getStoredDeviceIp,
  saveDeviceIp
} from './services/esp32Api';
import { 
  loadSavedVolume, 
  saveVolume, 
  loadSavedMuted, 
  saveMuted, 
  loadSavedLastTrackId, 
  saveLastTrackId, 
  loadSavedCustomUrl, 
  saveCustomUrl, 
  loadSavedEq, 
  saveEq, 
  loadSavedWiFi, 
  saveWiFi, 
  loadSavedOta, 
  saveOta 
} from './services/storage';

import { MinimalStatusHeader } from './components/MinimalStatusHeader';
import { TopControls } from './components/TopControls';
import { StreamSelectorTile } from './components/StreamSelectorTile';
import { DspEqTile } from './components/DspEqTile';
import { WifiModal } from './components/WifiModal';
import { AirPlayDlnaModal } from './components/AirPlayDlnaModal';
import { HardwareModal } from './components/HardwareModal';
import { OtaModal } from './components/OtaModal';
import { GitHubRepoExplorer } from './components/GitHubRepoExplorer';
import { FirmwareBuildsCard } from './components/FirmwareBuildsCard';

export default function App() {
  // Navigation / View Tabs
  const [activeView, setActiveView] = useState<'controller' | 'builds' | 'github'>('controller');

  // Modals Visibility
  const [isWifiModalOpen, setIsWifiModalOpen] = useState<boolean>(false);
  const [isAirPlayModalOpen, setIsAirPlayModalOpen] = useState<boolean>(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState<boolean>(false);
  const [isOtaModalOpen, setIsOtaModalOpen] = useState<boolean>(false);

  // Startup Wi-Fi Setup Banner (Only shown at startup, not persistent in main UI)
  const [showStartupWifiBanner, setShowStartupWifiBanner] = useState<boolean>(() => {
    return !localStorage.getItem('hifi_wifi_configured');
  });

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Metering & Level meters
  const [vuLeft, setVuLeft] = useState<number>(0);
  const [vuRight, setVuRight] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // DSP EQ State
  const [dspEq, setDspEq] = useState<DspEqState>(loadSavedEq);

  // Wi-Fi Configuration State
  const [wifiConfig, setWifiConfig] = useState<WiFiConfig>(loadSavedWiFi);

  // OTA Firmware State
  const [otaState, setOtaState] = useState<OTAState>(loadSavedOta);

  // ESP32 Hardware Connection State
  const [deviceIp, setDeviceIp] = useState<string>(() => getStoredDeviceIp());
  const [isHardwareOnline, setIsHardwareOnline] = useState<boolean>(false);
  const [isEditingIp, setIsEditingIp] = useState<boolean>(false);
  const [ipInput, setIpInput] = useState<string>(() => getStoredDeviceIp());

  // Live Services Telemetry State
  const [services, setServices] = useState<LiveServicesState>({
    airplay2: {
      running: true,
      activeStreaming: false,
      clientName: 'Apple Device (AirPlay 2)',
      codec: 'Apple ALAC Lossless',
      port: 5000,
      latencyMs: 50
    },
    dlna: {
      running: true,
      activeStreaming: false,
      rendererName: 'ESP32-S3 HiFi Renderer',
      port: 1900
    },
    httpStream: {
      active: false,
      bufferedKb: 1024,
      bufferPercent: 92
    },
    wifi: {
      apEnabled: true,
      apSsid: wifiConfig.apSsid,
      apIp: '192.168.4.1',
      apClientsCount: 1,
      staConnected: true,
      staSsid: wifiConfig.staSsid,
      staIp: wifiConfig.staticIp || '192.168.1.142',
      staRssi: -58,
      mdnsHost: wifiConfig.mdnsHost
    },
    dac: {
      model: 'UDA1334A',
      interface: 'I2S Master',
      sampleRate: 44100,
      bitDepth: 24,
      dmaBuffers: 6,
      dmaBufferSize: 512,
      pinBclk: 14,
      pinWsel: 15,
      pinDin: 16,
      clipping: false
    },
    hardware: {
      chip: 'ESP32-S3 (Dual Xtensa LX7)',
      cores: 2,
      flashSizeMb: 16,
      psramSizeMb: 8,
      psramFreeKb: 6940,
      heapFreeKb: 284,
      cpuTempC: 41.8,
      uptimeSeconds: 124300
    }
  });

  // Initialization: Load saved preferences
  useEffect(() => {
    const savedVol = loadSavedVolume();
    const savedMute = loadSavedMuted();
    const savedTrackId = loadSavedLastTrackId();
    const savedCustom = loadSavedCustomUrl();
    const savedEqState = loadSavedEq();

    setVolume(savedVol);
    setIsMuted(savedMute);
    setCustomUrl(savedCustom);
    setDspEq(savedEqState);

    const initialTrack = CURATED_TRACKS.find((t) => t.id === savedTrackId) || CURATED_TRACKS[0];
    setCurrentTrack(initialTrack);

    audioEngine.setVolume(savedVol);
    audioEngine.setMute(savedMute);
    audioEngine.setEq(savedEqState);

    // VU Meter Animation Loop
    const updateVUMeters = () => {
      const levels = audioEngine.getLevels();
      setVuLeft(levels.left);
      setVuRight(levels.right);
      animFrameRef.current = requestAnimationFrame(updateVUMeters);
    };
    animFrameRef.current = requestAnimationFrame(updateVUMeters);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Real-Time ESP32 Hardware Status Polling Loop
  useEffect(() => {
    let isMounted = true;
    const poll = async () => {
      try {
        const status = await fetchEspStatus(deviceIp);
        if (!isMounted) return;
        setIsHardwareOnline(true);
        setServices((prev) => ({
          ...prev,
          airplay2: {
            ...prev.airplay2,
            activeStreaming: status.airplay_active
          },
          dlna: {
            ...prev.dlna,
            activeStreaming: status.dlna_active
          },
          httpStream: {
            ...prev.httpStream,
            active: status.http_playing,
            url: status.stream_url || prev.httpStream.url
          },
          wifi: {
            ...prev.wifi,
            staConnected: status.sta_connected,
            staIp: status.sta_ip,
            staRssi: status.sta_rssi
          },
          hardware: {
            ...prev.hardware,
            heapFreeKb: Math.round(status.free_heap / 1024),
            psramFreeKb: Math.round(status.free_psram / 1024)
          }
        }));
      } catch {
        if (isMounted) setIsHardwareOnline(false);
      }
    };

    poll();
    const intervalId = setInterval(poll, 3000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [deviceIp]);

  // Synchronize EQ changes to WebAudio, ESP32 Hardware, and localStorage
  const handleEqChange = (newEq: DspEqState) => {
    setDspEq(newEq);
    saveEq(newEq);
    audioEngine.setEq(newEq);
    sendEspEq(deviceIp, newEq.bass, newEq.mid, newEq.treble).catch(() => {});
  };

  const handleSelectPreset = (preset: EqPreset) => {
    const updated: DspEqState = {
      ...dspEq,
      bass: preset.bass,
      mid: preset.mid,
      treble: preset.treble,
      selectedPreset: preset.name,
      enabled: true
    };
    handleEqChange(updated);
  };

  // Playback Handlers
  const handlePlayTrack = async (track: AudioTrack) => {
    setCurrentTrack(track);
    saveLastTrackId(track.id);

    try {
      if (track.isSynthetic && track.freq) {
        await audioEngine.playSyntheticTone(track.freq);
      } else {
        await audioEngine.playUrl(track.url);
        sendEspPlayStream(deviceIp, track.url).catch(() => {});
      }
      setIsPlaying(true);
      setIsPaused(false);
      
      setServices((prev) => ({
        ...prev,
        airplay2: { ...prev.airplay2, activeStreaming: false },
        dlna: { ...prev.dlna, activeStreaming: false },
        httpStream: { ...prev.httpStream, active: true, url: track.url, codec: track.codec },
        dac: { 
          ...prev.dac, 
          sampleRate: track.sampleRate?.includes('96') ? 96000 : track.sampleRate?.includes('48') ? 48000 : 44100 
        }
      }));
    } catch (err) {
      console.warn('Direct stream autoplay note:', err);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      audioEngine.pause();
      sendEspStopStream(deviceIp).catch(() => {});
      setIsPlaying(false);
      setIsPaused(true);
      setServices((prev) => ({
        ...prev,
        httpStream: { ...prev.httpStream, active: false }
      }));
    } else {
      if (currentTrack) {
        await handlePlayTrack(currentTrack);
      }
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    sendEspStopStream(deviceIp).catch(() => {});
    setIsPlaying(false);
    setIsPaused(false);
    setServices((prev) => ({
      ...prev,
      airplay2: { ...prev.airplay2, activeStreaming: false },
      dlna: { ...prev.dlna, activeStreaming: false },
      httpStream: { ...prev.httpStream, active: false }
    }));
  };

  const handleNext = () => {
    if (!currentTrack) return;
    const currentIndex = CURATED_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % CURATED_TRACKS.length;
    handlePlayTrack(CURATED_TRACKS[nextIndex]);
  };

  const handlePrev = () => {
    if (!currentTrack) return;
    const currentIndex = CURATED_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + CURATED_TRACKS.length) % CURATED_TRACKS.length;
    handlePlayTrack(CURATED_TRACKS[prevIndex]);
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    saveVolume(val);
    audioEngine.setVolume(val);
    sendEspVolume(deviceIp, val * 100).catch(() => {});
    if (isMuted && val > 0) {
      setIsMuted(false);
      saveMuted(false);
      audioEngine.setMute(false);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    saveMuted(nextMuted);
    audioEngine.setMute(nextMuted);
    sendEspVolume(deviceIp, nextMuted ? 0 : volume * 100).catch(() => {});
  };

  const handlePlayCustomUrl = (url: string) => {
    saveCustomUrl(url);
    const customTrack: AudioTrack = {
      id: `custom-${Date.now()}`,
      name: 'Custom Direct HTTP Stream',
      category: 'radio',
      description: url,
      url: url,
      codec: url.toLowerCase().endsWith('.flac') ? 'FLAC' :
             url.toLowerCase().endsWith('.aac') ? 'AAC' :
             url.toLowerCase().endsWith('.opus') ? 'Opus' :
             url.toLowerCase().endsWith('.wav') ? 'WAV' : 'MP3',
      bitrate: 'Auto-Detect',
      sampleRate: '44.1 kHz'
    };
    handlePlayTrack(customTrack);
  };

  // Wi-Fi Config Handler
  const handleSaveWifi = (cfg: WiFiConfig) => {
    setWifiConfig(cfg);
    saveWiFi(cfg);
    localStorage.setItem('hifi_wifi_configured', 'true');
    setShowStartupWifiBanner(false);
    sendEspWifiConfig(deviceIp, cfg.staSsid, cfg.staPassword).catch(() => {});
    setServices((prev) => ({
      ...prev,
      wifi: {
        ...prev.wifi,
        apSsid: cfg.apSsid,
        apEnabled: cfg.apKeepOpen,
        staSsid: cfg.staSsid,
        staConnected: true,
        mdnsHost: cfg.mdnsHost
      }
    }));
  };

  const handleDismissStartupWifi = () => {
    localStorage.setItem('hifi_wifi_configured', 'true');
    setShowStartupWifiBanner(false);
  };

  // OTA Firmware Handler
  const handleUpdateOta = (state: OTAState) => {
    setOtaState(state);
    saveOta(state);
  };

  // Simulation Triggers for AirPlay & DLNA
  const handleToggleAirPlaySim = () => {
    const next = !services.airplay2.activeStreaming;
    if (next) {
      audioEngine.pause();
      setIsPlaying(false);
    }
    setServices((prev) => ({
      ...prev,
      airplay2: { ...prev.airplay2, activeStreaming: next },
      dlna: { ...prev.dlna, activeStreaming: false },
      httpStream: { ...prev.httpStream, active: false }
    }));
  };

  const handleToggleDlnaSim = () => {
    const next = !services.dlna.activeStreaming;
    if (next) {
      audioEngine.pause();
      setIsPlaying(false);
    }
    setServices((prev) => ({
      ...prev,
      dlna: { ...prev.dlna, activeStreaming: next },
      airplay2: { ...prev.airplay2, activeStreaming: false },
      httpStream: { ...prev.httpStream, active: false }
    }));
  };

  return (
    <div className="min-h-screen bg-[#040406] text-zinc-200 pb-16">
      
      {/* Top Application Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#000000]/95 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-black rounded-[11px] flex items-center justify-center text-cyan-400">
                <Radio className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold text-white tracking-tight">
                  ESP32-S3 Hi-Fi
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                  N16R8 • UDA1334A
                </span>
              </div>
            </div>
          </div>

          {/* Primary View Switcher */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
            <button
              id="tab-view-controller"
              onClick={() => setActiveView('controller')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeView === 'controller'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Player</span>
            </button>

            <button
              id="tab-view-builds"
              onClick={() => setActiveView('builds')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeView === 'builds'
                  ? 'bg-cyan-500 text-black shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Binaries</span>
            </button>

            <button
              id="tab-view-github"
              onClick={() => setActiveView('github')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeView === 'github'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Repo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
        
        {/* Startup Wi-Fi Setup Banner (Only shown on startup, dismissible) */}
        {showStartupWifiBanner && (
          <div className="p-3 bg-gradient-to-r from-cyan-950/40 via-zinc-950 to-zinc-950 rounded-xl border border-cyan-800/50 flex items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-white">Wi-Fi Setup:</strong> Connect your ESP32-S3 to home Wi-Fi for AirPlay 2 & DLNA audio streaming.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWifiModalOpen(true)}
                className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-xs transition active:scale-95 shadow-sm"
              >
                Configure
              </button>
              <button
                onClick={handleDismissStartupWifi}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Hardware Link Status Bar (Target ESP32 IP & Live Sync Status) */}
        <div className="bg-[#08080a] border border-zinc-800/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isHardwareOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-medium text-zinc-300">
              {isHardwareOnline ? (
                <span>
                  <strong className="text-white">ESP32-S3 Online:</strong> Synced with hardware at{' '}
                  <span className="font-mono text-cyan-300">{deviceIp || 'direct host'}</span>
                </span>
              ) : (
                <span>
                  <strong className="text-zinc-200">Hardware Standby:</strong> Target ESP32 IP{' '}
                  <span className="font-mono text-zinc-400">{deviceIp || 'direct host'}</span>
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isEditingIp ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  placeholder="e.g. http://192.168.254.112"
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 w-48"
                />
                <button
                  onClick={() => {
                    const clean = ipInput.trim();
                    setDeviceIp(clean);
                    saveDeviceIp(clean);
                    setIsEditingIp(false);
                  }}
                  className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-xs transition"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIpInput(deviceIp);
                    setIsEditingIp(false);
                  }}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsEditingIp(true)}
                  className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[11px] transition"
                >
                  Change IP
                </button>
                <button
                  onClick={() => {
                    const ap = 'http://192.168.4.1';
                    setDeviceIp(ap);
                    saveDeviceIp(ap);
                    setIpInput(ap);
                  }}
                  title="Connect via SoftAP (192.168.4.1)"
                  className="px-2 py-1 rounded-lg border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 text-[10px] font-mono transition"
                >
                  SoftAP
                </button>
                <button
                  onClick={() => {
                    const sta = 'http://192.168.254.112';
                    setDeviceIp(sta);
                    saveDeviceIp(sta);
                    setIpInput(sta);
                  }}
                  title="Connect via Station IP (192.168.254.112)"
                  className="px-2 py-1 rounded-lg border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 text-[10px] font-mono transition"
                >
                  Home IP
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Minimal Hi-Fi Status Header (Status icons limited to clean toolbar) */}
        <MinimalStatusHeader
          services={services}
          activeSourceTitle={currentTrack?.name || 'Idle'}
          isPlaying={isPlaying}
          onOpenWifiModal={() => setIsWifiModalOpen(true)}
          onOpenAirPlayModal={() => setIsAirPlayModalOpen(true)}
          onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
          onOpenOtaModal={() => setIsOtaModalOpen(true)}
        />

        {/* View 1: AMOLED Hi-Fi Player (Clean, Uncluttered, Minimal Design) */}
        {activeView === 'controller' && (
          <div className="space-y-4">
            
            {/* Playback Controls Deck: VU Meters, Transport, Volume */}
            <TopControls
              isPlaying={isPlaying}
              isPaused={isPaused}
              currentTrack={currentTrack}
              volume={volume}
              isMuted={isMuted}
              vuLeft={vuLeft}
              vuRight={vuRight}
              onPlayPause={handlePlayPause}
              onStop={handleStop}
              onPrev={handlePrev}
              onNext={handleNext}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleToggleMute}
            />

            {/* Clean 2-Column Bento: Stream Selector & 3-Band DSP Equalizer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-6">
                <StreamSelectorTile
                  tracks={CURATED_TRACKS}
                  selectedTrack={currentTrack}
                  onSelectTrack={handlePlayTrack}
                  customUrl={customUrl}
                  onCustomUrlChange={setCustomUrl}
                  onPlayCustomUrl={handlePlayCustomUrl}
                />
              </div>
              <div className="lg:col-span-6">
                <DspEqTile
                  eq={dspEq}
                  onChangeEq={handleEqChange}
                  onSelectPreset={handleSelectPreset}
                />
              </div>
            </div>

          </div>
        )}

        {/* View 2: Firmware Binaries (merged.bin, bootloader, app) */}
        {activeView === 'builds' && (
          <div className="space-y-4">
            <FirmwareBuildsCard />
          </div>
        )}

        {/* View 3: Complete GitHub Repository */}
        {activeView === 'github' && (
          <div className="space-y-4">
            <FirmwareBuildsCard />
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>
                  Official ESP-IDF v5.2 / FreeRTOS GitHub project repository for ESP32-S3 N16R8.
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold hidden md:inline">
                Clean Modular Architecture
              </span>
            </div>
            <GitHubRepoExplorer files={GITHUB_REPO_FILES} />
          </div>
        )}

      </main>

      {/* Interactive Secondary Modals */}
      <WifiModal
        isOpen={isWifiModalOpen}
        onClose={() => setIsWifiModalOpen(false)}
        wifiConfig={wifiConfig}
        onSaveWifiConfig={handleSaveWifi}
        isStaConnected={services.wifi.staConnected}
        staIp={services.wifi.staIp}
        staRssi={services.wifi.staRssi}
      />

      <AirPlayDlnaModal
        isOpen={isAirPlayModalOpen}
        onClose={() => setIsAirPlayModalOpen(false)}
        services={services}
        onSimulateAirPlay={handleToggleAirPlaySim}
        onSimulateDlna={handleToggleDlnaSim}
      />

      <HardwareModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        services={services}
      />

      <OtaModal
        isOpen={isOtaModalOpen}
        onClose={() => setIsOtaModalOpen(false)}
        otaState={otaState}
        onUpdateOtaState={handleUpdateOta}
      />

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 text-center text-xs text-zinc-600 font-mono">
        ESP32-S3 N16R8 • UDA1334A I2S DAC • AirPlay 2 • DLNA • DSP Equalizer
      </footer>
    </div>
  );
}
