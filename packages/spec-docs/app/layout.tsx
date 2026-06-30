import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LEAN Format Documentation',
  description: 'LEAN (Lightweight Efficient Adaptive Notation) Format specification and documentation',
};

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/spec/language', label: 'Language Spec' },
  { href: '/spec/grammar', label: 'Grammar' },
  { href: '/guides/getting-started', label: 'Getting Started' },
  { href: '/guides/best-practices', label: 'Best Practices' },
  { href: '/api/core', label: 'Core API' },
  { href: '/api/editor', label: 'Editor API' },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('lean-format-theme') ||
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', theme === 'dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
        <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 h-12 max-w-7xl mx-auto">
            <span className="font-bold text-indigo-500">LEAN Format</span>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </header>
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
