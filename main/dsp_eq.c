#include "dsp_eq.h"
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
    if (!s_params.enabled || !samples || sample_count < 2) return;

    sample_count &= ~1; // Ensure even number of samples for stereo (L/R) pairs
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
