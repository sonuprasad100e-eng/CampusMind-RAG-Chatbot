import { create } from 'zustand';

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(resolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }
}

export const useThemeStore = create((set, get) => ({
  theme: 'dark', // 'dark' | 'light' | 'system'
  resolvedTheme: 'dark', // 'dark' | 'light'
  isInitialized: false,

  initTheme: () => {
    if (typeof window === 'undefined') return;

    let savedTheme = 'dark';
    try {
      savedTheme = localStorage.getItem('campusmind-theme') || 'dark';
    } catch (e) {
      // Ignore localStorage errors
    }

    const resolved = savedTheme === 'system' ? getSystemTheme() : savedTheme;
    applyThemeToDocument(resolved);

    set({
      theme: savedTheme,
      resolvedTheme: resolved,
      isInitialized: true,
    });

    // Listen to OS system color-scheme changes if theme is system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      if (get().theme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        applyThemeToDocument(newResolved);
        set({ resolvedTheme: newResolved });
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemChange);
    }
  },

  setTheme: (newTheme) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('campusmind-theme', newTheme);
    } catch (e) {
      // Ignore localStorage errors
    }

    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    applyThemeToDocument(resolved);

    set({
      theme: newTheme,
      resolvedTheme: resolved,
    });
  },

  toggleTheme: () => {
    const currentResolved = get().resolvedTheme;
    const nextTheme = currentResolved === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },
}));
