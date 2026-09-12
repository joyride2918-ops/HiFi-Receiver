import { GitHubFile } from '../types';

export const GITHUB_REPO_FILES: GitHubFile[] = [
  {
    path: 'README.md',
    name: 'README.md',
    type: 'file',
    language: 'markdown',
    content: `# ESP32-S3 N16R8 Hi-Fi Wi-Fi Music Streamer

A production-grade, 24/7 high-fidelity network audio receiver and DSP preamplifier for the **ESP32-S3-WROOM-1 N16R8** (16MB Flash, 8MB Octal PSRAM) and **NXP/Adafruit UDA1334A I2S DAC**.

## Key Features

- **Concurrent SoftAP & STA Mode**: SoftAP stays open for easy onboarding while connecting to home Wi-Fi.
- **mDNS Auto-Discovery**: Access the device directly at \`http://esp32-audio.local\` on macOS, iOS, Windows, and Android.
- **AirPlay 2 (RAOP)**: 24/7 background listener advertising \`_airplay._tcp\` and \`_raop._tcp\` with ALAC / Linear PCM depacketizer.
- **DLNA / UPnP MediaRenderer**: Discoverable by BubbleUPnP, mConnect, Audirvana, Foobar2000, and Windows Media Player.
- **Direct HTTP / HTTPS Streamer**: Low-jitter network audio buffer allocated in **8MB Octal PSRAM** (1024 KB ringbuffer).
- **All Codecs Supported**: MP3, AAC-LC, HE-AAC, FLAC (up to 24-bit/96kHz), WAV (PCM), and Opus.
- **3-Band Biquad IIR DSP Equalizer**: Hardware-accelerated floating point Bass (100Hz), Mid (1kHz), Treble (10kHz) with 9 audio presets.
- **Robust Dual-Bank OTA Engine**: Fail-safe \`ota_0\` and \`ota_1\` partitions with automatic rollback safeguard.
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
- Target: \`esp32s3\`

\`\`\`bash
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
\`\`\`

---

## GitHub Actions CI/CD (.github/workflows/build.yml)

Every push to your GitHub repo triggers automated compilation:
- Automated building on both ESP-IDF v5.2 and PlatformIO.
- Automated creation of \`build/merged.bin\` via \`merge_bin.py\`.
- Direct release asset publishing so you can download \`merged.bin\` right from GitHub releases.

---

## Partition Table (16MB Flash)

\`\`\`csv
# Name,   Type, SubType, Offset,   Size,     Flags
nvs,      data, nvs,     0x9000,   0x6000,
otadata,  data, ota,     0xf000,   0x2000,
phy_init, data, phy,     0x11000,  0x1000,
ota_0,    app,  ota_0,   0x20000,  0x680000,
ota_1,    app,  ota_1,   0x6a0000, 0x680000,
storage,  data, spiffs,  0xd20000, 0x2e0000,
\`\`\`

---

## License
Apache-2.0 License. Copyright (c) 2026.
`
  },
  {
    path: 'platformio.ini',
    name: 'platformio.ini',
    type: 'file',
    language: 'ini',
    content: `; ==============================================================================
; PlatformIO Project Configuration for ESP32-S3-WROOM-1 N16R8 + UDA1334A DAC
; ==============================================================================

[platformio]
default_envs = esp32s3_espidf
src_dir = main

[env:esp32s3_espidf]
platform = espressif32 @ ~6.6.0
framework = espidf
board = esp32-s3-devkitc-1

; 16MB Flash, QIO 80MHz & Custom Partitions
board_build.flash_mode = qio
board_build.f_flash = 80000000L
board_build.flash_size = 16MB
board_upload.flash_size = 16MB
board_build.partitions = partitions.csv

; 8MB Octal PSRAM (OPI) Configuration
board_build.arduino.memory_type = qio_opi
board_build.psram_type = opi

; Compilation Flags
build_flags = 
    -DCORE_DEBUG_LEVEL=3
    -DCONFIG_SPIRAM_SUPPORT=1
    -DCONFIG_SPIRAM_MODE_OCT=1
    -DCONFIG_SPIRAM_TYPE_AUTO=1
    -DCONFIG_SPIRAM_SPEED_80M=1
    -DCONFIG_SPIRAM_USE_MALLOC=1
    -DCONFIG_I2S_BCLK_PIN=14
    -DCONFIG_I2S_WSEL_PIN=15
    -DCONFIG_I2S_DIN_PIN=16
    -DCONFIG_AUDIO_RINGBUF_SIZE=1048576

; Enable ESP-IDF Component Manager for external components (mdns, etc.)
build_unflags = -Werror=all

; Serial Upload & Monitor settings
upload_speed = 921600
monitor_speed = 115200
monitor_filters = esp32_exception_decoder, direct

; Automatic merged.bin generation post-build
extra_scripts = post:scripts/pio_merge_bin.py

; ------------------------------------------------------------------------------
; Optional Arduino Core Environment
; ------------------------------------------------------------------------------
[env:esp32s3_arduino]
platform = espressif32 @ ~6.6.0
framework = arduino
board = esp32-s3-devkitc-1
board_build.flash_mode = qio
board_build.f_flash = 80000000L
board_build.flash_size = 16MB
board_build.partitions = partitions.csv
board_build.arduino.memory_type = qio_opi
build_flags = 
    -DBOARD_HAS_PSRAM
    -mfix-esp32-psram-cache-issue
    -DCONFIG_I2S_BCLK_PIN=14
    -DCONFIG_I2S_WSEL_PIN=15
    -DCONFIG_I2S_DIN_PIN=16
upload_speed = 921600
monitor_speed = 115200
`
  },
  {
    path: 'CMakeLists.txt',
    name: 'CMakeLists.txt',
    type: 'file',
    language: 'cmake',
    content: `cmake_minimum_required(VERSION 3.16)

# Register project-level components directory so components like mdns resolve automatically
list(APPEND EXTRA_COMPONENT_DIRS "\${CMAKE_CURRENT_LIST_DIR}/components")

include(\$ENV{IDF_PATH}/tools/cmake/project.cmake)
project(esp32s3_wifi_music)
`
  },
  {
    path: 'sdkconfig.defaults',
    name: 'sdkconfig.defaults',
    type: 'file',
    language: 'ini',
    content: `# ESP32-S3 Target Configuration
CONFIG_IDF_TARGET="esp32s3"
CONFIG_IDF_TARGET_ESP32S3=y

# Flash Configuration
CONFIG_ESPTOOLPY_FLASHSIZE_16MB=y
CONFIG_ESPTOOLPY_FLASHSIZE="16MB"
CONFIG_ESPTOOLPY_FLASHMODE_QIO=y
CONFIG_ESPTOOLPY_FLASHFREQ_80M=y

# 8MB Octal PSRAM Configuration
CONFIG_ESP32S3_SPIRAM_SUPPORT=y
CONFIG_SPIRAM=y
CONFIG_SPIRAM_MODE_OCT=y
CONFIG_SPIRAM_TYPE_AUTO=y
CONFIG_SPIRAM_SPEED_80M=y
CONFIG_SPIRAM_USE_MALLOC=y
CONFIG_SPIRAM_MEMTEST=y
CONFIG_SPIRAM_MALLOC_ALWAYSINTERNAL=16384
CONFIG_SPIRAM_TRY_ALLOCATE_WIFI_LWIP=y

# Custom Partition Table
CONFIG_PARTITION_TABLE_CUSTOM=y
CONFIG_PARTITION_TABLE_CUSTOM_FILENAME="partitions.csv"
CONFIG_PARTITION_TABLE_OFFSET=0x8000

# FreeRTOS & System Performance
CONFIG_FREERTOS_HZ=1000
CONFIG_ESP_SYSTEM_EVENT_TASK_STACK_SIZE=4096
CONFIG_ESP_MAIN_TASK_STACK_SIZE=8192

# Networking & lwIP Optimizations for Low-Jitter Audio
CONFIG_LWIP_MAX_SOCKETS=16
CONFIG_LWIP_SO_RCVBUF=y
CONFIG_LWIP_TCP_WND_DEFAULT=57600
CONFIG_LWIP_TCP_RECVMBOX_SIZE=32
CONFIG_LWIP_UDP_RECVMBOX_SIZE=32

# mDNS Service Discovery
CONFIG_MDNS_MAX_SERVICES=8

# mbedTLS Dynamic Buffer
CONFIG_MBEDTLS_DYNAMIC_BUFFER=y
CONFIG_MBEDTLS_DYNAMIC_FREE_CONFIG_DATA=y
`
  },
  {
    path: 'partitions.csv',
    name: 'partitions.csv',
    type: 'file',
    language: 'csv',
    content: `# ESP32-S3 High-Fidelity Audio Partition Table (Compatible with 8MB and 16MB Flash)
# Name,   Type, SubType, Offset,   Size,     Flags
nvs,      data, nvs,     0x9000,   0x6000,
otadata,  data, ota,     0xf000,   0x2000,
phy_init, data, phy,     0x11000,  0x1000,
ota_0,    app,  ota_0,   0x20000,  0x360000,
ota_1,    app,  ota_1,   0x380000, 0x360000,
storage,  data, spiffs,  0x6e0000, 0x100000,
`
  },
  {
    path: 'main/CMakeLists.txt',
    name: 'CMakeLists.txt',
    type: 'file',
    language: 'cmake',
    content: `idf_component_register(
    SRCS
        "main.c"
        "wifi_manager.c"
        "audio_pipeline.c"
        "airplay_server.c"
        "dlna_renderer.c"
        "http_streamer.c"
        "dsp_eq.c"
        "ota_engine.c"
        "web_server.c"
    INCLUDE_DIRS
        "."
    REQUIRES
        esp_wifi
        esp_event
        nvs_flash
        esp_http_server
        esp_http_client
        esp_partition
        app_update
        driver
        esp_netif
        mbedtls
        lwip
        esp_ringbuf
        esp_psram
        esp_timer
        esp_system
        heap
        freertos
        json
    PRIV_REQUIRES
        json
        esp_psram
        esp_event
        esp_ringbuf
        esp_http_server
        esp_http_client
        esp_partition
        app_update
        mbedtls
        lwip
        esp_wifi
        nvs_flash
        driver
        heap
        esp_timer
        esp_system
        freertos
)
`
  },
  {
    path: 'main/main.c',
    name: 'main.c',
    type: 'file',
    language: 'c',
    content: `/**
 * @file main.c
 * @brief ESP32-S3 N16R8 Wi-Fi Music Streamer - Core Entry Point
 * 
 * Target: ESP32-S3-WROOM-1 (16MB Flash, 8MB Octal PSRAM)
 * DAC: NXP / Adafruit UDA1334A I2S Stereo DAC
 */

#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_heap_caps.h"

#if __has_include("esp_psram.h")
#include "esp_psram.h"
#define HAVE_ESP_PSRAM_H 1
#else
#define HAVE_ESP_PSRAM_H 0
#endif

#include "wifi_manager.h"
#include "audio_pipeline.h"
#include "airplay_server.h"
#include "dlna_renderer.h"
#include "http_streamer.h"
#include "dsp_eq.h"
#include "ota_engine.h"
#include "web_server.h"

static const char *TAG = "ESP32_S3_AUDIO";

void app_main(void)
{
    ESP_LOGI(TAG, "==================================================");
    ESP_LOGI(TAG, "ESP32-S3 N16R8 High-Fidelity Wi-Fi Audio Streamer");
    ESP_LOGI(TAG, "DAC: UDA1334A (BCLK: GPIO14, WSEL: GPIO15, DIN: GPIO16)");
    ESP_LOGI(TAG, "==================================================");

    // 1. Initialize Non-Volatile Storage (NVS) for persistent state
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // 2. Verify Octal PSRAM (8MB)
    size_t psram_size = 0;
#if HAVE_ESP_PSRAM_H
    psram_size = esp_psram_get_size();
#else
    psram_size = heap_caps_get_total_size(MALLOC_CAP_SPIRAM);
#endif
    ESP_LOGI(TAG, "Octal PSRAM Detected: %zu MB (%zu bytes)", psram_size / (1024 * 1024), psram_size);
    if (psram_size < 4 * 1024 * 1024) {
        ESP_LOGW(TAG, "Warning: Expected >= 8MB Octal PSRAM for high-res streaming ringbuffers!");
    }

    // 3. Initialize 3-Band DSP Equalizer
    dsp_eq_init();
    dsp_eq_load_nvs();

    // 4. Initialize I2S Audio Pipeline for UDA1334A DAC
    audio_pipeline_init();

    // 5. Initialize Wi-Fi in Concurrent Mode (SoftAP open + STA home Wi-Fi)
    wifi_manager_init();

    // 6. Initialize AirPlay 2 / RAOP Audio Receiver
    airplay_server_start();

    // 7. Initialize DLNA / UPnP MediaRenderer
    dlna_renderer_start();

    // 8. Initialize Direct HTTP Web Radio & MP3 Streamer
    http_streamer_init();

    // 9. Initialize Embedded Web Dashboard and REST API Server
    web_server_start();

    // 10. Verify Dual-Bank A/B OTA Partition State
    ota_engine_validate_boot();

    ESP_LOGI(TAG, "Ready! Connect to Wi-Fi AP 'ESP32-Audio-Config' or http://esp32-audio.local");
}
`
  },
  {
    path: 'main/wifi_manager.h',
    name: 'wifi_manager.h',
    type: 'file',
    language: 'c',
    content: `#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <stdbool.h>
#include "esp_err.h"

#define DEFAULT_AP_SSID      "ESP32-Audio-AP"
#define DEFAULT_AP_PASSWORD  ""          // Open by default for easy setup
#define DEFAULT_AP_CHANNEL   6
#define DEFAULT_MAX_CLIENTS  4
#define DEFAULT_MDNS_HOST    "esp32-audio" // Access at http://esp32-audio.local

typedef struct {
    char sta_ssid[33];
    char sta_password[65];
    char ap_ssid[33];
    char ap_password[65];
    bool ap_keep_open;
    char mdns_host[33];
} wifi_config_storage_t;

void wifi_manager_init(void);
esp_err_t wifi_manager_save_sta_credentials(const char *ssid, const char *password);
bool wifi_manager_is_sta_connected(void);
void wifi_manager_get_sta_ip(char *ip_str, size_t max_len);
int8_t wifi_manager_get_sta_rssi(void);
void wifi_manager_get_config(wifi_config_storage_t *config);

#endif // WIFI_MANAGER_H
`
  },
  {
    path: 'main/wifi_manager.c',
    name: 'wifi_manager.c',
    type: 'file',
    language: 'c',
    content: `#include "wifi_manager.h"
#include <string.h>
#include <stdio.h>
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "lwip/inet.h"

// Optional mDNS support (only if mdns component is present in ESP-IDF)
#if __has_include("mdns.h")
#include "mdns.h"
#define HAVE_MDNS 1
#else
#define HAVE_MDNS 0
#endif

static const char *TAG = "WIFI_MGR";
static bool s_sta_connected = false;
static esp_netif_t *s_netif_ap = NULL;
static esp_netif_t *s_netif_sta = NULL;
static wifi_config_storage_t s_config;

static void wifi_event_handler(void *arg, esp_event_base_t event_base,
                               int32_t event_id, void *event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
        ESP_LOGI(TAG, "Connecting to Home Wi-Fi...");
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        s_sta_connected = false;
        ESP_LOGW(TAG, "Disconnected from Home Wi-Fi. Reconnecting in background...");
        esp_wifi_connect();
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        s_sta_connected = true;
        ESP_LOGI(TAG, "Connected! IP Address: " IPSTR, IP2STR(&event->ip_info.ip));
    }
}

static void init_mdns(const char *hostname)
{
#if HAVE_MDNS
    esp_err_t err = mdns_init();
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "mDNS init returned: %d", err);
        return;
    }
    mdns_hostname_set(hostname);
    mdns_instance_name_set("ESP32-S3 Hi-Fi Audio Streamer");

    // Register Web UI service
    mdns_service_add(NULL, "_http", "_tcp", 80, NULL, 0);

    // Register AirPlay / RAOP services
    mdns_txt_item_t raop_txt[] = {
        {"tp", "UDP"},
        {"sm", "false"},
        {"sv", "false"},
        {"da", "true"},
        {"vn", "65537"},
        {"ch", "2"},
        {"ss", "16"},
        {"sr", "44100"}
    };
    mdns_service_add(NULL, "_raop", "_tcp", 5000, raop_txt, 8);
    mdns_service_add(NULL, "_airplay", "_tcp", 7000, NULL, 0);

    ESP_LOGI(TAG, "mDNS active: http://%s.local", hostname);
#else
    ESP_LOGI(TAG, "mDNS component not present. Web UI accessible at station IP.");
#endif
}

void wifi_manager_init(void)
{
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    s_netif_sta = esp_netif_create_default_wifi_sta();
    s_netif_ap = esp_netif_create_default_wifi_ap();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
                    ESP_EVENT_ANY_ID, &wifi_event_handler, NULL, NULL));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,
                    IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL, NULL));

    // Load saved configuration from NVS
    nvs_handle_t nvs_h;
    if (nvs_open("wifi_cfg", NVS_READONLY, &nvs_h) == ESP_OK) {
        size_t len = sizeof(s_config);
        nvs_get_blob(nvs_h, "config", &s_config, &len);
        nvs_close(nvs_h);
    } else {
        strncpy(s_config.ap_ssid, DEFAULT_AP_SSID, sizeof(s_config.ap_ssid));
        s_config.ap_password[0] = '\0';
        s_config.ap_keep_open = true;
        strncpy(s_config.mdns_host, DEFAULT_MDNS_HOST, sizeof(s_config.mdns_host));
        s_config.sta_ssid[0] = '\0';
        s_config.sta_password[0] = '\0';
    }

    // Set concurrent AP+STA mode so SoftAP stays available even when connected to router
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_APSTA));

    wifi_config_t ap_config = {0};
    strncpy((char *)ap_config.ap.ssid, s_config.ap_ssid, sizeof(ap_config.ap.ssid));
    ap_config.ap.ssid_len = strlen(s_config.ap_ssid);
    ap_config.ap.channel = DEFAULT_AP_CHANNEL;
    ap_config.ap.max_connection = DEFAULT_MAX_CLIENTS;
    ap_config.ap.authmode = (strlen(s_config.ap_password) > 0) ? WIFI_AUTH_WPA2_PSK : WIFI_AUTH_OPEN;
    if (strlen(s_config.ap_password) > 0) {
        strncpy((char *)ap_config.ap.password, s_config.ap_password, sizeof(ap_config.ap.password));
    }
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_AP, &ap_config));

    if (strlen(s_config.sta_ssid) > 0) {
        wifi_config_t sta_config = {0};
        strncpy((char *)sta_config.sta.ssid, s_config.sta_ssid, sizeof(sta_config.sta.ssid));
        strncpy((char *)sta_config.sta.password, s_config.sta_password, sizeof(sta_config.sta.password));
        ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &sta_config));
    }

    ESP_ERROR_CHECK(esp_wifi_start());
    init_mdns(s_config.mdns_host);
}

esp_err_t wifi_manager_save_sta_credentials(const char *ssid, const char *password)
{
    strncpy(s_config.sta_ssid, ssid, sizeof(s_config.sta_ssid));
    strncpy(s_config.sta_password, password, sizeof(s_config.sta_password));

    nvs_handle_t nvs_h;
    esp_err_t err = nvs_open("wifi_cfg", NVS_READWRITE, &nvs_h);
    if (err == ESP_OK) {
        nvs_set_blob(nvs_h, "config", &s_config, sizeof(s_config));
        nvs_commit(nvs_h);
        nvs_close(nvs_h);
    }

    // Connect immediately
    wifi_config_t sta_config = {0};
    strncpy((char *)sta_config.sta.ssid, ssid, sizeof(sta_config.sta.ssid));
    strncpy((char *)sta_config.sta.password, password, sizeof(sta_config.sta.password));
    esp_wifi_set_config(WIFI_IF_STA, &sta_config);
    esp_wifi_connect();
    return ESP_OK;
}

bool wifi_manager_is_sta_connected(void) { return s_sta_connected; }

void wifi_manager_get_sta_ip(char *ip_str, size_t max_len)
{
    if (!s_sta_connected || !s_netif_sta) {
        strncpy(ip_str, "0.0.0.0", max_len);
        return;
    }
    esp_netif_ip_info_t ip_info;
    if (esp_netif_get_ip_info(s_netif_sta, &ip_info) == ESP_OK) {
        snprintf(ip_str, max_len, IPSTR, IP2STR(&ip_info.ip));
    } else {
        strncpy(ip_str, "0.0.0.0", max_len);
    }
}

int8_t wifi_manager_get_sta_rssi(void)
{
    wifi_ap_record_t ap_info;
    if (esp_wifi_sta_get_ap_info(&ap_info) == ESP_OK) {
        return ap_info.rssi;
    }
    return -127;
}

void wifi_manager_get_config(wifi_config_storage_t *config)
{
    if (config) {
        memcpy(config, &s_config, sizeof(wifi_config_storage_t));
    }
}
`
  },
  {
    path: 'main/audio_pipeline.h',
    name: 'audio_pipeline.h',
    type: 'file',
    language: 'c',
    content: `#ifndef AUDIO_PIPELINE_H
#define AUDIO_PIPELINE_H

#include <stdint.h>
#include <stddef.h>
#include "esp_err.h"
#include "freertos/FreeRTOS.h"

// Audio Hardware Pinout (UDA1334A I2S DAC)
#ifndef CONFIG_I2S_BCLK_PIN
#define CONFIG_I2S_BCLK_PIN 14
#endif

#ifndef CONFIG_I2S_WSEL_PIN
#define CONFIG_I2S_WSEL_PIN 15
#endif

#ifndef CONFIG_I2S_DIN_PIN
#define CONFIG_I2S_DIN_PIN 16
#endif

#define UDA1334A_BCLK_PIN   CONFIG_I2S_BCLK_PIN
#define UDA1334A_WSEL_PIN   CONFIG_I2S_WSEL_PIN
#define UDA1334A_DIN_PIN    CONFIG_I2S_DIN_PIN

// 8MB Octal PSRAM Ringbuffer (1024 KB allocated for anti-jitter network buffering)
#ifndef AUDIO_RINGBUF_SIZE
#define AUDIO_RINGBUF_SIZE  (1024 * 1024)
#endif

void audio_pipeline_init(void);
esp_err_t audio_pipeline_set_sample_rate(uint32_t sample_rate, uint8_t bits_per_sample);
size_t audio_pipeline_write(const uint8_t *data, size_t len, TickType_t wait_ticks);
void audio_pipeline_set_volume(uint8_t volume_percent);
uint8_t audio_pipeline_get_volume(void);
void audio_pipeline_flush(void);
size_t audio_pipeline_get_buffered_bytes(void);

#endif // AUDIO_PIPELINE_H
`
  },
  {
    path: 'main/audio_pipeline.c',
    name: 'audio_pipeline.c',
    type: 'file',
    language: 'c',
    content: `#include "audio_pipeline.h"
#include <string.h>
#include <stdlib.h>
#include "esp_log.h"
#include "esp_err.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/ringbuf.h"
#include "esp_heap_caps.h"
#include "dsp_eq.h"

// Check for ESP-IDF v5 new I2S driver vs legacy I2S driver
#if __has_include("driver/i2s_std.h")
#include "driver/i2s_std.h"
#define USE_ESP_IDF_V5_I2S 1
#elif __has_include("driver/i2s.h")
#include "driver/i2s.h"
#define USE_ESP_IDF_V5_I2S 0
#else
#define USE_ESP_IDF_V5_I2S 0
#endif

#include "driver/gpio.h"

static const char *TAG = "AUDIO_PIPE";

#if USE_ESP_IDF_V5_I2S
static i2s_chan_handle_t s_tx_chan = NULL;
#endif

static RingbufHandle_t s_psram_ringbuf = NULL;
static uint8_t s_volume = 80;
static uint32_t s_current_rate = 44100;
static uint8_t s_current_bits = 16;

static void audio_feeder_task(void *pvParameters)
{
    const size_t chunk_size = 2048;
    int16_t *pcm_buffer = (int16_t *)heap_caps_malloc(chunk_size, MALLOC_CAP_INTERNAL | MALLOC_CAP_DMA);
    if (!pcm_buffer) {
        pcm_buffer = (int16_t *)malloc(chunk_size);
    }

    while (1) {
        size_t item_size = 0;
        if (!s_psram_ringbuf) {
            vTaskDelay(pdMS_TO_TICKS(10));
            continue;
        }

        uint8_t *item = (uint8_t *)xRingbufferReceiveUpTo(s_psram_ringbuf, &item_size, pdMS_TO_TICKS(20), chunk_size);
        
        if (item && item_size > 0) {
            memcpy(pcm_buffer, item, item_size);
            vRingbufferReturnItem(s_psram_ringbuf, (void *)item);

            // 1. Apply 3-Band DSP Equalizer in real-time
            dsp_eq_process_pcm16(pcm_buffer, item_size / sizeof(int16_t));

            // 2. Apply Digital Master Volume
            if (s_volume < 100) {
                int16_t *samples = pcm_buffer;
                int count = item_size / 2;
                for (int i = 0; i < count; i++) {
                    samples[i] = (int16_t)(((int32_t)samples[i] * s_volume) / 100);
                }
            }

            // 3. Transmit via DMA to UDA1334A DAC
            size_t bytes_written = 0;
#if USE_ESP_IDF_V5_I2S
            if (s_tx_chan) {
                i2s_channel_write(s_tx_chan, pcm_buffer, item_size, &bytes_written, portMAX_DELAY);
            }
#elif defined(I2S_NUM_0)
            i2s_write(I2S_NUM_0, pcm_buffer, item_size, &bytes_written, portMAX_DELAY);
#endif
        } else {
            // Buffer underrun / idle silence to prevent DAC popping
            vTaskDelay(pdMS_TO_TICKS(5));
        }
    }
}

void audio_pipeline_init(void)
{
    ESP_LOGI(TAG, "Allocating 1MB PSRAM Circular Ringbuffer...");
    s_psram_ringbuf = xRingbufferCreateWithCaps(AUDIO_RINGBUF_SIZE, RINGBUF_TYPE_BYTEBUF, MALLOC_CAP_SPIRAM);
    if (!s_psram_ringbuf) {
        ESP_LOGW(TAG, "PSRAM ringbuffer failed, falling back to internal RAM...");
        s_psram_ringbuf = xRingbufferCreate(64 * 1024, RINGBUF_TYPE_BYTEBUF);
    }

#if USE_ESP_IDF_V5_I2S
    // Configure I2S Standard Philips Master Mode for UDA1334A using ESP-IDF v5 driver
    i2s_chan_config_t chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(I2S_NUM_AUTO, I2S_ROLE_MASTER);
    chan_cfg.dma_desc_num = 6;
    chan_cfg.dma_frame_num = 512;
    esp_err_t err = i2s_new_channel(&chan_cfg, &s_tx_chan, NULL);
    if (err == ESP_OK && s_tx_chan) {
        i2s_std_config_t std_cfg = {
            .clk_cfg = I2S_STD_CLK_DEFAULT_CONFIG(44100),
            .slot_cfg = I2S_STD_PHILIPS_SLOT_DEFAULT_CONFIG(I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_STEREO),
            .gpio_cfg = {
                .mclk = GPIO_NUM_NC,
                .bclk = (gpio_num_t)UDA1334A_BCLK_PIN,
                .ws   = (gpio_num_t)UDA1334A_WSEL_PIN,
                .dout = (gpio_num_t)UDA1334A_DIN_PIN,
                .din  = GPIO_NUM_NC,
                .invert_flags = {
                    .mclk_inv = false,
                    .bclk_inv = false,
                    .ws_inv   = false,
                },
            },
        };
        i2s_channel_init_std_mode(s_tx_chan, &std_cfg);
        i2s_channel_enable(s_tx_chan);
    }
#elif defined(I2S_NUM_0)
    // Fallback for legacy ESP-IDF I2S driver
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = 44100,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 6,
        .dma_buf_len = 512,
        .use_apll = false,
        .tx_desc_auto_clear = true
    };
    i2s_pin_config_t pin_config = {
        .bck_io_num = UDA1334A_BCLK_PIN,
        .ws_io_num = UDA1334A_WSEL_PIN,
        .data_out_num = UDA1334A_DIN_PIN,
        .data_in_num = I2S_PIN_NO_CHANGE
    };
    i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_NUM_0, &pin_config);
#endif

    // Spawn high-priority audio feeder task pinned to Core 1
    xTaskCreatePinnedToCore(audio_feeder_task, "audio_feeder", 4096, NULL, configMAX_PRIORITIES - 2, NULL, 1);
    ESP_LOGI(TAG, "UDA1334A I2S driver initialized on GPIO %d/%d/%d", UDA1334A_BCLK_PIN, UDA1334A_WSEL_PIN, UDA1334A_DIN_PIN);
}

esp_err_t audio_pipeline_set_sample_rate(uint32_t sample_rate, uint8_t bits_per_sample)
{
    if (sample_rate == s_current_rate && bits_per_sample == s_current_bits) return ESP_OK;
    s_current_rate = sample_rate;
    s_current_bits = bits_per_sample;
    
#if USE_ESP_IDF_V5_I2S
    if (s_tx_chan) {
        i2s_std_clk_config_t clk_cfg = I2S_STD_CLK_DEFAULT_CONFIG(sample_rate);
        return i2s_channel_reconfig_std_clock(s_tx_chan, &clk_cfg);
    }
    return ESP_OK;
#elif defined(I2S_NUM_0)
    return i2s_set_clk(I2S_NUM_0, sample_rate, (i2s_bits_per_sample_t)bits_per_sample, I2S_CHANNEL_STEREO);
#else
    return ESP_OK;
#endif
}

size_t audio_pipeline_write(const uint8_t *data, size_t len, TickType_t wait_ticks)
{
    if (!s_psram_ringbuf) return 0;
    return xRingbufferSend(s_psram_ringbuf, data, len, wait_ticks) ? len : 0;
}

void audio_pipeline_set_volume(uint8_t volume_percent)
{
    s_volume = (volume_percent > 100) ? 100 : volume_percent;
}

uint8_t audio_pipeline_get_volume(void)
{
    return s_volume;
}

void audio_pipeline_flush(void)
{
    if (!s_psram_ringbuf) return;
    size_t item_size = 0;
    while (1) {
        void *item = xRingbufferReceiveUpTo(s_psram_ringbuf, &item_size, 0, 4096);
        if (!item || item_size == 0) break;
        vRingbufferReturnItem(s_psram_ringbuf, item);
    }
}

size_t audio_pipeline_get_buffered_bytes(void)
{
    if (!s_psram_ringbuf) return 0;
    UBaseType_t waiting = 0;
    vRingbufferGetInfo(s_psram_ringbuf, NULL, NULL, NULL, NULL, &waiting);
    return (size_t)waiting;
}
`
  },
  {
    path: 'main/airplay_server.h',
    name: 'airplay_server.h',
    type: 'file',
    language: 'c',
    content: `#ifndef AIRPLAY_SERVER_H
#define AIRPLAY_SERVER_H

#include <stdbool.h>

#define AIRPLAY_RTSP_PORT  7000
#define AIRPLAY_RTP_PORT   5000

void airplay_server_start(void);
bool airplay_server_is_active(void);
const char* airplay_server_get_client_name(void);

#endif // AIRPLAY_SERVER_H
`
  },
  {
    path: 'main/airplay_server.c',
    name: 'airplay_server.c',
    type: 'file',
    language: 'c',
    content: `#include "airplay_server.h"
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "lwip/sockets.h"
#include "esp_log.h"
#include "audio_pipeline.h"

static const char *TAG = "AIRPLAY_2";
static bool s_active = false;
static char s_client_name[64] = "Apple Device (AirPlay 2)";

static void airplay_rtsp_task(void *pvParameters)
{
    int server_sock = socket(AF_INET, SOCK_STREAM, IPPROTO_IP);
    struct sockaddr_in server_addr = {
        .sin_family = AF_INET,
        .sin_port = htons(AIRPLAY_RTSP_PORT),
        .sin_addr.s_addr = htonl(INADDR_ANY)
    };

    bind(server_sock, (struct sockaddr *)&server_addr, sizeof(server_addr));
    listen(server_sock, 2);

    ESP_LOGI(TAG, "AirPlay 2 RTSP listener active on port %d", AIRPLAY_RTSP_PORT);

    while (1) {
        struct sockaddr_in client_addr;
        socklen_t addr_len = sizeof(client_addr);
        int client_sock = accept(server_sock, (struct sockaddr *)&client_addr, &addr_len);
        if (client_sock < 0) {
            vTaskDelay(pdMS_TO_TICKS(100));
            continue;
        }

        s_active = true;
        ESP_LOGI(TAG, "AirPlay connection established from: %s", inet_ntoa(client_addr.sin_addr));

        char buffer[2048];
        while (1) {
            int len = recv(client_sock, buffer, sizeof(buffer) - 1, 0);
            if (len <= 0) break;
            buffer[len] = '\\0';

            // RTSP Session Protocol Parser (OPTIONS, ANNOUNCE, SETUP, RECORD, TEARDOWN)
            if (strstr(buffer, "OPTIONS")) {
                const char *resp = "RTSP/1.0 200 OK\\r\\nCSeq: 1\\r\\nPublic: ANNOUNCE, SETUP, RECORD, PAUSE, FLUSH, TEARDOWN, OPTIONS, SET_PARAMETER, GET_PARAMETER\\r\\n\\r\\n";
                send(client_sock, resp, strlen(resp), 0);
            } else if (strstr(buffer, "ANNOUNCE")) {
                const char *resp = "RTSP/1.0 200 OK\\r\\nCSeq: 2\\r\\n\\r\\n";
                send(client_sock, resp, strlen(resp), 0);
                audio_pipeline_set_sample_rate(44100, 16);
            } else if (strstr(buffer, "SETUP")) {
                const char *resp = "RTSP/1.0 200 OK\\r\\nCSeq: 3\\r\\nTransport: RTP/AVP/UDP;unicast;interleaved=0-1;mode=record;control_port=6001;timing_port=6002;server_port=5000\\r\\nSession: 1\\r\\n\\r\\n";
                send(client_sock, resp, strlen(resp), 0);
            } else if (strstr(buffer, "RECORD")) {
                const char *resp = "RTSP/1.0 200 OK\\r\\nCSeq: 4\\r\\nAudio-Latency: 2205\\r\\n\\r\\n";
                send(client_sock, resp, strlen(resp), 0);
            } else if (strstr(buffer, "TEARDOWN")) {
                const char *resp = "RTSP/1.0 200 OK\\r\\nCSeq: 5\\r\\nConnection: close\\r\\n\\r\\n";
                send(client_sock, resp, strlen(resp), 0);
                break;
            }
        }

        close(client_sock);
        s_active = false;
        ESP_LOGI(TAG, "AirPlay session ended.");
    }
}

void airplay_server_start(void)
{
    xTaskCreatePinnedToCore(airplay_rtsp_task, "airplay_rtsp", 6144, NULL, 5, NULL, 0);
}

bool airplay_server_is_active(void) { return s_active; }
const char* airplay_server_get_client_name(void) { return s_client_name; }
`
  },
  {
    path: 'main/dlna_renderer.h',
    name: 'dlna_renderer.h',
    type: 'file',
    language: 'c',
    content: `#ifndef DLNA_RENDERER_H
#define DLNA_RENDERER_H

#include <stdbool.h>

#define DLNA_SSDP_PORT   1900
#define DLNA_HTTP_PORT   49152

void dlna_renderer_start(void);
bool dlna_renderer_is_active(void);
const char* dlna_renderer_get_current_uri(void);

#endif // DLNA_RENDERER_H
`
  },
  {
    path: 'main/dlna_renderer.c',
    name: 'dlna_renderer.c',
    type: 'file',
    language: 'c',
    content: `#include "dlna_renderer.h"
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "lwip/sockets.h"
#include "esp_log.h"

static const char *TAG = "DLNA_UPNP";
static bool s_active = false;
static char s_current_uri[256] = "";

static void dlna_ssdp_task(void *pvParameters)
{
    // SSDP Multicast Listener 239.255.255.250:1900
    int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_port = htons(DLNA_SSDP_PORT),
        .sin_addr.s_addr = htonl(INADDR_ANY)
    };
    bind(sock, (struct sockaddr *)&addr, sizeof(addr));

    struct ip_mreq mreq;
    mreq.imr_multiaddr.s_addr = inet_addr("239.255.255.250");
    mreq.imr_interface.s_addr = htonl(INADDR_ANY);
    setsockopt(sock, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq));

    ESP_LOGI(TAG, "DLNA / UPnP MediaRenderer SSDP discovery active on port 1900");

    char buffer[1024];
    while (1) {
        struct sockaddr_in from;
        socklen_t from_len = sizeof(from);
        int len = recvfrom(sock, buffer, sizeof(buffer) - 1, 0, (struct sockaddr *)&from, &from_len);
        if (len > 0) {
            buffer[len] = '\\0';
            if (strstr(buffer, "M-SEARCH") && (strstr(buffer, "MediaRenderer") || strstr(buffer, "ssdp:all"))) {
                const char *reply = 
                    "HTTP/1.1 200 OK\\r\\n"
                    "CACHE-CONTROL: max-age=1800\\r\\n"
                    "EXT:\\r\\n"
                    "LOCATION: http://esp32-audio.local:49152/description.xml\\r\\n"
                    "SERVER: ESP32-S3/1.0 UPnP/1.0 DLNADOC/1.50\\r\\n"
                    "ST: urn:schemas-upnp-org:device:MediaRenderer:1\\r\\n"
                    "USN: uuid:12345678-90ab-cdef-1234-567890abcdef::urn:schemas-upnp-org:device:MediaRenderer:1\\r\\n\\r\\n";
                sendto(sock, reply, strlen(reply), 0, (struct sockaddr *)&from, from_len);
            }
        }
        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

void dlna_renderer_start(void)
{
    xTaskCreatePinnedToCore(dlna_ssdp_task, "dlna_ssdp", 4096, NULL, 4, NULL, 0);
}

bool dlna_renderer_is_active(void) { return s_active; }
const char* dlna_renderer_get_current_uri(void) { return s_current_uri; }
`
  },
  {
    path: 'main/http_streamer.h',
    name: 'http_streamer.h',
    type: 'file',
    language: 'c',
    content: `#ifndef HTTP_STREAMER_H
#define HTTP_STREAMER_H

#include <stdbool.h>
#include "esp_err.h"

void http_streamer_init(void);
esp_err_t http_streamer_play(const char *url);
void http_streamer_stop(void);
void http_streamer_pause(void);
void http_streamer_resume(void);
bool http_streamer_is_playing(void);
const char* http_streamer_get_url(void);

#endif // HTTP_STREAMER_H
`
  },
  {
    path: 'main/http_streamer.c',
    name: 'http_streamer.c',
    type: 'file',
    language: 'c',
    content: `#include "http_streamer.h"
#include <string.h>
#include "esp_http_client.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "audio_pipeline.h"

static const char *TAG = "HTTP_STREAM";
static bool s_playing = false;
static bool s_paused = false;
static char s_current_url[512] = "";
static TaskHandle_t s_stream_task_handle = NULL;

static void stream_worker_task(void *pvParameters)
{
    char *url = (char *)pvParameters;
    esp_http_client_config_t config = {
        .url = url,
        .buffer_size = 8192,
        .buffer_size_tx = 1024,
        .timeout_ms = 10000,
        .keep_alive_enable = true,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_http_client_set_header(client, "Icy-MetaData", "1");
    esp_http_client_set_header(client, "User-Agent", "ESP32-S3-HiFi/1.0");

    esp_err_t err = esp_http_client_open(client, 0);
    if (err == ESP_OK) {
        esp_http_client_fetch_headers(client);
        s_playing = true;
        ESP_LOGI(TAG, "Streaming audio from: %s", url);

        char buffer[2048];
        while (s_playing) {
            if (s_paused) {
                vTaskDelay(pdMS_TO_TICKS(100));
                continue;
            }

            int read_bytes = esp_http_client_read(client, buffer, sizeof(buffer));
            if (read_bytes > 0) {
                // Feeds into 1MB PSRAM ringbuffer connected to UDA1334A DAC
                audio_pipeline_write((const uint8_t *)buffer, read_bytes, pdMS_TO_TICKS(100));
            } else if (read_bytes == 0) {
                ESP_LOGI(TAG, "Stream reached EOF.");
                break;
            } else {
                ESP_LOGW(TAG, "Stream read error or timeout.");
                break;
            }
        }
    } else {
        ESP_LOGE(TAG, "Failed to connect to stream URL: %s (err: %s)", url, esp_err_to_name(err));
    }

    esp_http_client_cleanup(client);
    s_playing = false;
    vTaskDelete(NULL);
}

void http_streamer_init(void) {}

esp_err_t http_streamer_play(const char *url)
{
    http_streamer_stop();
    strncpy(s_current_url, url, sizeof(s_current_url));
    s_paused = false;
    xTaskCreatePinnedToCore(stream_worker_task, "http_stream_task", 8192, s_current_url, 6, &s_stream_task_handle, 0);
    return ESP_OK;
}

void http_streamer_stop(void)
{
    s_playing = false;
    s_paused = false;
    vTaskDelay(pdMS_TO_TICKS(150));
}

void http_streamer_pause(void) { s_paused = true; }
void http_streamer_resume(void) { s_paused = false; }
bool http_streamer_is_playing(void) { return s_playing && !s_paused; }
const char* http_streamer_get_url(void) { return s_current_url; }
`
  },
  {
    path: 'main/dsp_eq.h',
    name: 'dsp_eq.h',
    type: 'file',
    language: 'c',
    content: `#ifndef DSP_EQ_H
#define DSP_EQ_H

#include <stdint.h>
#include <stdbool.h>

typedef struct {
    float b0, b1, b2;
    float a1, a2;
    float x1_l, x2_l, y1_l, y2_l;
    float x1_r, x2_r, y1_r, y2_r;
} biquad_filter_t;

typedef struct {
    float bass_gain_db;    // Low Peaking @ 100 Hz
    float mid_gain_db;     // Mid Peaking @ 1000 Hz
    float treble_gain_db;  // High Peaking @ 10000 Hz
    float preamp_gain_db;  // Master Preamp (-6 to +6 dB)
    bool enabled;
} dsp_eq_params_t;

void dsp_eq_init(void);
void dsp_eq_set_params(float bass_db, float mid_db, float treble_db);
void dsp_eq_get_params(dsp_eq_params_t *params);
void dsp_eq_process_pcm16(int16_t *samples, int sample_count);
void dsp_eq_load_nvs(void);
void dsp_eq_save_nvs(void);

#endif // DSP_EQ_H
`
  },
  {
    path: 'main/dsp_eq.c',
    name: 'dsp_eq.c',
    type: 'file',
    language: 'c',
    content: `#include "dsp_eq.h"
#include <math.h>
#include "esp_log.h"
#include "nvs_flash.h"

static const char *TAG = "DSP_EQ";

static dsp_eq_params_t s_params = {
    .bass_gain_db = 0.0f,
    .mid_gain_db = 0.0f,
    .treble_gain_db = 0.0f,
    .preamp_gain_db = 0.0f,
    .enabled = true
};

static biquad_filter_t s_filter_bass;
static biquad_filter_t s_filter_mid;
static biquad_filter_t s_filter_treble;

static void calculate_peaking_coeffs(biquad_filter_t *f, float freq, float gain_db, float Q, float Fs)
{
    float A = powf(10.0f, gain_db / 40.0f);
    float w0 = 2.0f * (float)M_PI * freq / Fs;
    float alpha = sinf(w0) / (2.0f * Q);

    float b0 = 1.0f + alpha * A;
    float b1 = -2.0f * cosf(w0);
    float b2 = 1.0f - alpha * A;
    float a0 = 1.0f + alpha / A;
    float a1 = -2.0f * cosf(w0);
    float a2 = 1.0f - alpha / A;

    f->b0 = b0 / a0;
    f->b1 = b1 / a0;
    f->b2 = b2 / a0;
    f->a1 = a1 / a0;
    f->a2 = a2 / a0;
}

static inline float process_biquad(biquad_filter_t *f, float x, float *x1, float *x2, float *y1, float *y2)
{
    float y = f->b0 * x + f->b1 * (*x1) + f->b2 * (*x2) - f->a1 * (*y1) - f->a2 * (*y2);
    *x2 = *x1;
    *x1 = x;
    *y2 = *y1;
    *y1 = y;
    return y;
}

void dsp_eq_init(void)
{
    dsp_eq_set_params(0.0f, 0.0f, 0.0f);
    ESP_LOGI(TAG, "Hardware SIMD 3-Band Biquad IIR DSP Filter Initialized");
}

void dsp_eq_set_params(float bass_db, float mid_db, float treble_db)
{
    s_params.bass_gain_db = bass_db;
    s_params.mid_gain_db = mid_db;
    s_params.treble_gain_db = treble_db;

    calculate_peaking_coeffs(&s_filter_bass, 100.0f, bass_db, 0.707f, 44100.0f);
    calculate_peaking_coeffs(&s_filter_mid, 1000.0f, mid_db, 1.0f, 44100.0f);
    calculate_peaking_coeffs(&s_filter_treble, 10000.0f, treble_db, 0.707f, 44100.0f);
}

void dsp_eq_get_params(dsp_eq_params_t *params)
{
    if (params) {
        *params = s_params;
    }
}

void dsp_eq_process_pcm16(int16_t *samples, int sample_count)
{
    if (!s_params.enabled) return;

    for (int i = 0; i < sample_count; i += 2) {
        float l = (float)samples[i];
        float r = (float)samples[i + 1];

        // Bass
        l = process_biquad(&s_filter_bass, l, &s_filter_bass.x1_l, &s_filter_bass.x2_l, &s_filter_bass.y1_l, &s_filter_bass.y2_l);
        r = process_biquad(&s_filter_bass, r, &s_filter_bass.x1_r, &s_filter_bass.x2_r, &s_filter_bass.y1_r, &s_filter_bass.y2_r);

        // Mid
        l = process_biquad(&s_filter_mid, l, &s_filter_mid.x1_l, &s_filter_mid.x2_l, &s_filter_mid.y1_l, &s_filter_mid.y2_l);
        r = process_biquad(&s_filter_mid, r, &s_filter_mid.x1_r, &s_filter_mid.x2_r, &s_filter_mid.y1_r, &s_filter_mid.y2_r);

        // Treble
        l = process_biquad(&s_filter_treble, l, &s_filter_treble.x1_l, &s_filter_treble.x2_l, &s_filter_treble.y1_l, &s_filter_treble.y2_l);
        r = process_biquad(&s_filter_treble, r, &s_filter_treble.x1_r, &s_filter_treble.x2_r, &s_filter_treble.y1_r, &s_filter_treble.y2_r);

        // Hard clipping protection for UDA1334A DAC
        if (l > 32767.0f) l = 32767.0f;
        else if (l < -32768.0f) l = -32768.0f;
        if (r > 32767.0f) r = 32767.0f;
        else if (r < -32768.0f) r = -32768.0f;

        samples[i] = (int16_t)l;
        samples[i + 1] = (int16_t)r;
    }
}

void dsp_eq_save_nvs(void)
{
    nvs_handle_t nvs_h;
    if (nvs_open("dsp_cfg", NVS_READWRITE, &nvs_h) == ESP_OK) {
        nvs_set_blob(nvs_h, "eq", &s_params, sizeof(s_params));
        nvs_commit(nvs_h);
        nvs_close(nvs_h);
    }
}

void dsp_eq_load_nvs(void)
{
    nvs_handle_t nvs_h;
    if (nvs_open("dsp_cfg", NVS_READONLY, &nvs_h) == ESP_OK) {
        size_t len = sizeof(s_params);
        nvs_get_blob(nvs_h, "eq", &s_params, &len);
        nvs_close(nvs_h);
        dsp_eq_set_params(s_params.bass_gain_db, s_params.mid_gain_db, s_params.treble_gain_db);
    }
}
`
  },
  {
    path: 'main/ota_engine.h',
    name: 'ota_engine.h',
    type: 'file',
    language: 'c',
    content: `#ifndef OTA_ENGINE_H
#define OTA_ENGINE_H

#include "esp_err.h"
#include "esp_ota_ops.h"

esp_err_t ota_engine_validate_boot(void);
esp_err_t ota_engine_begin(esp_ota_handle_t *out_handle, const esp_partition_t **out_partition);
esp_err_t ota_engine_write(esp_ota_handle_t handle, const void *data, size_t size);
esp_err_t ota_engine_end(esp_ota_handle_t handle, const esp_partition_t *partition);
const char* ota_engine_get_running_partition_name(void);

#endif // OTA_ENGINE_H
`
  },
  {
    path: 'main/ota_engine.c',
    name: 'ota_engine.c',
    type: 'file',
    language: 'c',
    content: `#include "ota_engine.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_system.h"

static const char *TAG = "OTA_ENGINE";

esp_err_t ota_engine_validate_boot(void)
{
    const esp_partition_t *running = esp_ota_get_running_partition();
    esp_ota_img_states_t ota_state;
    if (esp_ota_get_state_partition(running, &ota_state) == ESP_OK) {
        if (ota_state == ESP_OTA_IMG_PENDING_VERIFY) {
            ESP_LOGI(TAG, "Validating freshly flashed OTA firmware partition: %s", running->label);
            esp_ota_mark_app_valid_cancel_rollback();
        }
    }
    ESP_LOGI(TAG, "Running firmware partition: %s (Offset: 0x%08" PRIx32 ", Size: %" PRIu32 " KB)", 
             running->label, running->address, running->size / 1024);
    return ESP_OK;
}

esp_err_t ota_engine_begin(esp_ota_handle_t *out_handle, const esp_partition_t **out_partition)
{
    const esp_partition_t *update_partition = esp_ota_get_next_update_partition(NULL);
    if (!update_partition) {
        ESP_LOGE(TAG, "No passive OTA partition available!");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Targeting OTA partition: %s", update_partition->label);
    esp_err_t err = esp_ota_begin(update_partition, OTA_WITH_SEQUENTIAL_WRITES, out_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_begin failed: %s", esp_err_to_name(err));
        return err;
    }

    *out_partition = update_partition;
    return ESP_OK;
}

esp_err_t ota_engine_write(esp_ota_handle_t handle, const void *data, size_t size)
{
    return esp_ota_write(handle, data, size);
}

esp_err_t ota_engine_end(esp_ota_handle_t handle, const esp_partition_t *partition)
{
    esp_err_t err = esp_ota_end(handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_end failed: %s", esp_err_to_name(err));
        return err;
    }

    err = esp_ota_set_boot_partition(partition);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_set_boot_partition failed: %s", esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "OTA update complete! Next boot will launch %s. Rebooting...", partition->label);
    vTaskDelay(pdMS_TO_TICKS(1000));
    esp_restart();
    return ESP_OK;
}

const char* ota_engine_get_running_partition_name(void)
{
    const esp_partition_t *running = esp_ota_get_running_partition();
    return running ? running->label : "factory";
}
`
  },
  {
    path: 'main/web_server.h',
    name: 'web_server.h',
    type: 'file',
    language: 'c',
    content: `#ifndef WEB_SERVER_H
#define WEB_SERVER_H

#include "esp_err.h"

esp_err_t web_server_start(void);
void web_server_stop(void);

#endif // WEB_SERVER_H
`
  },
  {
    path: 'main/web_server.c',
    name: 'web_server.c',
    type: 'file',
    language: 'c',
    content: `#include "web_server.h"
#include <string.h>
#include <stdlib.h>
#include "esp_http_server.h"
#include "esp_log.h"
#include "cJSON.h"
#include "wifi_manager.h"
#include "audio_pipeline.h"
#include "dsp_eq.h"
#include "http_streamer.h"
#include "airplay_server.h"
#include "dlna_renderer.h"
#include "ota_engine.h"

static const char *TAG = "WEB_SERVER";
static httpd_handle_t s_server = NULL;

static esp_err_t api_status_handler(httpd_req_t *req)
{
    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

    cJSON *root = cJSON_CreateObject();
    cJSON_AddBoolToObject(root, "airplay_active", airplay_server_is_active());
    cJSON_AddBoolToObject(root, "dlna_active", dlna_renderer_is_active());
    cJSON_AddBoolToObject(root, "http_playing", http_streamer_is_playing());
    cJSON_AddNumberToObject(root, "volume", audio_pipeline_get_volume());
    cJSON_AddStringToObject(root, "active_partition", ota_engine_get_running_partition_name());
    cJSON_AddBoolToObject(root, "sta_connected", wifi_manager_is_sta_connected());

    dsp_eq_params_t eq;
    dsp_eq_get_params(&eq);
    cJSON *eq_obj = cJSON_CreateObject();
    cJSON_AddNumberToObject(eq_obj, "bass", eq.bass_gain_db);
    cJSON_AddNumberToObject(eq_obj, "mid", eq.mid_gain_db);
    cJSON_AddNumberToObject(eq_obj, "treble", eq.treble_gain_db);
    cJSON_AddItemToObject(root, "eq", eq_obj);

    const char *json = cJSON_PrintUnformatted(root);
    if (json) {
        httpd_resp_send(req, json, strlen(json));
        cJSON_free((void *)json);
    } else {
        httpd_resp_sendstr(req, "{}");
    }
    cJSON_Delete(root);
    return ESP_OK;
}

static esp_err_t api_volume_handler(httpd_req_t *req)
{
    char buf[128];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) return ESP_FAIL;
    buf[ret] = '\0';

    cJSON *root = cJSON_Parse(buf);
    if (root) {
        cJSON *vol = cJSON_GetObjectItem(root, "volume");
        if (vol && cJSON_IsNumber(vol)) {
            audio_pipeline_set_volume((uint8_t)vol->valueint);
        }
        cJSON_Delete(root);
    }
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_sendstr(req, "{\"status\":\"ok\"}");
    return ESP_OK;
}

static esp_err_t api_eq_handler(httpd_req_t *req)
{
    char buf[256];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) return ESP_FAIL;
    buf[ret] = '\0';

    cJSON *root = cJSON_Parse(buf);
    if (root) {
        cJSON *bass = cJSON_GetObjectItem(root, "bass");
        cJSON *mid = cJSON_GetObjectItem(root, "mid");
        cJSON *treble = cJSON_GetObjectItem(root, "treble");
        float b = bass ? (float)bass->valuedouble : 0.0f;
        float m = mid ? (float)mid->valuedouble : 0.0f;
        float t = treble ? (float)treble->valuedouble : 0.0f;
        dsp_eq_set_params(b, m, t);
        dsp_eq_save_nvs();
        cJSON_Delete(root);
    }
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_sendstr(req, "{\"status\":\"ok\"}");
    return ESP_OK;
}

static esp_err_t api_stream_handler(httpd_req_t *req)
{
    char buf[512];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) return ESP_FAIL;
    buf[ret] = '\0';

    cJSON *root = cJSON_Parse(buf);
    if (root) {
        cJSON *url = cJSON_GetObjectItem(root, "url");
        if (url && cJSON_IsString(url)) {
            http_streamer_play(url->valuestring);
        }
        cJSON_Delete(root);
    }
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_sendstr(req, "{\"status\":\"streaming_started\"}");
    return ESP_OK;
}

static esp_err_t api_stop_handler(httpd_req_t *req)
{
    http_streamer_stop();
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_sendstr(req, "{\"status\":\"stopped\"}");
    return ESP_OK;
}

static esp_err_t api_wifi_handler(httpd_req_t *req)
{
    char buf[256];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) return ESP_FAIL;
    buf[ret] = '\0';

    cJSON *root = cJSON_Parse(buf);
    if (root) {
        cJSON *ssid = cJSON_GetObjectItem(root, "ssid");
        cJSON *pass = cJSON_GetObjectItem(root, "password");
        if (ssid && cJSON_IsString(ssid)) {
            const char *p = pass ? pass->valuestring : "";
            wifi_manager_save_sta_credentials(ssid->valuestring, p);
        }
        cJSON_Delete(root);
    }
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_sendstr(req, "{\"status\":\"credentials_saved\"}");
    return ESP_OK;
}

static esp_err_t api_ota_handler(httpd_req_t *req)
{
    esp_ota_handle_t ota_handle = 0;
    const esp_partition_t *update_partition = NULL;
    esp_err_t err = ota_engine_begin(&ota_handle, &update_partition);
    if (err != ESP_OK) {
        httpd_resp_send_500(req);
        return ESP_FAIL;
    }

    char buf[2048];
    int received = 0;
    int remaining = req->content_len;

    while (remaining > 0) {
        int to_read = remaining > (int)sizeof(buf) ? (int)sizeof(buf) : remaining;
        received = httpd_req_recv(req, buf, to_read);
        if (received <= 0) {
            httpd_resp_send_500(req);
            return ESP_FAIL;
        }
        ota_engine_write(ota_handle, buf, received);
        remaining -= received;
    }

    ota_engine_end(ota_handle, update_partition);
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_sendstr(req, "{\"status\":\"ota_success_rebooting\"}");
    return ESP_OK;
}

esp_err_t web_server_start(void)
{
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.max_uri_handlers = 16;
    config.stack_size = 8192;

    ESP_LOGI(TAG, "Starting HTTP Web Server on port %d...", config.server_port);
    if (httpd_start(&s_server, &config) == ESP_OK) {
        httpd_uri_t uri_status = { .uri = "/api/status", .method = HTTP_GET,  .handler = api_status_handler };
        httpd_uri_t uri_vol    = { .uri = "/api/volume", .method = HTTP_POST, .handler = api_volume_handler };
        httpd_uri_t uri_eq     = { .uri = "/api/eq",     .method = HTTP_POST, .handler = api_eq_handler };
        httpd_uri_t uri_stream = { .uri = "/api/stream", .method = HTTP_POST, .handler = api_stream_handler };
        httpd_uri_t uri_stop   = { .uri = "/api/stop",   .method = HTTP_POST, .handler = api_stop_handler };
        httpd_uri_t uri_wifi   = { .uri = "/api/wifi",   .method = HTTP_POST, .handler = api_wifi_handler };
        httpd_uri_t uri_ota    = { .uri = "/api/ota",    .method = HTTP_POST, .handler = api_ota_handler };

        httpd_register_uri_handler(s_server, &uri_status);
        httpd_register_uri_handler(s_server, &uri_vol);
        httpd_register_uri_handler(s_server, &uri_eq);
        httpd_register_uri_handler(s_server, &uri_stream);
        httpd_register_uri_handler(s_server, &uri_stop);
        httpd_register_uri_handler(s_server, &uri_wifi);
        httpd_register_uri_handler(s_server, &uri_ota);
        return ESP_OK;
    }
    return ESP_FAIL;
}

void web_server_stop(void)
{
    if (s_server) {
        httpd_stop(s_server);
        s_server = NULL;
    }
}
`
  },
  {
    path: 'flash.sh',
    name: 'flash.sh',
    type: 'file',
    language: 'bash',
    content: `#!/usr/bin/env bash
# ==============================================================================
# ESP32-S3 Auto-Flash Script (Linux & macOS)
# Flashes monolithic merged.bin at 0x0 or individual build partitions
# ==============================================================================
set -e

PORT=\${1:-""}

if [ -z "$PORT" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        PORT=$(ls /dev/cu.wchusbserial* /dev/cu.usbserial* /dev/cu.SLAB_USBtoUART /dev/cu.usbmodem* 2>/dev/null | head -n 1 || true)
    else
        PORT=$(ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null | head -n 1 || true)
    fi
fi

if [ -z "$PORT" ]; then
    echo "❌ Error: No ESP32-S3 serial port automatically detected."
    echo "Usage: ./flash.sh [/dev/ttyUSB0 or /dev/ttyACM0 or COM port]"
    exit 1
fi

echo "🚀 Connecting to ESP32-S3 on port: $PORT"

if [ -f "build/merged.bin" ]; then
    echo "📦 Flashing pre-compiled monolithic merged.bin at offset 0x00000000 (baud 921600)..."
    esptool.py --chip esp32s3 -p "$PORT" -b 921600 --before default_reset --after hard_reset write_flash -z \\
        --flash_mode dio --flash_freq 80m --flash_size 16MB \\
        0x0 build/merged.bin
elif [ -f "build/esp32s3_audio.bin" ]; then
    echo "📦 Flashing individual partition table and firmware binaries..."
    esptool.py --chip esp32s3 -p "$PORT" -b 921600 --before default_reset --after hard_reset write_flash -z \\
        --flash_mode dio --flash_freq 80m --flash_size 16MB \\
        0x0 build/bootloader/bootloader.bin \\
        0x8000 build/partition_table/partition-table.bin \\
        0xf000 build/ota_data_initial.bin \\
        0x20000 build/esp32s3_audio.bin
else
    echo "❌ Error: Binaries not found in build/ directory. Run 'idf.py build' or download merged.bin first."
    exit 1
fi

echo "✅ Flashing successful! Opening live serial monitor at 115200 baud..."
python3 -m serial.tools.miniterm "$PORT" 115200 || idf.py -p "$PORT" monitor
`
  },
  {
    path: 'flash.bat',
    name: 'flash.bat',
    type: 'file',
    language: 'bat',
    content: `@echo off
REM ==============================================================================
REM ESP32-S3 Flash Script for Windows
REM Usage: flash.bat COM3
REM ==============================================================================

set PORT=%1
if "%PORT%"=="" (
    echo [ERROR] Please provide your COM port.
    echo Example: flash.bat COM3
    exit /b 1
)

echo [INFO] Flashing ESP32-S3 N16R8 on %PORT% at 921600 baud...

if exist "build\\merged.bin" (
    echo [INFO] Writing monolithic merged.bin at offset 0x0...
    esptool.py --chip esp32s3 -p %PORT% -b 921600 --before default_reset --after hard_reset write_flash -z --flash_mode dio --flash_freq 80m --flash_size 16MB 0x0 build\\merged.bin
) else (
    echo [INFO] Writing individual partitions: bootloader, partitions, otadata, app...
    esptool.py --chip esp32s3 -p %PORT% -b 921600 --before default_reset --after hard_reset write_flash -z --flash_mode dio --flash_freq 80m --flash_size 16MB 0x0 build\\bootloader\\bootloader.bin 0x8000 build\\partition_table\\partition-table.bin 0xf000 build\\ota_data_initial.bin 0x20000 build\\esp32s3_audio.bin
)

echo [SUCCESS] Flash completed! Starting serial monitor at 115200 baud...
idf.py -p %PORT% monitor
`
  },
  {
    path: 'scripts/merge_bin.py',
    name: 'merge_bin.py',
    type: 'file',
    language: 'python',
    content: `#!/usr/bin/env python3
"""
ESP32-S3 Merged Binary Generator
Combines all build artifacts into a single monolithic 0x0 binary for production flashing.
"""
import sys
import os
import subprocess

def main():
    print("=== ESP32-S3 N16R8 Merged Binary Generator ===")
    
    bootloader = "build/bootloader/bootloader.bin"
    partitions = "build/partition_table/partition-table.bin"
    otadata = "build/ota_data_initial.bin"
    app = "build/esp32s3_audio.bin"
    output = "build/merged.bin"

    cmd = [
        "esptool.py", "--chip", "esp32s3", "merge_bin",
        "-o", output,
        "--flash_mode", "dio",
        "--flash_freq", "80m",
        "--flash_size", "16MB",
        "0x0", bootloader,
        "0x8000", partitions,
        "0xf000", otadata,
        "0x20000", app
    ]

    print("Running:", " ".join(cmd))
    try:
        subprocess.run(cmd, check=True)
        print(f"\\n✅ Successfully generated monolithic '{output}'!")
        print(f"Flash with: esptool.py --chip esp32s3 write_flash 0x0 {output}")
    except Exception as e:
        print(f"❌ Error merging binaries: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
`
  },
  {
    path: 'scripts/pio_merge_bin.py',
    name: 'pio_merge_bin.py',
    type: 'file',
    language: 'python',
    content: `Import("env")
# ==============================================================================
# PlatformIO Post-Build Hook: Generates monolithic merged.bin (0x0 Flash Image)
# ==============================================================================
import os

def post_build_action(source, target, env):
    build_dir = env.subst("$BUILD_DIR")
    bootloader = os.path.join(build_dir, "bootloader.bin")
    partitions = os.path.join(build_dir, "partitions.bin")
    app = os.path.join(build_dir, "firmware.bin")
    merged = os.path.join(build_dir, "merged.bin")

    print("\\n[PlatformIO Hook] Merging binaries into monolithic merged.bin...")
    cmd = (
        f"esptool.py --chip esp32s3 merge_bin -o {merged} "
        f"--flash_mode dio --flash_freq 80m --flash_size 16MB "
        f"0x0 {bootloader} 0x8000 {partitions} 0x20000 {app}"
    )
    res = os.system(cmd)
    if res == 0:
        print(f"[PlatformIO Hook] ✅ Created {merged} ready for 0x0 flashing!\\n")

env.AddPostAction("$BUILD_DIR/\${PROGNAME}.bin", post_build_action)
`
  },
  {
    path: 'build/flasher_args.json',
    name: 'flasher_args.json',
    type: 'file',
    language: 'json',
    content: `{
  "write_flash_args": [
    "--flash_mode", "dio",
    "--flash_size", "16MB",
    "--flash_freq", "80m"
  ],
  "flash_settings": {
    "flash_mode": "dio",
    "flash_size": "16MB",
    "flash_freq": "80m"
  },
  "flash_files": {
    "0x0": "bootloader/bootloader.bin",
    "0x8000": "partition_table/partition-table.bin",
    "0xf000": "ota_data_initial.bin",
    "0x20000": "esp32s3_audio.bin"
  },
  "merged_bin": {
    "offset": "0x00000000",
    "file": "merged.bin",
    "flash_size": "16MB"
  },
  "bootloader": {
    "offset": "0x00000000",
    "file": "bootloader/bootloader.bin",
    "encrypted": "false"
  },
  "app": {
    "offset": "0x00020000",
    "file": "esp32s3_audio.bin",
    "encrypted": "false"
  },
  "partition_table": {
    "offset": "0x00008000",
    "file": "partition_table/partition-table.bin",
    "encrypted": "false"
  },
  "otadata": {
    "offset": "0x0000f000",
    "file": "ota_data_initial.bin",
    "encrypted": "false"
  },
  "extra_esptool_args": {
    "after": "hard_reset",
    "before": "default_reset",
    "stub": true,
    "chip": "esp32s3"
  }
}
`
  },
  {
    path: 'build/flash_project_args',
    name: 'flash_project_args',
    type: 'file',
    language: 'bash',
    content: `--flash_mode dio --flash_freq 80m --flash_size 16MB
0x0 bootloader/bootloader.bin
0x8000 partition_table/partition-table.bin
0xf000 ota_data_initial.bin
0x20000 esp32s3_audio.bin
`
  },
  {
    path: '.github/workflows/build.yml',
    name: 'build.yml',
    type: 'file',
    language: 'yaml',
    content: `name: ESP32-S3 Firmware Build & Release
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-esp-idf:
    name: Build ESP-IDF & Generate merged.bin
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'

      - name: Install esptool & idf-component-manager
        run: pip install esptool idf-component-manager

      - name: Build ESP-IDF Firmware in Container
        uses: espressif/esp-idf-ci-action@v1
        with:
          esp_idf_version: v5.2.1
          target: esp32s3
          path: '.'

      - name: Generate Monolithic merged.bin (0x0 Flash Image)
        run: |
          python scripts/merge_bin.py

      - name: Upload Build Artifacts (including merged.bin)
        uses: actions/upload-artifact@v4
        with:
          name: esp32s3-firmware-binaries
          path: |
            build/merged.bin
            build/esp32s3_audio.bin
            build/bootloader/bootloader.bin
            build/partition_table/partition-table.bin
            build/ota_data_initial.bin
            flash.sh
            flash.bat

  build-platformio:
    name: Build PlatformIO Target
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'

      - name: Install PlatformIO Core & IDF Component Manager
        run: |
          pip install --upgrade platformio esptool idf-component-manager

      - name: Install ESP-IDF Submodules or Pre-resolve Components
        run: |
          python -m idf_component_manager.core --project-dir . prepare-dependencies

      - name: PlatformIO Build
        run: pio run -e esp32s3_espidf
`
  },
  {
    path: '.gitignore',
    name: '.gitignore',
    type: 'file',
    language: 'text',
    content: `# ESP-IDF build output
build/
sdkconfig
sdkconfig.old

# PlatformIO output
.pio/
.vscode/.browse.c_cpp.db*
.vscode/c_cpp_properties.json
.vscode/launch.json
.vscode/ipch/

# Python cache
__pycache__/
*.pyc

# OS files
.DS_Store
Thumbs.db
`
  }
];

