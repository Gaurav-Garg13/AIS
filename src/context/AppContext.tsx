import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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
  const [theme, setThemeState] = useState<ThemeMode>('dark');

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
  };

  const setProfile = (updater: (prev: Profile) => Profile) => {
    setProfileState((prev) => updater(prev));
  };

  const setNotificationPrefs = (updater: (prev: NotificationPrefs) => NotificationPrefs) => {
    setNotificationPrefsState((prev) => updater(prev));
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/profile');
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
  }, []);

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

