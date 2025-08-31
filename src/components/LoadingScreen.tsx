import React from 'react';
import '../styles/LoadingScreen.css';
import { getTranslation } from '../translations';

interface LoadingScreenProps {
  language?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ language = 'English' }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h2>{getTranslation(language).game.searchingForGame}</h2>
        <p>{getTranslation(language).game.waitingForOpponent}</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 