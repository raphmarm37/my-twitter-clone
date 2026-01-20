export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Just now';

  const date = timestamp.toDate();
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const canEditItem = (item, userId) => {
  if (!item?.createdAt || item.userId !== userId) return false;

  const now = new Date();
  const itemTime = item.createdAt.toDate();
  const diffInMinutes = (now - itemTime) / (1000 * 60);

  return diffInMinutes < 5;
};
