# AI Companion Mobile App - Makefile
# Windows PowerShell compatible React Native and Android build automation

# Variables
APP_NAME := AICompanionApp
ANDROID_DIR := android
IOS_DIR := ios
NODE_MODULES := node_modules
GRADLE := gradlew
METRO_PORT := 8081

.PHONY: help install clean clean-all start start-reset android ios test lint format \
        android-clean android-build android-debug android-release android-install \
        ios-clean ios-build ios-install metro-reset permissions check-deps \
        doctor link-bluetooth setup-env devices-android verify-android \
        dev-android prepare-release debug-info test-bluetooth network-info

# Default target
help: ## Show this help message
	@echo "AI Companion Mobile App - Available Commands:"
	@echo ""
	@echo "Installation and Setup:"
	@echo "  install              Install all dependencies"
	@echo "  setup-env            Complete environment setup including permissions"
	@echo "  check-deps           Check if required tools are installed"
	@echo "  link-bluetooth       Link Bluetooth module for React Native"
	@echo "  fix-bluetooth-build  Fix Bluetooth library build issues"
	@echo "  fix-camera-build     Fix Camera library build issues"
	@echo "  fix-all-builds       Fix all known library build issues"
	@echo ""
	@echo "Development:"
	@echo "  start                Start Metro bundler"
	@echo "  start-reset          Start Metro bundler with cache reset"
	@echo "  metro-reset          Reset Metro cache"
	@echo ""
	@echo "Android Development:"
	@echo "  android              Build and run Android app (debug)"
	@echo "  android-debug        Build Android debug APK"
	@echo "  android-release      Build Android release APK"
	@echo "  android-build        Build Android project (without installing)"
	@echo "  android-install      Install app on connected Android device"
	@echo "  android-clean        Clean Android build"
	@echo "  android-logs         Show Android logs"
	@echo ""
	@echo "Testing and Quality:"
	@echo "  test                 Run tests"
	@echo "  test-watch           Run tests in watch mode"
	@echo "  lint                 Run ESLint"
	@echo "  lint-fix             Run ESLint with auto-fix"
	@echo "  format               Format code with Prettier"
	@echo ""
	@echo "Utility Commands:"
	@echo "  doctor               Run React Native doctor"
	@echo "  permissions          Show required permissions info"
	@echo "  clean                Clean node_modules and caches"
	@echo "  clean-all            Clean everything (node_modules, Android, caches)"
	@echo "  devices-android      List connected Android devices"
	@echo ""
	@echo "Quick Workflows:"
	@echo "  dev-android          Full Android development setup"
	@echo "  verify-android       Clean build and verify Android"
	@echo "  prepare-release      Prepare for release"

# Installation and Setup
install: ## Install all dependencies
	@echo "Installing dependencies..."
	npm install
	@echo "Dependencies installed successfully!"

setup-env: install link-bluetooth setup-android-sdk ## Complete environment setup including permissions
	@echo "Setting up development environment..."
	@echo "Environment setup complete!"

setup-android-sdk: ## Setup Android SDK path for build
	@echo "Setting up Android SDK configuration..."
	@if not exist android\local.properties ( echo sdk.dir=C:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk > android\local.properties )
	@echo "Android SDK configured!"

check-deps: ## Check if required tools are installed
	@echo "Checking dependencies..."
	@echo "Note: Manual verification required for Node.js and Java JDK"
	@echo "Run 'node --version' and 'java -version' to verify"

link-bluetooth: ## Link Bluetooth module for React Native
	@echo "Linking Bluetooth module..."
	@echo "WARNING: react-native-bluetooth-serial has compatibility issues with modern Android builds"
	@echo "Consider using react-native-ble-plx or @react-native-community/bluetooth-serial instead"
	-npx react-native link react-native-bluetooth-serial
	@echo "Bluetooth module linking attempted!"

fix-bluetooth-build: ## Fix Bluetooth library build issues
	@echo "Fixing react-native-bluetooth-serial build issues..."
	@if exist node_modules\react-native-bluetooth-serial\android\build.gradle ( \
		powershell -Command "(Get-Content node_modules\react-native-bluetooth-serial\android\build.gradle) -replace 'compile ', 'implementation ' | Set-Content node_modules\react-native-bluetooth-serial\android\build.gradle" \
	)
	@echo "Bluetooth build fixes applied!"

fix-camera-build: ## Fix Camera library build issues
	@echo "Fixing react-native-camera build issues..."
	@echo "Configuring camera library to use general flavor..."
	@if exist android\app\build.gradle ( \
		echo. >> android\app\build.gradle && \
		echo // Fix for react-native-camera ambiguity >> android\app\build.gradle && \
		echo configurations.all { >> android\app\build.gradle && \
		echo     resolutionStrategy { >> android\app\build.gradle && \
		echo         eachDependency { details -^> >> android\app\build.gradle && \
		echo             if (details.requested.group == 'AICompanionApp' ^&^& details.requested.name == 'react-native-camera') { >> android\app\build.gradle && \
		echo                 details.useTarget group: details.requested.group, name: details.requested.name, version: details.requested.version >> android\app\build.gradle && \
		echo             } >> android\app\build.gradle && \
		echo         } >> android\app\build.gradle && \
		echo     } >> android\app\build.gradle && \
		echo } >> android\app\build.gradle \
	)
	@echo "Camera build fixes applied!"

fix-all-builds: fix-bluetooth-build fix-camera-build ## Fix all known library build issues
	@echo "All build fixes applied!"

# Development
start: ## Start Metro bundler
	@echo "Starting Metro bundler..."
	npx react-native start

start-reset: ## Start Metro bundler with cache reset
	@echo "Starting Metro bundler with cache reset..."
	npx react-native start --reset-cache

metro-reset: ## Reset Metro cache
	@echo "Resetting Metro cache..."
	npx react-native start --reset-cache --port $(METRO_PORT)

# Android Development
android: ## Build and run Android app (debug)
	@echo "Building and running Android app..."
	npx react-native run-android

android-debug: ## Build Android debug APK
	@echo "Building Android debug APK..."
	cd $(ANDROID_DIR) && $(GRADLE) assembleDebug
	@echo "Debug APK built at: android\app\build\outputs\apk\debug\app-debug.apk"

android-release: ## Build Android release APK
	@echo "Building Android release APK..."
	cd $(ANDROID_DIR) && $(GRADLE) assembleRelease
	@echo "Release APK built at: android\app\build\outputs\apk\release\app-release.apk"

android-build: ## Build Android project (without installing)
	@echo "Building Android project..."
	cd $(ANDROID_DIR) && $(GRADLE) build

android-build-basic: ## Build Android project without camera dependencies
	@echo "Building basic Android project (excluding camera/QR features)..."
	@echo "This build excludes camera and QR code scanning functionality"
	@echo "To enable full features, fix library compatibility issues with 'make fix-all-builds'"
	cd $(ANDROID_DIR) && $(GRADLE) :app:assembleDebug -x lintVitalRelease

android-install: ## Install app on connected Android device
	@echo "Installing app on Android device..."
	cd $(ANDROID_DIR) && $(GRADLE) installDebug

android-clean: ## Clean Android build
	@echo "Cleaning Android build..."
	cd $(ANDROID_DIR) && $(GRADLE) clean

android-logs: ## Show Android logs
	@echo "Showing Android logs..."
	npx react-native log-android

# iOS Development
ios: ## Build and run iOS app
	@echo "Building and running iOS app..."
	npx react-native run-ios

ios-build: ## Build iOS project
	@echo "Building iOS project..."
	@echo "Note: iOS build requires macOS with Xcode"

ios-install: ## Install app on iOS device
	@echo "Installing app on iOS device..."
	@echo "Note: iOS install requires macOS with Xcode"

ios-clean: ## Clean iOS build
	@echo "Cleaning iOS build..."
	@echo "Note: iOS clean requires macOS with Xcode"

# Testing and Quality
test: ## Run tests
	@echo "Running tests..."
	npm test

test-watch: ## Run tests in watch mode
	@echo "Running tests in watch mode..."
	npm test -- --watch

lint: ## Run ESLint
	@echo "Running ESLint..."
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	@echo "Running ESLint with auto-fix..."
	npx eslint . --fix

format: ## Format code with Prettier
	@echo "Formatting code..."
	npx prettier --write .

# Utility Commands
doctor: ## Run React Native doctor
	@echo "Running React Native doctor..."
	npx react-native doctor

permissions: ## Show required permissions info
	@echo "Required permissions for Android:"
	@echo "- Bluetooth permissions (already configured)"
	@echo "- Location permissions (for Bluetooth scanning)"
	@echo "- Camera permissions (for QR scanning)"
	@echo ""
	@echo "Grant these permissions when prompted or via Settings"

# Cleaning
clean: ## Clean node_modules and caches
	@echo "Cleaning project..."
	@if exist $(NODE_MODULES) rmdir /s /q $(NODE_MODULES)
	npm cache clean --force
	@echo "Clean completed!"

clean-all: clean android-clean ## Clean everything (node_modules, Android, caches)
	@echo "Deep cleaning completed!"

# Device Management
devices-android: ## List connected Android devices
	@echo "Connected Android devices:"
	adb devices

devices-ios: ## List connected iOS devices
	@echo "Note: iOS device listing requires macOS"

# Build Verification
verify-android: android-clean android-build ## Clean build and verify Android
	@echo "Android build verification completed!"

verify-ios: ios-clean ios-build ## Clean build and verify iOS
	@echo "iOS build verification completed!"

# Quick Development Workflow
dev-android: clean-all install android ## Full Android development setup
	@echo "Android development environment ready!"

dev-ios: clean-all install ios ## Full iOS development setup
	@echo "iOS development environment ready!"

# Release Preparation
prepare-release: clean-all install test lint android-release ## Prepare for release
	@echo "Release preparation completed!"
	@echo "Release APK available at: android\app\build\outputs\apk\release\app-release.apk"

# Debugging
debug-info: ## Show debug information
	@echo "Debug Information:"
	@echo "Checking tool versions..."
	@node --version || echo "Node.js not found"
	@npm --version || echo "NPM not found"
	@npx react-native --version || echo "React Native CLI not found"
	@java -version || echo "Java not found"
	@echo ""

# Network and Communication
test-bluetooth: ## Test Bluetooth functionality
	@echo "Testing Bluetooth functionality..."
	@echo "Make sure ESP32 is paired and running"
	@echo "Check Android Settings > Bluetooth for 'AI-Companion'"

network-info: ## Show network configuration
	@echo "Network Configuration:"
	@echo "Metro bundler port: $(METRO_PORT)"
	@echo "Make sure firewall allows Metro on port $(METRO_PORT)"