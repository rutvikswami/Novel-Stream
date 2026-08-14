import React from 'react';
import {
  Disc,
  Heart,
  Shuffle,
  SkipBack,
  SkipForward,
  RotateCw,
  Pause,
  Play,
  Gauge,
  Volume2,
  VolumeX,
  ListMusic,
  X
} from 'lucide-react';

export default function BottomPlayer({
  currentTrack,
  isPlaying,
  togglePlay,
  currentTime,
  duration,
  handleScrub,
  formatTime,
  playPrev,
  playNext,
  playbackSpeed,
  setPlaybackSpeed,
  showSpeedPopover,
  setShowSpeedPopover,
  isMuted,
  setIsMuted,
  volume,
  setVolume,
  activeTab,
  setActiveTab
}) {
  return (
    <footer className="player-bar">
      {/* Left Section: Active Track details */}
      <div 
        className="player-track-info" 
        onClick={() => setActiveTab('player')} 
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
      >
        <div 
          className="player-thumbnail" 
          style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-cyan))', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Disc size={18} className={isPlaying ? 'animate-spin' : ''} />
        </div>
        <div className="player-track-details" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="player-track-name" style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            {currentTrack ? currentTrack.title : 'The Last Stand'}
          </span>
          <span className="player-track-author" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
            {currentTrack ? (currentTrack.subtitle || 'Chapter 1') : 'Chapter 12 • The Shadow Chronicles'}
          </span>
        </div>
        <button className="btn-footer-icon" style={{ marginLeft: '12px', color: 'var(--neon-cyan)' }} onClick={(e) => e.stopPropagation()}>
          <Heart size={14} fill="var(--neon-cyan)" />
        </button>
      </div>

      {/* Center Section: Media controls and scrubber */}
      <div className="player-controls-container">
        <div className="player-buttons">
          <button className="player-btn-circle" title="Shuffle"><Shuffle size={14} /></button>
          <button className="player-btn-circle" onClick={playPrev} title="Previous"><SkipBack size={14} /></button>
          <button className="player-btn-play" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={16} fill="#05070a" /> : <Play size={16} fill="#05070a" style={{ transform: 'translateX(1px)' }} />}
          </button>
          <button className="player-btn-circle" onClick={playNext} title="Next"><SkipForward size={14} /></button>
          <button className="player-btn-circle" title="Repeat"><RotateCw size={14} /></button>
        </div>

        <div className="player-timeline-wrapper">
          <span className="player-time-label">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => handleScrub(parseFloat(e.target.value))}
            className="player-scrubber"
          />
          <span className="player-time-label">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right Section: Volume & Playback Speed */}
      <div className="player-right-controls">
        <div className="speed-control-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
          <button
            className={`speed-select-btn ${showSpeedPopover ? 'active' : ''}`}
            title="Playback Speed"
            onClick={() => setShowSpeedPopover(!showSpeedPopover)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Gauge size={14} />
            {playbackSpeed.toFixed(2)}x
          </button>

          {showSpeedPopover && (
            <div className="speed-popover">
              <div className="speed-popover-header">
                <span>Speed Range</span>
                <button className="btn-close-mini" onClick={() => setShowSpeedPopover(false)}><X size={10} /></button>
              </div>
              <div className="speed-popover-body">
                <input
                  type="range"
                  min="0.25"
                  max="5.0"
                  step="0.25"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="speed-range-slider"
                />
                <div className="speed-popover-value">{playbackSpeed.toFixed(2)}x</div>
              </div>
            </div>
          )}
        </div>

        <div className="player-volume-wrapper">
          <button className="player-btn-circle" onClick={() => setIsMuted(!isMuted)} style={{ padding: 0 }}>
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              if (v > 0) setIsMuted(false);
            }}
            className="volume-slider"
          />
        </div>
        <button 
          className={`player-btn-circle ${activeTab === 'player' ? 'active-toggle' : ''}`} 
          onClick={() => setActiveTab('player')} 
          title="Show lyrics/subtitles"
        >
          <ListMusic size={16} />
        </button>
      </div>
    </footer>
  );
}
