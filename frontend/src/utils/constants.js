export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const PRIORITY_COLORS = {
  low: '#00B894',
  medium: '#FDCB6E',
  high: '#E17055',
  urgent: '#D63031',
};

export const COLUMN_COLORS = {
  0: '#6C5CE7',
  1: '#0984E3',
  2: '#FDCB6E',
  3: '#00B894',
};

export const LABEL_COLORS = [
  { bg: 'rgba(108, 92, 231, 0.15)', color: '#6C5CE7', name: 'Feature' },
  { bg: 'rgba(0, 206, 201, 0.15)', color: '#00CEC9', name: 'Bug' },
  { bg: 'rgba(253, 121, 168, 0.15)', color: '#FD79A8', name: 'Design' },
  { bg: 'rgba(9, 132, 227, 0.15)', color: '#0984E3', name: 'Backend' },
  { bg: 'rgba(225, 112, 85, 0.15)', color: '#E17055', name: 'Docs' },
  { bg: 'rgba(253, 203, 110, 0.15)', color: '#FDCB6E', name: 'Testing' },
];

export const AVATAR_COLORS = [
  '#6C5CE7', '#A29BFE', '#00B894', '#00CEC9',
  '#0984E3', '#FD79A8', '#E17055', '#FDCB6E',
  '#E84393', '#2D3436',
];

export const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatDueDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const isDueDateOverdue = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};
