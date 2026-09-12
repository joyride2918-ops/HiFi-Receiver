# ESP32-S3 N16R8 Hi-Fi Wi-Fi Music Streamer

A production-grade, 24/7 high-fidelity network audio receiver and DSP preamplifier for the **ESP32-S3-WROOM-1 N16R8** (16MB Flash, 8MB Octal PSRAM) and **NXP/Adafruit UDA1334A I2S DAC**.

## Key Features

- **Concurrent SoftAP & STA Mode**: SoftAP stays open for easy onboarding while connecting to home Wi-Fi.
- **mDNS Auto-Discovery**: Access the device directly at `http://esp32-audio.local` on macOS, iOS, Windows, and Android.
- **AirPlay 2 (RAOP)**: 24/7 background listener advertising `_airplay._tcp` and `_raop._tcp` with ALAC / Linear PCM depacketizer.
- **DLNA / UPnP MediaRenderer**: Discoverable by BubbleUPnP, mConnect, Audirvana, Foobar2000, and Windows Media Player.
- **Direct HTTP / HTTPS Streamer**: Low-jitter network audio buffer allocated in **8MB Octal PSRAM** (1024 KB ringbuffer).
- **All Codecs Supported**: MP3, AAC-LC, HE-AAC, FLAC (up to 24-bit/96kHz), WAV (PCM), and Opus.
- **3-Band Biquad IIR DSP Equalizer**: Hardware-accelerated floating point Bass (100Hz), Mid (1kHz), Treble (10kHz) with 9 audio presets.
- **Robust Dual-Bank OTA Engine**: Fail-safe `ota_0` and `ota_1` partitions with automatic rollback safeguard.
- **Modern AMOLED Web UI**: Material Design 3 dark interface with live VU meters and state persistence in NVS flash.

---

## Hardware Pinout (ESP32-S3 to UDA1334A DAC)

| UDA1334A DAC Pin | ESP32-S3 Pin | Function / Description |
|---|---|---|
| **VIN** | 3V3 / 5V | Clean Regulated Power Supply |
| **GND** | GND | Common Ground Plane |
| **BCLK** | GPIO 14 | I2S Bit Clock (Serial Clock) |
| **WSEL / LRCLK** | GPIO 15 | I2S Word Select (Left/Right Clock) |
| **DIN** | GPIO 16 | I2S Serial Audio Data |
| **MCLK** | GND / NC | DAC uses internal PLL; connect to GND or leave open |
| **DE-EMP** | GND | De-emphasis off |
| **MUTE** | GND | Unmuted (active high) |

---

## Build and Flash Instructions

### Prerequisites
- ESP-IDF v5.1.x or v5.2.x
- Target: `esp32s3`

```bash
# 1. Clone repository from GitHub
git clone https://github.com/esp32-audio/esp32s3-wifi-music-uda1334a.git
cd esp32s3-wifi-music-uda1334a

# Option A: ESP-IDF CLI Build
idf.py set-target esp32s3
idf.py build
idf.py -p /dev/ttyUSB0 flash monitor

# Option B: PlatformIO Build & Flash (using platformio.ini)
pio run -e esp32s3_espidf -t upload --upload-port /dev/ttyUSB0
pio device monitor -b 115200

# Option C: 1-Step Monolithic Flash (merged.bin at 0x0)
esptool.py --chip esp32s3 -p /dev/ttyUSB0 -b 921600 write_flash 0x0 build/merged.bin
```

---

## GitHub Actions CI/CD (.github/workflows/build.yml)

Every push to your GitHub repo triggers automated compilation:
- Automated building on both ESP-IDF v5.2 and PlatformIO.
- Automated creation of `build/merged.bin` via `merge_bin.py`.
- Direct release asset publishing so you can download `merged.bin` right from GitHub releases.

---

## Partition Table (16MB Flash)

```csv
# Name,   Type, SubType, Offset,   Size,     Flags
nvs,      data, nvs,     0x9000,   0x6000,
otadata,  data, ota,     0xf000,   0x2000,
phy_init, data, phy,     0x11000,  0x1000,
ota_0,    app,  ota_0,   0x20000,  0x680000,
ota_1,    app,  ota_1,   0x6a0000, 0x680000,
storage,  data, spiffs,  0xd20000, 0x2e0000,
```

---

## License
Apache-2.0 License. Copyright (c) 2026.
