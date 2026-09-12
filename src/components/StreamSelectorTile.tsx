import React, { useState } from 'react';
import { 
  Radio, 
  Sparkles, 
  Link, 
  Music, 
  Play, 
  ChevronDown, 
  Check, 
  Headphones,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { AudioTrack } from '../types';

interface StreamSelectorTileProps {
  tracks: AudioTrack[];
  selectedTrack: AudioTrack | null;
  onSelectTrack: (track: AudioTrack) => void;
  customUrl: string;
  onCustomUrlChange: (url: string) => void;
  onPlayCustomUrl: (url: string) => void;
}

export const StreamSelectorTile: React.FC<StreamSelectorTileProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  customUrl,
  onCustomUrlChange,
  onPlayCustomUrl
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dropdown' | 'custom'>('dropdown');

  const radioTracks = tracks.filter((t) => t.category === 'radio');
  const trialTracks = tracks.filter((t) => t.category === 'trial');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onPlayCustomUrl(customUrl.trim());
    }
  };

  const getCodecColor = (codec: string) => {
    switch (codec) {
      case 'FLAC': return 'text-amber-400 bg-amber-950/60 border-amber-800/40';
      case 'Opus': return 'text-purple-400 bg-purple-950/60 border-purple-800/40';
      case 'AAC': return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40';
      case 'WAV': return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40';
      default: return 'text-zinc-300 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div id="tile-stream-selector" className="bg-[#080808] border border-zinc-800/80 rounded-2xl p-4 md:p-5 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Audio Sources & Codecs</h3>
            <p className="text-[11px] text-zinc-400">Mixed Radios, Trial Codecs, or Direct Links</p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-0.5 bg-zinc-950 rounded-lg border border-zinc-800">
          <button
            id="tab-select-library"
            onClick={() => setActiveTab('dropdown')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              activeTab === 'dropdown'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Library Dropdown
          </button>
          <button
            id="tab-select-custom"
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              activeTab === 'custom'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Direct HTTP/HTTPS
          </button>
        </div>
      </div>

      {activeTab === 'dropdown' ? (
        <div className="space-y-4">
          {/* Main Dropdown Trigger */}
          <div className="relative">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Select Preset Stream or Benchmark Audio:
            </label>
            <button
              id="btn-track-dropdown-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-3.5 py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                  selectedTrack?.category === 'radio' ? 'bg-cyan-950 text-cyan-400' : 'bg-amber-950 text-amber-400'
                }`}>
                  {selectedTrack?.category === 'radio' ? <Radio className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                </div>
                <div className="truncate">
                  <span className="text-sm font-semibold text-zinc-100 block truncate">
                    {selectedTrack?.name || 'Choose stream...'}
                  </span>
                  <span className="text-[11px] text-zinc-500 truncate block">
                    {selectedTrack?.description}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                {selectedTrack && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getCodecColor(selectedTrack.codec)}`}>
                    {selectedTrack.codec}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute z-30 left-0 right-0 mt-2 bg-[#0d0d0d] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
                {/* Category: Mixed Radios */}
                <div className="p-2">
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Radio className="w-3 h-3" />
                    Curated Mixed Radios
                  </div>
                  {radioTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        onSelectTrack(track);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition my-0.5 ${
                        selectedTrack?.id === track.id
                          ? 'bg-cyan-950/40 text-cyan-200 border border-cyan-800/40'
                          : 'hover:bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-medium truncate text-zinc-200">{track.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{track.description}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getCodecColor(track.codec)}`}>
                          {track.codec}
                        </span>
                        {selectedTrack?.id === track.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Category: Trial Audios & Benchmarks */}
                <div className="p-2">
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Trial Audios & Codec Benchmarks
                  </div>
                  {trialTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        onSelectTrack(track);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition my-0.5 ${
                        selectedTrack?.id === track.id
                          ? 'bg-amber-950/40 text-amber-200 border border-amber-800/40'
                          : 'hover:bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-medium truncate text-zinc-200">{track.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{track.description}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getCodecColor(track.codec)}`}>
                          {track.codec}
                        </span>
                        {selectedTrack?.id === track.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Selection Pills */}
          <div>
            <div className="text-[11px] font-medium text-zinc-400 mb-1.5 flex items-center justify-between">
              <span>Quick Station Selectors:</span>
              <span className="text-[10px] text-zinc-500 font-mono">1-Click Switch</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {tracks.slice(0, 6).map((track) => (
                <button
                  key={track.id}
                  onClick={() => onSelectTrack(track)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left truncate transition ${
                    selectedTrack?.id === track.id
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-sm'
                      : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <span className="truncate block">{track.name.split(':')[1] || track.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Direct HTTP/HTTPS Playable Form */
        <form onSubmit={handleCustomSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="input-custom-url" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Direct Audio Stream URL (HTTP/HTTPS/Icecast/HLS):
            </label>
            <div className="relative">
              <input
                id="input-custom-url"
                type="url"
                required
                placeholder="https://icecast.example.com/live-stream.mp3"
                value={customUrl}
                onChange={(e) => onCustomUrlChange(e.target.value)}
                className="w-full pl-9 pr-24 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <Link className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <button
                type="submit"
                id="btn-play-custom-url"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-lg flex items-center gap-1 transition active:scale-95"
              >
                <Play className="w-3 h-3 fill-current" />
                Play URL
              </button>
            </div>
          </div>

          {/* Supported Codec Badges */}
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
            <div className="text-[11px] font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
              <Info className="w-3 h-3 text-cyan-400" />
              Hardware SIMD & ESP-ADF Decoders Ready:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['MP3 (320kbps)', 'AAC-LC / HE', 'FLAC 24-bit', 'Opus 48kHz', 'WAV Linear PCM', 'Ogg Vorbis'].map((codec) => (
                <span key={codec} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700/60 text-zinc-300">
                  {codec}
                </span>
              ))}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
