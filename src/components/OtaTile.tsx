import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  FileCode,
  HardDrive
} from 'lucide-react';
import { OTAState } from '../types';

interface OtaTileProps {
  otaState: OTAState;
  onUpdateOtaState: (state: OTAState) => void;
}

export const OtaTile: React.FC<OtaTileProps> = ({
  otaState,
  onUpdateOtaState
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startOtaFlash = (fileName: string, fileSize: number) => {
    setSelectedFileName(fileName);
    const targetPartition = otaState.currentPartition === 'ota_0' ? 'ota_1' : 'ota_0';

    onUpdateOtaState({
      ...otaState,
      isUpdating: true,
      progressPercent: 5,
      statusMessage: `Erasing sector and initiating esp_ota_begin on partition ${targetPartition}...`,
      fileSizeKb: Math.round(fileSize / 1024)
    });

    let current = 5;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 12) + 8;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        onUpdateOtaState({
          ...otaState,
          isUpdating: false,
          progressPercent: 100,
          currentPartition: targetPartition,
          nextPartition: targetPartition === 'ota_0' ? 'ota_1' : 'ota_0',
          statusMessage: `Firmware verified with SHA-256! Switched active boot partition to ${targetPartition}.`,
          firmwareVersion: 'v2.5.1-production'
        });
      } else {
        const step = current < 30 ? 'Streaming blocks via HTTP /api/ota...' :
                     current < 75 ? `Writing DMA chunks to ${targetPartition} Flash...` :
                     'Validating SHA-256 header and updating otadata partition...';
        onUpdateOtaState({
          ...otaState,
          isUpdating: true,
          progressPercent: current,
          statusMessage: step
        });
      }
    }, 250);
  };

  const handleFile = (file: File) => {
    if (file && (file.name.endsWith('.bin') || file.name.endsWith('.hex') || file.type.includes('octet-stream'))) {
      startOtaFlash(file.name, file.size);
    } else {
      // Allow even test bin files
      startOtaFlash(file.name || 'firmware-v2.5.1.bin', file.size || 2457600);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => setDragActive(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div id="tile-ota-firmware" className="bg-[#080808] border border-zinc-800/80 rounded-2xl p-4 md:p-5 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Robust Dual-Bank OTA</h3>
            <p className="text-[11px] text-zinc-400">Fail-Safe Firmware Flashing & Rollback Safeguard</p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Anti-Rollback
        </span>
      </div>

      {/* Dual Partition Map Visualization */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {/* Active Partition */}
        <div className={`p-3 rounded-xl border transition-all ${
          otaState.currentPartition === 'ota_0'
            ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
            : 'bg-zinc-950 border-zinc-800/80 text-zinc-400'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold">Partition 0 (ota_0)</span>
            {otaState.currentPartition === 'ota_0' && (
              <span className="text-[9px] font-mono bg-cyan-400 text-black font-bold px-1.5 py-0.2 rounded">
                BOOT
              </span>
            )}
          </div>
          <div className="text-[10px] text-zinc-400">Offset: 0x00020000 • Size: 6.5 MB</div>
          <div className="text-[10px] text-zinc-500 mt-1">
            {otaState.currentPartition === 'ota_0' ? 'Currently Running Image' : 'Standby Fallback'}
          </div>
        </div>

        {/* Standby / Passive Partition */}
        <div className={`p-3 rounded-xl border transition-all ${
          otaState.currentPartition === 'ota_1'
            ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
            : 'bg-zinc-950 border-zinc-800/80 text-zinc-400'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold">Partition 1 (ota_1)</span>
            {otaState.currentPartition === 'ota_1' && (
              <span className="text-[9px] font-mono bg-cyan-400 text-black font-bold px-1.5 py-0.2 rounded">
                BOOT
              </span>
            )}
          </div>
          <div className="text-[10px] text-zinc-400">Offset: 0x006A0000 • Size: 6.5 MB</div>
          <div className="text-[10px] text-zinc-500 mt-1">
            {otaState.currentPartition === 'ota_1' ? 'Currently Running Image' : 'OTA Staging Target'}
          </div>
        </div>
      </div>

      {/* Upload Drag & Drop Box */}
      <div
        id="ota-upload-dropzone"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center ${
          dragActive 
            ? 'border-cyan-400 bg-cyan-950/30' 
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".bin,.hex"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <UploadCloud className={`w-8 h-8 mb-2 ${otaState.isUpdating ? 'text-cyan-400 animate-bounce' : 'text-zinc-500'}`} />
        <div className="text-xs font-semibold text-zinc-200">
          {otaState.isUpdating 
            ? 'Flashing Firmware Binary...' 
            : selectedFileName 
            ? selectedFileName 
            : 'Click or Drag & Drop .bin Firmware File'}
        </div>
        <p className="text-[10px] text-zinc-500 mt-1">
          Target partition automatically determined via otadata table
        </p>
      </div>

      {/* Progress & Status */}
      {otaState.isUpdating && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Flashing Progress</span>
            <span className="text-cyan-400 font-bold">{otaState.progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200 rounded-full"
              style={{ width: `${otaState.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Log Box */}
      <div className="mt-3 p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-start gap-2">
        <FileCode className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="truncate">
          <span className="text-zinc-300 font-semibold block truncate">Status:</span>
          <span className="text-zinc-400 block truncate">{otaState.statusMessage}</span>
        </div>
      </div>

      {/* Test Flash Sample Action Button */}
      <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
        <span className="text-[10px] text-zinc-500">Current version: {otaState.firmwareVersion}</span>
        <button
          id="btn-simulate-ota-update"
          disabled={otaState.isUpdating}
          onClick={() => startOtaFlash('esp32s3-audio-v2.5.1.bin', 3145728)}
          className="text-[10px] font-mono px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-zinc-700 rounded-lg transition disabled:opacity-50"
        >
          Flash Test Firmware .bin
        </button>
      </div>
    </div>
  );
};
