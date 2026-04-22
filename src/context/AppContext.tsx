import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { ThemeColors, AppSettings } from '../types';
import { type ThemeTokens, darkTokens, lightTokens } from '../theme/tokens';
import { getDatabase } from '../database/setup';
import { getSetting, setSetting } from '../database/settingsRepository';

const darkColors: ThemeColors = {
  background: '#0A0A0B',
  surface: '#1A1A1D',
  surfaceAlt: '#222226',
  primary: '#C5FF4D',
  bot: '#1A1A1D',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.64)',
  success: '#4DE88F',
  warning: '#FFB84D',
  danger: '#FF5E5E',
  border: 'rgba(255,255,255,0.06)',
};

const lightColors: ThemeColors = {
  background: '#F4F4F2',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAF8',
  primary: '#0A0A0B',
  bot: '#FFFFFF',
  text: '#0A0A0B',
  textMuted: 'rgba(10,10,11,0.64)',
  success: '#1D9E5A',
  warning: '#D98A1E',
  danger: '#E24545',
  border: 'rgba(10,10,11,0.08)',
};

interface AppContextValue {
  colors: ThemeColors;
  T: ThemeTokens;
  isDark: boolean;
  themeMode: 'dark' | 'light';
  setThemeMode: (mode: 'dark' | 'light') => void;
  db: SQLiteDatabase | null;
  isDbReady: boolean;
  isLoading: boolean;
  settings: AppSettings;
  onboarded: boolean;
  setOnboarded: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue>({
  colors: lightColors,
  T: lightTokens,
  isDark: false,
  themeMode: 'light',
  setThemeMode: () => {},
  db: null,
  isDbReady: false,
  isLoading: true,
  settings: { defaultDueDay: 5, geminiApiKey: '', userName: '' },
  onboarded: false,
  setOnboarded: async () => {},
  updateSetting: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const systemDark = scheme === 'dark' || (scheme === null && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(systemDark ? 'dark' : 'dark');
  const isDark = themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const T = isDark ? darkTokens : lightTokens;

  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>({ defaultDueDay: 5, geminiApiKey: '', userName: '' });
  const [onboarded, setOnboardedState] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Database initialization timeout, proceeding without DB');
        setIsLoading(false);
      }
    }, 5000);

    getDatabase()
      .then(async (database) => {
        clearTimeout(timeoutId);
        setDb(database);
        const defaultDueDay = await getSetting(database, 'default_due_day');
        const geminiApiKey = await getSetting(database, 'gemini_api_key');
        const themeSetting = await getSetting(database, 'theme_mode');
        if (themeSetting === 'light' || themeSetting === 'dark') {
          setThemeMode(themeSetting);
        }
        const onboardedSetting = await getSetting(database, 'onboarded');
        if (onboardedSetting === '1') setOnboardedState(true);
        const userNameSetting = await getSetting(database, 'user_name');
        setSettings({
          defaultDueDay: defaultDueDay ? parseInt(defaultDueDay, 10) : 5,
          geminiApiKey: geminiApiKey ?? '',
          userName: userNameSetting ?? '',
        });
        setIsDbReady(true);
        setIsLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error('Failed to open database:', err);
        setIsLoading(false);
      });

    return () => clearTimeout(timeoutId);
  }, []);

  const setOnboarded = async () => {
    if (!db) { setOnboardedState(true); return; }
    await setSetting(db, 'onboarded', '1');
    setOnboardedState(true);
  };

  const updateSetting = async (key: string, value: string) => {
    if (!db) return;
    await setSetting(db, key, value);
    if (key === 'default_due_day') {
      setSettings((prev) => ({ ...prev, defaultDueDay: parseInt(value, 10) }));
    } else if (key === 'gemini_api_key') {
      setSettings((prev) => ({ ...prev, geminiApiKey: value }));
    } else if (key === 'user_name') {
      setSettings((prev) => ({ ...prev, userName: value }));
    } else if (key === 'theme_mode') {
      setThemeMode(value as 'dark' | 'light');
    }
  };

  return (
    <AppContext.Provider value={{ colors, T, isDark, themeMode, setThemeMode, db, isDbReady, isLoading, settings, onboarded, setOnboarded, updateSetting }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
