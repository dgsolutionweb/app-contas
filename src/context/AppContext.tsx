import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import type { ThemeColors, AppSettings } from '../types';
import { type ThemeTokens, darkTokens, lightTokens } from '../theme/tokens';
import { deleteSetting, getSetting, setSetting } from '../database/settingsRepository';
import { supabase } from '../services/supabase';
import { getOpenAIKeyStatus } from '../services/openaiKey';

const darkColors: ThemeColors = {
  background: '#0A0A0B', surface: '#1A1A1D', surfaceAlt: '#222226', primary: '#C5FF4D',
  bot: '#1A1A1D', text: '#FFFFFF', textMuted: 'rgba(255,255,255,0.64)', success: '#4DE88F',
  warning: '#FFB84D', danger: '#FF5E5E', border: 'rgba(255,255,255,0.06)',
};

const lightColors: ThemeColors = {
  background: '#F4F4F2', surface: '#FFFFFF', surfaceAlt: '#FAFAF8', primary: '#0A0A0B',
  bot: '#FFFFFF', text: '#0A0A0B', textMuted: 'rgba(10,10,11,0.64)', success: '#1D9E5A',
  warning: '#D98A1E', danger: '#E24545', border: 'rgba(10,10,11,0.08)',
};

const defaultSettings: AppSettings = {
  defaultDueDay: 5,
  cardClosingDay: 0,
  userName: '',
  openaiConfigured: false,
  openaiKeyHint: null,
};

interface AppContextValue {
  colors: ThemeColors;
  T: ThemeTokens;
  isDark: boolean;
  themeMode: 'dark' | 'light';
  setThemeMode: (mode: 'dark' | 'light') => void;
  db: any | null;
  isDbReady: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  settings: AppSettings;
  onboarded: boolean;
  setOnboarded: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  refreshOpenAIKeyStatus: () => Promise<void>;
  hideValues: boolean;
  toggleHideValues: () => void;
}

const AppContext = createContext<AppContextValue>({
  colors: lightColors, T: lightTokens, isDark: false, themeMode: 'light', setThemeMode: () => {},
  db: {}, isDbReady: false, isLoading: true, session: null, user: null, signOut: async () => {},
  settings: defaultSettings, onboarded: false, setOnboarded: async () => {}, updateSetting: async () => {},
  refreshOpenAIKeyStatus: async () => {},
  hideValues: false, toggleHideValues: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const systemDark = scheme === 'dark' || (scheme === null && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(systemDark ? 'dark' : 'dark');
  const isDark = themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const T = isDark ? darkTokens : lightTokens;

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [onboarded, setOnboardedState] = useState(false);
  const [hideValues, setHideValues] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;

    if (!session?.user.id) {
      setSettings(defaultSettings);
      setOnboardedState(false);
      setIsDbReady(false);
      setSettingsLoading(false);
      return () => { active = false; };
    }

    setSettingsLoading(true);
    const loadSettings = async () => {
      try {
        const [defaultDueDay, cardClosingDay, themeSetting, onboardedSetting, userNameSetting, openaiStatus] = await Promise.all([
          getSetting(null, 'default_due_day'),
          getSetting(null, 'card_closing_day'),
          getSetting(null, 'theme_mode'),
          getSetting(null, 'onboarded'),
          getSetting(null, 'user_name'),
          getOpenAIKeyStatus().catch(() => ({ configured: false, keyHint: null, updatedAt: null })),
        ]);

        if (!active) return;
        if (themeSetting === 'light' || themeSetting === 'dark') setThemeMode(themeSetting);
        setOnboardedState(onboardedSetting === '1');
        setSettings({
          defaultDueDay: defaultDueDay ? parseInt(defaultDueDay, 10) : 5,
          cardClosingDay: cardClosingDay ? parseInt(cardClosingDay, 10) : 0,
          userName: userNameSetting ?? session.user.user_metadata?.full_name ?? '',
          openaiConfigured: openaiStatus.configured,
          openaiKeyHint: openaiStatus.keyHint,
        });
        setIsDbReady(true);
        deleteSetting(null, 'gemini_api_key').catch(() => {});
        deleteSetting(null, 'openai_api_key').catch(() => {});
      } catch (error) {
        console.error('Failed to load authenticated settings:', error);
      } finally {
        if (active) setSettingsLoading(false);
      }
    };

    loadSettings();
    return () => { active = false; };
  }, [session?.user.id]);

  const setOnboarded = async () => {
    await setSetting(null, 'onboarded', '1');
    setOnboardedState(true);
  };

  const updateSetting = async (key: string, value: string) => {
    await setSetting(null, key, value);
    if (key === 'default_due_day') setSettings((prev) => ({ ...prev, defaultDueDay: parseInt(value, 10) }));
    else if (key === 'card_closing_day') setSettings((prev) => ({ ...prev, cardClosingDay: parseInt(value, 10) }));
    else if (key === 'user_name') setSettings((prev) => ({ ...prev, userName: value }));
    else if (key === 'theme_mode') setThemeMode(value as 'dark' | 'light');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshOpenAIKeyStatus = async () => {
    const status = await getOpenAIKeyStatus();
    setSettings((previous) => ({
      ...previous,
      openaiConfigured: status.configured,
      openaiKeyHint: status.keyHint,
    }));
  };

  return (
    <AppContext.Provider value={{
      colors, T, isDark, themeMode, setThemeMode, db: {}, isDbReady,
      isLoading: authLoading || (!!session && settingsLoading), session, user: session?.user ?? null,
      signOut, settings, onboarded, setOnboarded, updateSetting, refreshOpenAIKeyStatus,
      hideValues, toggleHideValues: () => setHideValues((value) => !value),
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
