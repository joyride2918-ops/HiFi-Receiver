#!/usr/bin/env python3
"""
ESP32-S3 Merged Binary Generator
Combines build artifacts into a single monolithic 0x0 binary for flashing.
"""
import sys
import os
import glob
import subprocess

def find_file(candidates):
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None

def main():
    print("=== ESP32-S3 Merged Binary Generator ===")

    # 1. Locate Bootloader (offset 0x0)
    bootloader = find_file([
        "build/bootloader/bootloader.bin",
        "build/bootloader.bin",
        ".pio/build/esp32s3_espidf/bootloader.bin"
    ])

    # 2. Locate Partition Table (offset 0x8000)
    partitions = find_file([
        "build/partition_table/partition-table.bin",
        "build/partitions.bin",
        ".pio/build/esp32s3_espidf/partitions.bin"
    ])

    # 3. Locate Main Application Binary (offset 0x20000)
    app = find_file([
        "build/esp32s3_audio.bin",
        "build/esp32s3_wifi_music.bin",
        "build/firmware.bin",
        ".pio/build/esp32s3_espidf/firmware.bin"
    ])

    # Fallback search for any other main app binary in build/
    if not app and os.path.isdir("build"):
        for f in glob.glob("build/*.bin"):
            base = os.path.basename(f)
            if base not in ["merged.bin", "ota_data_initial.bin", "bootloader.bin", "partition-table.bin", "partitions.bin"]:
                app = f
                break

    # 4. Locate OTA Data Initial (offset 0xf000, optional)
    otadata = find_file([
        "build/ota_data_initial.bin",
        "build/bootloader/ota_data_initial.bin",
        ".pio/build/esp32s3_espidf/ota_data_initial.bin"
    ])

    print(f"  Bootloader:      {bootloader or '❌ NOT FOUND'}")
    print(f"  Partition Table: {partitions or '❌ NOT FOUND'}")
    print(f"  Application:     {app or '❌ NOT FOUND'}")
    print(f"  OTA Data Initial:{otadata or '⚠️ Not present (optional)'}")

    if not bootloader or not partitions or not app:
        print("\n❌ Error: Missing required binary artifacts to create merged.bin!", file=sys.stderr)
        if os.path.isdir("build"):
            print("Files present in build/:", os.listdir("build"), file=sys.stderr)
        sys.exit(1)

    out_dir = os.path.dirname(app)
    output = os.path.join(out_dir, "merged.bin")

    # If app was found under a different name (e.g. esp32s3_wifi_music.bin),
    # ensure esp32s3_audio.bin also exists for downstream scripts
    standard_app_path = os.path.join(out_dir, "esp32s3_audio.bin")
    if os.path.abspath(app) != os.path.abspath(standard_app_path):
        try:
            import shutil
            shutil.copyfile(app, standard_app_path)
            print(f"  Mirrored to:     {standard_app_path}")
        except Exception as e:
            print(f"  Mirror warning:  {e}")

    cmd = [
        "esptool.py", "--chip", "esp32s3", "merge_bin",
        "-o", output,
        "--flash_mode", "dio",
        "--flash_freq", "80m",
        "--flash_size", "keep",
        "0x0", bootloader,
        "0x8000", partitions
    ]

    if otadata:
        cmd.extend(["0xf000", otadata])

    cmd.extend(["0x20000", app])

    print("\nRunning esptool merge command:")
    print(" ".join(cmd))

    try:
        res = subprocess.run(cmd, check=True)
        print(f"\n✅ Successfully generated monolithic '{output}'!")
        print(f"Flash with: esptool.py --chip esp32s3 write_flash 0x0 {output}\n")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error merging binaries: {e}", file=sys.stderr)
        sys.exit(e.returncode)

if __name__ == "__main__":
    main()
