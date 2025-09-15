import React, { useState, useEffect } from 'react';
import './YouTubeMusicPlayer.css';

const YouTubeMusicPlayer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const API_KEY = 'AIzaSyCiHkZ7c2mFioCWHtVUlEtyxAVgkvlnKbk';
  const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

  // Load last search from localStorage on component mount
  useEffect(() => {
    const lastSearch = localStorage.getItem('youtubeMusicLastSearch');
    if (lastSearch) {
      setSearchQuery(lastSearch);
    }
  }, []);

  // Search for videos using YouTube Data API
  const searchVideos = async (query) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const response = await fetch(
        `${YOUTUBE_API_URL}?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=10&key=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'API Error');
      }

      if (data.items && data.items.length > 0) {
        setSearchResults(data.items);
        // Save search to localStorage
        localStorage.setItem('youtubeMusicLastSearch', query);
      } else {
        setError('No results found. Try a different search term.');
      }
    } catch (err) {
      console.error('Search error:', err);
      if (err.message.includes('quotaExceeded')) {
        setError('API quota exceeded. Please try again later.');
      } else if (err.message.includes('403')) {
        setError('API access denied. Please check the API key.');
      } else {
        setError(`Search failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    searchVideos(searchQuery);
  };

  // Play selected video
  const playVideo = (video) => {
    setCurrentVideo(video);
    // Scroll to player section
    setTimeout(() => {
      const playerSection = document.getElementById('player-section');
      if (playerSection) {
        playerSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Toggle dark/light mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Format video duration (if available) - Currently unused but available for future enhancement
  // const formatDuration = (duration) => {
  //   // Note: Duration requires additional API call to video details
  //   return 'Duration not available';
  // };

  return (
    <div className={`youtube-music-player ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header */}
      <div className="music-header">
        <div className="header-left">
          <h1 className="music-title">🎵 YouTube Music Player</h1>
          <p className="music-subtitle">Stream music for free with YouTube</p>
        </div>
        <div className="header-right">
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for songs, artists, or genres..."
              className="search-input"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="search-button"
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? '⏳' : '🔍'} Search
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Searching for music...</p>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h2>Search Results</h2>
          <div className="results-grid">
            {searchResults.map((video) => (
              <div 
                key={video.id.videoId} 
                className="result-card"
                onClick={() => playVideo(video)}
              >
                <div className="video-thumbnail">
                  <img 
                    src={video.snippet.thumbnails.medium.url} 
                    alt={video.snippet.title}
                    loading="lazy"
                  />
                  <div className="play-overlay">
                    <span className="play-icon">▶️</span>
                  </div>
                </div>
                <div className="video-info">
                  <h3 className="video-title" title={video.snippet.title}>
                    {video.snippet.title}
                  </h3>
                  <p className="video-channel">{video.snippet.channelTitle}</p>
                  <p className="video-description">
                    {video.snippet.description.substring(0, 100)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player Section */}
      {currentVideo && (
        <div id="player-section" className="player-section">
          <h2>Now Playing</h2>
          <div className="player-container">
            <div className="video-player">
              <iframe
                width="100%"
                height="315"
                src={`https://www.youtube.com/embed/${currentVideo.id.videoId}?autoplay=1&rel=0`}
                title={currentVideo.snippet.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="video-details">
              <h3 className="playing-title">{currentVideo.snippet.title}</h3>
              <p className="playing-channel">by {currentVideo.snippet.channelTitle}</p>
              <p className="playing-description">
                {currentVideo.snippet.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="music-footer">
        <div className="footer-content">
          <p>🎵 Powered by YouTube Data API</p>
          <p>This app streams music from YouTube. All rights belong to the original creators and YouTube.</p>
          <a 
            href="https://www.youtube.com/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="youtube-link"
          >
            YouTube Terms of Service
          </a>
        </div>
        <div className="status-indicator">
          <span className="status-dot connected"></span>
          YouTube API Connected
        </div>
      </div>
    </div>
  );
};

export default YouTubeMusicPlayer;
