#include "audio_pipeline.h"
#include <string.h>
#include <stdlib.h>
#include "driver/gpio.h"
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
            i2s_write(UDA1334A_I2S_PORT, pcm_buffer, item_size, &bytes_written, portMAX_DELAY);
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
    i2s_chan_config_t chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(UDA1334A_I2S_PORT, I2S_ROLE_MASTER);
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
    i2s_driver_install(UDA1334A_I2S_PORT, &i2s_config, 0, NULL);
    i2s_set_pin(UDA1334A_I2S_PORT, &pin_config);
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
    return i2s_set_clk(UDA1334A_I2S_PORT, sample_rate, (i2s_bits_per_sample_t)bits_per_sample, I2S_CHANNEL_STEREO);
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
