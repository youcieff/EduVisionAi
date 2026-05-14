"use client";
import { create } from 'zustand';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('eduvision-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  // Auto-detect OS preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
};

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

// Apply on load immediately
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

const useThemeStore = create((set, get) => ({
  theme: initialTheme,
  isDark: initialTheme === 'dark',

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('eduvision-theme', newTheme);
    applyTheme(newTheme);
    set({ theme: newTheme, isDark: newTheme === 'dark' });
  },

  setTheme: (theme) => {
    localStorage.setItem('eduvision-theme', theme);
    applyTheme(theme);
    set({ theme, isDark: theme === 'dark' });
  },
}));

export default useThemeStore;
