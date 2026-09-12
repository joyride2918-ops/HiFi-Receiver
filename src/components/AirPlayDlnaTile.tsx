import React from 'react';
import { 
  Airplay, 
  Cast, 
  Radio, 
  Server, 
  CheckCircle2, 
  Activity, 
  Terminal,
  Smartphone
} from 'lucide-react';
import { LiveServicesState } from '../types';

interface AirPlayDlnaTileProps {
  services: LiveServicesState;
  onSimulateAirPlay: () => void;
  onSimulateDlna: () => void;
}

export const AirPlayDlnaTile: React.FC<AirPlayDlnaTileProps> = ({
  services,
  onSimulateAirPlay,
  onSimulateDlna
}) => {
  return (
    <div id="tile-airplay-dlna" className="bg-[#080808] border border-zinc-800/80 rounded-2xl p-4 md:p-5 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">AirPlay 2 & DLNA 24/7 Servers</h3>
            <p className="text-[11px] text-zinc-400">Background RAOP RTSP & UPnP MediaRenderer</p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
          <Activity className="w-3 h-3 text-emerald-400" />
          24*7 DAEMONS RUNNING
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* AirPlay 2 Daemon Card */}
        <div className={`p-3.5 rounded-xl border transition ${
          services.airplay2.activeStreaming 
            ? 'bg-cyan-950/30 border-cyan-500/50' 
            : 'bg-zinc-950 border-zinc-800/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-zinc-200">
              <Airplay className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold">Apple AirPlay 2 / RAOP</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              services.airplay2.activeStreaming ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {services.airplay2.activeStreaming ? 'STREAMING' : 'LISTENING'}
            </span>
          </div>

          <div className="space-y-1 text-[11px] font-mono text-zinc-400">
            <div>mDNS: <span className="text-zinc-200">_raop._tcp / _airplay._tcp</span></div>
            <div>RTSP Socket: <span className="text-zinc-200">TCP :7000 (Session)</span></div>
            <div>RTP Stream: <span className="text-zinc-200">UDP :5000 (ALAC/PCM)</span></div>
            <div>Latency: <span className="text-zinc-200">2205 frames (~50ms)</span></div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">
              {services.airplay2.activeStreaming ? services.airplay2.clientName : 'Ready for iPhone/Mac/iPad'}
            </span>
            <button
              id="btn-test-airplay-session"
              onClick={onSimulateAirPlay}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition ${
                services.airplay2.activeStreaming
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-zinc-900 border-zinc-700 text-cyan-300 hover:bg-zinc-800'
              }`}
            >
              {services.airplay2.activeStreaming ? 'Disconnect AirPlay' : 'Simulate AirPlay Link'}
            </button>
          </div>
        </div>

        {/* DLNA / UPnP Daemon Card */}
        <div className={`p-3.5 rounded-xl border transition ${
          services.dlna.activeStreaming 
            ? 'bg-purple-950/30 border-purple-500/50' 
            : 'bg-zinc-950 border-zinc-800/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-zinc-200">
              <Cast className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold">DLNA / UPnP Renderer</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              services.dlna.activeStreaming ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {services.dlna.activeStreaming ? 'STREAMING' : 'LISTENING'}
            </span>
          </div>

          <div className="space-y-1 text-[11px] font-mono text-zinc-400">
            <div>Discovery: <span className="text-zinc-200">SSDP 239.255.255.250:1900</span></div>
            <div>Control Port: <span className="text-zinc-200">HTTP :49152</span></div>
            <div>Service: <span className="text-zinc-200">urn:schemas-upnp-org:device:MediaRenderer:1</span></div>
            <div>Protocols: <span className="text-zinc-200">AVTransport, RenderingControl</span></div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">
              {services.dlna.activeStreaming ? 'Streaming from BubbleUPnP' : 'Ready for BubbleUPnP / Foobar'}
            </span>
            <button
              id="btn-test-dlna-session"
              onClick={onSimulateDlna}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition ${
                services.dlna.activeStreaming
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-zinc-900 border-zinc-700 text-purple-300 hover:bg-zinc-800'
              }`}
            >
              {services.dlna.activeStreaming ? 'Disconnect DLNA' : 'Simulate DLNA Link'}
            </button>
          </div>
        </div>
      </div>

      {/* Protocol Coexistence Info */}
      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Both AirPlay 2 and DLNA run as separate FreeRTOS non-blocking tasks. When a stream starts from either protocol, the ESP-IDF audio pipeline automatically acquires the I2S master mutex, adjusts the sample rate (44.1kHz or 48kHz), and streams to the UDA1334A DAC with zero popping.
        </p>
      </div>
    </div>
  );
};
