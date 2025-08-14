import React, { useState, useEffect } from 'react';
import './App.css';

interface LoginProps {
  onLogin: (username: string) => void;
}

interface User {
  username: string;
  password: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'newPassword'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : [];
  });

  useEffect(() => {
    // Load last used username if exists
    const lastUsername = localStorage.getItem('lastUsername');
    if (lastUsername) {
      setUsername(lastUsername);
    }
  }, []);

  const validatePassword = (pass: string) => {
    if (pass.length < 4) {
      return 'Password must be at least 4 characters long';
    }
    return '';
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.username === username);
    if (!user) {
      setError('User not found');
      return;
    }

    if (user.password !== password) {
      setError('Incorrect password');
      return;
    }

    localStorage.setItem('lastUsername', username);
    onLogin(username);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (users.some(u => u.username === username)) {
      setError('Username already taken');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const newUser: User = { username, password };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    localStorage.setItem('lastUsername', username);
    onLogin(username);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Simulate sending verification code
    setError('Verification code sent to your email!');
    setResetStep('code');
  };

  const handleVerificationCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    // Simulate code verification
    setError('Code verified! Enter your new password');
    setResetStep('newPassword');
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // For demo purposes, we'll just show success
    // In a real app, you'd update the password in your database
    setError('Password updated successfully!');
    setTimeout(() => {
      setShowPasswordReset(false);
      setResetStep('email');
      setResetEmail('');
      setVerificationCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setError('');
    }, 2000);
  };

  // Password reset screens
  if (showPasswordReset) {
    if (resetStep === 'email') {
      return (
        <div className="login-container">
          <div className="login-box">
            <h1>Change Password</h1>
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <button type="submit">Send Code</button>
            </form>
            <span 
              className="login-link"
              onClick={() => setShowPasswordReset(false)}
            >
              ← Back to Login
            </span>
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>
      );
    }

    if (resetStep === 'code') {
      return (
        <div className="login-container">
          <div className="login-box">
            <h1>Change Password</h1>
            <p className="reset-instructions">We sent a 6-digit code to {resetEmail}</p>
            <form onSubmit={handleVerificationCode}>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                required
              />
              <button type="submit">Verify Code</button>
            </form>
            <span 
              className="login-link"
              onClick={() => setShowPasswordReset(false)}
            >
              ← Back to Login
            </span>
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>
      );
    }

    if (resetStep === 'newPassword') {
      return (
        <div className="login-container">
          <div className="login-box">
            <h1>Change Password</h1>
            <form onSubmit={handlePasswordReset}>
              <input
                type="password"
                placeholder="Enter new password (min 4 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
              <button type="submit">Update Password</button>
            </form>
            <span 
              className="login-link"
              onClick={() => setShowPasswordReset(false)}
            >
              ← Back to Login
            </span>
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Get To The End</h1>
        {!isRegistering ? (
          <>
            <button 
              className="register-link"
              onClick={() => setIsRegistering(true)}
            >
              New user? Register here!
            </button>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Login</button>
              <span 
                className="forgot-password-link"
                onClick={() => setShowPasswordReset(true)}
              >
                Want to change password?
              </span>
            </form>
          </>
        ) : (
          <>
            <button 
              className="login-link"
              onClick={() => setIsRegistering(false)}
            >
              Already have an account? Login here!
            </button>
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Choose Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password (min 4 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="submit">Register</button>
            </form>
          </>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default Login; 