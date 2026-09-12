import React from 'react';
import { 
  Cpu, 
  Layers, 
  HardDrive, 
  Terminal, 
  Zap, 
  ShieldCheck, 
  Radio,
  CheckCircle2
} from 'lucide-react';
import { LiveServicesState } from '../types';

interface HardwareSpecsTileProps {
  services: LiveServicesState;
}

export const HardwareSpecsTile: React.FC<HardwareSpecsTileProps> = ({ services }) => {
  return (
    <div id="tile-hardware-specs" className="bg-[#080808] border border-zinc-800/80 rounded-2xl p-4 md:p-5 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">ESP32-S3 & DAC Hardware Pinout</h3>
            <p className="text-[11px] text-zinc-400">N16R8 Octal PSRAM + UDA1334A I2S Wiring</p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
          OCTAL 80MHz SPI
        </span>
      </div>

      {/* Pinout Table */}
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase">
                <th className="pb-1.5 font-semibold">UDA1334A Pin</th>
                <th className="pb-1.5 font-semibold">ESP32-S3 Pin</th>
                <th className="pb-1.5 font-semibold">Signal & Function</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
              <tr>
                <td className="py-1.5 font-bold text-cyan-400">BCLK</td>
                <td className="py-1.5 text-zinc-200">GPIO 14</td>
                <td className="py-1.5 text-zinc-400">I2S Bit Clock (Serial Clock)</td>
              </tr>
              <tr>
                <td className="py-1.5 font-bold text-cyan-400">WSEL / LRCLK</td>
                <td className="py-1.5 text-zinc-200">GPIO 15</td>
                <td className="py-1.5 text-zinc-400">I2S Word Select (Left/Right)</td>
              </tr>
              <tr>
                <td className="py-1.5 font-bold text-cyan-400">DIN / DATA</td>
                <td className="py-1.5 text-zinc-200">GPIO 16</td>
                <td className="py-1.5 text-zinc-400">I2S Serial Audio Data In</td>
              </tr>
              <tr>
                <td className="py-1.5 font-bold text-emerald-400">VIN</td>
                <td className="py-1.5 text-zinc-200">3V3 / 5V</td>
                <td className="py-1.5 text-zinc-400">Clean Regulated Power Supply</td>
              </tr>
              <tr>
                <td className="py-1.5 font-bold text-zinc-400">GND</td>
                <td className="py-1.5 text-zinc-200">GND</td>
                <td className="py-1.5 text-zinc-400">Common Ground Plane</td>
              </tr>
              <tr>
                <td className="py-1.5 text-zinc-500">MCLK</td>
                <td className="py-1.5 text-zinc-500">GND / Open</td>
                <td className="py-1.5 text-zinc-500">Internal PLL Enabled (No MCLK required)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Memory & System Telemetry */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
          <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-mono block">8MB OCTAL PSRAM</span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              6.8 MB Free / 1024KB Ringbuf
            </span>
          </div>
          <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-mono block">CPU DUAL-CORE LX7</span>
            <span className="text-xs font-mono font-bold text-emerald-300">
              240 MHz • 41.8°C
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
