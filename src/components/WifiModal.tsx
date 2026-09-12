import React, { useState } from 'react';
import { Wifi, X, Check, Globe, Shield, RefreshCw, Key, Network } from 'lucide-react';
import { WiFiConfig } from '../types';

interface WifiModalProps {
  isOpen: boolean;
  onClose: () => void;
  wifiConfig: WiFiConfig;
  onSaveWifiConfig: (cfg: WiFiConfig) => void;
  isStaConnected: boolean;
  staIp: string;
  staRssi: number;
}

export const WifiModal: React.FC<WifiModalProps> = ({
  isOpen,
  onClose,
  wifiConfig,
  onSaveWifiConfig,
  isStaConnected,
  staIp,
  staRssi
}) => {
  const [formData, setFormData] = useState<WiFiConfig>(wifiConfig);
  const [showPassword, setShowPassword] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWifiConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Wi-Fi & Network Configuration</h2>
              <p className="text-xs text-zinc-400">Concurrent SoftAP + Station mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status Pill */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 mb-5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isStaConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-zinc-300">STA: {isStaConnected ? formData.staSsid || 'Connected' : 'Connecting...'}</span>
          </div>
          <div className="text-zinc-400">
            {staIp ? `${staIp} (${staRssi} dBm)` : '192.168.4.1 (AP)'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-400 font-medium mb-1.5">Home Wi-Fi Network (SSID)</label>
            <div className="relative">
              <input
                type="text"
                value={formData.staSsid}
                onChange={(e) => setFormData({ ...formData, staSsid: e.target.value })}
                placeholder="e.g. MyHomeNetwork_5G"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                required
              />
              <Network className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1.5">Wi-Fi Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.staPassword}
                onChange={(e) => setFormData({ ...formData, staPassword: e.target.value })}
                placeholder="WPA2/WPA3 Password"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-zinc-400 hover:text-cyan-400 absolute right-3 top-3 font-mono"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">mDNS Hostname</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.mdnsHost}
                  onChange={(e) => setFormData({ ...formData, mdnsHost: e.target.value })}
                  placeholder="esp32-audio"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">http://{formData.mdnsHost || 'esp32-audio'}.local</span>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">SoftAP Broadcast</label>
              <label className="flex items-center gap-2 p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.apKeepOpen}
                  onChange={(e) => setFormData({ ...formData, apKeepOpen: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-0"
                />
                <span className="text-zinc-300 text-[11px]">Keep AP Active (24/7)</span>
              </label>
              <span className="text-[10px] text-zinc-500 mt-1 block">Allows setup anytime</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-cyan-500/20"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved to NVS!</span>
                </>
              ) : (
                <span>Save & Connect</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
