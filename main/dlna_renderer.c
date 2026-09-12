#include "dlna_renderer.h"
#include <string.h>
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "lwip/sockets.h"
#include "esp_log.h"
#include "wifi_manager.h"

static const char *TAG = "DLNA_UPNP";
static bool s_active = false;
static char s_current_uri[256] = "";

static void dlna_ssdp_task(void *pvParameters)
{
    // SSDP Multicast Listener 239.255.255.250:1900
    int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (sock < 0) {
        ESP_LOGE(TAG, "Failed to create SSDP socket");
        vTaskDelete(NULL);
        return;
    }

    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_port = htons(DLNA_SSDP_PORT),
        .sin_addr.s_addr = htonl(INADDR_ANY)
    };
    int opt = 1;
    setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    // Set non-blocking or 1-second timeout so we can periodically send NOTIFY
    struct timeval tv = { .tv_sec = 1, .tv_usec = 0 };
    setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

    bind(sock, (struct sockaddr *)&addr, sizeof(addr));

    struct ip_mreq mreq;
    mreq.imr_multiaddr.s_addr = inet_addr("239.255.255.250");
    mreq.imr_interface.s_addr = htonl(INADDR_ANY);
    setsockopt(sock, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq));

    ESP_LOGI(TAG, "DLNA / UPnP MediaRenderer SSDP discovery active on port 1900");

    char buffer[1024];
    uint32_t last_notify = 0;

    struct sockaddr_in mcast_dst = {
        .sin_family = AF_INET,
        .sin_port = htons(DLNA_SSDP_PORT),
        .sin_addr.s_addr = inet_addr("239.255.255.250")
    };

    while (1) {
        struct sockaddr_in from;
        socklen_t from_len = sizeof(from);
        int len = recvfrom(sock, buffer, sizeof(buffer) - 1, 0, (struct sockaddr *)&from, &from_len);

        char current_ip[32] = "192.168.4.1";
        if (wifi_manager_is_sta_connected()) {
            wifi_manager_get_sta_ip(current_ip, sizeof(current_ip));
            static bool s_sta_joined = false;
            if (!s_sta_joined && wifi_manager_get_sta_netif()) {
                esp_netif_ip_info_t ip_info;
                if (esp_netif_get_ip_info(wifi_manager_get_sta_netif(), &ip_info) == ESP_OK && ip_info.ip.addr != 0) {
                    struct ip_mreq mreq_sta;
                    mreq_sta.imr_multiaddr.s_addr = inet_addr("239.255.255.250");
                    mreq_sta.imr_interface.s_addr = ip_info.ip.addr;
                    setsockopt(sock, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq_sta, sizeof(mreq_sta));
                    setsockopt(sock, IPPROTO_IP, IP_MULTICAST_IF, &ip_info.ip.addr, sizeof(ip_info.ip.addr));
                    s_sta_joined = true;
                    ESP_LOGI(TAG, "Joined SSDP multicast group on STA interface %s", current_ip);
                }
            }
        }

        if (len > 0) {
            buffer[len] = '\0';
            if (strstr(buffer, "M-SEARCH") && (strstr(buffer, "MediaRenderer") || strstr(buffer, "AVTransport") || strstr(buffer, "ssdp:all") || strstr(buffer, "rootdevice"))) {
                char reply[512];
                snprintf(reply, sizeof(reply),
                    "HTTP/1.1 200 OK\r\n"
                    "CACHE-CONTROL: max-age=1800\r\n"
                    "EXT:\r\n"
                    "LOCATION: http://%s/description.xml\r\n"
                    "SERVER: ESP32-S3/1.0 UPnP/1.0 DLNADOC/1.50\r\n"
                    "ST: urn:schemas-upnp-org:device:MediaRenderer:1\r\n"
                    "USN: uuid:12345678-90ab-cdef-1234-567890abcdef::urn:schemas-upnp-org:device:MediaRenderer:1\r\n\r\n",
                    current_ip);
                sendto(sock, reply, strlen(reply), 0, (struct sockaddr *)&from, from_len);
            }
        }

        // Periodic SSDP NOTIFY alive broadcast every 20 seconds
        uint32_t now = xTaskGetTickCount();
        if ((now - last_notify) > pdMS_TO_TICKS(20000)) {
            last_notify = now;
            char notify[512];
            snprintf(notify, sizeof(notify),
                "NOTIFY * HTTP/1.1\r\n"
                "HOST: 239.255.255.250:1900\r\n"
                "CACHE-CONTROL: max-age=1800\r\n"
                "LOCATION: http://%s/description.xml\r\n"
                "NT: urn:schemas-upnp-org:device:MediaRenderer:1\r\n"
                "NTS: ssdp:alive\r\n"
                "SERVER: ESP32-S3/1.0 UPnP/1.0 DLNADOC/1.50\r\n"
                "USN: uuid:12345678-90ab-cdef-1234-567890abcdef::urn:schemas-upnp-org:device:MediaRenderer:1\r\n\r\n",
                current_ip);
            sendto(sock, notify, strlen(notify), 0, (struct sockaddr *)&mcast_dst, sizeof(mcast_dst));
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
