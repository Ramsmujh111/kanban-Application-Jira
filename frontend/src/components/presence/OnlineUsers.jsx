import Avatar from '../common/Avatar';

const OnlineUsers = ({ users }) => {
  if (!users || users.length === 0) return null;

  const displayUsers = users.slice(0, 5);
  const remaining = users.length - 5;

  return (
    <div className="online-users">
      <div className="online-users-stack">
        {displayUsers.map((user, index) => (
          <div key={user._id || index} style={{ position: 'relative' }}>
            <Avatar name={user.name} size="sm" />
            <span className="online-indicator" />
          </div>
        ))}
      </div>
      <span className="online-users-count">
        {users.length} online{remaining > 0 ? ` (+${remaining})` : ''}
      </span>
    </div>
  );
};

export default OnlineUsers;
