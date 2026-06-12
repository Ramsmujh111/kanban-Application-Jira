import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProjects, createProject } from '../store/projectSlice';
import Header from '../components/layout/Header';
import CreateProjectModal from '../components/project/CreateProjectModal';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import '../styles/components.css';

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { projects, loading } = useSelector((state) => state.projects);
  const dispatch = useDispatch();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleCreateProject = async (data) => {
    const result = await dispatch(createProject(data)).unwrap();
    navigate(`/projects/${result._id}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const projectIcons = ['🚀', '💡', '🎨', '⚡', '🔥', '🌟', '💎', '🎯'];

  return (
    <>
      <Header title="Dashboard" />
      <div className="page-content">
        {/* Greeting */}
        <div className="dashboard-header" style={{ animation: 'fadeInUp 500ms ease forwards' }}>
          <h1 className="dashboard-greeting">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="dashboard-subtitle">
            Here's an overview of your projects and tasks
          </p>
        </div>

        {/* Actions */}
        <div className="dashboard-actions" style={{ animation: 'fadeInUp 500ms ease forwards', animationDelay: '100ms', opacity: 0 }}>
          <h2 className="dashboard-section-title">Your Projects</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            ✚ New Project
          </button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <Spinner />
        ) : projects.length === 0 ? (
          <div className="empty-state" style={{ animation: 'fadeInUp 500ms ease forwards', animationDelay: '200ms', opacity: 0 }}>
            <div className="empty-state-icon">📂</div>
            <h3 className="empty-state-title">No projects yet</h3>
            <p className="empty-state-text">
              Create your first project to start organizing tasks and collaborating with your team.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              ✚ Create Your First Project
            </button>
          </div>
        ) : (
          <div className="projects-grid stagger-children">
            {projects.map((project, index) => (
              <div
                key={project._id}
                className="project-card"
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <div className="project-card-header">
                  <div className="project-card-icon">
                    {projectIcons[index % projectIcons.length]}
                  </div>
                </div>

                <h3 className="project-card-name">{project.name}</h3>
                <p className="project-card-desc">
                  {project.description || 'No description'}
                </p>

                <div className="project-card-stats">
                  <div className="project-card-stat">
                    <span>📋</span>
                    <strong>{project.columns?.length || 4}</strong> columns
                  </div>
                  <div className="project-card-stat">
                    <span>👥</span>
                    <strong>{project.members?.length || 1}</strong> members
                  </div>
                </div>

                <div className="project-card-members">
                  {project.members?.slice(0, 4).map((member) => (
                    <Avatar
                      key={member.user?._id || member.user}
                      name={member.user?.name || 'User'}
                      size="sm"
                    />
                  ))}
                  {project.members?.length > 4 && (
                    <div
                      className="avatar avatar-sm"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        marginLeft: '-6px',
                        border: '2px solid var(--bg-card)',
                        fontSize: '10px',
                      }}
                    >
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />
      </div>
    </>
  );
};

export default DashboardPage;
