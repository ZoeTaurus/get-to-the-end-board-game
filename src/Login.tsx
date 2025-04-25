import React, { useState, useEffect } from 'react';
import './Login.css';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState(() => localStorage.getItem('email') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('password') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [showUsernameInput, setShowUsernameInput] = useState(false);

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

  if (showUsernameInput) {
    return (
      <div className="login-container">
        <form onSubmit={handleUsernameSubmit} className="login-form">
          <h2>Choose Your Username</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
          />
          <button type="submit">Start Playing</button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-container">
      <form onSubmit={handleLoginSubmit} className="login-form">
        <h2>Login</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login; 