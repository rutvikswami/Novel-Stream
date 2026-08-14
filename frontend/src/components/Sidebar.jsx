import React from 'react';
import {
  Headphones,
  Disc,
  Library,
  Sparkles,
  Plus,
  Heart,
  Clock,
  Check,
  Crown,
  Database
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, playlistCount, storageInfo }) {
  const { usedText, percentage } = storageInfo || { usedText: '0.0 MB / 50 GB', percentage: 0.1 };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Headphones size={24} className="logo-icon" />
        <span className="logo-text">Novel Stream</span>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeTab === 'player' ? 'active' : ''}`} 
          onClick={() => setActiveTab('player')}
        >
          <Disc size={18} />
          <span>Now Playing & Queue</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'library' ? 'active' : ''}`} 
          onClick={() => setActiveTab('library')}
        >
          <Library size={18} />
          <span>Audio Library</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'generate' ? 'active' : ''}`} 
          onClick={() => setActiveTab('generate')}
        >
          <Sparkles size={18} />
          <span>Generate Audio</span>
        </button>

        <div className="sidebar-section-title-row">
          <span className="sidebar-section-title">Playlists</span>
          <button className="sidebar-section-plus"><Plus size={12} /></button>
        </div>

        <button 
          className={`nav-item ${activeTab === 'favorites' ? 'active' : ''}`} 
          onClick={() => setActiveTab('favorites')}
        >
          <Heart size={18} />
          <span>My Favorites</span>
          <span className="nav-item-count">12</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'recently' ? 'active' : ''}`} 
          onClick={() => setActiveTab('recently')}
        >
          <Clock size={18} />
          <span>Recently Played</span>
          <span className="nav-item-count">28</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'completed' ? 'active' : ''}`} 
          onClick={() => setActiveTab('completed')}
        >
          <Check size={18} />
          <span>Completed</span>
          <span className="nav-item-count">34</span>
        </button>
      </nav>

      {/* Storage Used Card Widget */}
      <div className="storage-widget-card" style={{ background: 'rgba(22, 28, 45, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="storage-icon-box" style={{ background: 'rgba(0, 240, 255, 0.05)', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--neon-cyan)' }}>
            <Database size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)' }}>Storage Used</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{usedText}</span>
          </div>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--neon-cyan)', borderRadius: '3px', boxShadow: '0 0 8px var(--neon-cyan-glow)', transition: 'width 0.3s ease' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          <span>{percentage}%</span>
        </div>
      </div>

      {/* Go Premium Box */}
      <div className="upgrade-promo-card">
        <span className="upgrade-promo-title">
          <Crown size={16} style={{ color: 'var(--neon-cyan)' }} />
          Go Premium
        </span>
        <p className="upgrade-promo-desc">Unlock unlimited storage, faster generation and advanced features.</p>
        <button className="btn-upgrade">Upgrade Now</button>
      </div>
    </aside>
  );
}
