import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StorageService, STORAGE_KEYS } from '../services/storage';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session from persistent storage on app launch
  const restoreSession = useCallback(async () => {
    try {
      const storedToken = await StorageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedUser = await StorageService.getParsedItem(STORAGE_KEYS.USER_PROFILE);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch {
      // Storage read error ignored
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const payload = res?.data || res;
    const rawUser = payload.user || payload;
    const accessToken = payload.tokens?.accessToken || payload.accessToken || payload.token;
    const refreshToken = payload.tokens?.refreshToken || payload.refreshToken;

    const normalizedRole = (rawUser.role || rawUser.userType || 'STAFF').toUpperCase();
    const isSuperadmin =
      normalizedRole === 'SUPERADMIN' ||
      rawUser.isSuperadmin === true ||
      rawUser.email === 'admin@zuna.com';
    const isAdmin =
      isSuperadmin ||
      normalizedRole === 'ADMIN' ||
      rawUser.isAdmin === true;

    const normalizedUser = {
      ...rawUser,
      role: rawUser.role || normalizedRole,
      userType: rawUser.userType || normalizedRole,
      isSuperadmin,
      isAdmin,
    };

    if (accessToken) {
      await StorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      await StorageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    await StorageService.setItem(STORAGE_KEYS.USER_PROFILE, normalizedUser);

    setToken(accessToken);
    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = async () => {
    const refreshToken = await StorageService.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    await authApi.logout(refreshToken);
    await StorageService.clear();
    setToken(null);
    setUser(null);
  };

  const isSuperadmin = !!(user?.isSuperadmin || user?.userType === 'SUPERADMIN');
  const isAdmin = !!(isSuperadmin || user?.isAdmin || user?.userType === 'ADMIN');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isSuperadmin,
        isAdmin,
        login,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
