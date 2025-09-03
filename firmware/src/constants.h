#ifndef CONSTANTS_H
#define CONSTANTS_H

namespace Constants {
// T-Display AMOLED Hardware Constants
struct Display {
  // Note: Actual dimensions are retrieved dynamically via amoled.width() and
  // amoled.height() T-Display AMOLED typical: 536x240 pixels
  static const int DEFAULT_WIDTH = 536;
  static const int DEFAULT_HEIGHT = 240;
  static const int COLOR_DEPTH = 16; // RGB565
};

struct Bluetooth {
  static constexpr const char *DEVICE_NAME = "AI-Companion";
  static constexpr const char *DEFAULT_PIN = "1234";
  static const int PAIRING_TIMEOUT_MS = 30000;   // 30 seconds
  static const int RECONNECT_INTERVAL_MS = 5000; // 5 seconds
};

struct Battery {
  static const int UPDATE_INTERVAL_MS = 10000;      // 10 seconds
  static const int LOW_BATTERY_THRESHOLD = 20;      // 20%
  static const int CRITICAL_BATTERY_THRESHOLD = 10; // 10%
};

struct Timing {
  static const int LVGL_HANDLER_INTERVAL_MS = 5;
  static const int MAIN_LOOP_DELAY_MS = 10;
  static const int MESSAGE_DISPLAY_TIMEOUT_MS = 5000; // 5 seconds
  static const int TOUCH_DEBOUNCE_MS = 200;           // 200ms
};

struct UI {
  // Button dimensions and positions (percentages of screen)
  static const int BUTTON_HEIGHT = 50;
  static const int BUTTON_SPACING = 10;
  static const int STATUS_BAR_HEIGHT = 30;
  static const int MESSAGE_CONTAINER_HEIGHT = 100;

  // Colors (RGB565 format)
  static const uint16_t COLOR_PRIMARY = 0x07E0;    // Green
  static const uint16_t COLOR_SECONDARY = 0x001F;  // Blue
  static const uint16_t COLOR_ACCENT = 0xF800;     // Red
  static const uint16_t COLOR_BACKGROUND = 0x0000; // Black
  static const uint16_t COLOR_TEXT = 0xFFFF;       // White
  static const uint16_t COLOR_WARNING = 0xFFE0;    // Yellow
};

struct Messages {
  static const int MAX_MESSAGE_LENGTH = 256;
  static const int MESSAGE_QUEUE_SIZE = 10;
  static constexpr const char *WELCOME_MESSAGE =
      "Welcome to your AI Companion!";
  static constexpr const char *PAIRING_MESSAGE = "Pairing Mode Active";
  static constexpr const char *CONNECTED_MESSAGE = "Connected to phone";
  static constexpr const char *DISCONNECTED_MESSAGE = "Bluetooth disconnected";
};

struct WiFi {
  // Optional WiFi for future features
  static constexpr const char *AP_SSID = "AI-Companion-Setup";
  static constexpr const char *AP_PASSWORD = "companion123";
  static const int CONNECTION_TIMEOUT_MS = 15000; // 15 seconds
};

struct JSON {
  // JSON message structure
  static constexpr const char *KEY_TYPE = "type";
  static constexpr const char *KEY_MESSAGE = "message";
  static constexpr const char *KEY_TIMESTAMP = "timestamp";
  static constexpr const char *KEY_DEVICE_NAME = "device_name";
  static constexpr const char *KEY_PIN = "pin";
  static constexpr const char *KEY_MAC = "mac";

  // Message types
  static constexpr const char *TYPE_CHAT = "chat";
  static constexpr const char *TYPE_PAIRING = "pairing";
  static constexpr const char *TYPE_STATUS = "status";
  static constexpr const char *TYPE_COMMAND = "command";
};

struct Storage {
  static constexpr const char *PREFS_NAMESPACE = "ai_companion";
  static constexpr const char *KEY_DEVICE_NAME = "device_name";
  static constexpr const char *KEY_PAIRED_DEVICES = "paired_devices";
  static constexpr const char *KEY_USER_SETTINGS = "user_settings";
};
} // namespace Constants

#endif // CONSTANTS_H
