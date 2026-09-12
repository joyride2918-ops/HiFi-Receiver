#include "web_server.h"
#include <string.h>
#include <stdlib.h>
#include "esp_http_server.h"
#include "esp_log.h"
#include "cJSON.h"
#include "wifi_manager.h"
#include "audio_pipeline.h"
#include "dsp_eq.h"
#include "http_streamer.h"
#include "airplay_server.h"
#include "dlna_renderer.h"
#include "ota_engine.h"

static const char *TAG = "WEB_SERVER";
static httpd_handle_t s_server = NULL;

static const char INDEX_HTML[] = 
"<!DOCTYPE html>"
"<html lang=\"en\">"
"<head>"
"<meta charset=\"UTF-8\">"
"<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">"
"<title>ESP32-S3 Hi-Fi Audio</title>"
"<style>"
"* { box-sizing: border-box; margin: 0; padding: 0; }"
"body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #f4f4f5; padding: 20px; display: flex; justify-content: center; min-height: 100vh; align-items: center; }"
".card { background: #121215; border: 1px solid #27272a; border-radius: 16px; max-width: 440px; width: 100%; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }"
".header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }"
".badge { font-size: 11px; padding: 3px 8px; border-radius: 9999px; background: rgba(6,182,212,0.15); color: #22d3ee; border: 1px solid rgba(6,182,212,0.3); font-weight: 600; }"
"h1 { font-size: 18px; font-weight: 700; }"
"p { font-size: 13px; color: #a1a1aa; margin-top: 2px; }"
".status-row { display: flex; justify-content: space-between; font-size: 12px; margin: 10px 0; padding: 10px 14px; background: #18181b; border-radius: 10px; border: 1px solid #27272a; }"
".form-group { margin-top: 14px; }"
"label { display: block; font-size: 12px; font-weight: 600; color: #d4d4d8; margin-bottom: 6px; }"
"input[type=text], input[type=password] { width: 100%; padding: 10px 14px; background: #18181b; border: 1px solid #3f3f46; border-radius: 10px; color: #fff; font-size: 14px; outline: none; transition: border-color 0.2s; }"
"input:focus { border-color: #06b6d4; }"
".btn { width: 100%; margin-top: 18px; padding: 12px; background: #06b6d4; color: #000; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s; }"
".btn:hover { background: #22d3ee; }"
".vol-box { margin-top: 20px; padding-top: 16px; border-top: 1px solid #27272a; }"
".vol-slider { width: 100%; accent-color: #06b6d4; cursor: pointer; margin-top: 8px; }"
".msg { margin-top: 12px; font-size: 12px; text-align: center; color: #4ade80; display: none; }"
"</style>"
"</head>"
"<body>"
"<div class=\"card\">"
  "<div class=\"header\">"
    "<div>"
      "<div style=\"display:flex;align-items:center;gap:8px\">"
        "<h1>ESP32-S3 Hi-Fi</h1>"
        "<span class=\"badge\">UDA1334A</span>"
      </div>"
      "<p>Wi-Fi & Audio Streamer Setup</p>"
    "</div>"
  "</div>"
  "<div class=\"status-row\">"
    "<span>AirPlay 2 & DLNA:</span>"
    "<strong id=\"ap-stat\" style=\"color:#22d3ee\">Ready (24/7)</strong>"
  "</div>"
  "<div class=\"status-row\">"
    "<span>Wi-Fi Connection:</span>"
    "<strong id=\"wifi-stat\" style=\"color:#fbbf24\">SoftAP (192.168.4.1)</strong>"
  "</div>"
  "<form id=\"wifi-form\" onsubmit=\"saveWifi(event)\">"
    "<div class=\"form-group\">"
      "<label for=\"ssid\">Home Wi-Fi Network (SSID)</label>"
      "<input type=\"text\" id=\"ssid\" placeholder=\"e.g. MyHomeWiFi\" required>"
    "</div>"
    "<div class=\"form-group\">"
      "<label for=\"pass\">Wi-Fi Password</label>"
      "<input type=\"password\" id=\"pass\" placeholder=\"WPA2/WPA3 Password\">"
    "</div>"
    "<button type=\"submit\" class=\"btn\" id=\"btn-save\">Connect to Wi-Fi</button>"
  "</form>"
  "<div id=\"msg\" class=\"msg\">Connecting to Wi-Fi... Please wait!</div>"
  "<div class=\"vol-box\">"
    "<div style=\"display:flex;justify-content:space-between;font-size:12px\">"
      "<span>Master Volume</span>"
      "<span id=\"vol-lbl\">80%</span>"
    "</div>"
    "<input type=\"range\" id=\"vol-slider\" class=\"vol-slider\" min=\"0\" max=\"100\" value=\"80\" oninput=\"setVol(this.value)\">"
  "</div>"
"</div>"
"<script>"
"async function pollStatus() {"
  "try {"
    "const res = await fetch('/api/status');"
    "const d = await res.json();"
    "if (d.sta_connected && d.sta_ip && d.sta_ip !== '0.0.0.0') {"
      "document.getElementById('wifi-stat').innerText = 'Connected (' + d.sta_ip + ')';"
      "document.getElementById('wifi-stat').style.color = '#4ade80';"
    "} else if (d.sta_connected) {"
      "document.getElementById('wifi-stat').innerText = 'Connected';"
      "document.getElementById('wifi-stat').style.color = '#4ade80';"
    "}"
    "if (d.volume !== undefined) {"
      "document.getElementById('vol-slider').value = d.volume;"
      "document.getElementById('vol-lbl').innerText = d.volume + '%';"
    "}"
  "} catch(e) {}"
"}"
"setInterval(pollStatus, 3000);"
"pollStatus();"
"async function saveWifi(e) {"
  "e.preventDefault();"
  "const ssid = document.getElementById('ssid').value;"
  "const password = document.getElementById('pass').value;"
  "const msg = document.getElementById('msg');"
  "msg.style.display = 'block';"
  "msg.innerText = 'Connecting ESP32-S3 to ' + ssid + '...';"
  "try {"
    "await fetch('/api/wifi', {"
      "method: 'POST',"
      "headers: {'Content-Type': 'application/json'},"
      "body: JSON.stringify({ssid, password})"
    "});"
    "msg.innerText = 'Credentials saved! ESP32-S3 is connecting...';"
  "} catch(err) {"
    "msg.innerText = 'Failed to send credentials.';"
    "msg.style.color = '#ef4444';"
  "}"
"}"
"async function setVol(v) {"
  "document.getElementById('vol-lbl').innerText = v + '%';"
  "try {"
    "await fetch('/api/volume', {"
      "method: 'POST',"
      "headers: {'Content-Type': 'application/json'},"
      "body: JSON.stringify({volume: parseInt(v)})"
    "});"
  "} catch(e) {}"
"}"
"</script>"
"</body>"
"</html>";

static esp_err_t index_html_handler(httpd_req_t *req)
{
    httpd_resp_set_type(req, "text/html");
    httpd_resp_set_hdr(req, "Cache-Control", "no-cache, no-store, must-revalidate");
    httpd_resp_send(req, INDEX_HTML, strlen(INDEX_HTML));
    return ESP_OK;
}

static esp_err_t favicon_handler(httpd_req_t *req)
{
    httpd_resp_set_status(req, "204 No Content");
    httpd_resp_send(req, NULL, 0);
    return ESP_OK;
}

static esp_err_t captive_portal_redirect_handler(httpd_req_t *req)
{
    httpd_resp_set_status(req, "302 Found");
    httpd_resp_set_hdr(req, "Location", "http://192.168.4.1/");
    httpd_resp_send(req, NULL, 0);
    return ESP_OK;
}

static esp_err_t api_status_handler(httpd_req_t *req)
{
    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

    cJSON *root = cJSON_CreateObject();
    cJSON_AddBoolToObject(root, "airplay_active", airplay_server_is_active());
    cJSON_AddBoolToObject(root, "dlna_active", dlna_renderer_is_active());
    cJSON_AddBoolToObject(root, "http_playing", http_streamer_is_playing());
    cJSON_AddNumberToObject(root, "volume", audio_pipeline_get_volume());
    cJSON_AddStringToObject(root, "active_partition", ota_engine_get_running_partition_name());
    cJSON_AddBoolToObject(root, "sta_connected", wifi_manager_is_sta_connected());
    char sta_ip_str[32] = {0};
    wifi_manager_get_sta_ip(sta_ip_str, sizeof(sta_ip_str));
    cJSON_AddStringToObject(root, "sta_ip", sta_ip_str);
    cJSON_AddNumberToObject(root, "sta_rssi", wifi_manager_get_sta_rssi());

    dsp_eq_params_t eq;
    dsp_eq_get_params(&eq);
    cJSON *eq_obj = cJSON_CreateObject();
    cJSON_AddNumberToObject(eq_obj, "bass", eq.bass_gain_db);
    cJSON_AddNumberToObject(eq_obj, "mid", eq.mid_gain_db);
    cJSON_AddNumberToObject(eq_obj, "treble", eq.treble_gain_db);
    cJSON_AddItemToObject(root, "eq", eq_obj);

    const char *json = cJSON_PrintUnformatted(root);
    if (json) {
        httpd_resp_send(req, json, strlen(json));
        cJSON_free((void *)json);
    } else {
        httpd_resp_sendstr(req, "{}");
    }
    cJSON_Delete(root);
    return ESP_OK;
}

static esp_err_t api_volume_handler(httpd_req_t *req)
{
    char buf[128];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) return ESP_FAIL;
    buf[ret] = '\0';

    cJSON *root = cJSON_Parse(buf);
    if (root) {
        cJSON *vol = cJSON_GetObjectItem(root, "volume");
        if (vol && cJSON_IsNumber(vol)) {
            audio_pipeline_set_volume((uint8_t)vol->valueint);
        }
        cJSON_Delete(root);
    }
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_sendstr(req, "{\"status\":\"ok\"}");
    return ESP_OK;
}

static esp_err_t api_eq_handler(httpd_req_t *req)
{
    char buf[256];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) return ESP_FAIL;
    buf[ret] = '\0';

    cJSON *root = cJSON_Parse(buf);
    if (root) {
        cJSON *bass = cJSON_GetObjectItem(root, "bass");
        cJSON *mid = cJSON_GetObjectItem(root, "mid");
        cJSON *treble = cJSON_GetObjectItem(root, "treble");
        float b = bass ? (float)bass->valuedouble : 0.0f;
        float m = mid ? (float)mid->valuedouble : 0.0f;
        float t = treble ? (float)treble->valuedouble : 0.0f;
        dsp_eq_set_params(b, m, t);
        dsp_eq_save_nvs();
        cJSON_Delete(root);
    }
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_sendstr(req, "{\"status\":\"ok\"}");
    return ESP_OK;
}

static esp_err_t api_stream_handler(httpd_req_t *req)
{
    char buf[512];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) return ESP_FAIL;
    buf[ret] = '\0';

    cJSON *root = cJSON_Parse(buf);
    if (root) {
        cJSON *url = cJSON_GetObjectItem(root, "url");
        if (url && cJSON_IsString(url)) {
            http_streamer_play(url->valuestring);
        }
        cJSON_Delete(root);
    }
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_sendstr(req, "{\"status\":\"streaming_started\"}");
    return ESP_OK;
}

static esp_err_t api_stop_handler(httpd_req_t *req)
{
    http_streamer_stop();
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_sendstr(req, "{\"status\":\"stopped\"}");
    return ESP_OK;
}

static esp_err_t api_wifi_handler(httpd_req_t *req)
{
    char buf[256];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) return ESP_FAIL;
    buf[ret] = '\0';

    cJSON *root = cJSON_Parse(buf);
    if (root) {
        cJSON *ssid = cJSON_GetObjectItem(root, "ssid");
        cJSON *pass = cJSON_GetObjectItem(root, "password");
        if (ssid && cJSON_IsString(ssid)) {
            const char *p = pass ? pass->valuestring : "";
            wifi_manager_save_sta_credentials(ssid->valuestring, p);
        }
        cJSON_Delete(root);
    }
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_sendstr(req, "{\"status\":\"credentials_saved\"}");
    return ESP_OK;
}

static esp_err_t api_ota_handler(httpd_req_t *req)
{
    esp_ota_handle_t ota_handle = 0;
    const esp_partition_t *update_partition = NULL;
    esp_err_t err = ota_engine_begin(&ota_handle, &update_partition);
    if (err != ESP_OK) {
        httpd_resp_send_500(req);
        return ESP_FAIL;
    }

    char buf[2048];
    int received = 0;
    int remaining = req->content_len;

    while (remaining > 0) {
        int to_read = remaining > (int)sizeof(buf) ? (int)sizeof(buf) : remaining;
        received = httpd_req_recv(req, buf, to_read);
        if (received <= 0) {
            httpd_resp_send_500(req);
            return ESP_FAIL;
        }
        ota_engine_write(ota_handle, buf, received);
        remaining -= received;
    }

    ota_engine_end(ota_handle, update_partition);
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_sendstr(req, "{\"status\":\"ota_success_rebooting\"}");
    return ESP_OK;
}

esp_err_t web_server_start(void)
{
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.max_uri_handlers = 20;
    config.stack_size = 8192;

    ESP_LOGI(TAG, "Starting HTTP Web Server on port %d...", config.server_port);
    if (httpd_start(&s_server, &config) == ESP_OK) {
        // Embedded Web UI & Captive Portal Endpoints
        httpd_uri_t uri_root     = { .uri = "/",                   .method = HTTP_GET,  .handler = index_html_handler };
        httpd_uri_t uri_index    = { .uri = "/index.html",          .method = HTTP_GET,  .handler = index_html_handler };
        httpd_uri_t uri_favicon  = { .uri = "/favicon.ico",         .method = HTTP_GET,  .handler = favicon_handler };
        httpd_uri_t uri_apple    = { .uri = "/hotspot-detect.html", .method = HTTP_GET,  .handler = captive_portal_redirect_handler };
        httpd_uri_t uri_android  = { .uri = "/generate_204",        .method = HTTP_GET,  .handler = captive_portal_redirect_handler };
        httpd_uri_t uri_win      = { .uri = "/connecttest.txt",     .method = HTTP_GET,  .handler = captive_portal_redirect_handler };

        // REST API Endpoints
        httpd_uri_t uri_status   = { .uri = "/api/status",          .method = HTTP_GET,  .handler = api_status_handler };
        httpd_uri_t uri_vol      = { .uri = "/api/volume",          .method = HTTP_POST, .handler = api_volume_handler };
        httpd_uri_t uri_eq       = { .uri = "/api/eq",              .method = HTTP_POST, .handler = api_eq_handler };
        httpd_uri_t uri_stream   = { .uri = "/api/stream",          .method = HTTP_POST, .handler = api_stream_handler };
        httpd_uri_t uri_stop     = { .uri = "/api/stop",            .method = HTTP_POST, .handler = api_stop_handler };
        httpd_uri_t uri_wifi     = { .uri = "/api/wifi",            .method = HTTP_POST, .handler = api_wifi_handler };
        httpd_uri_t uri_ota      = { .uri = "/api/ota",             .method = HTTP_POST, .handler = api_ota_handler };

        httpd_register_uri_handler(s_server, &uri_root);
        httpd_register_uri_handler(s_server, &uri_index);
        httpd_register_uri_handler(s_server, &uri_favicon);
        httpd_register_uri_handler(s_server, &uri_apple);
        httpd_register_uri_handler(s_server, &uri_android);
        httpd_register_uri_handler(s_server, &uri_win);

        httpd_register_uri_handler(s_server, &uri_status);
        httpd_register_uri_handler(s_server, &uri_vol);
        httpd_register_uri_handler(s_server, &uri_eq);
        httpd_register_uri_handler(s_server, &uri_stream);
        httpd_register_uri_handler(s_server, &uri_stop);
        httpd_register_uri_handler(s_server, &uri_wifi);
        httpd_register_uri_handler(s_server, &uri_ota);
        return ESP_OK;
    }
    return ESP_FAIL;
}

void web_server_stop(void)
{
    if (s_server) {
        httpd_stop(s_server);
        s_server = NULL;
    }
}
