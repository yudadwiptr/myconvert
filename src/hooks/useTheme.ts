import React, { useEffect, useState } from 'react';

export type Theme = 'pastel' | 'dark';

const STORAGE_KEY = 'myconvert_theme';

function readSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'pastel') return saved;
  } catch {
    // storage unavailable (private mode etc.)
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'pastel';
}

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/**
 * Theme state: follows the OS preference until the user picks one explicitly,
 * and animates the switch with a circular View Transition from the toggle.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readSavedTheme);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const toggleTheme = (e: React.MouseEvent<HTMLElement>) => {
    const nextTheme: Theme = theme === 'pastel' ? 'dark' : 'pastel';
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // ignore
    }
    const root = document.documentElement;

    // Synchronized CSS transition for browsers without View Transitions
    root.classList.add('theme-transitioning');
    window.setTimeout(() => root.classList.remove('theme-transitioning'), 520);

    const docWithVT = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    if (!docWithVT.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(nextTheme);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = docWithVT.startViewTransition(() => {
      applyThemeClass(nextTheme);
      setTheme(nextTheme);
    });

    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
          },
          {
            duration: 520,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      })
      .catch(() => {});
  };

  return { theme, toggleTheme };
}
