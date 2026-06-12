import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { registerUser, clearAuthError } from '../../store/authSlice';

const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    try {
      await dispatch(registerUser({ name, email, password })).unwrap();
      navigate('/dashboard');
    } catch (err) {
      // Error handled by slice
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-logo">🚀</div>
        <h1>Create account</h1>
        <p>Get started with TaskFlow today</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <div className="input-group">
          <label htmlFor="register-name">Full Name</label>
          <input
            id="register-name"
            type="text"
            className="input"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="input-group">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            className="input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            className="input"
            placeholder="Create a password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
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
            'Create Account'
          )}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account?{' '}
        <Link to="/login">Sign in</Link>
      </div>
    </div>
  );
};

export default RegisterForm;
