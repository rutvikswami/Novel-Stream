import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, librarySearch, setLibrarySearch }) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'player': return 'Now Playing';
      case 'queue': return 'Play Queue';
      case 'library': return 'Audio Library';
      case 'generate': return 'Generate Audio';
      case 'favorites': return 'My Favorites';
      case 'recently': return 'Recently Played';
      case 'completed': return 'Completed';
      default: return 'Novel Stream';
    }
  };

  const getTabDesc = () => {
    switch (activeTab) {
      case 'player': return 'High-quality audio streaming with time-synchronized captions.';
      case 'queue': return 'Manage your upcoming audiobook tracks and timing sequences.';
      case 'library': return 'Browse, search, rename, and select generated files stored in Supabase.';
      case 'generate': return 'Convert document text, webpages, or novel chapter sequences.';
      case 'favorites': return 'Your curated list of premium tracks.';
      case 'recently': return 'List of recently played audiobook files.';
      case 'completed': return 'Fully completed audiobook sequences.';
      default: return 'Novel audiobook tools.';
    }
  };

  return (
    <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="view-header-left">
        <h1 className="view-title">{getTabTitle()}</h1>
        <p className="view-desc">{getTabDesc()}</p>
      </div>
      <div className="view-header-right">
        <div className="search-bar-container">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search library..."
            className="search-input"
            value={librarySearch}
            onChange={(e) => {
              setLibrarySearch(e.target.value);
              if (activeTab !== 'library') setActiveTab('library');
            }}
          />
          <span className="search-shortcut">⌘K</span>
        </div>
      </div>
    </header>
  );
}
