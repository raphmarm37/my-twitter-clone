import { memo } from 'react';

const LoadingSpinner = memo(({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: { spinner: 'w-6 h-6', container: 'padding: var(--space-4)' },
    md: { spinner: 'w-8 h-8', container: 'padding: var(--space-8)' },
    lg: { spinner: 'w-10 h-10', container: 'padding: var(--space-8)' },
  };

  const { spinner, container } = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center justify-center" style={{ [container.split(': ')[0]]: container.split(': ')[1] }}>
      <div className="flex flex-col items-center gap-3">
        <div
          className={`${spinner} rounded-full border-2 animate-spin`}
          style={{
            borderColor: 'var(--color-border)',
            borderTopColor: 'var(--color-primary)'
          }}
        />
        {text && (
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
