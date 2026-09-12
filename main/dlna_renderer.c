#include "dlna_renderer.h"
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "lwip/sockets.h"
#include "esp_log.h"

static const char *TAG = "DLNA_UPNP";
static bool s_active = false;
static char s_current_uri[256] = "";

static void dlna_ssdp_task(void *pvParameters)
{
    // SSDP Multicast Listener 239.255.255.250:1900
    int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_port = htons(DLNA_SSDP_PORT),
        .sin_addr.s_addr = htonl(INADDR_ANY)
    };
    int opt = 1;
    setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    bind(sock, (struct sockaddr *)&addr, sizeof(addr));

    struct ip_mreq mreq;
    mreq.imr_multiaddr.s_addr = inet_addr("239.255.255.250");
    mreq.imr_interface.s_addr = htonl(INADDR_ANY);
    setsockopt(sock, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq));

    ESP_LOGI(TAG, "DLNA / UPnP MediaRenderer SSDP discovery active on port 1900");

    char buffer[1024];
    while (1) {
        struct sockaddr_in from;
        socklen_t from_len = sizeof(from);
        int len = recvfrom(sock, buffer, sizeof(buffer) - 1, 0, (struct sockaddr *)&from, &from_len);
        if (len > 0) {
            buffer[len] = '\0';
            if (strstr(buffer, "M-SEARCH") && (strstr(buffer, "MediaRenderer") || strstr(buffer, "ssdp:all"))) {
                const char *reply = 
                    "HTTP/1.1 200 OK\r\n"
                    "CACHE-CONTROL: max-age=1800\r\n"
                    "EXT:\r\n"
                    "LOCATION: http://esp32-audio.local:49152/description.xml\r\n"
                    "SERVER: ESP32-S3/1.0 UPnP/1.0 DLNADOC/1.50\r\n"
                    "ST: urn:schemas-upnp-org:device:MediaRenderer:1\r\n"
                    "USN: uuid:12345678-90ab-cdef-1234-567890abcdef::urn:schemas-upnp-org:device:MediaRenderer:1\r\n\r\n";
                sendto(sock, reply, strlen(reply), 0, (struct sockaddr *)&from, from_len);
            }
        }
        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

void dlna_renderer_start(void)
{
    xTaskCreatePinnedToCore(dlna_ssdp_task, "dlna_ssdp", 4096, NULL, 4, NULL, 0);
}

bool dlna_renderer_is_active(void) { return s_active; }
const char* dlna_renderer_get_current_uri(void) { return s_current_uri; }
