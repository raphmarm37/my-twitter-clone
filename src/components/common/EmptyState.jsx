import { memo } from 'react';
import { CommentIcon } from './Icons';

const EmptyState = memo(({ icon: Icon = CommentIcon, message }) => (
  <div className="text-center" style={{ padding: 'var(--space-8)' }}>
    <div style={{ margin: '0 auto var(--space-4)', color: 'var(--color-text-muted)' }}>
      <Icon size={48} />
    </div>
    <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
      {message}
    </p>
  </div>
));

EmptyState.displayName = 'EmptyState';

export default EmptyState;
