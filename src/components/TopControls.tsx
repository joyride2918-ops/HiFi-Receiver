import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Volume1,
  Activity,
  Disc3
} from 'lucide-react';
import { AudioTrack } from '../types';

interface TopControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentTrack: AudioTrack | null;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  vuLeft: number; // 0.0 to 1.0
  vuRight: number; // 0.0 to 1.0
  onPlayPause: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
}

export const TopControls: React.FC<TopControlsProps> = ({
  isPlaying,
  isPaused,
  currentTrack,
  volume,
  isMuted,
  vuLeft,
  vuRight,
  onPlayPause,
  onStop,
  onPrev,
  onNext,
  onVolumeChange,
  onToggleMute
}) => {
  const volumePercent = Math.round((isMuted ? 0 : volume) * 100);

  return (
    <div id="top-playback-controls" className="w-full bg-[#080808] border border-zinc-800/80 rounded-2xl p-4 md:p-5 shadow-xl">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
        
        {/* Current Track / Stream Info Display */}
        <div className="flex items-center gap-3.5 w-full lg:w-auto min-w-[240px]">
          <div className="relative flex-shrink-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
              isPlaying 
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-400 shadow-md shadow-cyan-500/20' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}>
              <Disc3 className={`w-6 h-6 ${isPlaying ? 'animate-spin-slow' : ''}`} />
            </div>
            {isPlaying && (
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#080808] rounded-full" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-semibold text-zinc-100 truncate">
                {currentTrack?.name || 'No Audio Stream Selected'}
              </h2>
              {currentTrack?.codec && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                  {currentTrack.codec}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {currentTrack?.bitrate ? `${currentTrack.bitrate} • ` : ''}
              {currentTrack?.sampleRate ? `${currentTrack.sampleRate} • ` : ''}
              {isPlaying ? 'Streaming to UDA1334A DAC' : 'Playback stopped'}
            </p>
          </div>
        </div>

        {/* Core Media Buttons (Pre, Play/Pause, Stop, Next) */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Previous Track Button */}
          <button
            id="btn-prev-track"
            onClick={onPrev}
            className="w-11 h-11 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition active:scale-95 shadow-sm"
            title="Previous Stream / Track"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            id="btn-play-pause"
            onClick={onPlayPause}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg ${
              isPlaying
                ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/25 ring-4 ring-cyan-500/20'
                : 'bg-zinc-100 hover:bg-white text-black shadow-white/10 ring-4 ring-white/10'
            }`}
            title={isPlaying ? 'Pause Audio' : 'Play Audio'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Stop Button */}
          <button
            id="btn-stop-track"
            onClick={onStop}
            className="w-11 h-11 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-rose-400 border border-zinc-800 flex items-center justify-center transition active:scale-95 shadow-sm"
            title="Stop Playback"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          {/* Next Track Button */}
          <button
            id="btn-next-track"
            onClick={onNext}
            className="w-11 h-11 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition active:scale-95 shadow-sm"
            title="Next Stream / Track"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Volume & Stereo VU Meter Section */}
        <div className="flex items-center gap-5 w-full lg:w-auto justify-between lg:justify-end">
          {/* Dual Channel VU Meters (L & R) */}
          <div className="flex flex-col gap-1.5 w-28 md:w-36 bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span className="flex items-center gap-1">
                <Activity className="w-2.5 h-2.5 text-cyan-400" />
                VU L/R
              </span>
              <span className={isPlaying ? 'text-emerald-400' : 'text-zinc-600'}>
                {isPlaying ? 'ACTIVE' : '0 dB'}
              </span>
            </div>
            {/* Left Channel Meter */}
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-rose-500 transition-all duration-75 rounded-full"
                style={{ width: `${Math.min(100, Math.max(2, vuLeft * 100))}%` }}
              />
            </div>
            {/* Right Channel Meter */}
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-rose-500 transition-all duration-75 rounded-full"
                style={{ width: `${Math.min(100, Math.max(2, vuRight * 100))}%` }}
              />
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2.5">
            <button
              id="btn-volume-mute"
              onClick={onToggleMute}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volumePercent === 0 ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : volumePercent < 50 ? (
                <Volume1 className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <input
                id="slider-master-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-24 md:w-32 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-xs font-mono font-bold text-zinc-300 w-8 text-right">
                {volumePercent}%
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
