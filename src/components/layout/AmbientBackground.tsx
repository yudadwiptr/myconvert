import React from 'react';
import { Theme } from '../../hooks/useTheme';

/** Cross-fading blurred color mesh behind the page, one layer per theme. */
export const AmbientBackground: React.FC<{ theme: Theme }> = ({ theme }) => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
    {/* Pastel mesh */}
    <div
      className={`absolute inset-0 transition-opacity duration-700 ease-out ${
        theme === 'pastel' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="absolute -top-28 left-[12%] w-[620px] h-[440px] bg-gradient-to-br from-purple-200/70 via-pink-200/55 to-indigo-200/50 blur-[110px] rounded-full animate-float-slow" />
      <div className="absolute top-20 right-[8%] w-[540px] h-[420px] bg-gradient-to-bl from-rose-200/60 via-amber-100/55 to-pink-200/50 blur-[115px] rounded-full" />
      <div className="absolute top-[460px] -left-24 w-[540px] h-[460px] bg-gradient-to-tr from-emerald-200/50 via-teal-100/55 to-sky-200/50 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-[15%] w-[600px] h-[440px] bg-gradient-to-tl from-violet-200/55 via-sky-200/45 to-pink-100/50 blur-[125px] rounded-full" />
    </div>

    {/* Cyber dark mesh */}
    <div
      className={`absolute inset-0 transition-opacity duration-700 ease-out ${
        theme === 'dark' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-indigo-600/15 blur-[140px] rounded-full" />
      <div className="absolute top-96 -left-32 w-[450px] h-[450px] bg-cyan-500/10 blur-[140px] rounded-full" />
      <div className="absolute top-80 -right-32 w-[450px] h-[450px] bg-violet-600/10 blur-[140px] rounded-full" />
    </div>
  </div>
);
