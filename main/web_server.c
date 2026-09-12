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
      "</div>"
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
  "<div style=\"margin-top:16px;padding-top:14px;border-top:1px solid #27272a\">"
    "<div style=\"font-size:12px;font-weight:700;color:#a1a1aa;text-transform:uppercase;margin-bottom:8px\">3-Band DSP Equalizer</div>"
    "<div style=\"display:flex;align-items:center;margin-top:6px;font-size:12px\">"
      "<span style=\"width:50px\">Bass</span>"
      "<input type=\"range\" id=\"eq-b\" style=\"flex:1;margin:0 8px;accent-color:#06b6d4\" min=\"-12\" max=\"12\" value=\"0\" oninput=\"setEQ()\">"
      "<span id=\"eq-b-val\" style=\"width:45px;text-align:right;color:#06b6d4\">0 dB</span>"
    "</div>"
    "<div style=\"display:flex;align-items:center;margin-top:6px;font-size:12px\">"
      "<span style=\"width:50px\">Mid</span>"
      "<input type=\"range\" id=\"eq-m\" style=\"flex:1;margin:0 8px;accent-color:#06b6d4\" min=\"-12\" max=\"12\" value=\"0\" oninput=\"setEQ()\">"
      "<span id=\"eq-m-val\" style=\"width:45px;text-align:right;color:#06b6d4\">0 dB</span>"
    "</div>"
    "<div style=\"display:flex;align-items:center;margin-top:6px;font-size:12px\">"
      "<span style=\"width:50px\">Treble</span>"
      "<input type=\"range\" id=\"eq-t\" style=\"flex:1;margin:0 8px;accent-color:#06b6d4\" min=\"-12\" max=\"12\" value=\"0\" oninput=\"setEQ()\">"
      "<span id=\"eq-t-val\" style=\"width:45px;text-align:right;color:#06b6d4\">0 dB</span>"
    "</div>"
  "</div>"
  "<div style=\"margin-top:16px;padding-top:14px;border-top:1px solid #27272a\">"
    "<div style=\"font-size:12px;font-weight:700;color:#a1a1aa;text-transform:uppercase;margin-bottom:8px\">Audio Stream Player</div>"
    "<input type=\"text\" id=\"stream-url\" placeholder=\"http://stream.radioparadise.com/mellow-128\">"
    "<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px\">"
      "<button type=\"button\" class=\"btn\" style=\"margin-top:0;padding:8px;font-size:11px;background:#27272a;color:#22d3ee;border:1px solid #3f3f46\" onclick=\"setPreset('http://stream.radioparadise.com/mellow-128')\">Radio Paradise</button>"
      "<button type=\"button\" class=\"btn\" style=\"margin-top:0;padding:8px;font-size:11px;background:#27272a;color:#22d3ee;border:1px solid #3f3f46\" onclick=\"setPreset('http://ice2.somafm.com/groovesalad-128-mp3')\">Groove Salad</button>"
      "<button type=\"button\" class=\"btn\" style=\"margin-top:0;padding:8px;font-size:11px;background:#27272a;color:#22d3ee;border:1px solid #3f3f46\" onclick=\"setPreset('http://stream.radioparadise.com/rock-128')\">RP Rock</button>"
      "<button type=\"button\" class=\"btn\" style=\"margin-top:0;padding:8px;font-size:11px;background:#27272a;color:#22d3ee;border:1px solid #3f3f46\" onclick=\"setPreset('http://ice1.somafm.com/dronezone-128-mp3')\">Drone Zone</button>"
    "</div>"
    "<div style=\"display:flex;gap:6px;margin-top:8px\">"
      "<button type=\"button\" class=\"btn\" onclick=\"playStream()\" style=\"margin-top:0;flex:2\">Play Stream</button>"
      "<button type=\"button\" class=\"btn\" onclick=\"stopStream()\" style=\"margin-top:0;flex:1;background:#27272a;color:#fff\">Stop</button>"
    "</div>"
  "</div>"
"</div>"
"<script>"
"let eqTimer;"
"function setPreset(url) {"
  "document.getElementById('stream-url').value = url;"
  "playStream();"
"}"
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
    "if (d.airplay_active) {"
      "document.getElementById('ap-stat').innerText = 'AirPlay Streaming';"
      "document.getElementById('ap-stat').style.color = '#4ade80';"
    "} else if (d.http_playing) {"
      "document.getElementById('ap-stat').innerText = 'Radio Streaming';"
      "document.getElementById('ap-stat').style.color = '#4ade80';"
    "} else {"
      "document.getElementById('ap-stat').innerText = 'Ready (AirPlay/DLNA)';"
      "document.getElementById('ap-stat').style.color = '#22d3ee';"
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
"function setEQ() {"
  "const b = parseFloat(document.getElementById('eq-b').value);"
  "const m = parseFloat(document.getElementById('eq-m').value);"
  "const t = parseFloat(document.getElementById('eq-t').value);"
  "document.getElementById('eq-b-val').innerText = (b > 0 ? '+' : '') + b + ' dB';"
  "document.getElementById('eq-m-val').innerText = (m > 0 ? '+' : '') + m + ' dB';"
  "document.getElementById('eq-t-val').innerText = (t > 0 ? '+' : '') + t + ' dB';"
  "clearTimeout(eqTimer);"
  "eqTimer = setTimeout(async () => {"
    "try {"
      "await fetch('/api/eq', {"
        "method: 'POST',"
        "headers: {'Content-Type': 'application/json'},"
        "body: JSON.stringify({bass: b, mid: m, treble: t})"
      "});"
    "} catch(e) {}"
  "}, 150);"
"}"
"async function playStream() {"
  "let url = document.getElementById('stream-url').value.trim();"
  "if (!url) {"
    "url = 'http://stream.radioparadise.com/mellow-128';"
    "document.getElementById('stream-url').value = url;"
  "}"
  "await fetch('/api/stream', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({url}) });"
  "setTimeout(pollStatus, 1000);"
"}"
"async function stopStream() {"
  "await fetch('/api/stop', { method: 'POST' });"
  "setTimeout(pollStatus, 500);"
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

static esp_err_t upnp_description_handler(httpd_req_t *req)
{
    const char *xml = 
        "<?xml version=\"1.0\"?>\r\n"
        "<root xmlns=\"urn:schemas-upnp-org:device-1-0\">\r\n"
        "  <specVersion><major>1</major><minor>0</minor></specVersion>\r\n"
        "  <device>\r\n"
        "    <deviceType>urn:schemas-upnp-org:device:MediaRenderer:1</deviceType>\r\n"
        "    <friendlyName>ESP32-S3 Hi-Fi Audio</friendlyName>\r\n"
        "    <manufacturer>Espressif</manufacturer>\r\n"
        "    <modelName>ESP32-S3-UDA1334A</modelName>\r\n"
        "    <UDN>uuid:12345678-90ab-cdef-1234-567890abcdef</UDN>\r\n"
        "    <serviceList>\r\n"
        "      <service>\r\n"
        "        <serviceType>urn:schemas-upnp-org:service:AVTransport:1</serviceType>\r\n"
        "        <serviceId>urn:upnp-org:serviceId:AVTransport</serviceId>\r\n"
        "        <controlURL>/upnp/control/AVTransport</controlURL>\r\n"
        "        <eventSubURL>/upnp/event/AVTransport</eventSubURL>\r\n"
        "        <SCPDURL>/avtransport.xml</SCPDURL>\r\n"
        "      </service>\r\n"
        "      <service>\r\n"
        "        <serviceType>urn:schemas-upnp-org:service:RenderingControl:1</serviceType>\r\n"
        "        <serviceId>urn:upnp-org:serviceId:RenderingControl</serviceId>\r\n"
        "        <controlURL>/upnp/control/RenderingControl</controlURL>\r\n"
        "        <eventSubURL>/upnp/event/RenderingControl</eventSubURL>\r\n"
        "        <SCPDURL>/renderingcontrol.xml</SCPDURL>\r\n"
        "      </service>\r\n"
        "      <service>\r\n"
        "        <serviceType>urn:schemas-upnp-org:service:ConnectionManager:1</serviceType>\r\n"
        "        <serviceId>urn:upnp-org:serviceId:ConnectionManager</serviceId>\r\n"
        "        <controlURL>/upnp/control/ConnectionManager</controlURL>\r\n"
        "        <eventSubURL>/upnp/event/ConnectionManager</eventSubURL>\r\n"
        "        <SCPDURL>/connectionmanager.xml</SCPDURL>\r\n"
        "      </service>\r\n"
        "    </serviceList>\r\n"
        "  </device>\r\n"
        "</root>\r\n";
    httpd_resp_set_type(req, "text/xml");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_send(req, xml, strlen(xml));
    return ESP_OK;
}

static esp_err_t upnp_scpd_avt_handler(httpd_req_t *req)
{
    const char *xml = 
        "<?xml version=\"1.0\"?>\r\n"
        "<scpd xmlns=\"urn:schemas-upnp-org:service-1-0\">\r\n"
        "  <specVersion><major>1</major><minor>0</minor></specVersion>\r\n"
        "  <actionList>\r\n"
        "    <action><name>SetAVTransportURI</name></action>\r\n"
        "    <action><name>Play</name></action>\r\n"
        "    <action><name>Pause</name></action>\r\n"
        "    <action><name>Stop</name></action>\r\n"
        "    <action><name>GetTransportInfo</name></action>\r\n"
        "    <action><name>GetPositionInfo</name></action>\r\n"
        "  </actionList>\r\n"
        "</scpd>\r\n";
    httpd_resp_set_type(req, "text/xml");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_send(req, xml, strlen(xml));
    return ESP_OK;
}

static esp_err_t upnp_scpd_rc_handler(httpd_req_t *req)
{
    const char *xml = 
        "<?xml version=\"1.0\"?>\r\n"
        "<scpd xmlns=\"urn:schemas-upnp-org:service-1-0\">\r\n"
        "  <specVersion><major>1</major><minor>0</minor></specVersion>\r\n"
        "  <actionList>\r\n"
        "    <action><name>SetVolume</name></action>\r\n"
        "    <action><name>GetVolume</name></action>\r\n"
        "    <action><name>SetMute</name></action>\r\n"
        "    <action><name>GetMute</name></action>\r\n"
        "  </actionList>\r\n"
        "</scpd>\r\n";
    httpd_resp_set_type(req, "text/xml");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_send(req, xml, strlen(xml));
    return ESP_OK;
}

static esp_err_t upnp_scpd_cm_handler(httpd_req_t *req)
{
    const char *xml = 
        "<?xml version=\"1.0\"?>\r\n"
        "<scpd xmlns=\"urn:schemas-upnp-org:service-1-0\">\r\n"
        "  <specVersion><major>1</major><minor>0</minor></specVersion>\r\n"
        "  <actionList>\r\n"
        "    <action><name>GetProtocolInfo</name></action>\r\n"
        "    <action><name>GetCurrentConnectionIDs</name></action>\r\n"
        "  </actionList>\r\n"
        "</scpd>\r\n";
    httpd_resp_set_type(req, "text/xml");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_send(req, xml, strlen(xml));
    return ESP_OK;
}

static esp_err_t upnp_renderingcontrol_handler(httpd_req_t *req)
{
    char buf[1024];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    char soap_resp[512] = "";
    if (ret > 0) {
        buf[ret] = '\0';
        if (strstr(buf, "SetVolume")) {
            char *vol_start = strstr(buf, "<DesiredVolume>");
            if (vol_start) {
                int vol = atoi(vol_start + 15);
                if (vol >= 0 && vol <= 100) {
                    audio_pipeline_set_volume((uint8_t)vol);
                }
            }
            snprintf(soap_resp, sizeof(soap_resp),
                "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">\r\n"
                "  <s:Body><u:SetVolumeResponse xmlns:u=\"urn:schemas-upnp-org:service:RenderingControl:1\"/></s:Body>\r\n"
                "</s:Envelope>\r\n");
        } else if (strstr(buf, "GetVolume")) {
            snprintf(soap_resp, sizeof(soap_resp),
                "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">\r\n"
                "  <s:Body><u:GetVolumeResponse xmlns:u=\"urn:schemas-upnp-org:service:RenderingControl:1\"><CurrentVolume>%d</CurrentVolume></u:GetVolumeResponse></s:Body>\r\n"
                "</s:Envelope>\r\n", audio_pipeline_get_volume());
        } else {
            snprintf(soap_resp, sizeof(soap_resp),
                "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">\r\n"
                "  <s:Body><u:Response xmlns:u=\"urn:schemas-upnp-org:service:RenderingControl:1\"/></s:Body>\r\n"
                "</s:Envelope>\r\n");
        }
    }
    httpd_resp_set_type(req, "text/xml");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_send(req, soap_resp, strlen(soap_resp));
    return ESP_OK;
}

static esp_err_t upnp_connectionmanager_handler(httpd_req_t *req)
{
    const char *soap_resp = 
        "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">\r\n"
        "  <s:Body>\r\n"
        "    <u:GetProtocolInfoResponse xmlns:u=\"urn:schemas-upnp-org:service:ConnectionManager:1\">\r\n"
        "      <Source></Source>\r\n"
        "      <Sink>http-get:*:audio/mpeg:*,http-get:*:audio/wav:*,http-get:*:audio/flac:*,http-get:*:audio/aac:*</Sink>\r\n"
        "    </u:GetProtocolInfoResponse>\r\n"
        "  </s:Body>\r\n"
        "</s:Envelope>\r\n";
    httpd_resp_set_type(req, "text/xml");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_send(req, soap_resp, strlen(soap_resp));
    return ESP_OK;
}

static esp_err_t upnp_avtransport_handler(httpd_req_t *req)
{
    char buf[1024];
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    char soap_resp[512] = "";
    if (ret > 0) {
        buf[ret] = '\0';
        if (strstr(buf, "SetAVTransportURI")) {
            char *start = strstr(buf, "<CurrentURI>");
            char *end = strstr(buf, "</CurrentURI>");
            if (start && end && end > start + 12) {
                char uri[256] = {0};
                size_t len = end - (start + 12);
                if (len < sizeof(uri)) {
                    strncpy(uri, start + 12, len);
                    uri[len] = '\0';
                    http_streamer_play(uri);
                }
            }
            snprintf(soap_resp, sizeof(soap_resp),
                "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">\r\n"
                "  <s:Body><u:SetAVTransportURIResponse xmlns:u=\"urn:schemas-upnp-org:service:AVTransport:1\"/></s:Body>\r\n"
                "</s:Envelope>\r\n");
        } else if (strstr(buf, "<u:Play") || strstr(buf, "Play")) {
            http_streamer_resume();
            snprintf(soap_resp, sizeof(soap_resp),
                "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">\r\n"
                "  <s:Body><u:PlayResponse xmlns:u=\"urn:schemas-upnp-org:service:AVTransport:1\"/></s:Body>\r\n"
                "</s:Envelope>\r\n");
        } else if (strstr(buf, "<u:Pause") || strstr(buf, "Pause")) {
            http_streamer_pause();
            snprintf(soap_resp, sizeof(soap_resp),
                "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">\r\n"
                "  <s:Body><u:PauseResponse xmlns:u=\"urn:schemas-upnp-org:service:AVTransport:1\"/></s:Body>\r\n"
                "</s:Envelope>\r\n");
        } else if (strstr(buf, "<u:Stop") || strstr(buf, "Stop")) {
            http_streamer_stop();
            snprintf(soap_resp, sizeof(soap_resp),
                "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">\r\n"
                "  <s:Body><u:StopResponse xmlns:u=\"urn:schemas-upnp-org:service:AVTransport:1\"/></s:Body>\r\n"
                "</s:Envelope>\r\n");
        } else if (strstr(buf, "GetTransportInfo")) {
            const char *state = http_streamer_is_playing() ? "PLAYING" : "STOPPED";
            snprintf(soap_resp, sizeof(soap_resp),
                "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">\r\n"
                "  <s:Body><u:GetTransportInfoResponse xmlns:u=\"urn:schemas-upnp-org:service:AVTransport:1\"><CurrentTransportState>%s</CurrentTransportState><CurrentTransportStatus>OK</CurrentTransportStatus><CurrentSpeed>1</CurrentSpeed></u:GetTransportInfoResponse></s:Body>\r\n"
                "</s:Envelope>\r\n", state);
        } else {
            snprintf(soap_resp, sizeof(soap_resp),
                "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">\r\n"
                "  <s:Body><u:Response xmlns:u=\"urn:schemas-upnp-org:service:AVTransport:1\"/></s:Body>\r\n"
                "</s:Envelope>\r\n");
        }
    }
    httpd_resp_set_type(req, "text/xml");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_send(req, soap_resp, strlen(soap_resp));
    return ESP_OK;
}

esp_err_t web_server_start(void)
{
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.max_uri_handlers = 24;
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

        // DLNA / UPnP MediaRenderer Endpoints
        httpd_uri_t uri_desc     = { .uri = "/description.xml",                 .method = HTTP_GET,  .handler = upnp_description_handler };
        httpd_uri_t uri_scpd_avt = { .uri = "/avtransport.xml",                 .method = HTTP_GET,  .handler = upnp_scpd_avt_handler };
        httpd_uri_t uri_scpd_rc  = { .uri = "/renderingcontrol.xml",            .method = HTTP_GET,  .handler = upnp_scpd_rc_handler };
        httpd_uri_t uri_scpd_cm  = { .uri = "/connectionmanager.xml",           .method = HTTP_GET,  .handler = upnp_scpd_cm_handler };
        httpd_uri_t uri_avt      = { .uri = "/upnp/control/AVTransport",        .method = HTTP_POST, .handler = upnp_avtransport_handler };
        httpd_uri_t uri_rc       = { .uri = "/upnp/control/RenderingControl",    .method = HTTP_POST, .handler = upnp_renderingcontrol_handler };
        httpd_uri_t uri_cm       = { .uri = "/upnp/control/ConnectionManager",   .method = HTTP_POST, .handler = upnp_connectionmanager_handler };

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

        httpd_register_uri_handler(s_server, &uri_desc);
        httpd_register_uri_handler(s_server, &uri_scpd_avt);
        httpd_register_uri_handler(s_server, &uri_scpd_rc);
        httpd_register_uri_handler(s_server, &uri_scpd_cm);
        httpd_register_uri_handler(s_server, &uri_avt);
        httpd_register_uri_handler(s_server, &uri_rc);
        httpd_register_uri_handler(s_server, &uri_cm);

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
