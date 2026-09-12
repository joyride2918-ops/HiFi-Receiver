import { AudioTrack, EqPreset } from '../types';

export const CURATED_TRACKS: AudioTrack[] = [
  // --- Curated Radios ---
  {
    id: 'radio-somafm-groovesalad',
    name: 'SomaFM: Groove Salad',
    category: 'radio',
    description: 'A nicely chilled plate of ambient/downtempo grooves and chillout music.',
    url: 'https://ice2.somafm.com/groovesalad-128-mp3',
    codec: 'MP3',
    bitrate: '128 kbps',
    sampleRate: '44.1 kHz'
  },
  {
    id: 'radio-somafm-defcon',
    name: 'SomaFM: DEF CON Radio',
    category: 'radio',
    description: 'Music for Hacking. The soundtrack to the DEF CON hacker conference.',
    url: 'https://ice4.somafm.com/defcon-128-mp3',
    codec: 'MP3',
    bitrate: '128 kbps',
    sampleRate: '44.1 kHz'
  },
  {
    id: 'radio-somafm-dronezone',
    name: 'SomaFM: Drone Zone',
    category: 'radio',
    description: 'Served best chilled, safe with most medications. Atmospheric ambient.',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    codec: 'MP3',
    bitrate: '128 kbps',
    sampleRate: '44.1 kHz'
  },
  {
    id: 'radio-lofi-chill',
    name: 'Lofi Chillhop Stream',
    category: 'radio',
    description: 'Relaxing study and coding hip-hop instrumental beats 24/7.',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    codec: 'AAC',
    bitrate: '128 kbps',
    sampleRate: '44.1 kHz'
  },
  {
    id: 'radio-swiss-classic',
    name: 'Radio Swiss Classic',
    category: 'radio',
    description: 'Premium classical music: Bach, Mozart, Beethoven, Chopin in high fidelity.',
    url: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128',
    codec: 'MP3',
    bitrate: '128 kbps',
    sampleRate: '44.1 kHz'
  },
  {
    id: 'radio-jazz24',
    name: 'Jazz24 Public Radio',
    category: 'radio',
    description: 'The greatest jazz recordings of all time from Miles Davis to Diana Krall.',
    url: 'https://live.wksu.org/jazz.mp3',
    codec: 'MP3',
    bitrate: '128 kbps',
    sampleRate: '44.1 kHz'
  },

  // --- Trial Audios & Codec Benchmarks ---
  {
    id: 'trial-flac-acoustic',
    name: 'Lossless FLAC Acoustic Studio Master',
    category: 'trial',
    description: '24-bit Lossless FLAC audio sample for testing high-dynamic DAC performance.',
    url: 'https://archive.org/download/test_audio_sample_flac/sample-96khz.flac',
    codec: 'FLAC',
    bitrate: 'VBR Lossless',
    sampleRate: '96.0 kHz'
  },
  {
    id: 'trial-opus-speech',
    name: 'Opus Interactive Speech & Vocal Test',
    category: 'trial',
    description: 'Opus low-latency speech codec benchmark with wideband vocal clarity.',
    url: 'https://archive.org/download/test_audio_sample_opus/sample-opus.opus',
    codec: 'Opus',
    bitrate: '64 kbps VBR',
    sampleRate: '48.0 kHz'
  },
  {
    id: 'trial-wav-dynamic',
    name: 'Uncompressed PCM WAV Dynamic Range',
    category: 'trial',
    description: 'Linear 16-bit 44.1kHz Stereo PCM WAV file for zero-compression I2S evaluation.',
    url: 'https://actions.google.com/sounds/v1/water/rain_heavy.ogg',
    codec: 'WAV',
    bitrate: '1411 kbps (PCM)',
    sampleRate: '44.1 kHz'
  },
  {
    id: 'trial-tone-1000hz',
    name: '1,000 Hz 0dB FS I2S Reference Sine Wave',
    category: 'trial',
    description: 'Precision laboratory calibration pure sine wave for THD+N & oscilloscope testing.',
    url: 'synthetic:1000',
    codec: 'WAV',
    bitrate: 'Bit-Perfect 32-bit',
    sampleRate: '48.0 kHz',
    isSynthetic: true,
    freq: 1000
  },
  {
    id: 'trial-tone-50hz',
    name: '50 Hz Sub-Bass DAC Linearity Test',
    category: 'trial',
    description: 'Deep sub-bass sine tone to test UDA1334A low-frequency DC blocking & bass EQ.',
    url: 'synthetic:50',
    codec: 'WAV',
    bitrate: 'Bit-Perfect 32-bit',
    sampleRate: '48.0 kHz',
    isSynthetic: true,
    freq: 50
  }
];

export const EQ_PRESETS: EqPreset[] = [
  {
    name: 'Flat',
    bass: 0,
    mid: 0,
    treble: 0,
    description: 'Bit-perfect direct passthrough with neutral frequency response.'
  },
  {
    name: 'Bass Boost',
    bass: 7.5,
    mid: 0.5,
    treble: -1.0,
    description: 'Deep low-end emphasis for electronic, club, and bass-heavy audio.'
  },
  {
    name: 'Rock',
    bass: 4.5,
    mid: -2.0,
    treble: 5.0,
    description: 'Punchy bass, recessed mids for guitar separation, crisp high-hats.'
  },
  {
    name: 'Pop',
    bass: 2.0,
    mid: 3.5,
    treble: 2.5,
    description: 'Forward vocals and balanced punch for modern radio mastering.'
  },
  {
    name: 'Jazz',
    bass: 3.5,
    mid: 1.5,
    treble: 3.0,
    description: 'Warm double bass, intimate brass/piano, natural cymbal air.'
  },
  {
    name: 'Vocal / Podcast',
    bass: -3.0,
    mid: 6.0,
    treble: 2.5,
    description: 'Sub-bass rumble filter with enhanced dialogue intelligibility.'
  },
  {
    name: 'Classical',
    bass: 3.0,
    mid: 0.0,
    treble: 4.0,
    description: 'Expansive acoustic hall staging, smooth string sheen, solid timpani.'
  },
  {
    name: 'Electronic',
    bass: 6.0,
    mid: 1.0,
    treble: 5.5,
    description: 'V-shaped dynamic punch with sub-rumble and crystalline synth highs.'
  },
  {
    name: 'Acoustic',
    bass: 2.5,
    mid: 2.0,
    treble: 4.5,
    description: 'Enhanced guitar string pluck, warm wood resonance, and vocal clarity.'
  }
];
