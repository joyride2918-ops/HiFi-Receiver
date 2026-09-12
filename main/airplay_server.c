#include "airplay_server.h"
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "lwip/sockets.h"
#include "esp_log.h"
#include "audio_pipeline.h"

static const char *TAG = "AIRPLAY_2";
static bool s_active = false;
static char s_client_name[64] = "Apple Device (AirPlay 2)";

static void airplay_rtsp_task(void *pvParameters)
{
    int server_sock = socket(AF_INET, SOCK_STREAM, IPPROTO_IP);
    struct sockaddr_in server_addr = {
        .sin_family = AF_INET,
        .sin_port = htons(AIRPLAY_RTSP_PORT),
        .sin_addr.s_addr = htonl(INADDR_ANY)
    };

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

            // RTSP Session Protocol Parser (OPTIONS, ANNOUNCE, SETUP, RECORD, TEARDOWN)
            if (strstr(buffer, "OPTIONS")) {
                const char *resp = "RTSP/1.0 200 OK\r\nCSeq: 1\r\nPublic: ANNOUNCE, SETUP, RECORD, PAUSE, FLUSH, TEARDOWN, OPTIONS, SET_PARAMETER, GET_PARAMETER\r\n\r\n";
                send(client_sock, resp, strlen(resp), 0);
            } else if (strstr(buffer, "ANNOUNCE")) {
                const char *resp = "RTSP/1.0 200 OK\r\nCSeq: 2\r\n\r\n";
                send(client_sock, resp, strlen(resp), 0);
                audio_pipeline_set_sample_rate(44100, 16);
            } else if (strstr(buffer, "SETUP")) {
                const char *resp = "RTSP/1.0 200 OK\r\nCSeq: 3\r\nTransport: RTP/AVP/UDP;unicast;interleaved=0-1;mode=record;control_port=6001;timing_port=6002;server_port=5000\r\nSession: 1\r\n\r\n";
                send(client_sock, resp, strlen(resp), 0);
            } else if (strstr(buffer, "RECORD")) {
                const char *resp = "RTSP/1.0 200 OK\r\nCSeq: 4\r\nAudio-Latency: 2205\r\n\r\n";
                send(client_sock, resp, strlen(resp), 0);
            } else if (strstr(buffer, "TEARDOWN")) {
                const char *resp = "RTSP/1.0 200 OK\r\nCSeq: 5\r\nConnection: close\r\n\r\n";
                send(client_sock, resp, strlen(resp), 0);
                break;
            }
        }

        close(client_sock);
        s_active = false;
        ESP_LOGI(TAG, "AirPlay session ended.");
    }
}

void airplay_server_start(void)
{
    xTaskCreatePinnedToCore(airplay_rtsp_task, "airplay_rtsp", 6144, NULL, 5, NULL, 0);
}

bool airplay_server_is_active(void) { return s_active; }
const char* airplay_server_get_client_name(void) { return s_client_name; }
