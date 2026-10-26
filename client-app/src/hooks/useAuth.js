import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StorageService, STORAGE_KEYS } from '../services/storage';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Background refresh of user profile from GET /api/auth/me
  const refreshUserProfile = useCallback(async () => {
    try {
      const freshUser = await authApi.getMe();
      if (freshUser && freshUser.email) {
        setUser((prev) => {
          const merged = { ...prev, ...freshUser };
          StorageService.setItem(STORAGE_KEYS.USER_PROFILE, merged);
          return merged;
        });
        return freshUser;
      }
    } catch {
      // Non-blocking on background sync
    }
    return null;
  }, []);

  // Restore authenticated session from persistent storage on app launch
  const restoreSession = useCallback(async () => {
    try {
      const storedToken = await StorageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedUser = await StorageService.getParsedItem(STORAGE_KEYS.USER_PROFILE);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        // Fetch fresh authoritative profile in background
        authApi.getMe().then((fresh) => {
          if (fresh && fresh.email) {
            setUser((curr) => {
              const updated = { ...curr, ...fresh };
              StorageService.setItem(STORAGE_KEYS.USER_PROFILE, updated);
              return updated;
            });
          }
        }).catch(() => { });
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

  /**
   * Real backend login
   */
  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const payload = res?.data || res;
    const rawUser = payload.user || payload;
    const accessToken = payload.tokens?.accessToken || payload.accessToken || payload.token;
    const refreshToken = payload.tokens?.refreshToken || payload.refreshToken;

    const emailLower = (rawUser.email || email || '').toLowerCase().trim();
    const normalizedRole = (rawUser.role || rawUser.userType || 'STAFF').toUpperCase();

    const isExplicitSuperadmin = [
      'admin@zuna.com',
      'superadmin@clinic.io',
    ].includes(emailLower);

    const isSuperadmin =
      isExplicitSuperadmin ||
      normalizedRole === 'SUPERADMIN' ||
      rawUser.isSuperadmin === true ||
      rawUser.is_super_admin === true;

    const isClinicAdmin =
      !isSuperadmin &&
      (normalizedRole === 'ADMIN' ||
        rawUser.isAdmin === true ||
        (Array.isArray(rawUser.roles) &&
          rawUser.roles.some((r) => {
            const rName = (typeof r === 'string' ? r : r?.name || '').toUpperCase();
            return rName === 'ADMIN' || rName.includes('ADMINISTRATOR');
          })));

    const normalizedUser = {
      ...rawUser,
      role: isSuperadmin ? 'SUPERADMIN' : isClinicAdmin ? 'ADMIN' : (rawUser.role || normalizedRole),
      userType: isSuperadmin ? 'SUPERADMIN' : isClinicAdmin ? 'ADMIN' : (rawUser.userType || normalizedRole),
      isSuperadmin,
      isAdmin: isSuperadmin || isClinicAdmin,
      isClinicAdmin,
      tenantId: rawUser.tenantId || rawUser.tenant?.id || null,
      clinicName: rawUser.clinicName || rawUser.tenant?.name || (isSuperadmin ? 'Global Platform Operations' : 'Clinical Workspace'),
      clinicCategoryName:
        rawUser.clinicCategoryName ||
        rawUser.clinicCategory?.name ||
        rawUser.tenant?.clinicCategoryName ||
        rawUser.tenant?.clinicCategory?.name ||
        null,
      permissions: rawUser.permissions || rawUser.effectivePermissions || [],
      effectivePermissions: rawUser.effectivePermissions || rawUser.permissions || [],
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

  /**
   * Real backend logout
   */
  const logout = async () => {
    try {
      const refreshToken = await StorageService.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      await authApi.logout(refreshToken);
    } catch {
      // Ignored
    } finally {
      await StorageService.clear();
      setToken(null);
      setUser(null);
    }
  };

  // Authority & Role flags
  const emailLower = (user?.email || '').toLowerCase().trim();
  const isSuperadmin = Boolean(
    user?.isSuperadmin ||
    user?.is_super_admin ||
    user?.userType === 'SUPERADMIN' ||
    user?.role === 'SUPERADMIN' ||
    emailLower === 'admin@zuna.com' ||
    emailLower === 'superadmin@clinic.io'
  );

  const isAdmin = Boolean(
    isSuperadmin ||
    user?.isAdmin ||
    user?.isClinicAdmin ||
    user?.userType === 'ADMIN' ||
    user?.role === 'ADMIN' ||
    (Array.isArray(user?.roles) &&
      user.roles.some((r) => {
        const rName = (typeof r === 'string' ? r : r?.name || '').toUpperCase();
        return rName === 'ADMIN' || rName.includes('ADMINISTRATOR');
      }))
  );

  const permissions = user?.permissions || user?.effectivePermissions || [];

  /**
   * Dynamic Permission checker
   */
  const hasPermission = useCallback((permissionKey) => {
    if (isSuperadmin) return true;
    if (!permissionKey) return true;
    if (permissions.includes('*')) return true;
    if (permissions.includes(permissionKey)) return true;
    const [mod] = permissionKey.split('.');
    if (mod && permissions.includes(`${mod}.*`)) return true;
    return false;
  }, [isSuperadmin, permissions]);

  const hasAnyPermission = useCallback((keys = []) => {
    if (isSuperadmin) return true;
    if (!keys || keys.length === 0) return true;
    return keys.some((k) => hasPermission(k));
  }, [isSuperadmin, hasPermission]);

  // Specialty identification
  const categoryStr = (
    user?.clinicCategoryName ||
    user?.clinicCategory?.name ||
    user?.tenant?.clinicCategoryName ||
    user?.tenant?.clinicCategory?.name ||
    ''
  ).toLowerCase();

  const roleStr = (user?.role || user?.roleTitle || '').toLowerCase();

  const isCardiology = categoryStr.includes('cardio') || roleStr.includes('cardio');
  const isPhysiotherapy = categoryStr.includes('physio') || roleStr.includes('physio');
  const isDental = categoryStr.includes('dent') || roleStr.includes('dent');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isSuperadmin,
        isAdmin,
        isCardiology,
        isPhysiotherapy,
        isDental,
        permissions,
        tenantId: user?.tenantId || null,
        clinicName: user?.clinicName || 'Active Workspace',
        hasPermission,
        hasAnyPermission,
        login,
        logout,
        restoreSession,
        refreshUserProfile,
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
