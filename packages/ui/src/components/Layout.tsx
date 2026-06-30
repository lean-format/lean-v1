import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  topNav?: React.ReactNode;
  title?: string;
}

export function Layout({ children, sidebar, topNav, title = 'LEAN Format' }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--lean-bg)] text-[var(--lean-text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--lean-border)] bg-[var(--lean-bg)]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lean-primary">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            {topNav}
            <button
              onClick={toggleTheme}
              className="lean-btn-secondary text-xs px-2 py-1 rounded"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>
      <div className="flex">
        {sidebar && (
          <aside className="w-56 shrink-0 border-r border-[var(--lean-border)] bg-[var(--lean-surface)] min-h-[calc(100vh-3rem)] overflow-y-auto">
            <nav className="p-3">{sidebar}</nav>
          </aside>
        )}
        <main className="flex-1 p-4 max-w-full overflow-auto">{children}</main>
      </div>
    </div>
  );
}
