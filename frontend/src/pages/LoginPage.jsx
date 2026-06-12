import LoginForm from '../components/auth/LoginForm';
import '../styles/auth.css';

const LoginPage = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
