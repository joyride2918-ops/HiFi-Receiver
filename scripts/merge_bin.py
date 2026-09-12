#!/usr/bin/env python3
"""
ESP32-S3 Merged Binary Generator
Combines all build artifacts into a single monolithic 0x0 binary for production flashing.
"""
import sys
import os
import subprocess

def main():
    print("=== ESP32-S3 N16R8 Merged Binary Generator ===")
    
    bootloader = "build/bootloader/bootloader.bin"
    partitions = "build/partition_table/partition-table.bin"
    otadata = "build/ota_data_initial.bin"
    app = "build/esp32s3_audio.bin"
    output = "build/merged.bin"

    cmd = [
        "esptool.py", "--chip", "esp32s3", "merge_bin",
        "-o", output,
        "--flash_mode", "dio",
        "--flash_freq", "80m",
        "--flash_size", "16MB",
        "0x0", bootloader,
        "0x8000", partitions,
        "0xf000", otadata,
        "0x20000", app
    ]

    print("Running:", " ".join(cmd))
    try:
        subprocess.run(cmd, check=True)
        print(f"\n✅ Successfully generated monolithic '{output}'!")
        print(f"Flash with: esptool.py --chip esp32s3 write_flash 0x0 {output}")
    except Exception as e:
        print(f"❌ Error merging binaries: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
