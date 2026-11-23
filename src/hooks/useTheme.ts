import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

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

/** Latest switch in flight, so an older one's cleanup can't unfreeze a newer reveal. */
let latestSwitch = 0;

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/**
 * Theme state: follows the OS preference until the user picks one explicitly,
 * and animates the switch with a circular View Transition from the toggle
 * (or a short color fade where View Transitions are unsupported).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readSavedTheme);
  // The theme the user last asked for. Updated synchronously on click, so rapid
  // toggles alternate correctly even before a pending transition has applied.
  const targetRef = useRef<Theme>(theme);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const toggleTheme = (e: React.MouseEvent<HTMLElement>) => {
    const nextTheme: Theme = targetRef.current === 'pastel' ? 'dark' : 'pastel';
    targetRef.current = nextTheme;
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // ignore
    }
    const root = document.documentElement;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyThemeClass(nextTheme);
      setTheme(nextTheme);
      return;
    }

    const docWithVT = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
    };

    // Fallback (no View Transitions): short color-only cross-fade.
    if (!docWithVT.startViewTransition) {
      root.classList.add('theme-fading');
      applyThemeClass(nextTheme);
      setTheme(nextTheme);
      window.setTimeout(() => root.classList.remove('theme-fading'), 300);
      return;
    }

    // View Transitions: freeze all CSS transitions so the new snapshot is the
    // final state, then reveal it with one clip-path animation from the toggle.
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const switchId = ++latestSwitch;
    root.classList.add('theme-switching');
    const transition = docWithVT.startViewTransition(() => {
      applyThemeClass(nextTheme);
      flushSync(() => setTheme(nextTheme));
    });

    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
          {
            duration: 650,
            easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      })
      .catch(() => {});

    transition.finished
      .catch(() => {})
      .finally(() => {
        if (switchId === latestSwitch) root.classList.remove('theme-switching');
      });
  };

  return { theme, toggleTheme };
}
