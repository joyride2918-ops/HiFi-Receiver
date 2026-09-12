/**
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
#include "esp_psram.h"
#include "esp_heap_caps.h"

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
    size_t psram_size = esp_psram_get_size();
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

    // 6. Start Web Server with REST API & AMOLED Web UI
    web_server_start();

    // 7. Start AirPlay 2 (RAOP) 24/7 background listener
    airplay_server_start();

    // 8. Start DLNA / UPnP MediaRenderer service
    dlna_renderer_start();

    // 9. Start Direct HTTP / Radio Streamer engine
    http_streamer_init();

    // 10. Check and validate OTA boot status
    ota_engine_validate_boot();

    ESP_LOGI(TAG, "All audio services initialized successfully. Ready for playback.");
}
