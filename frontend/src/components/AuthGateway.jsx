import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Mail, Lock, User, Paperclip, Sparkles, Library } from 'lucide-react';
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

// Atmospheric Background with moving dot grid
const AtmosphericBackground = ({ isDark }) => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* Base Gradient */}
    <div className={`absolute inset-0 transition-colors duration-1000 
      ${isDark 
        ? 'bg-[#0F0E0D]' 
        : 'bg-[#F9F7F2]'}`} 
    />
    
    {/* Radial Glows */}
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
        x: [0, 50, 0],
        y: [0, -30, 0]
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      className={`absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px]
        ${isDark ? 'bg-[#2D241E]' : 'bg-[#E5DFD3]'}`}
    />
    
    <motion.div 
      animate={{ 
        scale: [1.2, 1, 1.2],
        opacity: [0.2, 0.4, 0.2],
        x: [0, -40, 0],
        y: [0, 60, 0]
      }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      className={`absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] rounded-full blur-[100px]
        ${isDark ? 'bg-[#1E252D]' : 'bg-[#D3E0E5]'}`}
    />

    {/* Dot Grid */}
    <div 
      className="absolute inset-0 opacity-[0.15] dark:opacity-[0.07]" 
      style={{ 
        backgroundImage: `radial-gradient(${isDark ? '#E8E4D9' : '#2C2A29'} 1px, transparent 1px)`,
        backgroundSize: '32px 32px'
      }} 
    />
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
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

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
      className={`min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans
        ${isDark ? 'text-[#E8E4D9]' : 'text-[#2C2A29]'}`}
    >
      <AtmosphericBackground isDark={isDark} />
      <NoiseOverlay />
      
      {/* Theme Toggle */}
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
              transition={{ duration: 0.4 }}
            >
              <Sun className="w-6 h-6 text-[#E8E4D9]" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ opacity: 0, scale: 0.8, rotate: 90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: -90 }}
              transition={{ duration: 0.4 }}
            >
              <Moon className="w-6 h-6 text-[#2C2A29]" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Decorative Branding */}
      <div className="absolute top-8 left-8 flex items-center gap-3 z-40 opacity-40 hover:opacity-100 transition-opacity">
        <Library className="w-5 h-5" />
        <span className="font-serif tracking-widest text-xs uppercase">Est. 2024</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-[440px] px-6 z-10"
      >
        <div className={`relative p-10 sm:p-12 rounded-2xl overflow-hidden border transition-all duration-700
          ${isDark 
            ? 'bg-[#1A1817]/80 border-white/5 shadow-2xl backdrop-blur-2xl' 
            : 'bg-[#FDFDFD]/90 border-black/5 shadow-xl backdrop-blur-xl'}`}
        >
          {/* Subtle Aurora Glow behind the card contents */}
          <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20
            ${isDark ? 'bg-orange-500' : 'bg-amber-400'}`} 
          />

          <div className="relative z-10">
            <header className="mb-10 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#B06D5B] to-[#8C4A4A] text-white mb-6 shadow-lg shadow-orange-900/20"
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              
              <h1 className="text-3xl font-serif mb-3 tracking-tight">
                {isLogin ? 'The Library Archive' : 'Join the Registry'}
              </h1>
              <p className="text-sm opacity-60 font-sans tracking-wide uppercase text-[10px]">
                {isLogin ? 'Authenticate Your Credentials' : 'Create Your Academic Portfolio'}
              </p>
            </header>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium"
              >
                {error}
              </motion.div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="relative group"
                  >
                    <User className="absolute left-0 top-3 w-4 h-4 opacity-30 group-focus-within:opacity-80 transition-opacity" />
                    <input 
                      type="text" 
                      placeholder="Academic Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                      className={`w-full bg-transparent border-b py-2.5 pl-8 pr-4 outline-none transition-all text-sm
                        ${isDark ? 'border-white/10 focus:border-[#C78B77]' : 'border-black/10 focus:border-[#B06D5B]'}`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="relative group">
                <Mail className="absolute left-0 top-3 w-4 h-4 opacity-30 group-focus-within:opacity-80 transition-opacity" />
                <input 
                  type="email" 
                  placeholder="University Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full bg-transparent border-b py-2.5 pl-8 pr-4 outline-none transition-all text-sm
                    ${isDark ? 'border-white/10 focus:border-[#C78B77]' : 'border-black/10 focus:border-[#B06D5B]'}`}
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-0 top-3 w-4 h-4 opacity-30 group-focus-within:opacity-80 transition-opacity" />
                <input 
                  type="password" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full bg-transparent border-b py-2.5 pl-8 pr-4 outline-none transition-all text-sm
                    ${isDark ? 'border-white/10 focus:border-[#C78B77]' : 'border-black/10 focus:border-[#B06D5B]'}`}
                />
              </div>

              {!isLogin && (
                <div className="pt-2">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                      ${isDark 
                        ? 'border-white/5 bg-white/5 hover:bg-white/10' 
                        : 'border-black/5 bg-black/5 hover:bg-black/10'}`}
                  >
                    <Paperclip className="w-4 h-4 mb-1.5 opacity-40" />
                    <span className="text-[11px] opacity-60 font-medium">
                      {avatar ? avatar.name : 'Upload Profile Photo'}
                    </span>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              )}

              <div className="pt-6 space-y-5">
                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] disabled:opacity-50
                    ${isDark 
                      ? 'bg-[#C78B77] text-[#0F0E0D] shadow-lg shadow-orange-900/20' 
                      : 'bg-[#B06D5B] text-[#FDFDFD] shadow-lg shadow-orange-900/10'}`}
                >
                  {loading ? 'Verifying...' : isLogin ? 'Access Archive' : 'Register Scholar'}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className={`w-full border-t ${isDark ? 'border-white/5' : 'border-black/5'}`} />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                    <span className={`px-4 ${isDark ? 'bg-[#1A1817]' : 'bg-[#FDFDFD]'} opacity-40`}>OR</span>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-full max-w-[240px] [&_iframe]:!w-full">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google Authentication Failed')}
                      useOneTap
                      theme={isDark ? "filled_black" : "outline"}
                      shape="pill"
                    />
                  </div>
                </div>
              </div>
            </form>

            <footer className="mt-10 text-center text-xs">
              <p className="opacity-50 inline tracking-wide">
                {isLogin ? "New to the collective? " : "Already registered? "}
              </p>
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold uppercase tracking-widest ml-1 transition-colors"
                style={{ color: isDark ? '#C78B77' : '#B06D5B' }}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </footer>
          </div>
        </div>
        
        {/* Editorial Footnote */}
        <p className="mt-8 text-center text-[9px] opacity-20 uppercase tracking-[0.3em] font-medium">
          © 2024 StudyFlow Academic Intelligence Portal
        </p>
      </motion.div>
    </div>
  );
}
