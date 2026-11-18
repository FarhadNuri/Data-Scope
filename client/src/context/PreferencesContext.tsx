'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as preferencesService from '../services/preferences.service';
import { setThemeCache } from '../lib/storage';
import type { Preferences } from '../types/preferences';

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  defaultPageSize: 25,
  visibleColumns: {},
};

type PreferencesContextValue = {
  preferences: Preferences;
  loading: boolean;
  updatePreferences: (partial: Partial<Preferences>) => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);

  // Load preferences from backend once authenticated
  useEffect(() => {
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      return;
    }

    setLoading(true);
    preferencesService
      .getPreferences()
      .then((data) => {
        if (data) setPreferences(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // Apply theme to <html> element and sync to local storage cache
  useEffect(() => {
    const theme = preferences.theme;
    setThemeCache(theme);

    const apply = (isDark: boolean) => {
      document.documentElement.classList.toggle('dark', isDark);
    };

    if (theme === 'dark') {
      apply(true);
      return;
    }
    if (theme === 'light') {
      apply(false);
      return;
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches);

    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preferences.theme]);

  // Optimistically updates preferences, rolling back if the backend PUT fails
  const updatePreferences = useCallback(
    async (partial: Partial<Preferences>) => {
      const prev = preferences;

      setPreferences((current) => ({
        ...current,
        ...partial,
        visibleColumns: partial.visibleColumns
          ? { ...current.visibleColumns, ...partial.visibleColumns }
          : current.visibleColumns,
      }));

      try {
        await preferencesService.savePreferences(partial);
      } catch (err) {
        setPreferences(prev);
        throw err;
      }
    },
    [preferences]
  );

  return (
    <PreferencesContext.Provider value={{ preferences, loading, updatePreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
