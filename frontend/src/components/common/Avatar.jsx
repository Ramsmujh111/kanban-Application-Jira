import { getAvatarColor } from '../../utils/constants';

const Avatar = ({ name, size = 'md', className = '' }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const color = name ? getAvatarColor(name) : '#6C5CE7';

  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : '';

  return (
    <div
      className={`avatar ${sizeClass} ${className}`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initial}
    </div>
  );
};

export default Avatar;
