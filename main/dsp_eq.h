#ifndef DSP_EQ_H
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
