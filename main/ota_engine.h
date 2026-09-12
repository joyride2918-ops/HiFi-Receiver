#ifndef OTA_ENGINE_H
#define OTA_ENGINE_H

#include "esp_err.h"
#include "esp_ota_ops.h"

esp_err_t ota_engine_validate_boot(void);
esp_err_t ota_engine_begin(esp_ota_handle_t *out_handle, const esp_partition_t **out_partition);
esp_err_t ota_engine_write(esp_ota_handle_t handle, const void *data, size_t size);
esp_err_t ota_engine_end(esp_ota_handle_t handle, const esp_partition_t *partition);
const char* ota_engine_get_running_partition_name(void);

#endif // OTA_ENGINE_H
