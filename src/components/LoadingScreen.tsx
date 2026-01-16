import React from 'react';
import '../styles/LoadingScreen.css';
import { getTranslation } from '../translations';

interface LoadingScreenProps {
  language?: string;
  onBack?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ language = 'English', onBack }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h2>{getTranslation(language).game.searchingForGame}</h2>
        <p>{getTranslation(language).game.waitingForOpponent}</p>
        {onBack && (
          <button className="loading-back-button" onClick={onBack}>
            {getTranslation(language).game.backToHome}
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen; 