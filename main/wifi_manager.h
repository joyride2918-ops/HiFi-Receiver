#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include "esp_err.h"

#define DEFAULT_AP_SSID      "ESP32-Audio-Config"
#define DEFAULT_AP_PASSWORD  ""          // Open by default for easy setup
#define DEFAULT_AP_CHANNEL   6
#define DEFAULT_MAX_CLIENTS  4
#define DEFAULT_MDNS_HOST    "esp32-audio" // Access at http://esp32-audio.local

typedef struct {
    char sta_ssid[33];
    char sta_password[65];
    char ap_ssid[33];
    char ap_password[65];
    bool ap_keep_open;
    char mdns_host[33];
} wifi_config_storage_t;

void wifi_manager_init(void);
esp_err_t wifi_manager_save_sta_credentials(const char *ssid, const char *password);
bool wifi_manager_is_sta_connected(void);
void wifi_manager_get_sta_ip(char *ip_str, size_t max_len);
int8_t wifi_manager_get_sta_rssi(void);
void wifi_manager_get_config(wifi_config_storage_t *config);

#endif // WIFI_MANAGER_H
