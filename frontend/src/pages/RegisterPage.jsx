import RegisterForm from '../components/auth/RegisterForm';
import '../styles/auth.css';

const RegisterPage = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
