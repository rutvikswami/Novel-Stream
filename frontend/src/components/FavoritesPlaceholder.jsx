import React from 'react';
import { Heart, Clock, Check } from 'lucide-react';

export default function FavoritesPlaceholder({ type }) {
  if (type === 'favorites') {
    return (
      <div className="card" style={{ padding: '60px 40px', textAlign: 'center', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
        <Heart size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-cyber)', fontWeight: '700', letterSpacing: '0.5px' }}>Your Favorites is Empty</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '320px', lineHeight: '1.4' }}>
          Tap the heart icon on any playing track or library entry to add it to your favorites playlist.
        </p>
      </div>
    );
  }

  if (type === 'recently') {
    return (
      <div className="card" style={{ padding: '60px 40px', textAlign: 'center', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
        <Clock size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-cyber)', fontWeight: '700', letterSpacing: '0.5px' }}>No Recently Played</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '320px', lineHeight: '1.4' }}>
          Tracks you play will appear here so you can easily jump back in.
        </p>
      </div>
    );
  }

  if (type === 'completed') {
    return (
      <div className="card" style={{ padding: '60px 40px', textAlign: 'center', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
        <Check size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-cyber)', fontWeight: '700', letterSpacing: '0.5px' }}>No Completed Audiobooks</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '320px', lineHeight: '1.4' }}>
          Keep listening! When you finish an audiobook chapter, it will show up here.
        </p>
      </div>
    );
  }

  return null;
}
