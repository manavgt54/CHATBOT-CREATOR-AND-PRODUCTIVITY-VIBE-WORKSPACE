import React from 'react';
import { Link } from 'react-router-dom';
import YouTubeMusicPlayer from './YouTubeMusicPlayer';
import './MusicSpaces.css';

const MusicSpaces = () => {
  return (
    <div className="music-spaces">
      {/* Header with Navigation */}
      <div className="music-header">
        <div className="header-left">
          <h1 className="music-title">🎵 Music Spaces</h1>
          <p className="music-subtitle">Your personal music universe powered by YouTube</p>
        </div>
        <div className="header-right">
          <Link to="/dashboard" className="back-button">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* YouTube Music Player */}
      <YouTubeMusicPlayer />
    </div>
  );
};

export default MusicSpaces;
