import { useCallback, useEffect, useState } from 'react';
const STORAGE_KEY = 'lean-format-theme';
export function useTheme() {
    const [theme, setThemeState] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'light' || stored === 'dark')
                return stored;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });
    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);
    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
    }, []);
    const setTheme = useCallback((t) => {
        setThemeState(t);
    }, []);
    return { theme, toggleTheme, setTheme, isDark: theme === 'dark' };
}
