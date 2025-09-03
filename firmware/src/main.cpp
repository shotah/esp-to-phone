/**
 * AI Companion Device - ESP32 T-Display AMOLED
 * Wearable AI Assistant Interface with LVGL Buttons
 *
 * Features:
 * - LVGL 9.3.0 UI with touch buttons
 * - AI assistant message display simulation
 * - Battery status indicators
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <BLE2902.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <SPIFFS.h>

// LilyGo T-Display AMOLED includes
#include "constants.h"
#include <LV_Helper.h>
#include <LilyGo_AMOLED.h>

// Display and touch
LilyGo_Class amoled;

// LVGL objects
lv_obj_t *main_screen;
lv_obj_t *status_bar;
lv_obj_t *connection_label;
lv_obj_t *battery_label;
lv_obj_t *message_container;
lv_obj_t *current_message_label;
lv_obj_t *btn1;
lv_obj_t *btn1_label;

// BLE variables
BLEServer *pServer = nullptr;
BLECharacteristic *pTxCharacteristic = nullptr;
BLECharacteristic *pRxCharacteristic = nullptr;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// BLE UUIDs (Nordic UART Service compatible)
// These UUIDs provide compatibility with standard BLE UART implementations
#define SERVICE_UUID "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

// Application state
String device_name = "AI-Companion";
String current_message = "Welcome to your AI Companion!";

int battery_percentage = 100;
unsigned long last_message_time = 0;
unsigned long last_battery_update = 0;

// Message queue for display
const int MAX_MESSAGES = 10;
String message_queue[MAX_MESSAGES];
int message_count = 0;
int current_message_index = 0;

// Forward declarations
bool setup_display();
void setup_ui();
void setup_ble();
void send_ble_message(const String &type, const String &message,
                      const String &action = "");
void update_connection_status();
void update_battery_status();
void add_message_to_queue(const String &message);
void display_next_message();
void display_previous_message();

// BLE Server Callbacks
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) {
    deviceConnected = true;
    Serial.println("BLE Client connected");

    // Log current MTU for debugging
    uint16_t currentMTU = pServer->getPeerMTU(pServer->getConnId());
    Serial.printf("📡 MTU negotiated: %d bytes\n", currentMTU);

    // Log connection for monitoring (production: consider privacy implications)
    // Note: BLE peer address access varies by ESP32 BLE library version
    Serial.printf("🔐 Device connected from BLE client\n");

    add_message_to_queue("📱 Phone connected!");
    send_ble_message("connected", "ESP32 ready for communication", "ready");
  };

  void onDisconnect(BLEServer *pServer) {
    deviceConnected = false;
    Serial.println("BLE Client disconnected");
    add_message_to_queue("📱 Phone disconnected");
    // Restart advertising
    BLEDevice::startAdvertising();
  }
};

// BLE Characteristic Callbacks
class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String received_data = pCharacteristic->getValue().c_str();

    if (received_data.length() > 0) {
      Serial.println("BLE Received: " + received_data);

      // Parse JSON data
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, received_data);

      if (error) {
        Serial.println("JSON parsing failed: " + String(error.c_str()));
        return;
      }

      String type = doc["type"] | "";
      String message = doc["message"] | "";

      if (type == "ai_request") {
        add_message_to_queue("🤖 Processing: " + message);
        send_ble_message("ai_response", "AI Response to: " + message,
                         "processed");
        display_next_message();
      } else if (type == "test") {
        add_message_to_queue("📱 " + message);
        send_ble_message("test_response", "Hello from ESP32!", "ack");
        display_next_message();
      } else if (type == "hello") {
        add_message_to_queue("📱 " + message);
        send_ble_message("welcome", "Hello from ESP32! Ready to chat.",
                         "ready");
        display_next_message();
      } else {
        add_message_to_queue("📱 " + message);
        display_next_message();
      }
    }
  }
};

// LVGL display buffer - will be handled by LV_Helper
// T-Display AMOLED dimensions: 536x240
static const uint16_t screenWidth = 536;
static const uint16_t screenHeight = 240;

// Button event handlers
static void btn1_event_handler(lv_event_t *e) {
  lv_event_code_t code = lv_event_get_code(e);
  if (code == LV_EVENT_CLICKED) {
    Serial.println("Ask AI button pressed");
    add_message_to_queue("🔵 AI Assistant: How can I help you?");

    // Send BLE message to phone if connected
    if (deviceConnected) {
      send_ble_message("btn", "Ask AI", "ask");
    }

    display_next_message();
  }
}

// Touch input and display handling will be managed by LV_Helper

void setup() {
  Serial.begin(115200);
  delay(1000); // Give serial time to initialize
  Serial.println("\n=== AI Companion Device Starting ===");

  // Initialize SPIFFS
  Serial.print("Initializing SPIFFS... ");
  if (!SPIFFS.begin(true)) {
    Serial.println("FAILED!");
  } else {
    Serial.println("OK");
  }

  // Initialize display
  Serial.print("Initializing display... ");
  if (!setup_display()) {
    Serial.println("Display setup failed!");
    while (1)
      delay(1000); // Halt on display failure
  }
  Serial.println("OK");

  // Setup LVGL UI
  Serial.print("Setting up UI... ");
  setup_ui();
  Serial.println("OK");

  // Initialize BLE
  Serial.print("Initializing BLE... ");
  setup_ble();
  Serial.println("OK");

  Serial.println("=== Setup completed successfully! ===");
  Serial.println("ESP32 ready for BLE connections");
}

bool setup_display() {
  Serial.print("Setting up AMOLED display... ");

  // Initialize the AMOLED display
  bool result = amoled.begin();
  if (!result) {
    Serial.println("FAILED!");
    return false;
  }

  amoled.setRotation(0);
  amoled.setBrightness(200); // Adjust brightness (0-255)

  // Use LV_Helper but with potential workaround for LVGL 9.3.0 API issue
  beginLvglHelper(amoled);

  Serial.println("OK");
  return true;
}

void setup_ui() {
  Serial.println("Setting up UI...");

  // Create main screen
  main_screen = lv_obj_create(nullptr);
  lv_obj_set_style_bg_color(main_screen, lv_color_hex(0x000000), LV_PART_MAIN);
  lv_screen_load(main_screen);

  // Status bar at top - taller for better text and button
  status_bar = lv_obj_create(main_screen);
  lv_obj_set_size(status_bar, screenWidth, 45);
  lv_obj_set_pos(status_bar, 0, 0);
  lv_obj_set_style_bg_color(status_bar, lv_color_hex(0x2196F3), LV_PART_MAIN);
  lv_obj_set_style_border_width(status_bar, 0, LV_PART_MAIN);
  lv_obj_set_style_radius(status_bar, 0, LV_PART_MAIN);

  // Connection status label
  connection_label = lv_label_create(status_bar);
  lv_label_set_text(connection_label, "🔴 Disconnected");
  lv_obj_set_style_text_color(connection_label, lv_color_hex(0xFFFFFF),
                              LV_PART_MAIN);
  lv_obj_set_pos(connection_label, 8, 10);
  // Increase text size for readability
  lv_obj_set_style_text_font(connection_label, &lv_font_montserrat_16,
                             LV_PART_MAIN);

  // Battery status label
  battery_label = lv_label_create(status_bar);
  lv_label_set_text(battery_label, "🔋 100%");
  lv_obj_set_style_text_color(battery_label, lv_color_hex(0xFFFFFF),
                              LV_PART_MAIN);
  lv_obj_align(battery_label, LV_ALIGN_TOP_RIGHT, -8, 10);
  // Increase text size for readability
  lv_obj_set_style_text_font(battery_label, &lv_font_montserrat_16,
                             LV_PART_MAIN);

  // Initially hide the Ask AI button (will be shown in connected mode)
  btn1 = lv_button_create(status_bar);
  lv_obj_set_size(btn1, 90, 30);
  lv_obj_align(btn1, LV_ALIGN_TOP_RIGHT, -95, 7);
  lv_obj_set_style_bg_color(btn1, lv_color_hex(0x4CAF50), LV_PART_MAIN);
  lv_obj_set_style_radius(btn1, 15, LV_PART_MAIN);
  lv_obj_add_event_cb(btn1, btn1_event_handler, LV_EVENT_CLICKED, nullptr);
  lv_obj_add_flag(btn1, LV_OBJ_FLAG_HIDDEN); // Initially hidden

  btn1_label = lv_label_create(btn1);
  lv_label_set_text(btn1_label, "Ask AI");
  lv_obj_set_style_text_color(btn1_label, lv_color_hex(0xFFFFFF), LV_PART_MAIN);
  lv_obj_center(btn1_label);
  lv_obj_set_style_text_font(btn1_label, &lv_font_montserrat_16, LV_PART_MAIN);

  // Message container
  message_container = lv_obj_create(main_screen);
  lv_obj_set_size(message_container, screenWidth, screenHeight - 55);
  lv_obj_set_pos(message_container, 0, 50);
  lv_obj_set_style_bg_color(message_container, lv_color_hex(0x1E1E1E),
                            LV_PART_MAIN);
  lv_obj_set_style_border_color(message_container, lv_color_hex(0x333333),
                                LV_PART_MAIN);
  lv_obj_set_style_border_width(message_container, 2, LV_PART_MAIN);
  lv_obj_set_style_radius(message_container, 10, LV_PART_MAIN);

  // Current message label
  current_message_label = lv_label_create(message_container);
  lv_label_set_text(current_message_label,
                    "ESP32 Ready!\nWaiting for phone connection...");
  lv_obj_set_style_text_color(current_message_label, lv_color_hex(0xFFFFFF),
                              LV_PART_MAIN);
  lv_obj_set_style_text_align(current_message_label, LV_TEXT_ALIGN_CENTER,
                              LV_PART_MAIN);
  lv_label_set_long_mode(current_message_label, LV_LABEL_LONG_WRAP);
  lv_obj_set_size(current_message_label, screenWidth - 20, screenHeight - 75);
  lv_obj_set_style_text_font(current_message_label, &lv_font_montserrat_18,
                             LV_PART_MAIN);
  lv_obj_center(current_message_label);

  Serial.println("UI setup completed!");
}

void loop() {
  static unsigned long last_heartbeat = 0;
  unsigned long current_time = millis();

  // Status check every 5 seconds
  if (current_time - last_heartbeat > 5000) {
    Serial.printf("Status: %s | Messages: %d\n",
                  deviceConnected ? "Connected" : "Advertising", message_count);
    last_heartbeat = current_time;
  }

  // Handle LVGL tasks (using LVGL 9.x API)
  lv_timer_handler();

  // Handle BLE connection status changes
  if (!deviceConnected && oldDeviceConnected) {
    Serial.println("BLE: Device disconnected, restarting advertising");
    delay(500); // Give the bluetooth stack the chance to get things ready
    pServer->startAdvertising(); // Restart advertising
    Serial.println("BLE: Advertising restarted");
    oldDeviceConnected = deviceConnected;
    update_connection_status();
    // Hide the Ask AI button when disconnected
    lv_obj_add_flag(btn1, LV_OBJ_FLAG_HIDDEN);
  }

  // Connected to a client
  if (deviceConnected && !oldDeviceConnected) {
    Serial.println("BLE: Device connected!");
    oldDeviceConnected = deviceConnected;
    update_connection_status();
    // Show the Ask AI button when connected
    lv_obj_clear_flag(btn1, LV_OBJ_FLAG_HIDDEN);
    add_message_to_queue("Ready to communicate!");
    display_next_message();
  }

  // Update status indicators periodically
  if (current_time - last_message_time > 30000) { // 30 seconds
    update_connection_status();
    last_message_time = current_time;
  }

  if (current_time - last_battery_update > 60000) { // 1 minute
    update_battery_status();
    last_battery_update = current_time;
  }

  delay(5); // Small delay for stability
}

void update_connection_status() {
  if (deviceConnected) {
    lv_label_set_text(connection_label, "🟢 Connected");
  } else {
    lv_label_set_text(connection_label, "🔴 Disconnected");
  }
}

void update_battery_status() {
  // Battery simulation for proof of concept
  // TODO: Implement actual battery monitoring via ADC
  battery_percentage = random(75, 100);

  String battery_text = "🔋 " + String(battery_percentage) + "%";
  lv_label_set_text(battery_label, battery_text.c_str());
}

void add_message_to_queue(const String &message) {
  // Add message to queue
  if (message_count < MAX_MESSAGES) {
    message_queue[message_count] = message;
    message_count++;
  } else {
    // Shift messages and add new one
    for (int i = 0; i < MAX_MESSAGES - 1; i++) {
      message_queue[i] = message_queue[i + 1];
    }
    message_queue[MAX_MESSAGES - 1] = message;
  }

  // Display the latest message
  current_message_index = message_count - 1;
  if (current_message_index >= MAX_MESSAGES) {
    current_message_index = MAX_MESSAGES - 1;
  }

  // Update display
  if (message_count > 0) {
    lv_label_set_text(current_message_label,
                      message_queue[current_message_index].c_str());
  }

  Serial.println("Added message: " + message);
}

void display_next_message() {
  if (message_count > 0 && current_message_index < message_count - 1) {
    current_message_index++;
    lv_label_set_text(current_message_label,
                      message_queue[current_message_index].c_str());
  }
}

void display_previous_message() {
  if (message_count > 0 && current_message_index > 0) {
    current_message_index--;
    lv_label_set_text(current_message_label,
                      message_queue[current_message_index].c_str());
  }
}

void setup_ble() {
  Serial.println("Initializing BLE...");

  // Initialize BLE Device
  BLEDevice::init(device_name.c_str());

  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create BLE Characteristics
  pTxCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID_TX,
      BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ);
  pTxCharacteristic->addDescriptor(new BLE2902());

  pRxCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID_RX,
      BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_READ);
  pRxCharacteristic->setCallbacks(new MyCallbacks());

  // Start the service
  pService->start();
  Serial.println("✅ BLE service started");

  // Negotiate larger MTU for bigger payloads
  BLEDevice::setMTU(256); // Request 256 byte MTU (most devices support this)
  Serial.println("📡 BLE MTU set to 256 bytes for larger payloads");
  Serial.printf("Service UUID: %s\n", SERVICE_UUID);
  Serial.printf("TX Characteristic: %s\n", CHARACTERISTIC_UUID_TX);
  Serial.printf("RX Characteristic: %s\n", CHARACTERISTIC_UUID_RX);

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(
      0x0); // Set value to 0x00 to not advertise this parameter

  Serial.println("Starting BLE advertising...");
  Serial.printf("Device Name: %s\n", device_name.c_str());

  BLEDevice::startAdvertising();
  Serial.println("✅ BLE advertising started");

  Serial.printf("✅ BLE device \"%s\" is now advertising!\n",
                device_name.c_str());
  Serial.println("📡 Broadcasting service UUID for discovery...");
  Serial.println("⏳ Waiting for phone to connect...");
}

void send_ble_message(const String &type, const String &message,
                      const String &action) {
  if (deviceConnected && pTxCharacteristic != nullptr) {
    JsonDocument doc;
    doc["type"] = type;
    doc["message"] = message;
    doc["action"] = action;

    String json_string;
    serializeJson(doc, json_string);

    Serial.printf("📤 Original message: %s (%d bytes)\n", json_string.c_str(),
                  json_string.length());

    // MTU-aware message sizing (negotiated with client)
    const size_t MAX_NOTIFICATION_SIZE =
        200; // Conservative limit for reliability

    if (json_string.length() <= MAX_NOTIFICATION_SIZE) {
      // Send as notification
      Serial.printf("📡 Sending as notification: %s\n", json_string.c_str());
      pTxCharacteristic->setValue(json_string.c_str());
      pTxCharacteristic->notify();
      Serial.println("✅ BLE notification sent");
    } else {
      // For very large messages, log warning
      Serial.printf("⚠️ Message too large for notification (%d > %d bytes)\n",
                    json_string.length(), MAX_NOTIFICATION_SIZE);
      Serial.println("💡 Message truncated to fit MTU");
      // Truncate and send
      String truncated = json_string.substring(0, MAX_NOTIFICATION_SIZE);
      Serial.printf("📡 Sending truncated: %s\n", truncated.c_str());
      pTxCharacteristic->setValue(truncated.c_str());
      pTxCharacteristic->notify();
    }
  } else {
    Serial.println("⚠️ Cannot send BLE message - not connected or "
                   "characteristic unavailable");
  }
}
