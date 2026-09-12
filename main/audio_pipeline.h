#ifndef AUDIO_PIPELINE_H
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
