import { apiFetch } from '../utils/api';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

// Theme can be 'light' or 'dark'
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Load saved theme from localStorage, default to light
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' ? 'dark' : 'light';
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

  // Save theme to localStorage whenever it changes
  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('theme', mode);
  };

  const setProfile = (updater: (prev: Profile) => Profile) => {
    setProfileState(prev => updater(prev));
  };

  const setNotificationPrefs = (updater: (prev: NotificationPrefs) => NotificationPrefs) => {
    setNotificationPrefsState(prev => updater(prev));
  };

  const { isAuthenticated, token } = useAuth();

  // When user logs in, load their profile from the backend
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const loadProfile = async () => {
      try {
        const res = await apiFetch('/api/profile');
        if (!res.ok) return;

        const data = await res.json();

        // Update theme if saved in profile
        if (data.theme === 'dark' || data.theme === 'light') {
          setThemeState(data.theme);
        }

        // Update profile fields if they exist
        setProfileState(prev => ({
          ...prev,
          name: data.name || prev.name,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : prev.avatarUrl,
        }));

        // Update notification prefs if saved
        if (data.notificationPrefs) {
          setNotificationPrefsState(prev => ({ ...prev, ...data.notificationPrefs }));
        }
      } catch {
        // If it fails, just use the defaults — that's fine
      }
    };

    loadProfile();
  }, [isAuthenticated, token]);

  return (
    <AppContext.Provider value={{ theme, setTheme, profile, setProfile, notificationPrefs, setNotificationPrefs }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}
