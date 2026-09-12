import React from 'react';
import { LiveServicesState } from '../types';
import { 
  Wifi, 
  Cast, 
  Radio, 
  Cpu, 
  HardDrive, 
  Airplay, 
  CheckCircle2, 
  Layers,
  Copy,
  Check
} from 'lucide-react';

interface MainBannerProps {
  services: LiveServicesState;
  activeSourceTitle: string;
  isPlaying: boolean;
}

export const MainBanner: React.FC<MainBannerProps> = ({
  services,
  activeSourceTitle,
  isPlaying
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyMdns = () => {
    navigator.clipboard.writeText(`http://${services.wifi.mdnsHost}.local`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAirPlayActive = services.airplay2.activeStreaming;
  const isDlnaActive = services.dlna.activeStreaming;
  const isHttpActive = isPlaying && !isAirPlayActive && !isDlnaActive;

  return (
    <div id="main-services-banner" className="w-full bg-[#000000] border border-zinc-800/80 rounded-2xl p-4 md:p-5 shadow-2xl relative overflow-hidden">
      {/* Background subtle mesh glow */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-cyan-500/10 via-emerald-500/5 to-transparent pointer-events-none blur-3xl -mr-20 -mt-10" />

      {/* Top Bar: Model, Health, Active Audio Stream Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/70 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-cyan-400 shadow-inner">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-zinc-100 tracking-tight">
                ESP32-S3 N16R8
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
                16MB Flash • 8MB PSRAM
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              UDA1334A I2S DAC Master • Dual-Core 240MHz • FreeRTOS 1000Hz
            </p>
          </div>
        </div>

        {/* Live Audio Source Pill */}
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3.5 py-1.5 rounded-full">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
            Active Source:
          </span>
          <div className="flex items-center gap-1.5">
            {isAirPlayActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-semibold text-cyan-300 font-mono">AirPlay 2 (Lossless ALAC)</span>
              </>
            ) : isDlnaActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-xs font-semibold text-purple-300 font-mono">DLNA / UPnP Renderer</span>
              </>
            ) : isHttpActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-300 font-mono truncate max-w-[180px] sm:max-w-[260px]">
                  {activeSourceTitle}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                <span className="text-xs font-medium text-zinc-400 font-mono">Standby (24/7 Ready)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 6 Live Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3.5 relative z-10">
        {/* Service 1: AirPlay 2 */}
        <div className={`p-2.5 rounded-xl border transition-all ${
          isAirPlayActive 
            ? 'bg-cyan-950/30 border-cyan-500/50 shadow-sm shadow-cyan-500/10' 
            : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Airplay className={`w-4 h-4 ${isAirPlayActive ? 'text-cyan-400 animate-pulse' : 'text-zinc-400'}`} />
              <span className="text-xs font-semibold tracking-tight">AirPlay 2</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
              isAirPlayActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {isAirPlayActive ? 'STREAMING' : '24/7 READY'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 leading-tight">
            RAOP: :5000 / RTSP: :7000
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
            {isAirPlayActive ? services.airplay2.clientName : 'Apple ALAC • Multiroom'}
          </div>
        </div>

        {/* Service 2: DLNA / UPnP */}
        <div className={`p-2.5 rounded-xl border transition-all ${
          isDlnaActive 
            ? 'bg-purple-950/30 border-purple-500/50 shadow-sm shadow-purple-500/10' 
            : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Cast className={`w-4 h-4 ${isDlnaActive ? 'text-purple-400 animate-pulse' : 'text-zinc-400'}`} />
              <span className="text-xs font-semibold tracking-tight">DLNA/uPnP</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
              isDlnaActive ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {isDlnaActive ? 'ACTIVE' : '24/7 READY'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 leading-tight">
            SSDP: :1900 • AVTransport
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
            BubbleUPnP • mConnect
          </div>
        </div>

        {/* Service 3: HTTP / Web Streamer */}
        <div className={`p-2.5 rounded-xl border transition-all ${
          isHttpActive 
            ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm shadow-emerald-500/10' 
            : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Radio className={`w-4 h-4 ${isHttpActive ? 'text-emerald-400 animate-spin-slow' : 'text-zinc-400'}`} />
              <span className="text-xs font-semibold tracking-tight">HTTP Stream</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
              isHttpActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {isHttpActive ? 'PLAYING' : 'IDLE'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 leading-tight">
            Codecs: MP3, AAC, FLAC
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
            PSRAM Buffer: 1024 KB
          </div>
        </div>

        {/* Service 4: Wi-Fi Dual AP + STA */}
        <div className="p-2.5 rounded-xl border bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold tracking-tight">Wi-Fi AP+STA</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
              CONCURRENT
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 leading-tight truncate">
            STA: {services.wifi.staConnected ? services.wifi.staSsid : 'Connecting...'}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
            AP: {services.wifi.apSsid} (Open)
          </div>
        </div>

        {/* Service 5: mDNS .local server */}
        <div className="p-2.5 rounded-xl border bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 transition-all group">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold tracking-tight">mDNS .local</span>
            </div>
            <button 
              onClick={copyMdns} 
              title="Copy mDNS address" 
              className="text-[10px] text-zinc-400 hover:text-cyan-300 flex items-center gap-1 p-0.5"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <div className="text-[11px] font-mono text-cyan-300 leading-tight truncate">
            {services.wifi.mdnsHost}.local
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
            IP: {services.wifi.staIp || '192.168.4.1'}
          </div>
        </div>

        {/* Service 6: UDA1334A I2S DAC */}
        <div className="p-2.5 rounded-xl border bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold tracking-tight">DAC UDA1334A</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-800 text-emerald-300">
              I2S MASTER
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 leading-tight">
            GPIO 14/15/16
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
            {services.dac.sampleRate / 1000}kHz • {services.dac.bitDepth}-Bit DMA
          </div>
        </div>
      </div>
    </div>
  );
};
