/**
 * AI Companion App - ESP32 Bluetooth Communication
 * Wearable AI Assistant Interface
 *
 * @format
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Buffer } from 'buffer';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
  TextInput,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

// BLE imports
import { BleManager, Device } from 'react-native-ble-plx';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  type: 'ai' | 'user' | 'device';
  expanded?: boolean;
}

interface QRData {
  serviceUUID: string;
  txUUID: string;
  rxUUID: string;
}

type AppMode = 'chat' | 'qr_scanner';
type QRMode = 'camera' | 'text';

// BLE UUIDs matching ESP32 firmware
const SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const CHARACTERISTIC_UUID_RX = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
const CHARACTERISTIC_UUID_TX = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [bleManager] = useState(() => new BleManager());
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [appMode, setAppMode] = useState<AppMode>('chat');
  const [dynamicUUIDs, setDynamicUUIDs] = useState<QRData | null>(null);
  const [qrInput, setQrInput] = useState<string>('');
  const [qrMode, setQrMode] = useState<QRMode>('camera');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to your AI Companion! 👋',
      timestamp: new Date(),
      type: 'ai',
    },
    {
      id: '2',
      text: 'Tap "Connect" to find and connect to your ESP32 device.',
      timestamp: new Date(),
      type: 'ai',
    },
    {
      id: '3',
      text: 'Make sure your ESP32 is powered on and nearby.',
      timestamp: new Date(),
      type: 'ai',
    },
  ]);

  // BLE Permission and Setup
  useEffect(() => {
    const initBLE = async () => {
      const permissionsGranted = await requestPermissions();
      if (!permissionsGranted) {
        addMessage(
          '⚠️ Some permissions denied. BLE features may not work properly.',
          'ai',
        );
      }
    };

    initBLE();

    // Monitor BLE state changes
    const subscription = bleManager.onStateChange(state => {
      console.log('BLE state changed:', state);
      if (state !== 'PoweredOn') {
        setIsConnected(false);
        setConnectedDevice(null);
        setDeviceName('');
        addMessage('❌ Bluetooth turned off', 'ai');
      } else {
        addMessage('✅ Bluetooth is ready', 'ai');
      }
    }, true);

    return () => {
      subscription?.remove();
      bleManager.destroy();
    };
  }, [bleManager]);

  // Monitor connection state changes
  useEffect(() => {
    if (connectedDevice) {
      const subscription = connectedDevice.onDisconnected((error, device) => {
        console.log('Device disconnected:', device.name);
        setIsConnected(false);
        setConnectedDevice(null);
        setDeviceName('');
        addMessage('📱 Device disconnected', 'ai');
        if (error) {
          addMessage('❌ Disconnection error: ' + error.message, 'ai');
        }
      });

      return () => subscription.remove();
    }
  }, [connectedDevice]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        console.log('Requesting Bluetooth permissions...');

        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          // Note: BLUETOOTH_ADVERTISE is not needed for BLE scanning/connecting
          // It's only needed for advertising (acting as a BLE peripheral)
          // PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        ];

        console.log('Permissions to request:', permissions);

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        console.log('Permission results:', granted);

        // Check each permission individually
        const results = Object.entries(granted).map(([permission, result]) => ({
          permission,
          result,
          granted: result === PermissionsAndroid.RESULTS.GRANTED,
        }));

        console.log('Detailed permission results:', results);

        const deniedPermissions = results.filter(p => !p.granted);

        if (deniedPermissions.length > 0) {
          console.log('Some permissions denied:', deniedPermissions);
          Alert.alert(
            'Permissions Required',
            `The following permissions are required to connect to ESP32 devices:\n\n${deniedPermissions
              .map(p => p.permission.replace('android.permission.', ''))
              .join('\n')}`,
            [{ text: 'OK' }],
          );
          return false;
        } else {
          console.log('All permissions granted!');
          return true;
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        Alert.alert(
          'Permission Error',
          'Failed to request permissions: ' + (err as Error).message,
          [{ text: 'OK' }],
        );
        return false;
      }
    }
    return true;
  };

  // Unique ID counter to prevent duplicate keys
  const messageIdCounter = useRef(0);

  const addMessage = (text: string, type: 'ai' | 'user' | 'device') => {
    const newMessage: Message = {
      id: `${Date.now()}-${messageIdCounter.current++}`,
      text: text,
      timestamp: new Date(),
      type: type,
    };
    setMessages(prev => [...prev, newMessage]);

    // Auto-scroll to bottom when new message is added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // BLE Scanning Function
  const scanForDevices = async () => {
    if (isScanning) return;

    try {
      setIsScanning(true);
      addMessage('🔍 Scanning for ESP32 devices...', 'ai');
      console.log('Starting BLE scan...');

      // Check if Bluetooth is powered on
      const state = await bleManager.state();
      console.log('BLE state:', state);
      if (state !== 'PoweredOn') {
        Alert.alert(
          'Bluetooth Required',
          'Please enable Bluetooth to scan for devices.',
          [{ text: 'OK' }],
        );
        setIsScanning(false);
        return;
      }

      // First try scanning WITHOUT service filter to see all BLE devices
      console.log('Starting broad BLE scan (no filters)...');
      addMessage('🔍 Scanning for ALL BLE devices first...', 'ai');

      let foundEsp32 = false;
      let deviceCount = 0;

      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          addMessage('❌ Scan failed: ' + error.message, 'ai');
          setIsScanning(false);
          return;
        }

        console.log('Found device:', device?.name, device?.id, device?.rssi);
        deviceCount++;

        if (device) {
          // Only show notification for ESP32 device, not every BLE device
          if (device.name === 'AI-Companion') {
            foundEsp32 = true;
            console.log('Found ESP32 device! Connecting...');
            addMessage('🎯 Found ESP32 device: ' + device.name, 'ai');
            connectToDevice(device);
          }
        }
      });

      // After 8 seconds, try targeted scan with service UUID
      setTimeout(() => {
        if (!foundEsp32) {
          console.log('No ESP32 found in broad scan, trying targeted scan...');
          addMessage('🎯 No ESP32 found, trying targeted scan...', 'ai');
          bleManager.stopDeviceScan();

          setTimeout(() => {
            console.log('Starting targeted scan for service:', SERVICE_UUID);
            bleManager.startDeviceScan(
              [SERVICE_UUID],
              null,
              (error, device) => {
                if (error) {
                  console.error('Targeted scan error:', error);
                  return;
                }

                console.log('Targeted scan found:', device?.name, device?.id);
                if (device && device.name === 'AI-Companion') {
                  console.log('Found ESP32 in targeted scan! Connecting...');
                  addMessage(
                    '🎯 Found ESP32 in targeted scan: ' + device.name,
                    'ai',
                  );
                  connectToDevice(device);
                }
              },
            );
          }, 500); // Small delay before starting targeted scan
        }
      }, 8000);

      // Stop scanning after 18 seconds (8s broad + 7s targeted + 3s buffer)
      setTimeout(() => {
        console.log('Scan timeout - stopping scan');
        bleManager.stopDeviceScan();
        setIsScanning(false);
        if (!isConnected) {
          addMessage(
            '⏰ Scan timeout. Try again or check if ESP32 is powered on.',
            'ai',
          );
          addMessage('📊 Found ' + deviceCount + ' BLE devices total', 'ai');
          addMessage(
            '💡 Troubleshooting: Ensure ESP32 is powered on and nearby',
            'ai',
          );
        }
      }, 18000);
    } catch (error) {
      console.error('Scan setup error:', error);
      addMessage(
        '❌ Failed to start scanning: ' + (error as Error).message,
        'ai',
      );
      setIsScanning(false);
    }
  };

  // BLE Connection Function
  const connectToDevice = async (device: Device) => {
    try {
      bleManager.stopDeviceScan();
      setIsScanning(false);

      addMessage('🔗 Connecting to ' + device.name + '...', 'ai');

      console.log('Attempting to connect...');
      const deviceConnection = await device.connect();
      console.log('Device connected successfully');
      setConnectedDevice(deviceConnection);
      setIsConnected(true);
      setDeviceName(device.name || 'ESP32');

      addMessage('✅ Connected to ' + device.name, 'ai');

      // Small delay to let ESP32 finish setting up
      console.log('Waiting for ESP32 to be ready...');
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Negotiate larger MTU for bigger payloads
      console.log('Negotiating MTU...');
      const negotiatedMTU = await deviceConnection.requestMTU(256);
      console.log('Negotiated MTU:', negotiatedMTU, 'bytes');

      // Discover services and characteristics
      console.log('Discovering services...');
      await deviceConnection.discoverAllServicesAndCharacteristics();

      const services = await deviceConnection.services();
      console.log('Discovered services:', services.length);
      services.forEach((service, index) => {
        console.log(`Service ${index}: ${service.uuid}`);
      });

      console.log('Services discovered');
      addMessage(
        '📋 Services discovered (' + services.length + ' total)',
        'ai',
      );

      // Set up notifications for receiving messages
      console.log('Setting up notifications...');
      setupNotifications(deviceConnection);

      // Send a welcome message
      console.log('Sending welcome message...');
      await sendBLEMessage(
        'hello',
        'Connected from React Native app!',
        'connection_established',
      );
      console.log('Welcome message sent');
    } catch (error) {
      console.error('Connection error:', error);
      addMessage('❌ Failed to connect: ' + (error as Error).message, 'ai');
      setIsConnected(false);
      setConnectedDevice(null);
    }
  };

  // Setup BLE Notifications
  const setupNotifications = async (device: Device) => {
    try {
      console.log('Setting up BLE notifications...');
      const services = await device.services();
      console.log('Found services:', services.length);

      // Log all service UUIDs for debugging
      services.forEach((service, index) => {
        console.log(`Service ${index} UUID: ${service.uuid}`);
      });

      // Use dynamic UUIDs from QR code if available, otherwise fallback to static
      const currentServiceUUID = dynamicUUIDs?.serviceUUID || SERVICE_UUID;
      const currentTxUUID = dynamicUUIDs?.txUUID || CHARACTERISTIC_UUID_TX;

      const targetService = services.find(
        service =>
          service.uuid.toLowerCase() === currentServiceUUID.toLowerCase(),
      );
      console.log('Target service found:', !!targetService);
      console.log('Looking for service UUID:', currentServiceUUID);
      if (dynamicUUIDs) {
        console.log('Using dynamic UUIDs from QR code');
      }
      console.log('Comparing case-insensitively');

      if (!targetService) {
        console.log('BLE service not found');
        addMessage('❌ BLE service not found', 'ai');
        return;
      }

      const characteristics = await targetService.characteristics();
      console.log('Found characteristics:', characteristics.length);

      // Log all characteristics for debugging
      characteristics.forEach((char, index) => {
        console.log(`Characteristic ${index} UUID: ${char.uuid}`);
      });

      const txCharacteristic = characteristics.find(
        char => char.uuid.toLowerCase() === currentTxUUID.toLowerCase(),
      );
      console.log('TX characteristic found:', !!txCharacteristic);
      console.log('Looking for TX UUID:', currentTxUUID);

      if (!txCharacteristic) {
        console.log('TX characteristic not found');
        addMessage('❌ TX characteristic not found', 'ai');
        return;
      }

      console.log('Setting up characteristic monitor...');
      // Monitor notifications
      txCharacteristic.monitor((error, characteristic) => {
        if (error) {
          console.error('Monitor error:', error);
          return;
        }

        console.log('Received notification:', characteristic?.value);
        if (characteristic?.value) {
          try {
            const decodedValue = Buffer.from(
              characteristic.value,
              'base64',
            ).toString('utf-8');
            console.log('Decoded value:', decodedValue);
            console.log('Decoded length:', decodedValue.length, 'characters');

            // Check message integrity (MTU negotiation handles size limits)
            if (decodedValue.length >= 200) {
              console.log('⚠️ Large message received, may be at MTU limit');
            }

            const jsonData = JSON.parse(decodedValue);
            console.log('Parsed JSON:', jsonData);

            // Handle different message types
            if (jsonData.type === 'connected') {
              addMessage('✅ ' + jsonData.message, 'device');
            } else if (jsonData.type === 'ai_response') {
              addMessage('🤖 ' + jsonData.message, 'device');
            } else if (jsonData.type === 'welcome') {
              addMessage('👋 ' + jsonData.message, 'device');
            } else if (jsonData.type === 'test_response') {
              addMessage('📱 ' + jsonData.message, 'device');
            } else if (jsonData.type === 'btn') {
              addMessage(
                '🎯 ESP32 Button Press: ' + jsonData.message,
                'device',
              );
            } else if (jsonData.message) {
              addMessage('📱 ' + jsonData.message, 'device');
            }
          } catch (parseError) {
            console.log('Parse error:', parseError);
            addMessage('📱 ' + characteristic.value, 'device');
          }
        }
      });

      console.log('Notifications setup complete');
      addMessage('👂 Listening for device messages', 'ai');
    } catch (error) {
      console.error('Setup notifications error:', error);
      addMessage(
        '❌ Failed to setup notifications: ' + (error as Error).message,
        'ai',
      );
    }
  };

  // Send BLE Message
  const sendBLEMessage = async (
    type: string,
    message: string,
    action: string = '',
  ) => {
    if (!connectedDevice || !isConnected) {
      console.log('Cannot send - not connected');
      addMessage('❌ Not connected to device', 'ai');
      return;
    }

    try {
      console.log('Sending BLE message:', type, message);
      const messageData = {
        type,
        message,
        action,
        timestamp: Date.now(),
      };

      const jsonString = JSON.stringify(messageData);
      console.log('JSON message:', jsonString);

      console.log('Getting services...');
      const services = await connectedDevice.services();
      console.log('Found', services.length, 'services');

      // Log all service UUIDs
      services.forEach((service, index) => {
        console.log(`Service ${index} UUID: ${service.uuid}`);
      });

      const targetService = services.find(
        service => service.uuid.toLowerCase() === SERVICE_UUID.toLowerCase(),
      );
      console.log('Target service found:', !!targetService);
      console.log('Expected service UUID:', SERVICE_UUID);
      console.log('Comparing case-insensitively');

      if (!targetService) {
        addMessage('❌ BLE service not found for sending', 'ai');
        return;
      }

      console.log('Getting characteristics...');
      const characteristics = await targetService.characteristics();
      console.log('Found', characteristics.length, 'characteristics');

      // Log all characteristics
      characteristics.forEach((char, index) => {
        console.log(`Characteristic ${index} UUID: ${char.uuid}`);
      });

      // Re-declare UUID for this scope
      const currentRxUUID2 = dynamicUUIDs?.rxUUID || CHARACTERISTIC_UUID_RX;

      const rxCharacteristic = characteristics.find(
        char => char.uuid.toLowerCase() === currentRxUUID2.toLowerCase(),
      );
      console.log('RX characteristic found:', !!rxCharacteristic);
      console.log('Looking for RX UUID:', currentRxUUID2);

      if (!rxCharacteristic) {
        addMessage('❌ RX characteristic not found', 'ai');
        return;
      }

      console.log('Writing to RX characteristic...');
      const encodedMessage = Buffer.from(jsonString, 'utf-8').toString(
        'base64',
      );
      console.log(
        'Encoded message length:',
        encodedMessage.length,
        'characters',
      );

      // Check if message fits in negotiated MTU
      const maxPayloadSize = 200; // Conservative limit for 256-byte MTU
      if (encodedMessage.length > maxPayloadSize) {
        console.log(
          '⚠️ Message exceeds MTU limit, truncating for reliability...',
        );
        const truncatedMessage = encodedMessage.substring(0, maxPayloadSize);
        console.log('Truncated to:', truncatedMessage.length, 'characters');
      }

      const finalMessage =
        encodedMessage.length > maxPayloadSize
          ? encodedMessage.substring(0, maxPayloadSize)
          : encodedMessage;

      try {
        // Try writeWithoutResponse first (better for reliability)
        await rxCharacteristic.writeWithoutResponse(finalMessage);
        console.log('Message sent successfully (without response)');
        addMessage('📤 Sent: ' + message, 'user');
      } catch (writeError) {
        console.log('Write without response failed, trying with response...');
        // Fallback to write with response if without response fails
        await rxCharacteristic.writeWithResponse(finalMessage);
        console.log('Message sent successfully (with response)');
        addMessage('📤 Sent: ' + message, 'user');
      }
    } catch (error) {
      console.error('Send message error:', error);
      addMessage(
        '❌ Failed to send message: ' + (error as Error).message,
        'ai',
      );
    }
  };

  // Disconnect Function
  // Parse QR code data for BLE connection
  const parseQRData = useCallback((qrData: string): QRData | null => {
    try {
      // Expected format: "BLE:service_uuid:tx_uuid:rx_uuid"
      if (!qrData.startsWith('BLE:')) {
        console.log('Invalid QR format - must start with BLE:');
        return null;
      }

      const parts = qrData.split(':');
      if (parts.length !== 4) {
        console.log('Invalid QR format - expected 4 parts separated by :');
        return null;
      }

      const [, serviceUUID, txUUID, rxUUID] = parts;

      // Validate UUID format (36 characters with dashes)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (
        !uuidRegex.test(serviceUUID) ||
        !uuidRegex.test(txUUID) ||
        !uuidRegex.test(rxUUID)
      ) {
        console.log('Invalid UUID format in QR code');
        return null;
      }

      return { serviceUUID, txUUID, rxUUID };
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return null;
    }
  }, []);

  // Handle QR code camera scan success
  const onSuccess = useCallback(
    (e: any) => {
      const qrData = parseQRData(e.data);
      if (qrData) {
        setDynamicUUIDs(qrData);
        setAppMode('chat');

        // Add success message
        const newMessage: Message = {
          id: Date.now().toString(),
          text: `📱 QR Code scanned! Found ESP32 with service: ${qrData.serviceUUID.substring(
            0,
            8,
          )}...`,
          timestamp: new Date(),
          type: 'device',
        };
        setMessages(prev => [...prev, newMessage]);

        console.log(
          'QR code successfully scanned and parsed, dynamic UUIDs set',
        );
      } else {
        // Add error message
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: '❌ Invalid QR code format. Please scan a valid ESP32 QR code.',
          timestamp: new Date(),
          type: 'device',
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    },
    [parseQRData],
  );

  // Handle QR code text input submission

  const handleQRSubmit = useCallback(() => {
    const qrData = parseQRData(qrInput);
    if (qrData) {
      setDynamicUUIDs(qrData);
      setAppMode('chat');
      setQrInput('');

      // Add success message
      const newMessage: Message = {
        id: Date.now().toString(),
        text: `📝 QR Code processed! Found ESP32 with service: ${qrData.serviceUUID.substring(
          0,
          8,
        )}...`,
        timestamp: new Date(),
        type: 'device',
      };
      setMessages(prev => [...prev, newMessage]);

      console.log(
        'QR code successfully parsed from text input, dynamic UUIDs set',
      );
    } else {
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: '❌ Invalid QR code format. Please enter a valid ESP32 QR code.',
        timestamp: new Date(),
        type: 'device',
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [qrInput, parseQRData]);

  const disconnectDevice = useCallback(async () => {
    if (connectedDevice && isConnected) {
      try {
        await connectedDevice.cancelConnection();
        addMessage('📱 Disconnected from ' + deviceName, 'ai');
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }

    setIsConnected(false);
    setDeviceName('');
    setConnectedDevice(null);
  }, [connectedDevice, isConnected, deviceName]);

  // Connection function (replaces simulateConnection)
  const handleConnection = () => {
    if (isConnected) {
      disconnectDevice();
    } else {
      scanForDevices();
    }
  };

  const sendTestMessage = async () => {
    if (isConnected) {
      await sendBLEMessage(
        'test',
        'Hello from React Native app!',
        'test_message',
      );
    } else {
      Alert.alert('Not Connected', 'Please connect to a device first.');
    }
  };

  const toggleMessageExpansion = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, expanded: !msg.expanded } : msg,
      ),
    );
  };

  // Dynamic styles
  const getStatusIndicatorColor = () => {
    if (isConnected) return '#4CAF50';
    if (isScanning) return '#FF9800';
    return '#F44336';
  };

  const getConnectionButtonColor = () => {
    if (isScanning) return '#FF9800';
    if (isConnected) return '#F44336';
    return '#2196F3';
  };

  const showBLEInfo = () => {
    Alert.alert(
      'BLE Implementation Status',
      'This app uses react-native-ble-plx for real Bluetooth Low Energy communication.\n\n' +
        'Features:\n' +
        '• MTU negotiation for optimal performance\n' +
        '• Automatic device scanning and connection\n' +
        '• JSON message protocol\n' +
        '• Real-time bidirectional communication\n\n' +
        'See README.md for technical details!',
    );
  };

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      {/* QR Scanner Mode */}
      {appMode === 'qr_scanner' && (
        <View style={styles.qrContainer}>
          <View style={styles.qrHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setAppMode('chat')}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.qrTitle}>Scan ESP32 QR Code</Text>
          </View>

          {/* Mode Toggle */}
          <View style={styles.qrModeToggle}>
            <TouchableOpacity
              style={[
                styles.qrModeButton,
                qrMode === 'camera' && styles.qrModeButtonActive,
              ]}
              onPress={() => setQrMode('camera')}
            >
              <Text
                style={[
                  styles.qrModeButtonText,
                  qrMode === 'camera' && styles.qrModeButtonTextActive,
                ]}
              >
                📷 Camera
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.qrModeButton,
                qrMode === 'text' && styles.qrModeButtonActive,
              ]}
              onPress={() => setQrMode('text')}
            >
              <Text
                style={[
                  styles.qrModeButtonText,
                  qrMode === 'text' && styles.qrModeButtonTextActive,
                ]}
              >
                📝 Text
              </Text>
            </TouchableOpacity>
          </View>

          {/* Camera Scanner */}
          {qrMode === 'camera' && (
            <View style={styles.qrCameraContainer}>
              <QRCodeScanner
                onRead={onSuccess}
                flashMode={RNCamera.Constants.FlashMode.off}
                topContent={
                  <Text style={styles.qrInstructions}>
                    Point your camera at the ESP32 QR code
                  </Text>
                }
                bottomContent={
                  <View style={styles.qrBottom}>
                    <Text style={styles.qrHelp}>
                      Expected format: BLE:service:tx:rx
                    </Text>
                  </View>
                }
                cameraStyle={styles.qrCamera}
                containerStyle={styles.qrScannerContainer}
              />
            </View>
          )}

          {/* Text Input */}
          {qrMode === 'text' && (
            <View style={styles.qrInputContainer}>
              <Text style={styles.qrInstructions}>
                Enter the QR code data from your ESP32 device:
              </Text>

              <TextInput
                style={styles.qrTextInput}
                value={qrInput}
                onChangeText={setQrInput}
                placeholder="BLE:service_uuid:tx_uuid:rx_uuid"
                placeholderTextColor="#666"
                multiline={true}
                numberOfLines={3}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[
                  styles.qrSubmitButton,
                  !qrInput.trim() && styles.qrSubmitButtonDisabled,
                ]}
                onPress={handleQRSubmit}
                disabled={!qrInput.trim()}
              >
                <Text style={styles.buttonText}>Process QR Code</Text>
              </TouchableOpacity>

              <View style={styles.qrBottom}>
                <Text style={styles.qrHelp}>
                  Expected format: BLE:service_uuid:tx_uuid:rx_uuid
                </Text>
                <Text style={styles.qrExample}>
                  Example:
                  BLE:6E400001-B5A3-F393-E0A9-E50E24DCCA9E:6E400003-B5A3-F393-E0A9-E50E24DCCA9E:6E400002-B5A3-F393-E0A9-E50E24DCCA9E
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Chat Mode */}
      {appMode === 'chat' && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Companion</Text>
            <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusIndicatorColor() },
                ]}
              />
              <Text style={styles.statusText}>
                {isScanning
                  ? 'Scanning...'
                  : isConnected
                  ? `Connected to ${deviceName}`
                  : 'Ready to Connect'}
              </Text>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(message => (
              <TouchableOpacity
                key={message.id}
                style={[
                  styles.messageCard,
                  message.type === 'ai' && styles.aiMessage,
                  message.type === 'user' && styles.userMessage,
                  message.type === 'device' && styles.deviceMessage,
                ]}
                onPress={() => toggleMessageExpansion(message.id)}
              >
                <View style={styles.messageHeader}>
                  <Text style={styles.messageType}>
                    {message.type === 'ai'
                      ? '🤖 AI'
                      : message.type === 'user'
                      ? '👤 You'
                      : '⌚ Device'}
                  </Text>
                  <Text style={styles.messageTime}>
                    {message.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.messageText,
                    message.expanded && styles.expandedText,
                  ]}
                >
                  {message.expanded || message.text.length <= 100
                    ? message.text
                    : `${message.text.substring(0, 100)}...`}
                </Text>
                {message.text.length > 100 && (
                  <Text style={styles.expandHint}>
                    {message.expanded ? 'Tap to collapse' : 'Tap to expand'}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: getConnectionButtonColor(),
                },
              ]}
              onPress={handleConnection}
              disabled={isScanning}
            >
              <Text style={styles.buttonText}>
                {isScanning
                  ? 'Scanning...'
                  : isConnected
                  ? 'Disconnect'
                  : 'Connect to ESP32'}
              </Text>
            </TouchableOpacity>

            {!isConnected && (
              <TouchableOpacity
                style={styles.permissionsButton}
                onPress={requestPermissions}
              >
                <Text style={styles.buttonText}>🔐 Request Permissions</Text>
              </TouchableOpacity>
            )}

            {isConnected && (
              <TouchableOpacity
                style={styles.testButton}
                onPress={sendTestMessage}
              >
                <Text style={styles.buttonText}>Send Test Message</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.infoButton} onPress={showBLEInfo}>
              <Text style={styles.buttonText}>📖 BLE Implementation Guide</Text>
            </TouchableOpacity>

            {/* QR Scanner Button */}
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => setAppMode('qr_scanner')}
            >
              <Text style={styles.buttonText}>📱 Scan QR Code</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  aiMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  userMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  deviceMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#aaa',
  },
  messageTime: {
    fontSize: 12,
    color: '#777',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#e0e0e0',
  },
  expandedText: {
    // Additional styles for expanded text if needed
  },
  expandHint: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 8,
    fontStyle: 'italic',
  },
  controls: {
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionsButton: {
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },

  infoButton: {
    backgroundColor: '#9C27B0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrButton: {
    backgroundColor: '#FF5722',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  // QR Scanner Styles
  qrContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  qrHeader: {
    backgroundColor: '#2196F3',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Account for back button
  },
  qrModeToggle: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  qrModeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  qrModeButtonActive: {
    backgroundColor: '#2196F3',
  },
  qrModeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  qrModeButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  qrCameraContainer: {
    flex: 1,
  },
  qrScannerContainer: {
    flex: 1,
  },
  qrCamera: {
    height: 300,
  },
  qrInputContainer: {
    flex: 1,
    padding: 16,
  },
  qrInstructions: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  qrTextInput: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 16,
    color: '#e0e0e0',
  },
  qrSubmitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  qrSubmitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  qrBottom: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  qrHelp: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  qrExample: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
