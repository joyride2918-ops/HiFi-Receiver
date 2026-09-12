#include "airplay_server.h"
#include <string.h>
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "lwip/sockets.h"
#include "esp_log.h"
#include "audio_pipeline.h"

static const char *TAG = "AIRPLAY_2";
static bool s_active = false;
static char s_client_name[64] = "Apple Device (AirPlay 2)";

static int extract_cseq(const char *buf)
{
    const char *p = strstr(buf, "CSeq:");
    if (!p) p = strstr(buf, "cseq:");
    if (p) {
        int cseq = 1;
        if (sscanf(p + 5, "%d", &cseq) == 1) {
            return cseq;
        }
    }
    return 1;
}

static void airplay_rtsp_task(void *pvParameters)
{
    int server_sock = socket(AF_INET, SOCK_STREAM, IPPROTO_IP);
    struct sockaddr_in server_addr = {
        .sin_family = AF_INET,
        .sin_port = htons(AIRPLAY_RTSP_PORT),
        .sin_addr.s_addr = htonl(INADDR_ANY)
    };

    int opt = 1;
    setsockopt(server_sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

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
            buffer[len] = '\0';

            int cseq = extract_cseq(buffer);
            char resp[512];

            // RTSP Session Protocol Parser (OPTIONS, ANNOUNCE, SETUP, RECORD, TEARDOWN)
            if (strstr(buffer, "OPTIONS")) {
                snprintf(resp, sizeof(resp),
                    "RTSP/1.0 200 OK\r\n"
                    "CSeq: %d\r\n"
                    "Public: ANNOUNCE, SETUP, RECORD, PAUSE, FLUSH, TEARDOWN, OPTIONS, SET_PARAMETER, GET_PARAMETER\r\n\r\n",
                    cseq);
                send(client_sock, resp, strlen(resp), 0);
            } else if (strstr(buffer, "ANNOUNCE")) {
                snprintf(resp, sizeof(resp),
                    "RTSP/1.0 200 OK\r\n"
                    "CSeq: %d\r\n\r\n",
                    cseq);
                send(client_sock, resp, strlen(resp), 0);
                audio_pipeline_set_sample_rate(44100, 16);
            } else if (strstr(buffer, "SETUP")) {
                snprintf(resp, sizeof(resp),
                    "RTSP/1.0 200 OK\r\n"
                    "CSeq: %d\r\n"
                    "Transport: RTP/AVP/UDP;unicast;interleaved=0-1;mode=record;control_port=6001;timing_port=6002;server_port=5000\r\n"
                    "Session: 1\r\n\r\n",
                    cseq);
                send(client_sock, resp, strlen(resp), 0);
            } else if (strstr(buffer, "RECORD")) {
                snprintf(resp, sizeof(resp),
                    "RTSP/1.0 200 OK\r\n"
                    "CSeq: %d\r\n"
                    "Audio-Latency: 2205\r\n\r\n",
                    cseq);
                send(client_sock, resp, strlen(resp), 0);
            } else if (strstr(buffer, "SET_PARAMETER")) {
                // Parse volume parameter from Apple device
                char *vol_pos = strstr(buffer, "volume:");
                if (vol_pos) {
                    float db = 0.0f;
                    if (sscanf(vol_pos + 7, "%f", &db) == 1) {
                        // Volume is in dB: -144.0 (mute) to 0.0 (100%)
                        int pct = 0;
                        if (db > -30.0f) {
                            pct = (int)((db + 30.0f) * (100.0f / 30.0f));
                        }
                        if (pct < 0) pct = 0;
                        if (pct > 100) pct = 100;
                        audio_pipeline_set_volume((uint8_t)pct);
                    }
                }
                snprintf(resp, sizeof(resp),
                    "RTSP/1.0 200 OK\r\n"
                    "CSeq: %d\r\n\r\n",
                    cseq);
                send(client_sock, resp, strlen(resp), 0);
            } else if (strstr(buffer, "FLUSH")) {
                snprintf(resp, sizeof(resp),
                    "RTSP/1.0 200 OK\r\n"
                    "CSeq: %d\r\n\r\n",
                    cseq);
                send(client_sock, resp, strlen(resp), 0);
            } else if (strstr(buffer, "GET_PARAMETER")) {
                snprintf(resp, sizeof(resp),
                    "RTSP/1.0 200 OK\r\n"
                    "CSeq: %d\r\n\r\n",
                    cseq);
                send(client_sock, resp, strlen(resp), 0);
            } else if (strstr(buffer, "TEARDOWN")) {
                snprintf(resp, sizeof(resp),
                    "RTSP/1.0 200 OK\r\n"
                    "CSeq: %d\r\n"
                    "Connection: close\r\n\r\n",
                    cseq);
                send(client_sock, resp, strlen(resp), 0);
                break;
            }
        }

        close(client_sock);
        s_active = false;
        ESP_LOGI(TAG, "AirPlay session ended.");
    }
}

static void airplay_rtp_task(void *pvParameters)
{
    int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (sock < 0) {
        ESP_LOGE(TAG, "Failed to create RTP socket");
        vTaskDelete(NULL);
        return;
    }

    int opt = 1;
    setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    // Increase socket buffer for streaming throughput
    int rcvbuf = 32 * 1024;
    setsockopt(sock, SOL_SOCKET, SO_RCVBUF, &rcvbuf, sizeof(rcvbuf));

    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_port = htons(AIRPLAY_RTP_PORT),
        .sin_addr.s_addr = htonl(INADDR_ANY)
    };

    if (bind(sock, (struct sockaddr *)&addr, sizeof(addr)) != 0) {
        ESP_LOGE(TAG, "Failed to bind RTP audio port %d", AIRPLAY_RTP_PORT);
        close(sock);
        vTaskDelete(NULL);
        return;
    }

    ESP_LOGI(TAG, "AirPlay RTP Audio Receiver active on UDP port %d", AIRPLAY_RTP_PORT);

    uint8_t packet[2048];
    while (1) {
        int len = recv(sock, packet, sizeof(packet), 0);
        if (len <= 0) {
            vTaskDelay(pdMS_TO_TICKS(10));
            continue;
        }

        // Standard RTP header is 12 bytes
        if (len > 12 && (packet[0] & 0x80)) {
            size_t header_len = 12;
            // Check for RTP extension header
            if (packet[0] & 0x10) {
                if (len >= 16) {
                    uint16_t ext_len = ((uint16_t)packet[14] << 8) | packet[15];
                    header_len = 16 + (ext_len * 4);
                }
            }

            if (len > (int)header_len) {
                const uint8_t *pcm_data = packet + header_len;
                size_t pcm_len = len - header_len;
                audio_pipeline_write(pcm_data, pcm_len, pdMS_TO_TICKS(20));
            }
        }
    }
}

void airplay_server_start(void)
{
    xTaskCreatePinnedToCore(airplay_rtsp_task, "airplay_rtsp", 6144, NULL, 5, NULL, 0);
    xTaskCreatePinnedToCore(airplay_rtp_task, "airplay_rtp", 4096, NULL, 5, NULL, 0);
}

bool airplay_server_is_active(void) { return s_active; }
const char* airplay_server_get_client_name(void) { return s_client_name; }
