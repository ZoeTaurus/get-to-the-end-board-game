import React from 'react';
import '../styles/LoadingScreen.css';

const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h2>Finding a player...</h2>
        <p>Please wait while we connect you with an opponent</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 