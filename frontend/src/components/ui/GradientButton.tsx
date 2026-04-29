import React from 'react';
import { motion } from 'framer-motion';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

const GradientButton: React.FC<GradientButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => {
  const isPrimary = variant === 'primary';
  
  return (
    <motion.button
      whileHover={{ scale: 1.01, translateY: -1 }}
      whileTap={{ scale: 0.99 }}
      className={`
        relative overflow-hidden
        px-8 py-3.5 rounded-[16px]
        font-sans font-black uppercase tracking-widest text-[11px]
        transition-all duration-300
        flex items-center justify-center gap-3
        ${isPrimary 
          ? 'bg-sage-900 dark:bg-sage-100 text-white dark:text-sage-900 shadow-xl shadow-sage-900/10 hover:shadow-sage-900/20' 
          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {isPrimary && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      )}
    </motion.button>
  );
};

export default GradientButton;
