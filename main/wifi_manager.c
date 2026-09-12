#include "wifi_manager.h"
#include <string.h>
#include <stdio.h>
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "lwip/inet.h"

// Optional mDNS support (only if mdns component is present in ESP-IDF)
#if __has_include("mdns.h")
#include "mdns.h"
#define HAVE_MDNS 1
#else
#define HAVE_MDNS 0
#endif

static const char *TAG = "WIFI_MGR";
static bool s_sta_connected = false;
static esp_netif_t *s_netif_ap = NULL;
static esp_netif_t *s_netif_sta = NULL;
static wifi_config_storage_t s_config;

static void init_mdns(const char *hostname)
{
#if HAVE_MDNS
    static bool s_mdns_initialized = false;
    if (!s_mdns_initialized) {
        esp_err_t err = mdns_init();
        if (err != ESP_OK) {
            ESP_LOGW(TAG, "mDNS init returned: %d", err);
            return;
        }
        s_mdns_initialized = true;
    }

    mdns_hostname_set(hostname);
    mdns_instance_name_set("ESP32-S3 Hi-Fi");

    // Remove existing services if re-initializing after IP acquisition
    mdns_service_remove("_http", "_tcp");
    mdns_service_remove("_raop", "_tcp");
    mdns_service_remove("_airplay", "_tcp");

    // 1. Web UI service
    mdns_service_add(NULL, "_http", "_tcp", 80, NULL, 0);

    // 2. AirPlay / RAOP Services (iOS requires MAC@DeviceName format for RAOP discovery)
    uint8_t mac[6] = {0};
    esp_wifi_get_mac(WIFI_IF_STA, mac);

    char mac_nocolon[16];
    snprintf(mac_nocolon, sizeof(mac_nocolon), "%02X%02X%02X%02X%02X%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    char raop_name[64];
    snprintf(raop_name, sizeof(raop_name), "%s@ESP32-S3 Hi-Fi", mac_nocolon);

    char mac_colon[20];
    snprintf(mac_colon, sizeof(mac_colon), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    mdns_txt_item_t raop_txt[] = {
        {"txtvers", "1"},
        {"ch", "2"},
        {"cn", "0,1"},
        {"et", "0,1"},
        {"sv", "false"},
        {"da", "true"},
        {"sr", "44100"},
        {"ss", "16"},
        {"vn", "65537"},
        {"tp", "UDP"},
        {"md", "0,1,2"},
        {"sm", "false"},
        {"ek", "1"}
    };
    mdns_service_add(raop_name, "_raop", "_tcp", 5000, raop_txt, sizeof(raop_txt)/sizeof(raop_txt[0]));

    // 3. AirPlay Service (Port 7000)
    mdns_txt_item_t airplay_txt[] = {
        {"deviceid", mac_colon},
        {"features", "0x5A7FFFF7,0x1E"},
        {"flags", "0x4"},
        {"model", "AudioAccessory1,1"},
        {"srcvers", "220.68"},
        {"pw", "false"},
        {"vv", "2"}
    };
    mdns_service_add("ESP32-S3 Hi-Fi", "_airplay", "_tcp", 7000, airplay_txt, sizeof(airplay_txt)/sizeof(airplay_txt[0]));

    ESP_LOGI(TAG, "mDNS AirPlay active: %s, URL: http://%s.local", raop_name, hostname);
#else
    ESP_LOGI(TAG, "mDNS component not present. Web UI accessible at station IP.");
#endif
}

static void wifi_event_handler(void *arg, esp_event_base_t event_base,
                               int32_t event_id, void *event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
        ESP_LOGI(TAG, "Connecting to Home Wi-Fi...");
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        s_sta_connected = false;
        ESP_LOGW(TAG, "Disconnected from Home Wi-Fi. Reconnecting in background...");
        esp_wifi_connect();
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        s_sta_connected = true;
        ESP_LOGI(TAG, "Connected! IP Address: " IPSTR, IP2STR(&event->ip_info.ip));
        // Announce AirPlay and Web services on newly obtained Station IP
        init_mdns(s_config.mdns_host);
    }
}

void wifi_manager_init(void)
{
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    s_netif_sta = esp_netif_create_default_wifi_sta();
    s_netif_ap = esp_netif_create_default_wifi_ap();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
                    ESP_EVENT_ANY_ID, &wifi_event_handler, NULL, NULL));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,
                    IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL, NULL));

    // Load saved configuration from NVS
    nvs_handle_t nvs_h;
    if (nvs_open("wifi_cfg", NVS_READONLY, &nvs_h) == ESP_OK) {
        size_t len = sizeof(s_config);
        nvs_get_blob(nvs_h, "config", &s_config, &len);
        nvs_close(nvs_h);
    } else {
        strncpy(s_config.ap_ssid, DEFAULT_AP_SSID, sizeof(s_config.ap_ssid));
        s_config.ap_password[0] = '\0';
        s_config.ap_keep_open = true;
        strncpy(s_config.mdns_host, DEFAULT_MDNS_HOST, sizeof(s_config.mdns_host));
        s_config.sta_ssid[0] = '\0';
        s_config.sta_password[0] = '\0';
    }

    // Set concurrent AP+STA mode so SoftAP stays available even when connected to router
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_APSTA));

    wifi_config_t ap_config = {0};
    strncpy((char *)ap_config.ap.ssid, s_config.ap_ssid, sizeof(ap_config.ap.ssid));
    ap_config.ap.ssid_len = strlen(s_config.ap_ssid);
    ap_config.ap.channel = DEFAULT_AP_CHANNEL;
    ap_config.ap.max_connection = DEFAULT_MAX_CLIENTS;
    ap_config.ap.authmode = (strlen(s_config.ap_password) > 0) ? WIFI_AUTH_WPA2_PSK : WIFI_AUTH_OPEN;
    if (strlen(s_config.ap_password) > 0) {
        strncpy((char *)ap_config.ap.password, s_config.ap_password, sizeof(ap_config.ap.password));
    }
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_AP, &ap_config));

    if (strlen(s_config.sta_ssid) > 0) {
        wifi_config_t sta_config = {0};
        strncpy((char *)sta_config.sta.ssid, s_config.sta_ssid, sizeof(sta_config.sta.ssid));
        strncpy((char *)sta_config.sta.password, s_config.sta_password, sizeof(sta_config.sta.password));
        ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &sta_config));
    }

    ESP_ERROR_CHECK(esp_wifi_start());
    init_mdns(s_config.mdns_host);
}

esp_err_t wifi_manager_save_sta_credentials(const char *ssid, const char *password)
{
    strncpy(s_config.sta_ssid, ssid, sizeof(s_config.sta_ssid) - 1);
    s_config.sta_ssid[sizeof(s_config.sta_ssid) - 1] = '\0';
    strncpy(s_config.sta_password, password, sizeof(s_config.sta_password) - 1);
    s_config.sta_password[sizeof(s_config.sta_password) - 1] = '\0';

    nvs_handle_t nvs_h;
    esp_err_t err = nvs_open("wifi_cfg", NVS_READWRITE, &nvs_h);
    if (err == ESP_OK) {
        nvs_set_blob(nvs_h, "config", &s_config, sizeof(s_config));
        nvs_commit(nvs_h);
        nvs_close(nvs_h);
    }

    // Connect immediately
    wifi_config_t sta_config = {0};
    strncpy((char *)sta_config.sta.ssid, s_config.sta_ssid, sizeof(sta_config.sta.ssid) - 1);
    sta_config.sta.ssid[sizeof(sta_config.sta.ssid) - 1] = '\0';
    strncpy((char *)sta_config.sta.password, s_config.sta_password, sizeof(sta_config.sta.password) - 1);
    sta_config.sta.password[sizeof(sta_config.sta.password) - 1] = '\0';
    esp_wifi_set_config(WIFI_IF_STA, &sta_config);
    esp_wifi_connect();
    return ESP_OK;
}

bool wifi_manager_is_sta_connected(void) { return s_sta_connected; }

void wifi_manager_get_sta_ip(char *ip_str, size_t max_len)
{
    if (!s_sta_connected || !s_netif_sta) {
        strncpy(ip_str, "0.0.0.0", max_len);
        return;
    }
    esp_netif_ip_info_t ip_info;
    if (esp_netif_get_ip_info(s_netif_sta, &ip_info) == ESP_OK) {
        snprintf(ip_str, max_len, IPSTR, IP2STR(&ip_info.ip));
    } else {
        strncpy(ip_str, "0.0.0.0", max_len);
    }
}

int8_t wifi_manager_get_sta_rssi(void)
{
    wifi_ap_record_t ap_info;
    if (esp_wifi_sta_get_ap_info(&ap_info) == ESP_OK) {
        return ap_info.rssi;
    }
    return -127;
}

void wifi_manager_get_config(wifi_config_storage_t *config)
{
    if (config) {
        memcpy(config, &s_config, sizeof(wifi_config_storage_t));
    }
}
