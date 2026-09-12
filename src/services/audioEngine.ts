import { DspEqState } from '../types';

class AudioEngineService {
  private ctx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private oscNode: OscillatorNode | null = null;
  private oscGainNode: GainNode | null = null;

  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private preampGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private isSyntheticPlaying = false;
  private currentSyntheticFreq = 1000;
  private currentVolume = 0.8;
  private isMuted = false;

  private meterDataArray: Uint8Array | null = null;
  private freqDataArray: Uint8Array | null = null;

  public init() {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'none';

    // Biquad Filters: Bass (100Hz Lowshelf/Peaking), Mid (1000Hz Peaking), Treble (10000Hz Highshelf/Peaking)
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'peaking';
    this.bassFilter.frequency.setValueAtTime(100, this.ctx.currentTime);
    this.bassFilter.Q.setValueAtTime(0.707, this.ctx.currentTime);
    this.bassFilter.gain.setValueAtTime(0, this.ctx.currentTime);

    this.midFilter = this.ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    this.midFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
    this.midFilter.gain.setValueAtTime(0, this.ctx.currentTime);

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'peaking';
    this.trebleFilter.frequency.setValueAtTime(10000, this.ctx.currentTime);
    this.trebleFilter.Q.setValueAtTime(0.707, this.ctx.currentTime);
    this.trebleFilter.gain.setValueAtTime(0, this.ctx.currentTime);

    this.preampGain = this.ctx.createGain();
    this.preampGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // Connect Filter Chain: Source -> Bass -> Mid -> Treble -> Preamp -> MasterGain -> Analyser -> Destination
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.preampGain);
    this.preampGain.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.meterDataArray = new Uint8Array(this.analyser.fftSize);
    this.freqDataArray = new Uint8Array(this.analyser.frequencyBinCount);

    // Wire audio element
    try {
      this.sourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.sourceNode.connect(this.bassFilter);
    } catch {
      // Source node already wired or fallback
    }
  }

  public async resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public async playUrl(url: string) {
    this.init();
    await this.resumeContext();
    this.stopSynthetic();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = url;
      this.audioElement.load();
      await this.audioElement.play();
    }
  }

  public async playSyntheticTone(frequency: number) {
    this.init();
    await this.resumeContext();

    if (this.audioElement) {
      this.audioElement.pause();
    }

    this.stopSynthetic();
    if (!this.ctx || !this.bassFilter) return;

    this.currentSyntheticFreq = frequency;
    this.oscNode = this.ctx.createOscillator();
    this.oscNode.type = 'sine';
    this.oscNode.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    this.oscGainNode = this.ctx.createGain();
    // Smooth fade in
    this.oscGainNode.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.oscGainNode.gain.exponentialRampToValueAtTime(0.3, this.ctx.currentTime + 0.05);

    this.oscNode.connect(this.oscGainNode);
    this.oscGainNode.connect(this.bassFilter);

    this.oscNode.start();
    this.isSyntheticPlaying = true;
  }

  public stopSynthetic() {
    if (this.oscNode && this.ctx && this.oscGainNode) {
      try {
        const now = this.ctx.currentTime;
        this.oscGainNode.gain.setValueAtTime(this.oscGainNode.gain.value, now);
        this.oscGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        this.oscNode.stop(now + 0.06);
      } catch {
        // Safe catch
      }
      this.oscNode = null;
      this.oscGainNode = null;
    }
    this.isSyntheticPlaying = false;
  }

  public pause() {
    if (this.isSyntheticPlaying) {
      this.stopSynthetic();
    } else if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public async resume() {
    await this.resumeContext();
    if (this.isSyntheticPlaying) {
      this.playSyntheticTone(this.currentSyntheticFreq);
    } else if (this.audioElement && this.audioElement.src) {
      await this.audioElement.play();
    }
  }

  public stop() {
    this.stopSynthetic();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  public setVolume(val: number) {
    this.currentVolume = Math.max(0, Math.min(1, val));
    if (!this.masterGain || !this.ctx) return;
    const target = this.isMuted ? 0 : this.currentVolume;
    this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (!this.masterGain || !this.ctx) return;
    const target = this.isMuted ? 0 : this.currentVolume;
    this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
  }

  public setEq(eq: DspEqState) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.bassFilter) {
      this.bassFilter.gain.setTargetAtTime(eq.enabled ? eq.bass : 0, now, 0.05);
    }
    if (this.midFilter) {
      this.midFilter.gain.setTargetAtTime(eq.enabled ? eq.mid : 0, now, 0.05);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.setTargetAtTime(eq.enabled ? eq.treble : 0, now, 0.05);
    }
    if (this.preampGain) {
      const preampLinear = Math.pow(10, (eq.enabled ? eq.preamp : 0) / 20);
      this.preampGain.gain.setTargetAtTime(preampLinear, now, 0.05);
    }
  }

  public getLevels(): { left: number; right: number; peak: number; frequencies: Uint8Array } {
    if (!this.analyser || !this.meterDataArray || !this.freqDataArray) {
      return { left: 0, right: 0, peak: 0, frequencies: new Uint8Array(64) };
    }

    this.analyser.getByteTimeDomainData(this.meterDataArray);
    this.analyser.getByteFrequencyData(this.freqDataArray);

    let sum = 0;
    let peak = 0;
    for (let i = 0; i < this.meterDataArray.length; i++) {
      const val = (this.meterDataArray[i] - 128) / 128;
      sum += val * val;
      if (Math.abs(val) > peak) peak = Math.abs(val);
    }

    const rms = Math.sqrt(sum / this.meterDataArray.length);
    // Slight stereo variation simulation from frequency bins
    const left = Math.min(1, rms * 1.8);
    const right = Math.min(1, rms * 1.8 * 0.95);

    return {
      left,
      right,
      peak: Math.min(1, peak),
      frequencies: this.freqDataArray
    };
  }

  public getAudioElement() {
    return this.audioElement;
  }
}

export const audioEngine = new AudioEngineService();
