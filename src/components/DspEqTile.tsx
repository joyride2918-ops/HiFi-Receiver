import React from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Power, 
  Sparkles, 
  AudioWaveform,
  Volume2
} from 'lucide-react';
import { DspEqState, EqPreset } from '../types';
import { EQ_PRESETS } from '../data/radiosAndTrials';

interface DspEqTileProps {
  eq: DspEqState;
  onChangeEq: (newEq: DspEqState) => void;
  onSelectPreset: (preset: EqPreset) => void;
}

export const DspEqTile: React.FC<DspEqTileProps> = ({
  eq,
  onChangeEq,
  onSelectPreset
}) => {
  const handleBassChange = (val: number) => {
    onChangeEq({ ...eq, bass: val, selectedPreset: 'Custom' });
  };

  const handleMidChange = (val: number) => {
    onChangeEq({ ...eq, mid: val, selectedPreset: 'Custom' });
  };

  const handleTrebleChange = (val: number) => {
    onChangeEq({ ...eq, treble: val, selectedPreset: 'Custom' });
  };

  const handlePreampChange = (val: number) => {
    onChangeEq({ ...eq, preamp: val });
  };

  const toggleEnabled = () => {
    onChangeEq({ ...eq, enabled: !eq.enabled });
  };

  const handleReset = () => {
    onChangeEq({
      bass: 0,
      mid: 0,
      treble: 0,
      preamp: 0,
      selectedPreset: 'Flat',
      enabled: true
    });
  };

  // Generate SVG points for the combined 3-band response curve
  // Frequencies from 20 Hz to 20,000 Hz (log scale)
  const generateCurvePoints = () => {
    const points: string[] = [];
    const width = 320;
    const height = 80;
    const midY = height / 2;

    const numPoints = 32;
    for (let i = 0; i <= numPoints; i++) {
      const xRatio = i / numPoints;
      // Log frequency: 20 Hz to 20,000 Hz
      const freq = 20 * Math.pow(1000, xRatio);

      // Approximate response of peaking filters
      let gainDb = eq.enabled ? eq.preamp : 0;
      if (eq.enabled) {
        // Bass peaking around 100 Hz
        const bassDiff = Math.log10(freq / 100);
        gainDb += eq.bass / (1 + bassDiff * bassDiff * 3);

        // Mid peaking around 1000 Hz
        const midDiff = Math.log10(freq / 1000);
        gainDb += eq.mid / (1 + midDiff * midDiff * 4);

        // Treble peaking around 10000 Hz
        const trebleDiff = Math.log10(freq / 10000);
        gainDb += eq.treble / (1 + trebleDiff * trebleDiff * 3);
      }

      // Map -15dB ... +15dB to height (80px)
      const clampedDb = Math.max(-15, Math.min(15, gainDb));
      const y = midY - (clampedDb / 15) * (height / 2 - 8);
      const x = (xRatio * width);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  return (
    <div id="tile-dsp-eq" className="bg-[#080808] border border-zinc-800/80 rounded-2xl p-4 md:p-5 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              DSP 3-Band Tone EQ
              {!eq.enabled && (
                <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  BYPASS
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-400">Hardware Xtensa LX7 Floating-Point Biquad</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-eq-reset"
            onClick={handleReset}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            title="Reset to Flat 0dB"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            id="btn-eq-bypass"
            onClick={toggleEnabled}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              eq.enabled
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 shadow-sm'
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {eq.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Real-time Frequency Response Curve Visualization */}
      <div className="mb-4 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 relative">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
          <span>20 Hz</span>
          <span>100 Hz (BASS)</span>
          <span>1 kHz (MID)</span>
          <span>10 kHz (TREBLE)</span>
          <span>20 kHz</span>
        </div>
        <div className="w-full h-16 relative flex items-center">
          {/* Zero dB reference gridline */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-zinc-800 border-dashed" />
          <svg className="w-full h-full overflow-visible" viewBox="0 0 320 80" preserveAspectRatio="none">
            {/* Filled area under response curve */}
            <polygon
              points={`0,40 ${generateCurvePoints()} 320,40`}
              fill={eq.enabled ? 'rgba(6, 182, 212, 0.12)' : 'rgba(113, 113, 122, 0.05)'}
            />
            {/* Response Curve Line */}
            <polyline
              points={generateCurvePoints()}
              fill="none"
              stroke={eq.enabled ? '#06b6d4' : '#52525b'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1 font-mono">
          <span>+12 dB</span>
          <span className="text-cyan-400 font-bold">Preset: {eq.selectedPreset}</span>
          <span>-12 dB</span>
        </div>
      </div>

      {/* 3 Main Sliders: Bass, Mid, Treble */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Bass Slider (100 Hz) */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 text-center flex flex-col items-center">
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">BASS</span>
          <span className="text-[10px] text-zinc-500 font-mono">100 Hz</span>
          <div className="h-28 flex items-center justify-center my-2">
            <input
              id="slider-eq-bass"
              type="range"
              min="-12"
              max="12"
              step="0.5"
              disabled={!eq.enabled}
              value={eq.bass}
              onChange={(e) => handleBassChange(parseFloat(e.target.value))}
              className="h-24 w-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 [writing-mode:vertical-lr] [direction:rtl]"
            />
          </div>
          <span className={`text-xs font-mono font-bold ${eq.bass > 0 ? 'text-cyan-400' : eq.bass < 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
            {eq.bass > 0 ? `+${eq.bass.toFixed(1)}` : eq.bass.toFixed(1)} dB
          </span>
        </div>

        {/* Mid Slider (1000 Hz) */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 text-center flex flex-col items-center">
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">MID</span>
          <span className="text-[10px] text-zinc-500 font-mono">1 kHz</span>
          <div className="h-28 flex items-center justify-center my-2">
            <input
              id="slider-eq-mid"
              type="range"
              min="-12"
              max="12"
              step="0.5"
              disabled={!eq.enabled}
              value={eq.mid}
              onChange={(e) => handleMidChange(parseFloat(e.target.value))}
              className="h-24 w-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 [writing-mode:vertical-lr] [direction:rtl]"
            />
          </div>
          <span className={`text-xs font-mono font-bold ${eq.mid > 0 ? 'text-cyan-400' : eq.mid < 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
            {eq.mid > 0 ? `+${eq.mid.toFixed(1)}` : eq.mid.toFixed(1)} dB
          </span>
        </div>

        {/* Treble Slider (10000 Hz) */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 text-center flex flex-col items-center">
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">TREBLE</span>
          <span className="text-[10px] text-zinc-500 font-mono">10 kHz</span>
          <div className="h-28 flex items-center justify-center my-2">
            <input
              id="slider-eq-treble"
              type="range"
              min="-12"
              max="12"
              step="0.5"
              disabled={!eq.enabled}
              value={eq.treble}
              onChange={(e) => handleTrebleChange(parseFloat(e.target.value))}
              className="h-24 w-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 [writing-mode:vertical-lr] [direction:rtl]"
            />
          </div>
          <span className={`text-xs font-mono font-bold ${eq.treble > 0 ? 'text-cyan-400' : eq.treble < 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
            {eq.treble > 0 ? `+${eq.treble.toFixed(1)}` : eq.treble.toFixed(1)} dB
          </span>
        </div>
      </div>

      {/* Preset Pills */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Tone Presets:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EQ_PRESETS.map((p) => {
            const isSelected = eq.selectedPreset === p.name;
            return (
              <button
                key={p.name}
                id={`preset-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => onSelectPreset(p)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-sm'
                    : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
