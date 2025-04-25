import React, { useState, useEffect } from 'react';
import './Login.css';
import { getTranslation, getLanguageDisplayName, languageDisplayNames } from './translations';

// Language list in alphabetical order
const languages = [
  'Afrikaans', 'Shqip', 'አማርኛ', 'العربية', 'Հայերեն', 'Azərbaycan',
  'Euskara', 'Беларуская', 'বাংলা', 'Bosanski', 'Български', 'မြန်မာ',
  'Català', 'Cebuano', 'Chichewa', '中文', '繁體中文', 'Corsu', 'Hrvatski', 'Čeština',
  'Dansk', 'Nederlands',
  'English', 'Esperanto', 'Eesti',
  'Filipino', 'Suomi', 'Français', 'Frysk',
  'Galego', 'ქართული', 'Deutsch', 'Ελληνικά', 'ગુજરાતી',
  'Kreyòl Ayisyen', 'Hausa', 'ʻŌlelo Hawaiʻi', 'עברית', 'हिन्दी', 'Hmoob', 'Magyar',
  'Íslenska', 'Igbo', 'Bahasa Indonesia', 'Gaeilge', 'Italiano',
  '日本語', 'Basa Jawa',
  'ಕನ್ನಡ', 'Қазақ', 'ខ្មែរ', '한국어', 'Kurdî',
  'Кыргызча',
  'ລາວ', 'Latina', 'Latviešu', 'Lietuvių', 'Lëtzebuergesch',
  'Македонски', 'Malagasy', 'Bahasa Melayu', 'മലയാളം', 'Malti', 'Māori', 'मराठी', 'Монгол', 'မြန်မာစာ',
  'नेपाली', 'Norsk',
  'ଓଡ଼ିଆ', 'پښتو', 'فارسی', 'Polski', 'Português', 'ਪੰਜਾਬੀ',
  'Română', 'Русский',
  'Gagana Sāmoa', 'Gàidhlig', 'Српски', 'Sesotho', 'Shona', 'سنڌي', 'සිංහල', 'Slovenčina', 'Slovenščina', 'Soomaali', 'Español', 'Basa Sunda', 'Kiswahili', 'Svenska',
  'Тоҷикӣ', 'தமிழ்', 'తెలుగు', 'ไทย', 'Türkçe',
  'Українська', 'اردو', 'ئۇيغۇرچە', 'O\'zbek',
  'Tiếng Việt',
  'Cymraeg',
  'isiXhosa',
  'יידיש', 'Yorùbá',
  'isiZulu'
];

interface LoginProps {
  onLogin: (username: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, selectedLanguage, onLanguageChange }) => {
  const [email, setEmail] = useState(() => localStorage.getItem('email') || '');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [error, setError] = useState('');

  const t = getTranslation(selectedLanguage);

  useEffect(() => {
    // Check if we have saved email and username
    const savedEmail = localStorage.getItem('email');
    const savedUsername = localStorage.getItem('username');

    if (savedEmail && savedUsername) {
      onLogin(savedUsername);
    }
  }, [onLogin]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onLanguageChange(e.target.value);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError(t.login.error);
      return;
    }

    try {
      // Here you would typically make an API call to verify the email and password
      // For now, we'll just validate the email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Save email but not password
      localStorage.setItem('email', email);

      // Check for saved username
      const savedUsername = localStorage.getItem('username');
      if (savedUsername) {
        onLogin(savedUsername);
      } else {
        setShowUsernameInput(true);
      }
    } catch (err) {
      setError(t.login.error);
    }
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || username.length < 3 || username.length > 15) {
      setError(t.login.error);
      return;
    }

    localStorage.setItem('username', username);
    onLogin(username);
  };

  if (showUsernameInput) {
    return (
      <div className="login-container">
        <form onSubmit={handleUsernameSubmit} className="login-form">
          <h2>{t.login.chooseUsername}</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t.login.usernamePlaceholder}
            minLength={3}
            maxLength={15}
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit">{t.login.startPlaying}</button>
          
          <div className="language-selector">
            <div className="language-label">
              <span className="globe-icon">🌐</span>
              <span>{t.login.language}</span>
            </div>
            <select 
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="language-dropdown"
            >
              {Object.entries(languageDisplayNames).map(([key, displayName]) => (
                <option key={key} value={key}>
                  {displayName}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="login-container">
      <form onSubmit={handleLoginSubmit} className="login-form">
        <h2>{t.login.title}</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.login.emailPlaceholder}
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.login.passwordPlaceholder}
          required
        />
        {error && <div className="error">{error}</div>}
        <button type="submit">{t.login.loginButton}</button>
        
        <div className="language-selector">
          <div className="language-label">
            <span className="globe-icon">🌐</span>
            <span>{t.login.language}</span>
          </div>
          <select 
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className="language-dropdown"
          >
            {Object.entries(languageDisplayNames).map(([key, displayName]) => (
              <option key={key} value={key}>
                {displayName}
              </option>
            ))}
          </select>
        </div>
      </form>
    </div>
  );
};

export default Login; 