import React from 'react';
import { Menu, MoreHorizontal } from 'lucide-react';

export default function PlayQueue({
  playlist,
  setPlaylist,
  currentTrack,
  isPlaying,
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
  setAutoplayEnabled
}) {
  return (
    <div className="card play-queue-card" style={{ height: 'auto', maxHeight: 'none' }}>
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
        <div className="lyrics-empty-state" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Queue is empty. Select files from Library.</div>
      ) : (
        <div className="mini-queue-list-scrollable" style={{ maxHeight: 'none', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
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
                      <div className="soundwave-icon" style={{ height: '10px', gap: '2px', display: 'flex', alignItems: 'flex-end' }}>
                        <span className="bar" style={{ width: '2px', height: '60%', background: 'var(--neon-cyan)' }}></span>
                        <span className="bar" style={{ width: '2px', height: '100%', background: 'var(--neon-cyan)' }}></span>
                        <span className="bar" style={{ width: '2px', height: '40%', background: 'var(--neon-cyan)' }}></span>
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

      <div className="queue-autoplay-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
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
  );
}
