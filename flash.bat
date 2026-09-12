@echo off
REM ==============================================================================
REM ESP32-S3 Flash Script for Windows
REM Usage: flash.bat COM3
REM ==============================================================================

set PORT=%1
if "%PORT%"=="" (
    echo [ERROR] Please provide your COM port.
    echo Example: flash.bat COM3
    exit /b 1
)

echo [INFO] Flashing ESP32-S3 N16R8 on %PORT% at 921600 baud...

if exist "build\merged.bin" (
    echo [INFO] Writing monolithic merged.bin at offset 0x0...
    esptool.py --chip esp32s3 -p %PORT% -b 921600 --before default_reset --after hard_reset write_flash -z --flash_mode dio --flash_freq 80m --flash_size 16MB 0x0 build\merged.bin
) else (
    echo [INFO] Writing individual partitions: bootloader, partitions, otadata, app...
    esptool.py --chip esp32s3 -p %PORT% -b 921600 --before default_reset --after hard_reset write_flash -z --flash_mode dio --flash_freq 80m --flash_size 16MB 0x0 build\bootloader\bootloader.bin 0x8000 build\partition_table\partition-table.bin 0xf000 build\ota_data_initial.bin 0x20000 build\esp32s3_audio.bin
)

echo [SUCCESS] Flash completed! Starting serial monitor at 115200 baud...
idf.py -p %PORT% monitor
