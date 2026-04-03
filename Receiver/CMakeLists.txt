cmake_minimum_required(VERSION 3.11)
project(udpleds)

set(CMAKE_CXX_STANDARD 17)

# ---------------------------------------------------------------------------
# nlohmann/json  (header-only, fetched at configure time)
# ---------------------------------------------------------------------------
include(FetchContent)
FetchContent_Declare(
  nlohmann_json
  GIT_REPOSITORY https://github.com/nlohmann/json.git
  GIT_TAG        v3.11.3
  GIT_SHALLOW    TRUE
)
set(JSON_BuildTests OFF CACHE INTERNAL "")
set(JSON_Install    OFF CACHE INTERNAL "")
FetchContent_MakeAvailable(nlohmann_json)

# ---------------------------------------------------------------------------
# Application target
# ---------------------------------------------------------------------------
include_directories(include)
include_directories(config)

file(GLOB_RECURSE SOURCES
  src/*.cpp
)

add_executable(udpleds ${SOURCES})

target_link_libraries(udpleds
  ws2811
  pthread
  nlohmann_json::nlohmann_json
)
