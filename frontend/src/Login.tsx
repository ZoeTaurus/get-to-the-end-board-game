import React, { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [step, setStep] = useState<'login' | 'username'>('login');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for saved credentials
    const savedEmail = localStorage.getItem('email');
    const savedPassword = localStorage.getItem('password');
    const savedUsername = localStorage.getItem('username');

    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      if (savedUsername) {
        setUsername(savedUsername);
        onLogin(savedUsername);
      }
    }
  }, [onLogin]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Save credentials
    localStorage.setItem('email', email);
    localStorage.setItem('password', password);

    // If username is already saved, login directly
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      onLogin(savedUsername);
    } else {
      setStep('username');
    }
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (username.length > 15) {
      setError('Username must be less than 15 characters');
      return;
    }

    localStorage.setItem('username', username);
    onLogin(username);
  };

  if (step === 'username') {
    return (
      <div className="login-container">
        <form onSubmit={handleUsernameSubmit} className="login-form">
          <h2>Choose Your Username</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username (3-15 characters)"
            maxLength={15}
            autoFocus
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit">Start Playing</button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-container">
      <form onSubmit={handleLoginSubmit} className="login-form">
        <h2>Welcome Back!</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          autoFocus
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min. 6 characters)"
          required
        />
        {error && <div className="error">{error}</div>}
        <button type="submit">Continue</button>
      </form>
    </div>
  );
};

export default Login; 