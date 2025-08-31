import React from 'react';
import { getTranslation } from '../translations';

interface ShopScreenProps {
  language: string;
  currentTheme: string;
  onThemeSelect: (theme: string) => void;
  onBack: () => void;
}

const ShopScreen: React.FC<ShopScreenProps> = ({ language, currentTheme, onThemeSelect, onBack }) => {
  const themes = [
    {
      id: 'default',
      name: 'Default',
      description: 'Classic game board',
      colors: ['#f8f9fa', '#e9ecef'],
      preview: '🎮'
    },
    {
      id: 'original',
      name: 'Original',
      description: 'Classic orange and black board',
      colors: ['#FF6B35', '#2D3436'],
      preview: '🔶'
    },
    {
      id: 'summer',
      name: 'Summer',
      description: 'Bright sunny beach vibes',
      colors: ['#FFD93D', '#74B9FF'],
      preview: '🌞'
    },
    {
      id: 'fall',
      name: 'Fall',
      description: 'Autumn leaves and harvest',
      colors: ['#E17055', '#FDCB6E'],
      preview: '🍂'
    },
    {
      id: 'winter',
      name: 'Winter',
      description: 'Cool snow and ice',
      colors: ['#74B9FF', '#FFFFFF'],
      preview: '❄️'
    },
    {
      id: 'spring',
      name: 'Spring',
      description: 'Fresh green and flowers',
      colors: ['#00B894', '#FF7675'],
      preview: '🌸'
    }
  ];

  return (
    <div className="shop-screen">
      <div className="shop-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1 className="shop-title">🛍️ Theme Shop</h1>
        <p className="shop-subtitle">Choose your board theme</p>
      </div>

      <div className="themes-grid">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`theme-card ${currentTheme === theme.id ? 'selected' : ''}`}
            onClick={() => onThemeSelect(theme.id)}
          >
            {currentTheme === theme.id && (
              <div className="selected-checkmark">✓</div>
            )}
            <div className="theme-preview">
              <div 
                className="theme-board-preview"
                style={{
                  background: `linear-gradient(45deg, ${theme.colors[0]}, ${theme.colors[1]})`
                }}
              >
                <div className="preview-piece red-piece">●</div>
                <div className="preview-piece blue-piece">♦</div>
              </div>
              <div className="theme-emoji">{theme.preview}</div>
            </div>
            
            <div className="theme-info">
              <h3 className="theme-name">{theme.name}</h3>
              <p className="theme-description">{theme.description}</p>
              
              <div className="theme-colors">
                {theme.colors.map((color, index) => (
                  <div
                    key={index}
                    className="color-dot"
                    style={{ backgroundColor: color }}
                  ></div>
                ))}
              </div>
              
              {currentTheme === theme.id && (
                <div className="selected-badge">✓ Selected</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopScreen;
