import React, { useEffect, useState } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('vp-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('vp-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('vp-theme', 'light');
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark(d => !d) };
}

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300"
      style={{
        background: isDark ? 'var(--brand-gradient-soft)' : 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        color: 'var(--text-tertiary)',
      }}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
        {isDark ? 'Dark' : 'Light'}
      </span>
      <div
        className="relative transition-all duration-300"
        style={{
          width: 36,
          height: 20,
          borderRadius: 99,
          background: isDark ? 'var(--brand-gradient)' : 'var(--bg-base)',
          border: `1px solid ${isDark ? 'transparent' : 'var(--border-strong)'}`,
          boxShadow: isDark ? 'var(--shadow-brand)' : 'none',
        }}
      >
        <div
          className="absolute top-[2px] transition-all duration-300"
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            left: isDark ? 18 : 2,
            background: isDark ? '#fff' : 'var(--text-muted)',
          }}
        />
      </div>
      <div style={{ color: isDark ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
        {isDark ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </div>
    </button>
  );
}
