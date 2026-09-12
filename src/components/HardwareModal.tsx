import React from 'react';
import { Cpu, X, HardDrive, CheckCircle2, Zap, Layers, Thermometer } from 'lucide-react';
import { LiveServicesState } from '../types';

interface HardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: LiveServicesState;
}

export const HardwareModal: React.FC<HardwareModalProps> = ({
  isOpen,
  onClose,
  services
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">ESP32-S3 & DAC Hardware Specs</h2>
              <p className="text-xs text-zinc-400">N16R8 SoC • NXP / Adafruit UDA1334A I2S Master</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pinout Table */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">UDA1334A I2S Wiring (Master Mode)</h3>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="text-[10px] text-zinc-500 mb-1">BCLK (Bit Clock)</div>
              <div className="text-cyan-400 font-bold text-sm">GPIO 14</div>
              <div className="text-[10px] text-zinc-500 mt-1">Pin 14</div>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="text-[10px] text-zinc-500 mb-1">WSEL / LRCLK</div>
              <div className="text-cyan-400 font-bold text-sm">GPIO 15</div>
              <div className="text-[10px] text-zinc-500 mt-1">Pin 15</div>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="text-[10px] text-zinc-500 mb-1">DIN (Data In)</div>
              <div className="text-cyan-400 font-bold text-sm">GPIO 16</div>
              <div className="text-[10px] text-zinc-500 mt-1">Pin 16</div>
            </div>
          </div>
        </div>

        {/* Memory & Chip Diagnostic Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs font-mono mb-5">
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <div className="text-[10px] text-zinc-500">Octal PSRAM (8MB)</div>
            <div className="text-emerald-400 font-bold text-sm mt-0.5">
              {(services.hardware.psramFreeKb / 1024).toFixed(1)} MB Free
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">1MB Dedicated Ringbuffer</div>
          </div>
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <div className="text-[10px] text-zinc-500">Internal SRAM Heap</div>
            <div className="text-cyan-400 font-bold text-sm mt-0.5">
              {services.hardware.heapFreeKb} KB Free
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Dual-Core 240MHz LX7</div>
          </div>
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <div className="text-[10px] text-zinc-500">Audio DMA Pipeline</div>
            <div className="text-zinc-200 font-bold text-sm mt-0.5">
              {services.dac.dmaBuffers} × {services.dac.dmaBufferSize} samples
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Zero Pop / Click Free</div>
          </div>
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <div className="text-[10px] text-zinc-500">DAC Resolution</div>
            <div className="text-purple-400 font-bold text-sm mt-0.5">
              {services.dac.sampleRate / 1000} kHz / {services.dac.bitDepth}-Bit
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Stereo Philips Standard</div>
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
