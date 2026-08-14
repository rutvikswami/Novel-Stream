import React from 'react';
import {
  Shuffle,
  SkipBack,
  SkipForward,
  RotateCw,
  Pause,
  Play,
  Heart,
  Bookmark,
  Download,
  MoreHorizontal,
  Info,
  Clock,
  ChevronRight,
  Headphones,
  Activity,
  Volume2,
  ListMusic,
  Menu
} from 'lucide-react';

export default function NowPlayingQueue({
  currentTrack,
  isPlaying,
  togglePlay,
  currentTime,
  duration,
  handleScrub,
  formatTime,
  playPrev,
  playNext,
  cues,
  playlist,
  setPlaylist,
  draggedIndex,
  setDraggedIndex,
  dragOverIndex,
  setDragOverIndex,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  handleDrop,
  loadTrack,
  autoplayEnabled,
  setAutoplayEnabled,
  playbackSpeed,
  setPlaybackSpeed,

  // Playback settings card states and functions
  sleepTimer,
  cycleSleepTimer,
  audioQuality,
  cycleAudioQuality,
  crossfade,
  cycleCrossfade,
  volumeBoost,
  toggleVolumeBoost
}) {
  return (
    <div className="dashboard-grid">
      {/* PANEL A: NOW PLAYING CARD */}
      <div className="card now-playing-card">
        <div className="card-header-row">
          <span className="section-title">NOW PLAYING</span>
          <div className="soundwave-icon">
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>
        </div>

        <div className="cover-art-container">
          <div className="castle-art-svg">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
              <defs>
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="50%" stopColor="#1e1b4b" />
                  <stop offset="100%" stopColor="#311042" />
                </linearGradient>
                <radialGradient id="moonGlow" cx="70%" cy="30%" r="40%">
                  <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="200" height="200" fill="url(#skyGrad)" />
              <circle cx="140" cy="60" r="20" fill="url(#moonGlow)" />
              <circle cx="140" cy="60" r="12" fill="#cbd5e1" />
              <path d="M0 200 L40 140 L70 160 L120 110 L160 150 L200 130 Z" fill="#020617" />
              <rect x="90" y="80" width="16" height="40" fill="#0f172a" />
              <polygon points="85,80 98,60 111,80" fill="#020617" />
              <rect x="110" y="90" width="12" height="30" fill="#0f172a" />
              <polygon points="107,90 116,75 125,90" fill="#020617" />
              <path d="M100 180 C95 180 93 175 95 170 C97 165 99 155 100 150 C101 155 103 165 105 170 C107 175 105 180 100 180 Z" fill="#0f172a" />
              <circle cx="100" cy="148" r="3" fill="#cbd5e1" />
            </svg>
          </div>
        </div>

        <div className="track-info-center">
          <span className="active-chapter-label" style={{ color: 'var(--neon-cyan)' }}>
            {currentTrack ? (currentTrack.subtitle || 'Chapter 1') : 'Chapter 12'}
          </span>
          <h2 className="active-track-title-large">
            {currentTrack ? currentTrack.title : 'The Last Stand'}
          </h2>
          <p className="active-track-author-large">
            The Shadow Chronicles by Aria Moon
          </p>
        </div>

        <div className="timeline-controls-block">
          <div className="timeline-slider-row">
            <span className="time-lbl">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => handleScrub(parseFloat(e.target.value))}
              className="player-scrubber scrubber-cyan"
              style={{ flex: 1 }}
            />
            <span className="time-lbl">{formatTime(duration)}</span>
          </div>

          <div className="playback-actions-row">
            <button className="btn-action-icon shuffle" title="Shuffle"><Shuffle size={16} /></button>
            <button className="btn-action-icon prev" onClick={playPrev} title="Previous"><SkipBack size={18} /></button>
            <button className="btn-action-play" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={20} fill="#fff" /> : <Play size={20} fill="#fff" style={{ transform: 'translateX(1px)' }} />}
            </button>
            <button className="btn-action-icon next" onClick={playNext} title="Next"><SkipForward size={18} /></button>
            <button className="btn-action-icon repeat" title="Repeat"><RotateCw size={16} /></button>
          </div>

          <div className="card-icons-footer">
            <button className="btn-footer-icon" title="Favorites"><Heart size={16} /></button>
            <button className="btn-footer-icon" title="Bookmark"><Bookmark size={16} /></button>
            <button className="btn-footer-icon" style={{ opacity: 0.25, cursor: 'not-allowed' }} title="Downloads disabled"><Download size={16} /></button>
            <button className="btn-footer-icon" title="Menu"><MoreHorizontal size={16} /></button>
          </div>
        </div>
      </div>

      {/* PANEL B: DETAILS & SETTINGS */}
      <div className="settings-stack">
        {/* Card B1: Dynamic Caption Timing */}
        <div className="card captions-card">
          <div className="card-header-row">
            <span className="section-title">DYNAMIC CAPTION TIMING</span>
            <Info size={14} style={{ color: 'var(--text-secondary)' }} />
          </div>

          <div className="captions-visualizer-container">
            {cues.length > 0 ? (
              <div className="lyrics-list-scrollable">
                {cues.map((cue, idx) => {
                  const isActive = currentTime >= cue.start && currentTime <= cue.end;
                  return (
                    <p
                      key={idx}
                      id={`lyric-line-${idx}`}
                      className={`lyric-line ${isActive ? 'active' : ''}`}
                      onClick={() => handleScrub(cue.start)}
                    >
                      {cue.text}
                    </p>
                  );
                })}
              </div>
            ) : (
              <div className="waveform-mockup-block">
                <div className="waveform-bars">
                  <span className="w-bar" style={{ height: '30%' }}></span>
                  <span className="w-bar" style={{ height: '45%' }}></span>
                  <span className="w-bar" style={{ height: '60%' }}></span>
                  <span className="w-bar" style={{ height: '75%' }}></span>
                  <span className="w-bar active" style={{ height: '90%' }}></span>
                  <span className="w-bar" style={{ height: '60%' }}></span>
                  <span className="w-bar" style={{ height: '40%' }}></span>
                  <span className="w-bar" style={{ height: '50%' }}></span>
                  <span className="w-bar" style={{ height: '25%' }}></span>
                </div>
                <p className="captions-hint">Captions will sync automatically during playback</p>
              </div>
            )}
          </div>
        </div>

        {/* Card B2: Playback Controls */}
        <div className="card controls-card-panel">
          <div className="card-header-row">
            <span className="section-title">PLAYBACK CONTROLS</span>
          </div>
          <div className="control-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {/* Sleep Timer */}
            <div className="control-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <div className="item-label-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.8rem' }}>Sleep Timer</span>
              </div>
              <div className="item-value-group" onClick={cycleSleepTimer} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>{sleepTimer}</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Audio Quality */}
            <div className="control-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <div className="item-label-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Headphones size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.8rem' }}>Audio Quality</span>
              </div>
              <div className="item-value-group" onClick={cycleAudioQuality} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>{audioQuality}</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Crossfade */}
            <div className="control-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <div className="item-label-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.8rem' }}>Crossfade</span>
              </div>
              <div className="item-value-group" onClick={cycleCrossfade} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>{crossfade}</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Volume Boost Toggle */}
            <div className="control-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <div className="item-label-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Volume2 size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.8rem' }}>Volume Boost</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={volumeBoost} onChange={toggleVolumeBoost} />
                <span className="slider-round"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Card B3: Playback Speed Presets */}
        <div className="card speed-presets-card">
          <div className="card-header-row">
            <span className="section-title">PLAYBACK SPEED</span>
            <span className="speed-active-status" style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', fontWeight: '600' }}>
              {playbackSpeed === 1.0 ? 'Normal' : `${playbackSpeed.toFixed(2)}x`}
            </span>
          </div>
          <div className="speed-preset-buttons" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '12px 0 8px' }}>
            {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                className={`speed-preset-btn ${playbackSpeed === speed ? 'active' : ''}`}
                onClick={() => setPlaybackSpeed(speed)}
                style={{ flex: 1, padding: '8px 0', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', textAlignment: 'center' }}
              >
                {speed.toFixed(2)}x
              </button>
            ))}
          </div>
          <p className="speed-footer-note" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Speed changes apply to current track</p>
        </div>
      </div>

      {/* PANEL C: PLAY QUEUE */}
      <div className="card play-queue-card">
        <div className="card-header-row flex-align-start">
          <div>
            <span className="section-title">PLAY QUEUE</span>
            <div className="queue-meta-text" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {playlist.length} tracks • 4h 28m
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="queue-header-btn" onClick={() => setPlaylist([])} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Clear</button>
            <button className="queue-header-btn" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><MoreHorizontal size={14} /></button>
          </div>
        </div>

        {playlist.length === 0 ? (
          <div className="lyrics-empty-state">Queue is empty. Select files from Library.</div>
        ) : (
          <div className="mini-queue-list-scrollable">
            {playlist.map((track, index) => {
              const isActive = currentTrack?.id === track.id;
              const isCardDragged = draggedIndex === index;
              const isCardOver = dragOverIndex === index;

              return (
                <div
                  key={track.id}
                  className={`queue-item-card ${isActive ? 'active' : ''} ${isCardDragged ? 'dragging' : ''} ${isCardOver ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => loadTrack(track)}
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'grab', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="queue-item-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <span className="queue-index-badge" style={{ width: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {isActive && isPlaying ? (
                        <div className="soundwave-icon" style={{ height: '10px', gap: '2px' }}>
                          <span className="bar" style={{ width: '2px', height: '60%' }}></span>
                          <span className="bar" style={{ width: '2px', height: '100%' }}></span>
                          <span className="bar" style={{ width: '2px', height: '40%' }}></span>
                        </div>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span className="library-text-main" style={{ color: isActive ? 'var(--neon-cyan)' : 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {track.title}
                      </span>
                      {isActive && <span className="now-playing-badge" style={{ fontSize: '0.65rem', color: 'var(--neon-cyan)', fontWeight: '600', textTransform: 'uppercase' }}>Now Playing</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="queue-track-duration" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>34:27</span>
                    <button className="btn-drag-handle" style={{ cursor: 'grab', background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                      <Menu size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="queue-autoplay-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="autoplay-text-block" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span className="autoplay-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Autoplay</span>
            <p className="autoplay-desc" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Automatically play next track</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={autoplayEnabled}
              onChange={(e) => setAutoplayEnabled(e.target.checked)}
            />
            <span className="slider-round"></span>
          </label>
        </div>
      </div>
    </div>
  );
}
