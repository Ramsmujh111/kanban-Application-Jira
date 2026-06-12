import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loginUser, clearAuthError } from '../../store/authSlice';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the slice
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-logo">📋</div>
        <h1>Welcome back</h1>
        <p>Sign in to your TaskFlow account</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <div className="input-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className="input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="input-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="auth-footer">
        Don't have an account?{' '}
        <Link to="/register">Create one</Link>
      </div>
    </div>
  );
};

export default LoginForm;
