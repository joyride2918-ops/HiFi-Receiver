import React from 'react';
import { Airplay, Cast, X, Activity, Server, Radio, Smartphone } from 'lucide-react';
import { LiveServicesState } from '../types';

interface AirPlayDlnaModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: LiveServicesState;
  onSimulateAirPlay: () => void;
  onSimulateDlna: () => void;
}

export const AirPlayDlnaModal: React.FC<AirPlayDlnaModalProps> = ({
  isOpen,
  onClose,
  services,
  onSimulateAirPlay,
  onSimulateDlna
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <Airplay className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Wireless Streaming Services</h2>
              <p className="text-xs text-zinc-400">AirPlay 2 (RAOP) & DLNA / UPnP MediaRenderer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AirPlay 2 Card */}
        <div className={`p-4 rounded-xl border mb-3 transition ${
          services.airplay2.activeStreaming 
            ? 'bg-cyan-950/30 border-cyan-500/50' 
            : 'bg-zinc-950 border-zinc-800/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-zinc-200">
              <Airplay className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold">Apple AirPlay 2 Receiver (RAOP)</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              services.airplay2.activeStreaming ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {services.airplay2.activeStreaming ? 'STREAMING' : 'READY (24/7)'}
            </span>
          </div>

          <div className="text-xs text-zinc-400 space-y-1 font-mono">
            <div className="flex justify-between"><span>RTSP Control:</span> <span className="text-zinc-200">TCP :7000</span></div>
            <div className="flex justify-between"><span>RTP Audio:</span> <span className="text-zinc-200">UDP :5000 (Lossless ALAC)</span></div>
            <div className="flex justify-between"><span>Connected Client:</span> <span className="text-cyan-300">{services.airplay2.activeStreaming ? services.airplay2.clientName : 'None (Listening)'}</span></div>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-end">
            <button
              onClick={onSimulateAirPlay}
              className={`text-xs font-medium px-3 py-1 rounded-lg border transition ${
                services.airplay2.activeStreaming
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900/60'
                  : 'bg-zinc-900 border-zinc-700 text-cyan-300 hover:bg-zinc-800'
              }`}
            >
              {services.airplay2.activeStreaming ? 'Disconnect AirPlay Test' : 'Test AirPlay Link'}
            </button>
          </div>
        </div>

        {/* DLNA Card */}
        <div className={`p-4 rounded-xl border mb-5 transition ${
          services.dlna.activeStreaming 
            ? 'bg-purple-950/30 border-purple-500/50' 
            : 'bg-zinc-950 border-zinc-800/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-zinc-200">
              <Cast className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold">DLNA / UPnP MediaRenderer</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              services.dlna.activeStreaming ? 'bg-purple-500/20 text-purple-300 font-bold' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {services.dlna.activeStreaming ? 'STREAMING' : 'READY (24/7)'}
            </span>
          </div>

          <div className="text-xs text-zinc-400 space-y-1 font-mono">
            <div className="flex justify-between"><span>SSDP Discovery:</span> <span className="text-zinc-200">239.255.255.250:1900</span></div>
            <div className="flex justify-between"><span>HTTP SOAP:</span> <span className="text-zinc-200">TCP :49152 (AVTransport)</span></div>
            <div className="flex justify-between"><span>Compatible Apps:</span> <span className="text-purple-300">BubbleUPnP, mConnect, Foobar2000</span></div>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-end">
            <button
              onClick={onSimulateDlna}
              className={`text-xs font-medium px-3 py-1 rounded-lg border transition ${
                services.dlna.activeStreaming
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900/60'
                  : 'bg-zinc-900 border-zinc-700 text-purple-300 hover:bg-zinc-800'
              }`}
            >
              {services.dlna.activeStreaming ? 'Disconnect DLNA Test' : 'Test DLNA Link'}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
