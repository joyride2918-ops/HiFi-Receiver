cmake_minimum_required(VERSION 3.16)

# Register project-level components directory so components like mdns resolve automatically
list(APPEND EXTRA_COMPONENT_DIRS "${CMAKE_CURRENT_LIST_DIR}/components")

include($ENV{IDF_PATH}/tools/cmake/project.cmake)
project(esp32s3_audio)
