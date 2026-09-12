import React from 'react';
import { 
  Airplay, 
  Cast, 
  Wifi, 
  Cpu, 
  UploadCloud, 
  Radio,
  Music2,
  Volume2,
  Activity
} from 'lucide-react';
import { LiveServicesState } from '../types';

interface MinimalStatusHeaderProps {
  services: LiveServicesState;
  activeSourceTitle: string;
  isPlaying: boolean;
  onOpenWifiModal: () => void;
  onOpenAirPlayModal: () => void;
  onOpenHardwareModal: () => void;
  onOpenOtaModal: () => void;
}

export const MinimalStatusHeader: React.FC<MinimalStatusHeaderProps> = ({
  services,
  activeSourceTitle,
  isPlaying,
  onOpenWifiModal,
  onOpenAirPlayModal,
  onOpenHardwareModal,
  onOpenOtaModal
}) => {
  const isAirPlayActive = services.airplay2.activeStreaming;
  const isDlnaActive = services.dlna.activeStreaming;
  const isHttpActive = isPlaying && !isAirPlayActive && !isDlnaActive;

  return (
    <div id="minimal-status-header" className="w-full bg-[#08080a] border border-zinc-800/80 rounded-2xl px-4 py-3 md:px-5 md:py-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3">
      
      {/* Left: Device & Audio Engine Status */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600/20 to-emerald-500/20 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
          <Radio className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight">ESP32-S3 Hi-Fi</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800">
              UDA1334A • 24b/44.1kHz
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying || isAirPlayActive || isDlnaActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="font-mono text-zinc-300">
                {isAirPlayActive ? 'AirPlay 2 (ALAC)' : isDlnaActive ? 'DLNA / UPnP' : isHttpActive ? activeSourceTitle : 'Standby / 24*7 Ready'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Minimal Status Icons Toolbar (Clickable to open dedicated modals) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        
        {/* 1. Apple AirPlay 2 Icon Button */}
        <button
          id="btn-status-airplay"
          onClick={onOpenAirPlayModal}
          title={isAirPlayActive ? 'AirPlay 2 Active Streaming' : 'AirPlay 2 Ready (Click to inspect)'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition active:scale-95 ${
            isAirPlayActive
              ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300 shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-500/30'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <Airplay className={`w-4 h-4 ${isAirPlayActive ? 'text-cyan-400 animate-pulse' : ''}`} />
          <span className="hidden sm:inline text-[11px]">AirPlay</span>
          {isAirPlayActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
        </button>

        {/* 2. DLNA / UPnP Icon Button */}
        <button
          id="btn-status-dlna"
          onClick={onOpenAirPlayModal}
          title={isDlnaActive ? 'DLNA Active Streaming' : 'DLNA Ready (Click to inspect)'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition active:scale-95 ${
            isDlnaActive
              ? 'bg-purple-950/60 border-purple-500/80 text-purple-300 shadow-sm shadow-purple-500/20 ring-1 ring-purple-500/30'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <Cast className={`w-4 h-4 ${isDlnaActive ? 'text-purple-400 animate-pulse' : ''}`} />
          <span className="hidden sm:inline text-[11px]">DLNA</span>
          {isDlnaActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />}
        </button>

        {/* 3. Wi-Fi Status & Setup Icon Button */}
        <button
          id="btn-status-wifi"
          onClick={onOpenWifiModal}
          title={`Wi-Fi: ${services.wifi.staConnected ? services.wifi.staSsid : 'Not Connected'} (Click to configure)`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition active:scale-95 text-xs font-mono"
        >
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline text-[11px] truncate max-w-[100px]">
            {services.wifi.staConnected ? services.wifi.staSsid || 'Connected' : 'Wi-Fi'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </button>

        {/* 4. Hardware Specs Icon Button */}
        <button
          id="btn-status-hardware"
          onClick={onOpenHardwareModal}
          title="ESP32-S3 & DAC Hardware Pinouts"
          className="p-2 rounded-xl border bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition active:scale-95"
        >
          <Cpu className="w-4 h-4" />
        </button>

        {/* 5. OTA Firmware Update Icon Button */}
        <button
          id="btn-status-ota"
          onClick={onOpenOtaModal}
          title="Dual-Bank OTA Firmware Flasher"
          className="p-2 rounded-xl border bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
        </button>

      </div>

    </div>
  );
};
