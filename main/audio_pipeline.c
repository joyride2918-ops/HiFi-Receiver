#include "audio_pipeline.h"
#include <string.h>
#include "driver/i2s_std.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/ringbuf.h"
#include "esp_heap_caps.h"
#include "dsp_eq.h"

static const char *TAG = "AUDIO_PIPE";

static i2s_chan_handle_t s_tx_chan = NULL;
static RingbufHandle_t s_psram_ringbuf = NULL;
static uint8_t s_volume = 80;
static uint32_t s_current_rate = 44100;
static uint8_t s_current_bits = 16;

static void audio_feeder_task(void *pvParameters)
{
    const size_t chunk_size = 2048;
    int16_t *pcm_buffer = heap_caps_malloc(chunk_size, MALLOC_CAP_INTERNAL | MALLOC_CAP_DMA);

    while (1) {
        size_t item_size = 0;
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
            i2s_channel_write(s_tx_chan, pcm_buffer, item_size, &bytes_written, portMAX_DELAY);
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
        ESP_LOGE(TAG, "Failed to allocate audio ringbuffer in PSRAM!");
        return;
    }

    // Configure I2S Standard Philips Master Mode for UDA1334A
    i2s_chan_config_t chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(UDA1334A_I2S_PORT, I2S_ROLE_MASTER);
    chan_cfg.dma_desc_num = 6;
    chan_cfg.dma_frame_num = 512;
    ESP_ERROR_CHECK(i2s_new_channel(&chan_cfg, &s_tx_chan, NULL));

    i2s_std_config_t std_cfg = {
        .clk_cfg = I2S_STD_CLK_DEFAULT_CONFIG(44100),
        .slot_cfg = I2S_STD_PHILIPS_SLOT_DEFAULT_CONFIG(I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_STEREO),
        .gpio_cfg = {
            .mclk = I2S_GPIO_UNUSED,
            .bclk = UDA1334A_BCLK_PIN,
            .ws   = UDA1334A_WSEL_PIN,
            .dout = UDA1334A_DIN_PIN,
            .din  = I2S_GPIO_UNUSED,
            .invert_flags = {
                .mclk_inv = false,
                .bclk_inv = false,
                .ws_inv   = false,
            },
        },
    };
    ESP_ERROR_CHECK(i2s_channel_init_std_mode(s_tx_chan, &std_cfg));
    ESP_ERROR_CHECK(i2s_channel_enable(s_tx_chan));

    // Spawn high-priority audio feeder task pinned to Core 1
    xTaskCreatePinnedToCore(audio_feeder_task, "audio_feeder", 4096, NULL, configMAX_PRIORITIES - 2, NULL, 1);
    ESP_LOGI(TAG, "UDA1334A I2S driver initialized on GPIO 14/15/16");
}

esp_err_t audio_pipeline_set_sample_rate(uint32_t sample_rate, uint8_t bits_per_sample)
{
    if (sample_rate == s_current_rate && bits_per_sample == s_current_bits) return ESP_OK;
    s_current_rate = sample_rate;
    s_current_bits = bits_per_sample;
    
    i2s_std_clk_config_t clk_cfg = I2S_STD_CLK_DEFAULT_CONFIG(sample_rate);
    return i2s_channel_reconfig_std_clock(s_tx_chan, &clk_cfg);
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

uint8_t audio_pipeline_get_volume(void) { return s_volume; }
