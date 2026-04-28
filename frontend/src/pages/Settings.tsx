import { apiFetch } from '../utils/api';
import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../context/AuthContext';
import { User, CheckCircle2, Sun, Moon } from 'lucide-react';

export default function Settings() {
  const { profile, setProfile, notificationPrefs, setNotificationPrefs, theme, setTheme } = useAppContext();
  const { showToast } = useToast();

  const [formState, setFormState] = useState({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profile.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { user, login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Persist to backend
    void (async () => {
      try {
        let finalAvatarUrl = profile.avatarUrl;
        
        if (avatarFile) {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          const avatarRes = await apiFetch('/api/profile/avatar', {
            method: 'POST',
            body: formData,
          });
          if (avatarRes.ok) {
            const data = await avatarRes.json();
            finalAvatarUrl = data.avatarUrl;
            if (user && login) {
              login({ ...data, token: localStorage.getItem('auth_token') || '' });
            }
          }
        }

        await apiFetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formState.name,
            email: formState.email,
            phone: formState.phone,
            avatarUrl: finalAvatarUrl,
            theme,
            notificationPrefs,
          }),
        });
        
        setProfile((prev) => ({
          ...prev,
          name: formState.name,
          email: formState.email,
          phone: formState.phone,
          avatarUrl: finalAvatarUrl,
        }));
        
        showToast('Settings saved successfully.', { type: 'success' });
      } catch {
        showToast('Failed to save settings.', { type: 'error' });
      }
    })();
  };

  const inputClass = "w-full py-2 bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-slate-800 dark:focus:border-slate-400 transition-colors duration-300 font-sans";
  const labelClass = "block text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1 font-sans";
  const btnClass = "px-6 py-2 bg-[#4E7F65] dark:bg-[#3B634E] text-white rounded font-medium hover:opacity-90 transition-opacity font-sans flex items-center justify-center gap-2 shadow-sm";

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="mb-10">
          <h1 className="text-4xl font-serif text-[#1E293B] dark:text-slate-200 mb-2 transition-colors duration-300 tracking-tight">Profile & Preferences</h1>
          <p className="text-slate-500 dark:text-slate-400 transition-colors duration-300 font-sans">
            Manage your personal information and aesthetic choices.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1A1817] rounded-xl border border-slate-200 dark:border-[#2C2A28] p-10 shadow-sm transition-colors duration-300"
        >
          <h2 className="text-xl font-serif text-slate-800 dark:text-slate-200 mb-8 flex items-center gap-3 transition-colors duration-300">
            <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            Identity
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              
              {/* Avatar Upload */}
              <div className="md:col-span-2 flex items-center gap-6 border-b border-slate-100 dark:border-slate-800/50 pb-8">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-[#242220] flex items-center justify-center overflow-hidden border border-slate-200 dark:border-[#2C2A28] transition-colors duration-300 shadow-sm shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
                <div>
                  <label className="inline-flex items-center gap-2 px-5 py-2 bg-white dark:bg-[#242220] border border-slate-200 dark:border-[#2C2A28] text-slate-800 dark:text-slate-200 text-sm font-medium rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2C2A28] transition-colors font-sans shadow-sm">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <span>Upload Portrait</span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-sans">JPEG or PNG. Max 2MB.</p>
                </div>
              </div>

              {/* Theme Settings */}
              <div className="md:col-span-2">
                <label className={labelClass}>Aesthetic</label>
                <div className="flex gap-4 mt-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded border transition-all duration-300 font-sans text-sm ${
                      theme === 'light'
                        ? 'bg-[#F8FAFC] dark:bg-[#F8FAFC] text-slate-800 border-slate-300 shadow-sm'
                        : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#2C2A28] hover:border-slate-300'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Editorial Light</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded border transition-all duration-300 font-sans text-sm ${
                      theme === 'dark'
                        ? 'bg-[#242220] text-slate-200 border-[#3B634E] shadow-sm'
                        : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#2C2A28] hover:border-slate-700'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Midnight Charcoal</span>
                  </motion.button>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-1">
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Contact Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formState.phone}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-[#2C2A28] flex justify-end">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className={btnClass}
              >
                <CheckCircle2 className="w-4 h-4" />
                Commit Changes
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
