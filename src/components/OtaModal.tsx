import React, { useState } from 'react';
import { UploadCloud, X, Check, AlertTriangle, RotateCcw, ShieldCheck, HardDrive } from 'lucide-react';
import { OTAState } from '../types';

interface OtaModalProps {
  isOpen: boolean;
  onClose: () => void;
  otaState: OTAState;
  onUpdateOtaState: (state: OTAState) => void;
}

export const OtaModal: React.FC<OtaModalProps> = ({
  isOpen,
  onClose,
  otaState,
  onUpdateOtaState
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleSimulateFlash = () => {
    setIsUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          const nextSlot = otaState.runningPartition === 'ota_0' ? 'ota_1' : 'ota_0';
          onUpdateOtaState({
            ...otaState,
            runningPartition: nextSlot,
            nextUpdatePartition: nextSlot === 'ota_0' ? 'ota_1' : 'ota_0',
            lastUpdateTimestamp: new Date().toISOString(),
            status: 'valid'
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleRollback = () => {
    const rolledBackSlot = otaState.runningPartition === 'ota_0' ? 'ota_1' : 'ota_0';
    onUpdateOtaState({
      ...otaState,
      runningPartition: rolledBackSlot,
      nextUpdatePartition: rolledBackSlot === 'ota_0' ? 'ota_1' : 'ota_0',
      status: 'rolled_back'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Dual-Bank OTA Firmware Update</h2>
              <p className="text-xs text-zinc-400">Safe A/B Partition Rollback with Zero Downtime</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Bank Slots */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className={`p-3.5 rounded-xl border text-xs font-mono transition ${
            otaState.runningPartition === 'ota_0'
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">Slot A (ota_0)</span>
              {otaState.runningPartition === 'ota_0' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-sans font-semibold">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-500">Offset: 0x020000 • Size: 3.375 MB</div>
          </div>

          <div className={`p-3.5 rounded-xl border text-xs font-mono transition ${
            otaState.runningPartition === 'ota_1'
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">Slot B (ota_1)</span>
              {otaState.runningPartition === 'ota_1' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-sans font-semibold">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-500">Offset: 0x380000 • Size: 3.375 MB</div>
          </div>
        </div>

        {/* Upload Action */}
        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 mb-5 text-xs text-zinc-300">
          <div className="font-medium mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Target Update Slot: <span className="text-cyan-300 font-mono">{otaState.nextUpdatePartition}</span></span>
          </div>
          <p className="text-[11px] text-zinc-500 mb-3">
            Firmware binary will be written to the alternate inactive slot and verified with cryptographic checksum before boot flag swap.
          </p>

          {isUploading && (
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-[11px] font-mono text-cyan-400">
                <span>Flashing into {otaState.nextUpdatePartition}...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleRollback}
              disabled={isUploading}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rollback to Prev Slot</span>
            </button>

            <button
              onClick={handleSimulateFlash}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'Writing Flash...' : 'Flash Firmware'}</span>
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
