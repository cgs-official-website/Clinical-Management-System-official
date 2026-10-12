import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryStore = new Map();

export const StorageService = {
  async setItem(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
      memoryStore.set(key, serialized);
    } catch {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      memoryStore.set(key, serialized);
    }
  },

  async getItem(key) {
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null) return val;
      return memoryStore.get(key) || null;
    } catch {
      return memoryStore.get(key) || null;
    }
  },

  async getParsedItem(key) {
    const raw = await this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  },

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      memoryStore.delete(key);
    } catch {
      memoryStore.delete(key);
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
      memoryStore.clear();
    } catch {
      memoryStore.clear();
    }
  },
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'clinic_mobile_access_token',
  REFRESH_TOKEN: 'clinic_mobile_refresh_token',
  USER_PROFILE: 'clinic_mobile_user_profile',
};

export default StorageService;
