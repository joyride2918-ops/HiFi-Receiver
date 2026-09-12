#include "http_streamer.h"
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
