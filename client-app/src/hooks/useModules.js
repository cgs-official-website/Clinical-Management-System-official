import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { apiClient } from '../api/client';
import { useAuth } from './useAuth';

const ModulesContext = createContext({ modules: [], loading: true, error: null, refresh: () => { } });

/**
 * Same source as the website sidebar: GET /api/permissions/user/me -> permittedModules
 * (name, icon, route). The server already filters by clinic category + role permissions.
 */
export const ModulesProvider = ({ children }) => {
    const { user } = useAuth();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        try {
            const res = await apiClient.get('/api/permissions/user/me');
            const list = res.data?.permittedModules || res.data?.data?.permittedModules || [];
            const cleaned = list
                .filter((m) => m?.route && !/\/dashboard$/.test(m.route))
                .sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
            setModules(cleaned);
            setError(null);
        } catch (e) {
            setError(e?.response?.data?.error?.message || e?.message || 'Unable to load modules');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) refresh();
    }, [user?.id, refresh]);

    // Live permission sync: re-fetch whenever the app returns to foreground
    useEffect(() => {
        const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
        return () => sub.remove();
    }, [refresh]);

    return (
        <ModulesContext.Provider value={{ modules, loading, error, refresh }}>
            {children}
        </ModulesContext.Provider>
    );
};

export const useModules = () => useContext(ModulesContext);
export default useModules;
