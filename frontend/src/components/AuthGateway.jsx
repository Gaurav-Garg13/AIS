import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Mail, Lock, User, Paperclip } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { VITE_API_URL } from '../utils/api';

// SVG Noise Filter Component to create the tactile paper/matte feel
const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay">
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" />
    </svg>
  </div>
);

export default function AuthGateway() {
  const [isDark, setIsDark] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { login: loginContext } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin ? { email, password } : { name, email, password };

      const res = await fetch(`${VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (!isLogin && avatar) {
        // Upload avatar
        const formData = new FormData();
        formData.append('avatar', avatar);
        const avatarRes = await fetch(`${VITE_API_URL}/api/profile/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${data.token}`
          },
          body: formData
        });
        const avatarData = await avatarRes.json();
        if (avatarRes.ok) {
           data.avatarUrl = avatarData.avatarUrl;
        }
      }

      loginContext(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${VITE_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google auth failed');
      
      loginContext(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`min-h-screen w-full transition-colors duration-400 ease-in-out flex items-center justify-center relative overflow-hidden
        ${isDark ? 'bg-[#1A1817] text-[#E8E4D9]' : 'bg-[#F4F1EB] text-[#2C2A29]'}`}
      style={{ fontFamily: '"DM Sans", "Outfit", sans-serif' }}
    >
      <NoiseOverlay />
      
      <button 
        onClick={() => setIsDark(!isDark)}
        className="absolute top-8 right-8 p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-40 focus:outline-none"
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <Sun className="w-6 h-6 text-[#E8E4D9]" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ opacity: 0, scale: 0.8, rotate: 90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: -90 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <Moon className="w-6 h-6 text-[#2C2A29]" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <motion.div 
        layout
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        className={`relative w-full max-w-[420px] p-10 sm:p-12 rounded-xl z-10 transition-colors duration-400
          ${isDark ? 'bg-[#242220]' : 'bg-[#EBE5D9]'}`
        }
        style={{
          boxShadow: isDark 
            ? 'inset 1px 1px 0px rgba(255, 255, 255, 0.06)' 
            : '0px 20px 40px rgba(44, 42, 41, 0.05)'
        }}
      >
        <motion.div layout className="mb-10 text-center">
          <motion.h1 
            layout 
            className="text-3xl mb-3 tracking-tight" 
            style={{ fontFamily: '"Playfair Display", "Lora", serif' }}
          >
            The Library Archive
          </motion.h1>
          <motion.p layout className="text-sm opacity-60">
            {isLogin ? 'Welcome back to your academic platform.' : 'Join our community of scholars.'}
          </motion.p>
        </motion.div>

        {error && (
          <div className="mb-4 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <AnimatePresence mode="popLayout" initial={false}>
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative group">
                  <User className="absolute left-0 top-3.5 w-5 h-5 opacity-40 transition-opacity group-focus-within:opacity-80" />
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className={`w-full bg-transparent border-b py-3 pl-9 pr-4 outline-none transition-colors
                      ${isDark ? 'border-white/10 focus:border-[#C78B77]' : 'border-black/10 focus:border-[#B06D5B]'}`}
                  />
                </div>
              </motion.div>
            )}
            
            <motion.div layout key="email" className="relative group">
              <Mail className="absolute left-0 top-3.5 w-5 h-5 opacity-40 transition-opacity group-focus-within:opacity-80" />
              <input 
                type="email" 
                placeholder="University Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full bg-transparent border-b py-3 pl-9 pr-4 outline-none transition-colors
                  ${isDark ? 'border-white/10 focus:border-[#C78B77]' : 'border-black/10 focus:border-[#B06D5B]'}`}
              />
            </motion.div>
            
            <motion.div layout key="password" className="relative group">
              <Lock className="absolute left-0 top-3.5 w-5 h-5 opacity-40 transition-opacity group-focus-within:opacity-80" />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full bg-transparent border-b py-3 pl-9 pr-4 outline-none transition-colors
                  ${isDark ? 'border-white/10 focus:border-[#C78B77]' : 'border-black/10 focus:border-[#B06D5B]'}`}
              />
            </motion.div>

            {!isLogin && (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="pt-2 pb-1"
              >
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${isDark 
                      ? 'border-white/20 hover:border-white/40 text-[#E8E4D9]' 
                      : 'border-black/20 hover:border-black/40 text-[#2C2A29]'}`}
                >
                  <Paperclip className="w-5 h-5 mb-2 opacity-50" />
                  <span className="text-sm opacity-60">
                    {avatar ? avatar.name : 'Upload Profile ID Photo'}
                  </span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="pt-4 space-y-4">
            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded font-medium transition-all hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50
                ${isDark 
                  ? 'bg-[#C78B77] text-[#1A1817] focus:ring-[#C78B77] focus:ring-offset-[#242220]' 
                  : 'bg-[#B06D5B] text-[#F4F1EB] focus:ring-[#B06D5B] focus:ring-offset-[#EBE5D9]'}`}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
            <div className="flex items-center justify-center pt-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login failed')}
                useOneTap
              />
            </div>
          </motion.div>
        </form>

        <motion.div layout className="mt-8 text-center text-sm">
          <span className="opacity-60">
            {isLogin ? "Don't have an account? " : "Already a member? "}
          </span>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium hover:underline focus:outline-none ml-1"
            style={{ color: isDark ? '#C78B77' : '#B06D5B' }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
