cmake_minimum_required(VERSION 3.10)
project(udpleds)

set(CMAKE_CXX_STANDARD 17)

include_directories(include)
include_directories(config)

file(GLOB_RECURSE SOURCES
  src/*.cpp
)

add_executable(udpleds ${SOURCES})

target_link_libraries(udpleds
  ws2811
  pthread
)