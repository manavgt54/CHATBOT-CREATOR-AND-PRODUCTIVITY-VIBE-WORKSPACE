import React, { useState } from 'react';
import { useMusic } from '../contexts/MusicContext';
import styled from 'styled-components';

const MusicPlayerContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 15px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  z-index: 1001;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 0, 0, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
  }
`;

const PlayerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const PlayerTitle = styled.h4`
  margin: 0;
  font-size: 0.9rem;
  color: #ff0000;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const MinimizeButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  border-radius: 3px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const TrackInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const TrackThumbnail = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 5px;
  object-fit: cover;
`;

const TrackDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const TrackName = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
`;

const TrackArtist = styled.div`
  font-size: 0.7rem;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;

  &:hover {
    background: rgba(255, 0, 0, 0.3);
    transform: scale(1.1);
  }

  &.play-pause {
    background: #ff0000;
    font-size: 1rem;
    
    &:hover {
      background: #ff4444;
    }
  }
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 10px;
`;

const VolumeSlider = styled.input`
  flex: 1;
  height: 4px;
  background: #333;
  outline: none;
  border-radius: 2px;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: #ff0000;
    border-radius: 50%;
    cursor: pointer;
  }
`;

const SearchContainer = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #333;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.8rem;
  outline: none;
  margin-bottom: 8px;

  &::placeholder {
    color: #999;
  }

  &:focus {
    border-color: #ff0000;
  }
`;

const SearchButton = styled.button`
  width: 100%;
  padding: 8px;
  background: #ff0000;
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: #ff4444;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SearchResults = styled.div`
  max-height: 150px;
  overflow-y: auto;
  margin-top: 8px;
`;

const SearchResult = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-bottom: 4px;

  &:hover {
    background: rgba(255, 0, 0, 0.2);
  }
`;

const ResultThumbnail = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 4px;
  object-fit: cover;
`;

const ResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResultTitle = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
`;

const ResultChannel = styled.div`
  font-size: 0.6rem;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 0.7rem;
  text-align: center;
  margin-top: 5px;
`;

const NoMusicMessage = styled.div`
  text-align: center;
  color: #999;
  font-size: 0.8rem;
  padding: 20px;
`;

const MiniMusicPlayer = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    searchResults,
    isSearching,
    error,
    searchMusic,
    playTrack,
    togglePlayPause,
    stopMusic,
    toggleMute,
    changeVolume,
    clearSearch
  } = useMusic();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      await searchMusic(localSearchQuery);
    }
  };

  const handlePlayResult = (video) => {
    const track = {
      id: video.id.videoId,
      title: video.snippet.title,
      artist: video.snippet.channelTitle,
      thumbnail: video.snippet.thumbnails.medium.url,
      description: video.snippet.description
    };
    playTrack(track);
    clearSearch();
    setLocalSearchQuery('');
  };

  if (isMinimized) {
    return (
      <MusicPlayerContainer style={{ width: '60px', height: '60px', padding: '10px' }}>
        <PlayerHeader>
          <PlayerTitle>🎵</PlayerTitle>
          <MinimizeButton onClick={() => setIsMinimized(false)}>+</MinimizeButton>
        </PlayerHeader>
      </MusicPlayerContainer>
    );
  }

  return (
    <MusicPlayerContainer>
      <PlayerHeader>
        <PlayerTitle>🎵 Music Player</PlayerTitle>
        <MinimizeButton onClick={() => setIsMinimized(true)}>−</MinimizeButton>
      </PlayerHeader>

      {currentTrack ? (
        <>
          <TrackInfo>
            <TrackThumbnail src={currentTrack.thumbnail} alt={currentTrack.title} />
            <TrackDetails>
              <TrackName title={currentTrack.title}>{currentTrack.title}</TrackName>
              <TrackArtist title={currentTrack.artist}>{currentTrack.artist}</TrackArtist>
            </TrackDetails>
          </TrackInfo>

          <Controls>
            <ControlButton onClick={stopMusic} title="Stop">⏹️</ControlButton>
            <ControlButton 
              className="play-pause" 
              onClick={togglePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </ControlButton>
            <ControlButton onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? '🔇' : '🔊'}
            </ControlButton>
          </Controls>

          <VolumeContainer>
            <span>🔊</span>
            <VolumeSlider
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(parseInt(e.target.value))}
            />
            <span>{isMuted ? 0 : volume}%</span>
          </VolumeContainer>

          {currentTrack.id && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <iframe
                width="100%"
                height="80"
                src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1`}
                title={currentTrack.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: '8px' }}
              ></iframe>
            </div>
          )}
        </>
      ) : (
        <NoMusicMessage>
          No music playing
        </NoMusicMessage>
      )}

      <SearchContainer>
        <form onSubmit={handleSearch}>
          <SearchInput
            type="text"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="Search for music..."
            disabled={isSearching}
          />
          <SearchButton type="submit" disabled={isSearching || !localSearchQuery.trim()}>
            {isSearching ? '⏳' : '🔍'} Search
          </SearchButton>
        </form>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {searchResults.length > 0 && (
          <SearchResults>
            {searchResults.slice(0, 3).map((video) => (
              <SearchResult
                key={video.id.videoId}
                onClick={() => handlePlayResult(video)}
              >
                <ResultThumbnail src={video.snippet.thumbnails.default.url} alt={video.snippet.title} />
                <ResultInfo>
                  <ResultTitle title={video.snippet.title}>{video.snippet.title}</ResultTitle>
                  <ResultChannel title={video.snippet.channelTitle}>{video.snippet.channelTitle}</ResultChannel>
                </ResultInfo>
              </SearchResult>
            ))}
          </SearchResults>
        )}
      </SearchContainer>
    </MusicPlayerContainer>
  );
};

export default MiniMusicPlayer;

