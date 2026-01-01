import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeId = 'glassy-light' | 'midnight' | 'deep-forest' | 'aura' | 'netflix' | 'appletv' | 'prime' | 'hbo';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  blur: number;
  setBlur: (blur: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'streame.theme';
const BLUR_STORAGE_KEY = 'streame.blur';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (
      stored === 'glassy-light' ||
      stored === 'midnight' ||
      stored === 'deep-forest' ||
      stored === 'aura' ||
      stored === 'netflix' ||
      stored === 'appletv' ||
      stored === 'prime' ||
      stored === 'hbo'
    ) {
      return stored;
    }
    return 'midnight';
  });

  const [blur, setBlurState] = useState<number>(() => {
    const stored = localStorage.getItem(BLUR_STORAGE_KEY);
    const parsed = stored ? Number(stored) : NaN;
    if (!Number.isFinite(parsed)) return 20;
    return clamp(parsed, 0, 40);
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const next = clamp(blur, 0, 40);
    document.documentElement.style.setProperty('--glass-blur', `${next}px`);
    localStorage.setItem(BLUR_STORAGE_KEY, String(next));
  }, [blur]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      blur,
      setBlur: setBlurState,
    }),
    [theme, blur]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
