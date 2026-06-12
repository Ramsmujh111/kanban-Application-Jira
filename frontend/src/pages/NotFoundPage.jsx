import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="auth-page">
      <div style={{
        textAlign: 'center',
        animation: 'fadeInUp 500ms ease forwards',
      }}>
        <div style={{ fontSize: '6rem', marginBottom: '16px' }}>🔍</div>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, var(--text-primary), var(--accent-primary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
        }}>
          404
        </h1>
        <p style={{ color: 'var(--text-tertiary)', marginBottom: '24px', fontSize: '1.1rem' }}>
          The page you're looking for doesn't exist
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
