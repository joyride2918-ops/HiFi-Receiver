Import("env")
# ==============================================================================
# PlatformIO Post-Build Hook: Generates monolithic merged.bin (0x0 Flash Image)
# ==============================================================================
import os

def post_build_action(source, target, env):
    build_dir = env.subst("$BUILD_DIR")
    bootloader = os.path.join(build_dir, "bootloader.bin")
    partitions = os.path.join(build_dir, "partitions.bin")
    app = os.path.join(build_dir, "firmware.bin")
    merged = os.path.join(build_dir, "merged.bin")

    print("\n[PlatformIO Hook] Merging binaries into monolithic merged.bin...")
    cmd = (
        f"esptool.py --chip esp32s3 merge_bin -o {merged} "
        f"--flash_mode dio --flash_freq 80m --flash_size keep "
        f"0x0 {bootloader} 0x8000 {partitions} 0x20000 {app}"
    )
    res = os.system(cmd)
    if res == 0:
        print(f"[PlatformIO Hook] ✅ Created {merged} ready for 0x0 flashing!\n")

env.AddPostAction("$BUILD_DIR/${PROGNAME}.bin", post_build_action)
