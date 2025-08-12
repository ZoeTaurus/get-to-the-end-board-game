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