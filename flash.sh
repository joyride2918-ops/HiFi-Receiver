#!/usr/bin/env bash
# ==============================================================================
# ESP32-S3 Auto-Flash Script (Linux & macOS)
# Flashes monolithic merged.bin at 0x0 or individual build partitions
# ==============================================================================
set -e

PORT=${1:-""}

if [ -z "$PORT" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        PORT=$(ls /dev/cu.wchusbserial* /dev/cu.usbserial* /dev/cu.SLAB_USBtoUART /dev/cu.usbmodem* 2>/dev/null | head -n 1 || true)
    else
        PORT=$(ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null | head -n 1 || true)
    fi
fi

if [ -z "$PORT" ]; then
    echo "❌ Error: No ESP32-S3 serial port automatically detected."
    echo "Usage: ./flash.sh [/dev/ttyUSB0 or /dev/ttyACM0 or COM port]"
    exit 1
fi

echo "🚀 Connecting to ESP32-S3 on port: $PORT"

if [ -f "build/merged.bin" ]; then
    echo "📦 Flashing pre-compiled monolithic merged.bin at offset 0x00000000 (baud 921600)..."
    esptool.py --chip esp32s3 -p "$PORT" -b 921600 --before default_reset --after hard_reset write_flash -z \
        --flash_mode dio --flash_freq 80m --flash_size 16MB \
        0x0 build/merged.bin
elif [ -f "build/esp32s3_audio.bin" ]; then
    echo "📦 Flashing individual partition table and firmware binaries..."
    esptool.py --chip esp32s3 -p "$PORT" -b 921600 --before default_reset --after hard_reset write_flash -z \
        --flash_mode dio --flash_freq 80m --flash_size 16MB \
        0x0 build/bootloader/bootloader.bin \
        0x8000 build/partition_table/partition-table.bin \
        0xf000 build/ota_data_initial.bin \
        0x20000 build/esp32s3_audio.bin
else
    echo "❌ Error: Binaries not found in build/ directory. Run 'idf.py build' or download merged.bin first."
    exit 1
fi

echo "✅ Flashing successful! Opening live serial monitor at 115200 baud..."
python3 -m serial.tools.miniterm "$PORT" 115200 || idf.py -p "$PORT" monitor
