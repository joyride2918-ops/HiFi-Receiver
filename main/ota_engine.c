#include "ota_engine.h"
#include "esp_log.h"
#include "esp_system.h"

static const char *TAG = "OTA_ENGINE";

esp_err_t ota_engine_validate_boot(void)
{
    const esp_partition_t *running = esp_ota_get_running_partition();
    esp_ota_img_states_t ota_state;
    if (esp_ota_get_state_partition(running, &ota_state) == ESP_OK) {
        if (ota_state == ESP_OTA_IMG_PENDING_VERIFY) {
            ESP_LOGI(TAG, "Validating freshly flashed OTA firmware partition: %s", running->label);
            esp_ota_mark_app_valid_cancel_rollback();
        }
    }
    ESP_LOGI(TAG, "Running firmware partition: %s (Offset: 0x%08" PRIx32 ", Size: %" PRIu32 " KB)", 
             running->label, running->address, running->size / 1024);
    return ESP_OK;
}

esp_err_t ota_engine_begin(esp_ota_handle_t *out_handle, const esp_partition_t **out_partition)
{
    const esp_partition_t *update_partition = esp_ota_get_next_update_partition(NULL);
    if (!update_partition) {
        ESP_LOGE(TAG, "No passive OTA partition available!");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Targeting OTA partition: %s", update_partition->label);
    esp_err_t err = esp_ota_begin(update_partition, OTA_WITH_SEQUENTIAL_WRITES, out_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_begin failed: %s", esp_err_to_name(err));
        return err;
    }

    *out_partition = update_partition;
    return ESP_OK;
}

esp_err_t ota_engine_write(esp_ota_handle_t handle, const void *data, size_t size)
{
    return esp_ota_write(handle, data, size);
}

esp_err_t ota_engine_end(esp_ota_handle_t handle, const esp_partition_t *partition)
{
    esp_err_t err = esp_ota_end(handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_end failed: %s", esp_err_to_name(err));
        return err;
    }

    err = esp_ota_set_boot_partition(partition);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_ota_set_boot_partition failed: %s", esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "OTA update complete! Next boot will launch %s. Rebooting...", partition->label);
    vTaskDelay(pdMS_TO_TICKS(1000));
    esp_restart();
    return ESP_OK;
}

const char* ota_engine_get_running_partition_name(void)
{
    const esp_partition_t *running = esp_ota_get_running_partition();
    return running ? running->label : "factory";
}
