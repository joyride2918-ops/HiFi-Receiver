#include "http_streamer.h"
#include <string.h>
#include <stdlib.h>
#include "esp_http_client.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "audio_pipeline.h"

#define MINIMP3_IMPLEMENTATION
#define MINIMP3_ONLY_MP3
#define MINIMP3_NO_SIMD
#include "minimp3.h"

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

        mp3dec_t mp3d;
        mp3dec_init(&mp3d);
        mp3dec_frame_info_t info;

        const size_t inbuf_cap = 4096;
        uint8_t *inbuf = (uint8_t *)malloc(inbuf_cap);
        short *pcm = (short *)malloc(MINIMP3_MAX_SAMPLES_PER_FRAME * sizeof(short));
        short *stereo_pcm = (short *)malloc(MINIMP3_MAX_SAMPLES_PER_FRAME * 2 * sizeof(short));

        if (!inbuf || !pcm || !stereo_pcm) {
            ESP_LOGE(TAG, "Failed to allocate MP3 decoder buffers");
            if (inbuf) free(inbuf);
            if (pcm) free(pcm);
            if (stereo_pcm) free(stereo_pcm);
            esp_http_client_cleanup(client);
            s_playing = false;
            s_stream_task_handle = NULL;
            vTaskDelete(NULL);
            return;
        }

        int inbuf_bytes = 0;

        while (s_playing) {
            if (s_paused) {
                vTaskDelay(pdMS_TO_TICKS(100));
                continue;
            }

            // Fill input buffer from HTTP stream if we have room
            if (inbuf_bytes < 2048) {
                int to_read = inbuf_cap - inbuf_bytes;
                int read_bytes = esp_http_client_read(client, (char *)inbuf + inbuf_bytes, to_read);
                if (read_bytes > 0) {
                    inbuf_bytes += read_bytes;
                } else if (read_bytes < 0) {
                    ESP_LOGW(TAG, "Stream read error or timeout.");
                    break;
                }
            }

            if (inbuf_bytes == 0) {
                vTaskDelay(pdMS_TO_TICKS(10));
                continue;
            }

            // Decode MP3 frame to PCM
            int samples = mp3dec_decode_frame(&mp3d, inbuf, inbuf_bytes, pcm, &info);
            if (info.frame_bytes > 0) {
                if (samples > 0) {
                    if (info.hz > 0 && info.hz != 44100) {
                        audio_pipeline_set_sample_rate(info.hz, 16);
                    }

                    if (info.channels == 2) {
                        audio_pipeline_write((const uint8_t *)pcm, samples * 2 * sizeof(short), pdMS_TO_TICKS(100));
                    } else if (info.channels == 1) {
                        for (int i = 0; i < samples; i++) {
                            stereo_pcm[i * 2] = pcm[i];
                            stereo_pcm[i * 2 + 1] = pcm[i];
                        }
                        audio_pipeline_write((const uint8_t *)stereo_pcm, samples * 2 * sizeof(short), pdMS_TO_TICKS(100));
                    }
                }
                inbuf_bytes -= info.frame_bytes;
                if (inbuf_bytes > 0) {
                    memmove(inbuf, inbuf + info.frame_bytes, inbuf_bytes);
                }
            } else {
                // If not enough data for full frame, read more. If full buffer and no frame, drop 1 byte to re-sync
                if (inbuf_bytes >= inbuf_cap) {
                    inbuf_bytes--;
                    memmove(inbuf, inbuf + 1, inbuf_bytes);
                }
            }
        }

        free(inbuf);
        free(pcm);
        free(stereo_pcm);
    } else {
        ESP_LOGE(TAG, "Failed to connect to stream URL: %s (err: %s)", url, esp_err_to_name(err));
    }

    esp_http_client_cleanup(client);
    s_playing = false;
    s_stream_task_handle = NULL;
    vTaskDelete(NULL);
}

void http_streamer_init(void) {}

esp_err_t http_streamer_play(const char *url)
{
    http_streamer_stop();
    if (!url || strlen(url) == 0) return ESP_ERR_INVALID_ARG;
    strncpy(s_current_url, url, sizeof(s_current_url) - 1);
    s_current_url[sizeof(s_current_url) - 1] = '\0';
    s_paused = false;
    xTaskCreatePinnedToCore(stream_worker_task, "http_stream_task", 8192, s_current_url, 6, &s_stream_task_handle, 0);
    return ESP_OK;
}

void http_streamer_stop(void)
{
    if (s_playing) {
        s_playing = false;
        s_paused = false;
        for (int i = 0; i < 30 && s_stream_task_handle != NULL; i++) {
            vTaskDelay(pdMS_TO_TICKS(10));
        }
    }
}

void http_streamer_pause(void) { s_paused = true; }
void http_streamer_resume(void) { s_paused = false; }
bool http_streamer_is_playing(void) { return s_playing && !s_paused; }
const char* http_streamer_get_url(void) { return s_current_url; }
