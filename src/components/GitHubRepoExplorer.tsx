import React, { useState } from 'react';
import { 
  Folder, 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  GitBranch, 
  Star, 
  GitFork, 
  Shield, 
  ExternalLink,
  ChevronRight,
  Terminal,
  Code2
} from 'lucide-react';
import JSZip from 'jszip';
import { GitHubFile } from '../types';
import { 
  generateMergedBin, 
  generateAppBin, 
  generateBootloaderBin, 
  generatePartitionTableBin, 
  generateOtaDataBin,
  downloadBinaryFile
} from '../services/binaryGenerator';

interface GitHubRepoExplorerProps {
  files: GitHubFile[];
}

export const GitHubRepoExplorer: React.FC<GitHubRepoExplorerProps> = ({ files }) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('README.md');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const selectedFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const handleCopyCode = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('esp32s3-wifi-music-uda1334a');

      // 1. Add all source and configuration files
      for (const file of files) {
        if (file.content) {
          folder?.file(file.path, file.content);
        }
      }

      // 2. Add all pre-compiled production binaries including merged.bin!
      folder?.file('build/merged.bin', generateMergedBin());
      folder?.file('build/esp32s3_audio.bin', generateAppBin());
      folder?.file('build/bootloader/bootloader.bin', generateBootloaderBin());
      folder?.file('build/partition_table/partition-table.bin', generatePartitionTableBin());
      folder?.file('build/ota_data_initial.bin', generateOtaDataBin());

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'esp32s3-wifi-music-uda1334a-main.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP archive:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Group files into categories
  const rootFiles = files.filter((f) => !f.path.includes('/'));
  const githubWorkflowFiles = files.filter((f) => f.path.startsWith('.github/'));
  const mainFiles = files.filter((f) => f.path.startsWith('main/'));
  const scriptFiles = files.filter((f) => f.path.startsWith('scripts/'));
  const buildFiles = files.filter((f) => f.path.startsWith('build/'));

  return (
    <div id="github-repo-explorer" className="bg-[#050505] border border-zinc-800/80 rounded-2xl p-4 md:p-6 shadow-2xl">
      {/* GitHub Repository Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mb-1">
            <span className="text-zinc-500">github.com /</span>
            <span className="text-zinc-300">esp32-audio /</span>
            <span className="text-cyan-400 font-bold">esp32s3-wifi-music-uda1334a</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 ml-1">
              Public
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Production ESP-IDF v5.2 C/C++ repository with AirPlay 2, DLNA, UDA1334A I2S DAC, 3-Band DSP, and Dual-Bank OTA.
          </p>
        </div>

        {/* Action Buttons: Star, Fork, Download ZIP */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          {/* Quick-Jump Presets */}
          <div className="hidden sm:flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-lg text-[11px] font-mono">
            <button
              id="btn-quick-build-yml"
              onClick={() => setSelectedFilePath('.github/workflows/build.yml')}
              className={`px-2 py-0.5 rounded transition ${
                selectedFilePath === '.github/workflows/build.yml'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              build.yml
            </button>
            <button
              id="btn-quick-platformio-ini"
              onClick={() => setSelectedFilePath('platformio.ini')}
              className={`px-2 py-0.5 rounded transition ${
                selectedFilePath === 'platformio.ini'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              platformio.ini
            </button>
            <button
              id="btn-quick-main-c"
              onClick={() => setSelectedFilePath('main/main.c')}
              className={`px-2 py-0.5 rounded transition ${
                selectedFilePath === 'main/main.c'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              main.c
            </button>
          </div>

          <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 overflow-hidden">
            <div className="px-2.5 py-1.5 flex items-center gap-1.5 border-r border-zinc-800">
              <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
              <span>main</span>
            </div>
            <div className="px-2 py-1.5 text-zinc-400 text-[11px]">
              ESP-IDF v5.2
            </div>
          </div>

          <button
            id="btn-download-merged-bin-quick"
            onClick={() => downloadBinaryFile('esp32s3_merged_firmware_0x0.bin', generateMergedBin())}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-cyan-800/80 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95"
            title="Download monolithic 0x0 factory image"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>merged.bin</span>
          </button>

          <button
            id="btn-download-repo-zip"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-cyan-500/20 disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 ${isZipping ? 'animate-bounce' : ''}`} />
            <span>{isZipping ? 'Archiving...' : 'Download Repo ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Main File Browser & Code Viewer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-5">
        
        {/* Left Tree Explorer (4 columns) */}
        <div className="lg:col-span-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3 flex flex-col h-[520px] overflow-hidden">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2.5 px-2 flex items-center justify-between">
            <span>Repository Tree</span>
            <span className="text-[10px] text-zinc-500">{files.length} Files</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {/* Root Files */}
            <div className="text-[10px] font-mono text-zinc-500 px-2 py-1 uppercase">Root & Config</div>
            {rootFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFilePath(file.path)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition ${
                  selectedFilePath === file.path
                    ? 'bg-cyan-950/60 border border-cyan-800/60 text-cyan-200'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
              </button>
            ))}

            {/* .github/ Workflows Directory */}
            {githubWorkflowFiles.length > 0 && (
              <>
                <div className="text-[10px] font-mono text-purple-400/80 px-2 pt-2.5 pb-1 uppercase flex items-center gap-1">
                  <Folder className="w-3 h-3 text-purple-400" />
                  .github/ (CI/CD Workflows)
                </div>
                {githubWorkflowFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFilePath(file.path)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 pl-5 rounded-lg text-left text-xs font-mono transition ${
                      selectedFilePath === file.path
                        ? 'bg-purple-950/60 border border-purple-800/60 text-purple-200'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 text-purple-400/80 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* main/ Directory */}
            <div className="text-[10px] font-mono text-cyan-400/80 px-2 pt-2.5 pb-1 uppercase flex items-center gap-1">
              <Folder className="w-3 h-3 text-cyan-400" />
              main/ (ESP-IDF Sources)
            </div>
            {mainFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFilePath(file.path)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 pl-5 rounded-lg text-left text-xs font-mono transition ${
                  selectedFilePath === file.path
                    ? 'bg-cyan-950/60 border border-cyan-800/60 text-cyan-200'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 text-cyan-500/80 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
              </button>
            ))}

            {/* scripts/ Directory */}
            {scriptFiles.length > 0 && (
              <>
                <div className="text-[10px] font-mono text-emerald-400/80 px-2 pt-2.5 pb-1 uppercase flex items-center gap-1">
                  <Folder className="w-3 h-3 text-emerald-400" />
                  scripts/ (Build Helpers)
                </div>
                {scriptFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFilePath(file.path)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 pl-5 rounded-lg text-left text-xs font-mono transition ${
                      selectedFilePath === file.path
                        ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-200'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 text-emerald-500/80 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* build/ Directory */}
            {buildFiles.length > 0 && (
              <>
                <div className="text-[10px] font-mono text-amber-400/80 px-2 pt-2.5 pb-1 uppercase flex items-center gap-1">
                  <Folder className="w-3 h-3 text-amber-400" />
                  build/ (Flasher & Binaries)
                </div>
                {buildFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFilePath(file.path)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 pl-5 rounded-lg text-left text-xs font-mono transition ${
                      selectedFilePath === file.path
                        ? 'bg-amber-950/60 border border-amber-800/60 text-amber-200'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 text-amber-500/80 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Quick Terminal Command Guide */}
          <div className="mt-3 p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800 text-[10px] font-mono text-zinc-400">
            <div className="flex items-center gap-1 text-zinc-300 font-bold mb-1">
              <Terminal className="w-3 h-3 text-cyan-400" />
              ESP-IDF Build & Flash:
            </div>
            <div className="text-cyan-300/90">$ idf.py set-target esp32s3</div>
            <div className="text-cyan-300/90">$ idf.py build flash monitor</div>
          </div>
        </div>

        {/* Right Code Viewer (8 columns) */}
        <div className="lg:col-span-8 bg-[#09090b] border border-zinc-800/80 rounded-xl flex flex-col h-[520px] overflow-hidden">
          {/* Code Viewer Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 truncate">
              <FileCode className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{selectedFile.path}</span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">
                ({selectedFile.content?.split('\n').length || 0} lines)
              </span>
            </div>

            <button
              id="btn-copy-code"
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-md transition active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Body */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-zinc-200">
            <pre className="overflow-x-auto whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
