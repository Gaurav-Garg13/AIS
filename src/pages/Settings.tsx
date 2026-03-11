import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/ToastProvider';
import { User, CheckCircle2, Sun, Moon } from 'lucide-react';

export default function Settings() {
  const { profile, setProfile, notificationPrefs, setNotificationPrefs, theme, setTheme } = useAppContext();
  const { showToast } = useToast();

  const [formState, setFormState] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profile.avatarUrl);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (formState.newPassword && formState.newPassword !== formState.confirmPassword) {
      showToast('New password and confirmation do not match.', { type: 'error' });
      return;
    }

    setProfile((prev) => ({
      ...prev,
      name: formState.name,
      email: formState.email,
      phone: formState.phone,
      avatarUrl: avatarPreview ?? prev.avatarUrl,
    }));

    setNotificationPrefs(() => notificationPrefs);

    // Persist to backend profile.json (best-effort)
    void (async () => {
      try {
        await fetch('http://localhost:3000/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formState.name,
            email: formState.email,
            phone: formState.phone,
            avatarUrl: avatarPreview ?? '',
            theme,
            notificationPrefs: notificationPrefs,
          }),
        });
        showToast('Settings saved successfully.', { type: 'success' });
      } catch {
        showToast('Saved locally, but failed to persist profile.json.', { type: 'error' });
      }
    })();

    setFormState((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">
            Manage your profile and preferences.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Profile Information
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-800/40 flex items-center justify-center overflow-hidden border-2 border-white/10">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <span>Change Avatar</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'bg-white text-gray-900 border-gray-300'
                        : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'bg-gray-900 text-white border-gray-600'
                        : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Dark</span>
                  </motion.button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 transition-all"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formState.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save Settings
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
