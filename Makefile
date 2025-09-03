# AI Companion System - Root Makefile
# Unified build system for ESP32 firmware and React Native mobile app
# Windows PowerShell compatible

# Variables
PROJECT_NAME := AI-Companion
FIRMWARE_DIR := firmware
MOBILE_DIR := mobile-app/AICompanionApp
FIRMWARE_ENV := T-Display-AMOLED

.PHONY: help setup-all build-all clean-all deploy-all monitor-all lint-all format-all \
        firmware-build firmware-upload firmware-monitor firmware-deploy firmware-clean \
        mobile-install mobile-android mobile-deploy mobile-clean mobile-lint \
        test-all test-firmware test-mobile test-connection verify-all docs

# Default help target
help: ## Show this help message
	@echo "========================================="
	@echo "AI Companion System - Unified Commands"
	@echo "========================================="
	@echo ""
	@echo "🚀 Quick Start Commands:"
	@echo "  setup-all            Complete system setup (firmware + mobile)"
	@echo "  build-all            Build both firmware and mobile app"
	@echo "  deploy-all           Deploy firmware to ESP32 and app to Android"
	@echo "  monitor-all          Monitor both ESP32 serial and mobile logs"
	@echo ""
	@echo "🔧 Firmware Commands (ESP32):"
	@echo "  firmware-build       Build ESP32 firmware"
	@echo "  firmware-upload      Upload firmware to ESP32"
	@echo "  firmware-monitor     Monitor ESP32 serial output"
	@echo "  firmware-deploy      Build, upload, and monitor firmware"
	@echo "  firmware-clean       Clean firmware build"
	@echo "  firmware-format      Format C++ code"
	@echo "  firmware-lint        Run clang-tidy on firmware"
	@echo ""
	@echo "📱 Mobile App Commands (React Native):"
	@echo "  mobile-install       Install dependencies"
	@echo "  mobile-android       Build and run Android app"
	@echo "  mobile-deploy        Install deps and run Android app"
	@echo "  mobile-clean         Clean mobile build"
	@echo "  mobile-lint          Run ESLint on mobile app"
	@echo "  mobile-format        Format TypeScript code"
	@echo ""
	@echo "🧪 Testing Commands:"
	@echo "  test-all             Run all tests"
	@echo "  test-mobile          Run mobile app tests"
	@echo "  test-connection      Test BLE connection"
	@echo "  verify-all           Clean build and verify everything"
	@echo ""
	@echo "🛠 Utility Commands:"
	@echo "  lint-all             Lint all code (firmware + mobile)"
	@echo "  format-all           Format all code (firmware + mobile)"
	@echo "  clean-all            Clean all builds"
	@echo "  docs                 Generate documentation"
	@echo ""
	@echo "📊 Monitoring:"
	@echo "  status               Show system status"
	@echo "  devices              List connected devices"
	@echo ""
	@echo "Examples:"
	@echo "  make setup-all       # First time setup"
	@echo "  make deploy-all      # Deploy to both devices"
	@echo "  make monitor-all     # Watch logs from both"

# ============================================================================
# 🚀 QUICK START COMMANDS
# ============================================================================

setup-all: ## Complete system setup (firmware + mobile)
	@echo "🚀 Setting up complete AI Companion system..."
	@echo "Installing mobile app dependencies..."
	@$(MAKE) mobile-install
	@echo "✅ System setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Connect ESP32 via USB"
	@echo "2. Connect Android device via USB"
	@echo "3. Run: make deploy-all"

build-all: ## Build both firmware and mobile app
	@echo "🔨 Building complete AI Companion system..."
	@$(MAKE) firmware-build
	@$(MAKE) mobile-android
	@echo "✅ Build complete!"

deploy-all: ## Deploy firmware to ESP32 and app to Android
	@echo "🚀 Deploying complete AI Companion system..."
	@echo ""
	@echo "Step 1: Deploying firmware to ESP32..."
	@$(MAKE) firmware-deploy &
	@echo ""
	@echo "Step 2: Deploying mobile app to Android..."
	@$(MAKE) mobile-deploy
	@echo ""
	@echo "✅ Deployment complete!"
	@echo ""
	@echo "Ready for demo:"
	@echo "1. ESP32 should show 'AI Companion Ready!'"
	@echo "2. Mobile app should be installed on Android"
	@echo "3. Follow DEMO_GUIDE.md for testing"

monitor-all: ## Monitor both ESP32 serial and mobile logs
	@echo "📊 Monitoring ESP32 and mobile logs..."
	@echo "Press Ctrl+C to stop monitoring"
	@echo ""
	@start "ESP32 Monitor" cmd /k "cd $(FIRMWARE_DIR) && make monitor"
	@start "Mobile Logs" cmd /k "cd $(MOBILE_DIR) && npx react-native log-android"
	@echo "Monitoring windows opened. Check separate terminal windows."

# ============================================================================
# 🔧 FIRMWARE COMMANDS (ESP32)
# ============================================================================

firmware-build: ## Build ESP32 firmware
	@echo "🔨 Building ESP32 firmware..."
	@cd $(FIRMWARE_DIR) && $(MAKE) build
	@echo "✅ Firmware build complete!"

firmware-upload: ## Upload firmware to ESP32
	@echo "📤 Uploading firmware to ESP32..."
	@echo "Make sure ESP32 is connected via USB and in download mode if needed"
	@cd $(FIRMWARE_DIR) && $(MAKE) upload
	@echo "✅ Firmware uploaded!"

firmware-monitor: ## Monitor ESP32 serial output
	@echo "📊 Monitoring ESP32 serial output..."
	@echo "Press Ctrl+C to stop monitoring"
	@cd $(FIRMWARE_DIR) && $(MAKE) monitor

firmware-deploy: ## Build, upload, and monitor firmware
	@echo "🚀 Deploying ESP32 firmware..."
	@cd $(FIRMWARE_DIR) && $(MAKE) deploy
	@echo "✅ Firmware deployment complete!"

firmware-clean: ## Clean firmware build
	@echo "🧹 Cleaning firmware build..."
	@cd $(FIRMWARE_DIR) && $(MAKE) clean-all
	@echo "✅ Firmware clean complete!"

firmware-format: ## Format C++ code
	@echo "✨ Formatting firmware code..."
	@cd $(FIRMWARE_DIR) && $(MAKE) format
	@echo "✅ Firmware formatting complete!"

firmware-lint: ## Run clang-tidy on firmware
	@echo "🔍 Linting firmware code..."
	@cd $(FIRMWARE_DIR) && $(MAKE) tidy
	@echo "✅ Firmware linting complete!"

# ============================================================================
# 📱 MOBILE APP COMMANDS (React Native)
# ============================================================================

mobile-install: ## Install mobile app dependencies
	@echo "📦 Installing mobile app dependencies..."
	@cd $(MOBILE_DIR) && $(MAKE) install
	@echo "✅ Mobile dependencies installed!"

mobile-android: ## Build and run Android app
	@echo "📱 Building and running Android app..."
	@echo "Make sure Android device is connected via USB with USB debugging enabled"
	@cd $(MOBILE_DIR) && $(MAKE) android
	@echo "✅ Mobile app deployed to Android!"

mobile-deploy: mobile-install mobile-android ## Install deps and run Android app

mobile-clean: ## Clean mobile build
	@echo "🧹 Cleaning mobile build..."
	@cd $(MOBILE_DIR) && $(MAKE) clean-all
	@echo "✅ Mobile clean complete!"

mobile-lint: ## Run ESLint on mobile app
	@echo "🔍 Linting mobile app code..."
	@cd $(MOBILE_DIR) && $(MAKE) lint
	@echo "✅ Mobile linting complete!"

mobile-format: ## Format TypeScript code
	@echo "✨ Formatting mobile app code..."
	@cd $(MOBILE_DIR) && $(MAKE) format
	@echo "✅ Mobile formatting complete!"

# ============================================================================
# 🧪 TESTING COMMANDS
# ============================================================================

test-all: test-mobile ## Run all tests
	@echo "✅ All tests complete!"

test-mobile: ## Run mobile app tests
	@echo "🧪 Running mobile app tests..."
	@cd $(MOBILE_DIR) && $(MAKE) test
	@echo "✅ Mobile tests complete!"

test-connection: ## Test BLE connection
	@echo "🔗 Testing BLE connection..."
	@echo "This will check if ESP32 and mobile app can communicate"
	@echo ""
	@echo "1. Make sure ESP32 is running (should show 'AI Companion Ready!')"
	@echo "2. Make sure mobile app is installed on Android"
	@echo "3. In mobile app, tap 'Connect to ESP32'"
	@echo "4. Verify connection status turns green on both devices"
	@echo "5. Test button press on ESP32"
	@echo "6. Test 'Send Test Message' in mobile app"
	@echo ""
	@echo "See DEMO_GUIDE.md for detailed testing steps"

verify-all: clean-all build-all ## Clean build and verify everything
	@echo "✅ System verification complete!"

# ============================================================================
# 🛠 UTILITY COMMANDS
# ============================================================================

lint-all: firmware-lint mobile-lint ## Lint all code (firmware + mobile)
	@echo "✅ All code linting complete!"

format-all: firmware-format mobile-format ## Format all code (firmware + mobile)
	@echo "✅ All code formatting complete!"

clean-all: firmware-clean mobile-clean ## Clean all builds
	@echo "✅ Complete system clean finished!"

docs: ## Generate documentation
	@echo "📚 Generating documentation..."
	@echo "Main documentation files:"
	@echo "  README.md - Project overview and setup"
	@echo "  DEMO_GUIDE.md - Complete demonstration guide"
	@echo "  $(MOBILE_DIR)/README.md - Mobile app specific docs"
	@echo "✅ Documentation ready!"

# ============================================================================
# 📊 MONITORING AND STATUS
# ============================================================================

status: ## Show system status
	@echo "📊 AI Companion System Status:"
	@echo "================================"
	@echo ""
	@echo "Project: $(PROJECT_NAME)"
	@echo "Firmware Dir: $(FIRMWARE_DIR)"
	@echo "Mobile Dir: $(MOBILE_DIR)"
	@echo ""
	@echo "Checking tools..."
	@node --version 2>nul && echo "✅ Node.js installed" || echo "❌ Node.js not found"
	@npm --version 2>nul && echo "✅ NPM installed" || echo "❌ NPM not found" 
	@pio --version 2>nul && echo "✅ PlatformIO installed" || echo "❌ PlatformIO not found"
	@adb version 2>nul && echo "✅ ADB installed" || echo "❌ ADB not found"
	@echo ""
	@echo "Checking build status..."
	@if exist $(FIRMWARE_DIR)\.pio\build\$(FIRMWARE_ENV)\firmware.elf ( echo "✅ Firmware built" ) else ( echo "❌ Firmware not built" )
	@if exist $(MOBILE_DIR)\android\app\build\outputs\apk ( echo "✅ Mobile app built" ) else ( echo "❌ Mobile app not built" )

devices: ## List connected devices
	@echo "🔌 Connected Devices:"
	@echo "===================="
	@echo ""
	@echo "ESP32 devices (COM ports):"
	@powershell -Command "Get-WmiObject -Class Win32_SerialPort | Select-Object Name, Description, DeviceID | Format-Table -AutoSize"
	@echo ""
	@echo "Android devices:"
	@adb devices 2>nul || echo "ADB not available - install Android SDK"

# ============================================================================
# 🎯 DEMO AND TROUBLESHOOTING
# ============================================================================

demo: ## Quick demo setup
	@echo "🎬 AI Companion Demo Setup:"
	@echo "==========================="
	@echo ""
	@echo "Following DEMO_GUIDE.md reproduction steps..."
	@echo ""
	@echo "Step 1: Building and deploying firmware..."
	@$(MAKE) firmware-deploy
	@echo ""
	@echo "Step 2: Installing and running mobile app..."
	@$(MAKE) mobile-deploy
	@echo ""
	@echo "✅ Demo setup complete!"
	@echo ""
	@echo "Next: Follow DEMO_GUIDE.md Section 4 for testing"

troubleshoot: ## Troubleshooting guide
	@echo "🔧 Troubleshooting Guide:"
	@echo "========================"
	@echo ""
	@echo "Common issues and solutions:"
	@echo ""
	@echo "1. ESP32 not detected:"
	@echo "   - Check USB cable connection"
	@echo "   - Install ESP32 drivers"
	@echo "   - Try different USB port"
	@echo ""
	@echo "2. Android app won't install:"
	@echo "   - Enable USB debugging on Android"
	@echo "   - Check ADB connection with 'adb devices'"
	@echo "   - Try 'make mobile-clean' then 'make mobile-android'"
	@echo ""
	@echo "3. BLE connection fails:"
	@echo "   - Make sure both devices are powered on"
	@echo "   - Check Bluetooth permissions on Android"
	@echo "   - Try restarting both devices"
	@echo ""
	@echo "4. Build errors:"
	@echo "   - Run 'make clean-all' then 'make build-all'"
	@echo "   - Check tool versions with 'make status'"
	@echo "   - Ensure all dependencies installed"

# Show help by default
.DEFAULT_GOAL := help
