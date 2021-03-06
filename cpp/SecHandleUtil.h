#pragma once;

#include <winsock.h>
#define SECURITY_WIN32
#include <sspi.h>
#include <string>

namespace myAddon {

class SecHandleUtil {
 public:
  static std::string serialize(SecHandle& handle);
  static SecHandle deserialize(std::string& s);
};

}  // namespace myAddon
