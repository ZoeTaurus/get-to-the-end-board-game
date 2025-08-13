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

  const validatePassword = (pass: string) => {
    // Sanitize input to prevent XSS
    const sanitizedPass = pass.replace(/[<>]/g, '');
    
    if (sanitizedPass.length < 4) {
      return 'Password must be at least 4 characters long';
    }
    
    // Check for common weak passwords
    const weakPasswords = ['1234', 'password', '12345', '123456', 'qwerty'];
    if (weakPasswords.includes(sanitizedPass.toLowerCase())) {
      return 'Password is too common, please choose a stronger one';
    }
    
    return '';
  };

  const sanitizeInput = (input: string) => {
    return input.replace(/[<>]/g, '').trim();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedEmail.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    const passwordError = validatePassword(sanitizedPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Save credentials
    localStorage.setItem('email', sanitizedEmail);
    localStorage.setItem('password', sanitizedPassword);

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

    // Sanitize username input
    const sanitizedUsername = sanitizeInput(username);

    if (!sanitizedUsername.trim()) {
      setError('Please enter a username');
      return;
    }

    if (sanitizedUsername.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (sanitizedUsername.length > 15) {
      setError('Username must be less than 15 characters');
      return;
    }

    localStorage.setItem('username', sanitizedUsername);
    onLogin(sanitizedUsername);
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