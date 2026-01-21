import { memo } from 'react';
import { SunIcon, MoonIcon } from './Icons';

const ThemeToggle = memo(({ isDark, onToggle }) => {
  return (
    <div className="theme-toggle">
      <span style={{ color: isDark ? 'var(--color-text-muted)' : 'var(--color-warning)' }}>
        <SunIcon size={16} />
      </span>

      <button
        onClick={onToggle}
        className={`theme-switch ${isDark ? 'active' : ''}`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <div className="theme-switch-knob">
          {isDark ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="5" />
            </svg>
          )}
        </div>
      </button>

      <span style={{ color: isDark ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
        <MoonIcon size={16} />
      </span>
    </div>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
