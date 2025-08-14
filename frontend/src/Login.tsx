import React, { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState(() => localStorage.getItem('email') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('password') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'newPassword'>('email');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if we have saved credentials
    const savedEmail = localStorage.getItem('email');
    const savedPassword = localStorage.getItem('password');
    const savedUsername = localStorage.getItem('username');

    if (savedEmail && savedPassword && savedUsername) {
      onLogin(savedUsername);
    }
  }, [onLogin]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save credentials
    localStorage.setItem('email', email);
    localStorage.setItem('password', password);

    // Check for saved username
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      onLogin(savedUsername);
    } else {
      setShowUsernameInput(true);
    }
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('username', username);
    onLogin(username);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setMessage('Please enter your email address');
      return;
    }
    
    // Simulate sending verification code
    setMessage('Verification code sent to your email!');
    setResetStep('code');
  };

  const handleVerificationCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setMessage('Please enter the 6-digit verification code');
      return;
    }
    
    // Simulate code verification
    setMessage('Code verified! Enter your new password');
    setResetStep('newPassword');
  };

  const handleNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }
    
    // Update password in localStorage
    localStorage.setItem('password', newPassword);
    setMessage('Password updated successfully!');
    
    // Reset to login screen after a short delay
    setTimeout(() => {
      setShowPasswordReset(false);
      setResetStep('email');
      setResetEmail('');
      setVerificationCode('');
      setNewPassword('');
      setMessage('');
    }, 2000);
  };

  const goBackToLogin = () => {
    setShowPasswordReset(false);
    setResetStep('email');
    setResetEmail('');
    setVerificationCode('');
    setNewPassword('');
    setMessage('');
  };

  // Password reset screens
  if (showPasswordReset) {
    if (resetStep === 'email') {
      return (
        <div className="login-container">
          <div className="login-card">
            <h1>Reset Password</h1>
            <h2>Enter your email</h2>
            <form onSubmit={handlePasswordReset}>
              <div className="form-group">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              {message && <div className="message">{message}</div>}
              <button type="submit" className="login-button">Send Code</button>
            </form>
            <button onClick={goBackToLogin} className="back-link">← Back to Login</button>
            <div className="decoration">
              <div className="piece red"></div>
              <div className="piece blue circle"></div>
              <div className="piece red"></div>
            </div>
          </div>
        </div>
      );
    }

    if (resetStep === 'code') {
      return (
        <div className="login-container">
          <div className="login-card">
            <h1>Reset Password</h1>
            <h2>Enter verification code</h2>
            <p className="reset-instructions">We sent a 6-digit code to {resetEmail}</p>
            <form onSubmit={handleVerificationCode}>
              <div className="form-group">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                />
              </div>
              {message && <div className="message">{message}</div>}
              <button type="submit" className="login-button">Verify Code</button>
            </form>
            <button onClick={goBackToLogin} className="back-link">← Back to Login</button>
            <div className="decoration">
              <div className="piece red"></div>
              <div className="piece blue circle"></div>
              <div className="piece red"></div>
            </div>
          </div>
        </div>
      );
    }

    if (resetStep === 'newPassword') {
      return (
        <div className="login-container">
          <div className="login-card">
            <h1>Reset Password</h1>
            <h2>Choose new password</h2>
            <form onSubmit={handleNewPassword}>
              <div className="form-group">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  required
                />
              </div>
              {message && <div className="message">{message}</div>}
              <button type="submit" className="login-button">Update Password</button>
            </form>
            <button onClick={goBackToLogin} className="back-link">← Back to Login</button>
            <div className="decoration">
              <div className="piece red"></div>
              <div className="piece blue circle"></div>
              <div className="piece red"></div>
            </div>
          </div>
        </div>
      );
    }
  }

  if (showUsernameInput) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Choose Your Username</h2>
          <form onSubmit={handleUsernameSubmit}>
            <div className="form-group">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
            <button type="submit" className="login-button">Start Playing</button>
          </form>
          <div className="decoration">
            <div className="piece red"></div>
            <div className="piece blue circle"></div>
            <div className="piece red"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Get to the End</h1>
        <h2>Welcome Back!</h2>
        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          <button type="submit" className="login-button">Login</button>
        </form>
        <button 
          onClick={() => setShowPasswordReset(true)} 
          className="forgot-password-link"
        >
          Forgot Password?
        </button>
        <div className="decoration">
          <div className="piece red"></div>
          <div className="piece blue circle"></div>
          <div className="piece red"></div>
        </div>
      </div>
    </div>
  );
};

export default Login; 