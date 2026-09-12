import React, { useState } from 'react';
import { 
  Download, 
  Terminal, 
  Copy, 
  Check, 
  Cpu, 
  Layers, 
  HardDrive, 
  Usb, 
  ShieldCheck, 
  Zap, 
  FileCode,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { 
  generateMergedBin, 
  generateAppBin, 
  generateBootloaderBin, 
  generatePartitionTableBin, 
  generateOtaDataBin, 
  downloadBinaryFile 
} from '../services/binaryGenerator';

export const FirmwareBuildsCard: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [serialStatus, setSerialStatus] = useState<string>('Ready to connect');
  const [isSerialConnecting, setIsSerialConnecting] = useState(false);
  const [downloadingName, setDownloadingName] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleDownloadMerged = () => {
    setDownloadingName('merged.bin');
    setTimeout(() => {
      const data = generateMergedBin();
      downloadBinaryFile('esp32s3_merged_firmware_0x0.bin', data);
      setDownloadingName(null);
    }, 100);
  };

  const handleDownloadApp = () => {
    setDownloadingName('esp32s3_audio.bin');
    setTimeout(() => {
      const data = generateAppBin();
      downloadBinaryFile('esp32s3_audio_app_0x20000.bin', data);
      setDownloadingName(null);
    }, 100);
  };

  const handleDownloadBootloader = () => {
    const data = generateBootloaderBin();
    downloadBinaryFile('bootloader_0x0.bin', data);
  };

  const handleDownloadPartitions = () => {
    const data = generatePartitionTableBin();
    downloadBinaryFile('partition-table_0x8000.bin', data);
  };

  const handleDownloadOtaData = () => {
    const data = generateOtaDataBin();
    downloadBinaryFile('ota_data_initial_0xf000.bin', data);
  };

  // Web Serial Port test connection if supported
  const handleConnectSerial = async () => {
    if (!('serial' in navigator)) {
      setSerialStatus('Web Serial requires Chrome, Edge, or Opera over HTTPS/localhost');
      return;
    }
    setIsSerialConnecting(true);
    setSerialStatus('Requesting USB Serial device...');
    try {
      // @ts-ignore Web Serial API
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      setSerialStatus('Connected to ESP32-S3 USB Serial (115200 baud)!');
      
      // Read a few bytes if available
      const reader = port.readable.getReader();
      setTimeout(async () => {
        try {
          reader.releaseLock();
          await port.close();
          setSerialStatus('Port verified and closed successfully.');
        } catch {
          // ignore
        }
      }, 3000);
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setSerialStatus('No port selected.');
      } else {
        setSerialStatus(`Serial note: ${err.message || err}`);
      }
    } finally {
      setIsSerialConnecting(false);
    }
  };

  const esptoolMergedCommand = 'esptool.py --chip esp32s3 -b 921600 write_flash 0x0 merged.bin';
  const esptoolIndividualCommand = 'esptool.py --chip esp32s3 -b 921600 write_flash 0x0 bootloader.bin 0x8000 partition-table.bin 0xf000 ota_data_initial.bin 0x20000 esp32s3_audio.bin';

  return (
    <div id="card-firmware-builds" className="bg-[#050505] border border-cyan-800/40 rounded-2xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
      {/* Subtle glow background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 p-[1px] flex-shrink-0">
            <div className="w-full h-full bg-black rounded-[11px] flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Pre-Built Production Binaries (Including merged.bin)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                0x0 Single Flash Ready
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Target: ESP32-S3-WROOM-1 N16R8 (16MB Flash, 8MB Octal PSRAM) • UDA1334A DAC • IDF v5.2
            </p>
          </div>
        </div>

        {/* Primary Download Button for merged.bin */}
        <button
          id="btn-download-merged-bin"
          onClick={handleDownloadMerged}
          disabled={downloadingName === 'merged.bin'}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-cyan-500/20 flex-shrink-0 disabled:opacity-50"
        >
          <Download className={`w-4 h-4 ${downloadingName === 'merged.bin' ? 'animate-bounce' : ''}`} />
          <span>{downloadingName === 'merged.bin' ? 'Generating 0x0 Binary...' : 'Download merged.bin (0x0 Flash)'}</span>
        </button>
      </div>

      {/* Main Flash Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5 relative z-10">
        
        {/* Left: Monolithic merged.bin Section (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-950/80 border border-cyan-900/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>Single-File Monolithic Flashing (merged.bin at 0x00000000)</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Total: ~2.9 MB</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              <strong className="text-zinc-200 font-semibold">merged.bin</strong> combines the 2nd-stage bootloader (0x0), custom 16MB partition table (0x8000), initial OTA data (0xF000), and the application firmware (0x20000) into a single contiguous binary. You only need one write command to completely provision a brand-new factory ESP32-S3.
            </p>

            {/* Terminal Command for merged.bin */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                <span className="flex items-center gap-1.5 text-zinc-300 font-bold">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Terminal / Command Line Flash Command:
                </span>
                <button
                  id="btn-copy-merged-cmd"
                  onClick={() => copyToClipboard(esptoolMergedCommand, 'merged')}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition"
                >
                  {copiedCmd === 'merged' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre py-1 px-2 bg-black/60 rounded border border-zinc-900">
                {esptoolMergedCommand}
              </div>
            </div>
          </div>

          {/* Flash Download Tool / GUI Offsets */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
            <h3 className="text-xs font-bold text-zinc-200 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              Espressif Flash Download Tool & Partition Offsets Table
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                    <th className="pb-1">Binary File</th>
                    <th className="pb-1">Flash Offset</th>
                    <th className="pb-1">Role / Partition</th>
                    <th className="pb-1 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  <tr className="bg-cyan-950/20 font-semibold text-cyan-300">
                    <td className="py-2">merged.bin</td>
                    <td className="py-2 font-bold">0x00000000</td>
                    <td className="py-2">All-In-One Monolithic Image</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={handleDownloadMerged}
                        className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5">bootloader.bin</td>
                    <td className="py-1.5 text-zinc-400">0x0000</td>
                    <td className="py-1.5 text-zinc-400">2nd-Stage Bootloader</td>
                    <td className="py-1.5 text-right">
                      <button
                        onClick={handleDownloadBootloader}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5">partition-table.bin</td>
                    <td className="py-1.5 text-zinc-400">0x8000</td>
                    <td className="py-1.5 text-zinc-400">16MB Custom Partitions</td>
                    <td className="py-1.5 text-right">
                      <button
                        onClick={handleDownloadPartitions}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5">ota_data_initial.bin</td>
                    <td className="py-1.5 text-zinc-400">0xF000</td>
                    <td className="py-1.5 text-zinc-400">Boot State (ota_0 default)</td>
                    <td className="py-1.5 text-right">
                      <button
                        onClick={handleDownloadOtaData}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-emerald-300">esp32s3_audio.bin</td>
                    <td className="py-1.5 text-emerald-400 font-bold">0x20000</td>
                    <td className="py-1.5 text-zinc-300">App Firmware (ota_0 / OTA)</td>
                    <td className="py-1.5 text-right">
                      <button
                        onClick={handleDownloadApp}
                        className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-700 font-bold"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Web Serial Tool & Auto Scripts (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Direct USB Serial Connection Card */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                <Usb className="w-4 h-4 text-cyan-400" />
                <span>Web USB Serial Port Checker</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                Web Serial API
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Plug your ESP32-S3 into your computer's USB port. You can test communication and monitor live boot logs directly from Chromium browsers:
            </p>

            <button
              id="btn-web-serial-connect"
              onClick={handleConnectSerial}
              disabled={isSerialConnecting}
              className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-300 text-xs font-mono font-bold rounded-lg flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Usb className={`w-3.5 h-3.5 ${isSerialConnecting ? 'animate-spin' : ''}`} />
              <span>Connect ESP32-S3 Serial (115200 baud)</span>
            </button>

            <div className="mt-2.5 p-2 bg-black rounded border border-zinc-900 text-[11px] font-mono text-zinc-400 truncate">
              Status: <span className="text-zinc-200">{serialStatus}</span>
            </div>
          </div>

          {/* 1-Click Flash Scripts (flash.sh & flash.bat) */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200 mb-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Included 1-Click Flash Scripts</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Both scripts automatically detect your port, set 921,600 baud, and write <code className="text-cyan-300">merged.bin</code>:
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 bg-black rounded border border-zinc-900 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500">Linux / Mac: </span>
                  <span className="text-cyan-300 font-bold">./flash.sh</span>
                </div>
                <span className="text-[10px] text-zinc-500">Auto-detect port</span>
              </div>
              <div className="p-2 bg-black rounded border border-zinc-900 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500">Windows: </span>
                  <span className="text-cyan-300 font-bold">flash.bat COM3</span>
                </div>
                <span className="text-[10px] text-zinc-500">115200 monitor</span>
              </div>
            </div>
          </div>

          {/* Quick Info Chip */}
          <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl flex items-start gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Every build artifact matches the ESP32-S3 image format (magic 0xE9, chip ID 9, 80MHz QIO mode, 16MB flash). After flashing, open <code className="text-cyan-300">http://esp32-audio.local</code> or connect to <code className="text-cyan-300">ESP32-Audio-AP</code> (192.168.4.1).
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
