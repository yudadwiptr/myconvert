import React from 'react';
import { Infinity as InfinityIcon, Moon, Sun } from 'lucide-react';
import { MyConvertLogo } from '../MyConvertLogo';
import { Theme } from '../../hooks/useTheme';

const NAV_LINKS = [
  { href: '#popular-tools', label: 'Alat Populer' },
  { href: '#features', label: 'Keunggulan' },
  { href: '#formats', label: '35+ Format' },
  { href: '#faq', label: 'FAQ' },
];

interface NavbarProps {
  theme: Theme;
  onToggleTheme: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme, onHome }) => (
  <header className="sticky top-0 z-40 smooth-theme border-b border-line/70 bg-canvas/75 backdrop-blur-xl">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          onHome();
        }}
        className="flex items-center gap-2.5 group"
      >
        <MyConvertLogo size="md" className="group-hover:scale-[1.02] transition-transform duration-300" />
        <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-300/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 smooth-theme">
          <InfinityIcon className="w-3 h-3" />
          UNLIMITED SIZE
        </span>
      </a>

      <div className="flex items-center gap-4">
        <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-fg-muted">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-accent transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={onToggleTheme}
          title="Ganti tema Pastel / Dark"
          aria-label={theme === 'pastel' ? 'Ganti ke mode gelap' : 'Ganti ke mode pastel'}
          className="group relative inline-flex items-center gap-2.5 p-1 sm:pr-3.5 rounded-full text-xs font-extrabold border smooth-theme bg-purple-100/80 hover:bg-purple-100 border-purple-200/90 text-purple-950 shadow-sm dark:bg-slate-900 dark:hover:bg-slate-800/90 dark:border-slate-700/90 dark:text-slate-200"
        >
          <span
            className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-sm ${
              theme === 'pastel' ? 'bg-white text-amber-500 rotate-0' : 'bg-indigo-600 text-white rotate-180'
            }`}
          >
            <Sun
              className={`w-4 h-4 absolute transition-all duration-500 ${
                theme === 'pastel' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
              }`}
            />
            <Moon
              className={`w-3.5 h-3.5 absolute transition-all duration-500 ${
                theme === 'dark' ? 'opacity-100 -rotate-180 scale-100' : 'opacity-0 rotate-90 scale-50'
              }`}
            />
          </span>
          <span className="hidden sm:inline tracking-tight transition-colors duration-300">
            {theme === 'pastel' ? 'Pastel Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>
    </div>
  </header>
);
