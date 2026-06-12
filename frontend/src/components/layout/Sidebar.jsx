import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { fetchProjects } from '../../store/projectSlice';
import Avatar from '../common/Avatar';

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.projects);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const projectColors = ['#6C5CE7', '#00CEC9', '#FD79A8', '#E17055', '#FDCB6E', '#0984E3'];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">📋</div>
        <span className="sidebar-brand">TaskFlow</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Menu</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="icon">🏠</span>
            Dashboard
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Projects</div>
          <div className="sidebar-project-list">
            {projects.map((project, index) => (
              <NavLink
                key={project._id}
                to={`/projects/${project._id}`}
                className={({ isActive }) =>
                  `sidebar-project-item ${isActive ? 'active' : ''}`
                }
              >
                <span
                  className="sidebar-project-dot"
                  style={{
                    backgroundColor:
                      projectColors[index % projectColors.length],
                  }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {project.name}
                </span>
              </NavLink>
            ))}
            {projects.length === 0 && (
              <div style={{ padding: '8px 16px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                No projects yet
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Click to logout">
          <Avatar name={user?.name || 'User'} />
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-email">{user?.email || ''}</div>
          </div>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>⏻</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
