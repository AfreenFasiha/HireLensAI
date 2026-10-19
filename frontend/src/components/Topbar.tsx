import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({ title, subtitle, actions }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-[72px] border-b border-white/10 bg-[#000000]/80 backdrop-blur-xl px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 select-none shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* Minimal Theme Toggle with glossy glass feel */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-white/15 bg-white/[0.05] text-neutral-300 hover:text-white hover:bg-white/[0.12] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#fde047]" />
          ) : (
            <Moon className="w-4 h-4 text-[#bae6fd]" />
          )}
        </button>
      </div>
    </header>
  );
};
