import { Platform } from 'react-native';

/**
 * CLINICAL MANAGEMENT SYSTEM (CMS) - ENVIRONMENT CONFIGURATION
 *
 * 1. Physical Android Device (USB Testing with ADB Reverse) [DEFAULT]:
 *    Run in terminal: `adb reverse tcp:5000 tcp:5000`
 *    The physical device routes http://127.0.0.1:5000 directly to your host server.
 *
 * 2. Android Emulator (Standard Android Studio AVD without ADB Reverse):
 *    Change DEFAULT_HOST to: 'http://10.0.2.2:5000'
 *    (Android emulator automatically maps 10.0.2.2 to the host machine 127.0.0.1)
 *
 * 3. Physical Device over Wi-Fi (No USB cable / same local network):
 *    Change DEFAULT_HOST to your computer's LAN IP, e.g.: 'http://192.168.1.150:5000'
 *
 * 4. iOS Simulator:
 *    Uses 'http://127.0.0.1:5000' or 'http://localhost:5000'
 */
const DEFAULT_HOST =
  Platform.OS === 'android'
    ? 'http://127.0.0.1:5000' // Physical Android USB with ADB reverse (adb reverse tcp:5000 tcp:5000)
    : 'http://127.0.0.1:5000';

export const ENV = {
  API_BASE_URL: DEFAULT_HOST,
  TIMEOUT: 30000,
  APP_NAME: 'Zuna Health CMS',
  VERSION: '1.0.0',
};

export default ENV;
