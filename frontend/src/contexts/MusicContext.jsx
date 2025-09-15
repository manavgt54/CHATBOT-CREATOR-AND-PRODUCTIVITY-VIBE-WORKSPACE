import React, { createContext, useContext, useState, useEffect } from 'react';

const MusicContext = createContext();

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

export const MusicProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // YouTube API configuration
  const API_KEY = 'AIzaSyCiHkZ7c2mFioCWHtVUlEtyxAVgkvlnKbk';
  const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

  // Load music state from localStorage on mount
  useEffect(() => {
    const savedTrack = localStorage.getItem('currentTrack');
    const savedVolume = localStorage.getItem('musicVolume');
    const savedQuery = localStorage.getItem('lastMusicSearch');
    
    if (savedTrack) {
      setCurrentTrack(JSON.parse(savedTrack));
    }
    if (savedVolume) {
      setVolume(parseInt(savedVolume));
    }
    if (savedQuery) {
      setSearchQuery(savedQuery);
    }
  }, []);

  // Save music state to localStorage
  useEffect(() => {
    if (currentTrack) {
      localStorage.setItem('currentTrack', JSON.stringify(currentTrack));
    }
  }, [currentTrack]);

  useEffect(() => {
    localStorage.setItem('musicVolume', volume.toString());
  }, [volume]);

  useEffect(() => {
    if (searchQuery) {
      localStorage.setItem('lastMusicSearch', searchQuery);
    }
  }, [searchQuery]);

  // Search for music
  const searchMusic = async (query) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsSearching(true);
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
        setSearchQuery(query);
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
      setIsSearching(false);
    }
  };

  // Play a track
  const playTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setError('');
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Stop music
  const stopMusic = () => {
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Set volume
  const changeVolume = (newVolume) => {
    setVolume(Math.max(0, Math.min(100, newVolume)));
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  // Clear search results
  const clearSearch = () => {
    setSearchResults([]);
    setSearchQuery('');
    setError('');
  };

  const value = {
    // State
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    searchQuery,
    searchResults,
    isSearching,
    error,
    
    // Actions
    searchMusic,
    playTrack,
    togglePlayPause,
    stopMusic,
    toggleMute,
    changeVolume,
    clearSearch,
    setSearchQuery,
    setError
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};

