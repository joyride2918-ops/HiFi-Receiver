import React, { useState } from 'react';
import { 
  Wifi, 
  Globe, 
  ShieldCheck, 
  RefreshCw, 
  Check, 
  Lock, 
  Smartphone, 
  SignalHigh, 
  CheckCircle2,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { WiFiConfig } from '../types';

interface WifiTileProps {
  wifiConfig: WiFiConfig;
  onSaveWifiConfig: (cfg: WiFiConfig) => void;
  isStaConnected: boolean;
  staIp: string;
  staRssi: number;
}

export const WifiTile: React.FC<WifiTileProps> = ({
  wifiConfig,
  onSaveWifiConfig,
  isStaConnected,
  staIp,
  staRssi
}) => {
  const [staSsid, setStaSsid] = useState(wifiConfig.staSsid);
  const [staPassword, setStaPassword] = useState('');
  const [apSsid, setApSsid] = useState(wifiConfig.apSsid);
  const [apKeepOpen, setApKeepOpen] = useState(wifiConfig.apKeepOpen);
  const [mdnsHost, setMdnsHost] = useState(wifiConfig.mdnsHost);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const mockAvailableNetworks = [
    { ssid: 'Home-WiFi-5G', rssi: -54, secure: true },
    { ssid: 'LivingRoom_Audio_Mesh', rssi: -62, secure: true },
    { ssid: 'IoT-Devices-2.4G', rssi: -68, secure: true },
    { ssid: 'Guest-Wireless', rssi: -78, secure: false }
  ];

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 800);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: WiFiConfig = {
      ...wifiConfig,
      staSsid: staSsid.trim(),
      staPassword: staPassword ? staPassword : wifiConfig.staPassword,
      apSsid: apSsid.trim(),
      apKeepOpen,
      mdnsHost: mdnsHost.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    };
    onSaveWifiConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div id="tile-wifi-network" className="bg-[#080808] border border-zinc-800/80 rounded-2xl p-4 md:p-5 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Wi-Fi & mDNS Manager</h3>
            <p className="text-[11px] text-zinc-400">SoftAP Startup + Home STA + .local mDNS</p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${isStaConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className={isStaConnected ? 'text-emerald-300' : 'text-amber-300'}>
            {isStaConnected ? 'STA + AP ACTIVE' : 'AP ONLY'}
          </span>
        </div>
      </div>

      {/* Feature 1 Highlight: AP Startup is Kept Open for Easy Setup & Fail-Safe */}
      <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-xl p-3 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                SoftAP Always Accessible
                <span className="text-[9px] bg-cyan-500/20 text-cyan-200 px-1.5 py-0.5 rounded font-mono">
                  192.168.4.1
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                AP stays running concurrently with your Home Wi-Fi so you never get locked out.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0 text-xs text-zinc-300">
            <input
              type="checkbox"
              id="checkbox-ap-keep-open"
              checked={apKeepOpen}
              onChange={(e) => setApKeepOpen(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-cyan-500 accent-cyan-400"
            />
            <span className="text-[11px] font-medium font-mono">Keep AP Open</span>
          </label>
        </div>
      </div>

      {/* Network Configuration Form */}
      <form onSubmit={handleSave} className="space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Home Wi-Fi SSID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="input-sta-ssid" className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                Home Wi-Fi Network (SSID):
              </label>
              <button
                type="button"
                onClick={handleScan}
                disabled={isScanning}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isScanning ? 'animate-spin' : ''}`} />
                Scan Networks
              </button>
            </div>
            <input
              id="input-sta-ssid"
              type="text"
              required
              value={staSsid}
              onChange={(e) => setStaSsid(e.target.value)}
              placeholder="e.g. MyHome-WiFi"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
            />

            {/* Scanned networks quick-picks */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {mockAvailableNetworks.map((net) => (
                <button
                  type="button"
                  key={net.ssid}
                  onClick={() => setStaSsid(net.ssid)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition flex items-center gap-1 ${
                    staSsid === net.ssid
                      ? 'bg-zinc-800 text-cyan-300 border-cyan-700'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <SignalHigh className="w-2.5 h-2.5 text-emerald-400" />
                  {net.ssid}
                </button>
              ))}
            </div>
          </div>

          {/* Wi-Fi Password */}
          <div>
            <label htmlFor="input-sta-password" className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 mb-1">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              Home Wi-Fi Password (WPA2/WPA3):
            </label>
            <input
              id="input-sta-password"
              type="password"
              value={staPassword}
              onChange={(e) => setStaPassword(e.target.value)}
              placeholder="Leave blank to keep saved password in NVS"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* mDNS Hostname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="input-mdns-host" className="text-xs font-medium text-zinc-300 block mb-1">
                mDNS Hostname:
              </label>
              <div className="relative">
                <input
                  id="input-mdns-host"
                  type="text"
                  required
                  value={mdnsHost}
                  onChange={(e) => setMdnsHost(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 pr-14"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-zinc-500">.local</span>
              </div>
            </div>

            <div>
              <label htmlFor="input-ap-ssid" className="text-xs font-medium text-zinc-300 block mb-1">
                SoftAP Broadcast Name:
              </label>
              <input
                id="input-ap-ssid"
                type="text"
                value={apSsid}
                onChange={(e) => setApSsid(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Save to NVS Flash Button */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-save-wifi"
            className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Saved to ESP32 NVS Flash!</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Save to ESP32 Flash & Connect</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
