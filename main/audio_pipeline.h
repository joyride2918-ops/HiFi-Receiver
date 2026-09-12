#ifndef AUDIO_PIPELINE_H
#define AUDIO_PIPELINE_H

#include <stdint.h>
#include <stddef.h>
#include "esp_err.h"

// Pin Configuration for UDA1334A DAC
#define UDA1334A_I2S_PORT   I2S_NUM_0
#define UDA1334A_BCLK_PIN   GPIO_NUM_14
#define UDA1334A_WSEL_PIN   GPIO_NUM_15
#define UDA1334A_DIN_PIN    GPIO_NUM_16

// 8MB Octal PSRAM Ringbuffer (1024 KB allocated for anti-jitter network buffering)
#define AUDIO_RINGBUF_SIZE  (1024 * 1024)

void audio_pipeline_init(void);
esp_err_t audio_pipeline_set_sample_rate(uint32_t sample_rate, uint8_t bits_per_sample);
size_t audio_pipeline_write(const uint8_t *data, size_t len, TickType_t wait_ticks);
void audio_pipeline_set_volume(uint8_t volume_percent);
uint8_t audio_pipeline_get_volume(void);
void audio_pipeline_flush(void);
size_t audio_pipeline_get_buffered_bytes(void);

#endif // AUDIO_PIPELINE_H
