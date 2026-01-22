import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import AuthForm from '../components/auth/AuthForm';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess('Login successful! Redirecting...');
      setLoading(false);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Login error:', err);

      switch (err.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address format');
          break;
        case 'auth/invalid-credential':
          setError('Invalid email or password. Please check your credentials and try again.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed login attempts. Please try again later.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled');
          break;
        default:
          setError(`Login failed: ${err.message}`);
      }
      setLoading(false);
    }
  };

  const fields = [
    {
      id: 'email',
      type: 'email',
      label: 'Email',
      value: email,
      onChange: (e) => setEmail(e.target.value),
      placeholder: 'Enter your email',
    },
    {
      id: 'password',
      type: 'password',
      label: 'Password',
      value: password,
      onChange: (e) => setPassword(e.target.value),
      placeholder: 'Enter your password',
    },
  ];

  return (
    <AuthForm
      title="Log In"
      subtitle="Sign in to your account"
      fields={fields}
      submitText="Log In"
      loadingText="Logging in..."
      loading={loading}
      error={error}
      success={success}
      onSubmit={handleSubmit}
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkTo="/signup"
    />
  );
}

export default Login;
