import { Platform } from 'react-native';

/**
 * Android emulator routes 10.0.2.2 to host machine's 127.0.0.1.
 * For physical devices on same Wi-Fi, change to your LAN IP (e.g. http://192.168.1.X:5000)
 */
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export const ENV = {
  API_BASE_URL: DEFAULT_HOST,
  TIMEOUT: 30000,
  APP_NAME: 'Zuna Health CMS',
  VERSION: '1.0.0',
};

export default ENV;
