import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import AuthForm from '../components/auth/AuthForm';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        userId: user.uid,
        createdAt: serverTimestamp(),
        followers: [],
        following: []
      });

      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError(err.message || 'Failed to create account');
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
    {
      id: 'confirmPassword',
      type: 'password',
      label: 'Confirm Password',
      value: confirmPassword,
      onChange: (e) => setConfirmPassword(e.target.value),
      placeholder: 'Confirm your password',
    },
  ];

  return (
    <AuthForm
      title="Sign Up"
      subtitle="Create your account"
      fields={fields}
      submitText="Sign Up"
      loadingText="Creating Account..."
      loading={loading}
      error={error}
      success={success}
      onSubmit={handleSubmit}
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo="/login"
    />
  );
}

export default Signup;
