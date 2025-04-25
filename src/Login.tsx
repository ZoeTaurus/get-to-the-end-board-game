import React, { useState, useEffect } from 'react';
import './Login.css';
import { getTranslation } from './translations';

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
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState(() => localStorage.getItem('email') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('password') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => 
    localStorage.getItem('language') || 'English'
  );

  const t = getTranslation(selectedLanguage);

  useEffect(() => {
    // Check if we have saved credentials
    const savedEmail = localStorage.getItem('email');
    const savedPassword = localStorage.getItem('password');
    const savedUsername = localStorage.getItem('username');

    if (savedEmail && savedPassword && savedUsername) {
      onLogin(savedUsername);
    }
  }, [onLogin]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

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
          <h2>{t.login.chooseUsername}</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t.login.usernamePlaceholder}
            required
          />
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
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language}
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
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
      </form>
    </div>
  );
};

export default Login; 