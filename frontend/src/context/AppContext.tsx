import { apiFetch } from '../utils/api';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type ThemeMode = 'light' | 'dark';

export interface Profile {
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}

export interface NotificationPrefs {
  emailAssignments: boolean;
  emailGrades: boolean;
  pushReminders: boolean;
  newsletter: boolean;
}

interface AppContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  profile: Profile;
  setProfile: (updater: (prev: Profile) => Profile) => void;
  notificationPrefs: NotificationPrefs;
  setNotificationPrefs: (updater: (prev: NotificationPrefs) => NotificationPrefs) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [profile, setProfileState] = useState<Profile>({
    name: 'Alex Student',
    email: 'alex@student.edu',
    phone: '+91-9876543210',
    avatarUrl: undefined,
  });

  const [notificationPrefs, setNotificationPrefsState] = useState<NotificationPrefs>({
    emailAssignments: true,
    emailGrades: true,
    pushReminders: false,
    newsletter: false,
  });

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('theme', mode);
  };

  const setProfile = (updater: (prev: Profile) => Profile) => {
    setProfileState((prev) => updater(prev));
  };

  const setNotificationPrefs = (updater: (prev: NotificationPrefs) => NotificationPrefs) => {
    setNotificationPrefsState((prev) => updater(prev));
  };

  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    
    const loadProfile = async () => {
      try {
        const res = await apiFetch('/api/profile');
        if (!res.ok) return;
        const data = (await res.json()) as {
          name?: string;
          email?: string;
          phone?: string;
          avatarUrl?: string;
          theme?: ThemeMode;
          notificationPrefs?: NotificationPrefs;
        };
        if (data.theme === 'dark' || data.theme === 'light') {
          setThemeState(data.theme);
        }
        setProfileState((prev) => ({
          ...prev,
          ...(data.name ? { name: data.name } : {}),
          ...(data.email ? { email: data.email } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
          ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        }));
        if (data.notificationPrefs) {
          setNotificationPrefsState((prev) => ({ ...prev, ...data.notificationPrefs }));
        }
      } catch {
        // best-effort; fall back to defaults
      }
    };

    void loadProfile();
  }, [isAuthenticated, token]);

  const value = useMemo<AppContextValue>(
    () => ({
      theme,
      setTheme,
      profile,
      setProfile,
      notificationPrefs,
      setNotificationPrefs,
    }),
    [theme, profile, notificationPrefs]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}

