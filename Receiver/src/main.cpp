#include "core/Application.h"
#include <iostream>

int main() {
  Application app;

  if (!app.initialize()) {
    std::cerr << "Initialization failed.\n";
    return -1;
  }

  app.run();
  return 0;
}