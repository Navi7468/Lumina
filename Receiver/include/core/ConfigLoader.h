#pragma once
#include "Config.h"
#include <string>

class ConfigLoader {
public:
  // Attempts to load config.json from `path`.
  // Any key missing from the file retains its compiled-in default value.
  // Returns true if the file was found and parsed successfully, false if the
  // file was missing or could not be parsed (defaults are used in both cases).
  static bool load(const std::string& path, Config& out);
};
