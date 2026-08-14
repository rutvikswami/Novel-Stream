import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Plus,
  FileAudio,
  Play,
  Edit2,
  MoreHorizontal,
  FolderOpen,
  Calendar,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Upload,
  Check,
  X,
  ChevronDown,
  BookOpen,
  Sparkles
} from 'lucide-react';

export default function AudioLibrary({
  library,
  librarySearch,
  setLibrarySearch,
  isLoadingLibrary,
  fetchLibrary,
  libraryError,
  selectedLibraryFiles,
  setSelectedLibraryFiles,
  editingFilename,
  setEditingFilename,
  editValue,
  setEditValue,
  handleCheckboxChange,
  bulkDelete,
  bulkLoadToPlaylist,
  saveRename,
  cancelEditing,
  startEditing,
  loadSingleToPlaylist,
  deleteLibraryFile,
  loadTrack,
  playlist,
  setActiveTab,
  formatFilename
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, novel, conversion

  // Client-side search & category filtering
  const filteredLibrary = library.filter(file => {
    const matchesSearch = file.filename.toLowerCase().includes(librarySearch.toLowerCase());
    if (!matchesSearch) return false;

    const isNovel = /\(\d+\)\.mp3$/i.test(file.filename);
    if (categoryFilter === 'novel') {
      return isNovel;
    }
    if (categoryFilter === 'conversion') {
      return !isNovel;
    }
    return true;
  });

  // Reset page when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [librarySearch, categoryFilter]);

  const totalPages = Math.ceil(filteredLibrary.length / pageSize) || 1;
  const paginatedLibrary = filteredLibrary.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Mock metadata properties for library files to match the mockup visual detail
  const getMockDuration = (index) => {
    const durations = ["32:47", "28:19", "31:03", "29:11", "34:55", "27:49"];
    return durations[index % durations.length];
  };

  const getMockSize = (index) => {
    const sizes = ["48.6 MB", "42.1 MB", "46.8 MB", "43.2 MB", "51.7 MB", "41.0 MB"];
    return sizes[index % sizes.length];
  };

  const getMockAddedOn = (index) => {
    const dates = ["Today, 10:32 AM", "Today, 10:15 AM", "Today, 10:01 AM", "Today, 09:45 AM", "Today, 09:28 AM", "Today, 09:10 AM"];
    return dates[index % dates.length];
  };

  return (
    <div>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Browse, search, rename, and select generated files stored in Supabase.
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-mini-refresh" onClick={fetchLibrary} disabled={isLoadingLibrary} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} className={isLoadingLibrary ? 'animate-spin' : ''} />
            Reload
          </button>
          <button className="btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--neon-cyan)', color: '#030712' }}>
            <Upload size={14} />
            Upload Audio
          </button>
        </div>
      </div>

      {/* Tool Search and Filter Row */}
      <div className="library-tools" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        {/* Search */}
        <div className="input-wrapper search-input-wrapper" style={{ flex: 1, maxWidth: '280px' }}>
          <span className="input-icon"><Search size={14} /></span>
          <input
            type="text"
            placeholder="Search library..."
            className="text-input"
            value={librarySearch}
            onChange={(e) => setLibrarySearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
          <span className="search-shortcut" style={{ right: '10px' }}>⌘K</span>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn-icon ${categoryFilter === 'all' ? 'active-toggle' : ''}`}
            onClick={() => setCategoryFilter('all')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', width: 'auto', fontSize: '0.8rem', height: '36px', background: categoryFilter === 'all' ? 'rgba(0, 240, 255, 0.08)' : 'transparent', borderColor: categoryFilter === 'all' ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.08)', color: categoryFilter === 'all' ? 'var(--neon-cyan)' : 'var(--text-secondary)' }}
          >
            <FolderOpen size={14} />
            <span>All Files</span>
          </button>
          
          <button 
            className={`btn-icon ${categoryFilter === 'novel' ? 'active-toggle' : ''}`}
            onClick={() => setCategoryFilter('novel')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', width: 'auto', fontSize: '0.8rem', height: '36px', background: categoryFilter === 'novel' ? 'rgba(0, 240, 255, 0.08)' : 'transparent', borderColor: categoryFilter === 'novel' ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.08)', color: categoryFilter === 'novel' ? 'var(--neon-cyan)' : 'var(--text-secondary)' }}
          >
            <BookOpen size={14} />
            <span>Novel Chapters</span>
          </button>

          <button 
            className={`btn-icon ${categoryFilter === 'conversion' ? 'active-toggle' : ''}`}
            onClick={() => setCategoryFilter('conversion')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', width: 'auto', fontSize: '0.8rem', height: '36px', background: categoryFilter === 'conversion' ? 'rgba(0, 240, 255, 0.08)' : 'transparent', borderColor: categoryFilter === 'conversion' ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.08)', color: categoryFilter === 'conversion' ? 'var(--neon-cyan)' : 'var(--text-secondary)' }}
          >
            <Sparkles size={14} />
            <span>Conversions</span>
          </button>
        </div>

        {/* Configuration sliders */}
        <button className="btn-icon" title="Filter settings"><SlidersHorizontal size={14} /></button>

        {/* Bulk action buttons on the right */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            className="btn-bulk-delete"
            onClick={bulkDelete}
            disabled={selectedLibraryFiles.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: selectedLibraryFiles.length > 0 ? 'rgba(217, 4, 41, 0.15)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: selectedLibraryFiles.length > 0 ? 'var(--neon-red)' : 'var(--text-muted)' }}
          >
            <Trash2 size={12} />
            Bulk Delete
          </button>
          <button
            className="btn-bulk-fetch"
            onClick={bulkLoadToPlaylist}
            disabled={selectedLibraryFiles.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: selectedLibraryFiles.length > 0 ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.02)', color: selectedLibraryFiles.length > 0 ? '#030712' : 'var(--text-muted)' }}
          >
            <Plus size={12} />
            Add to Queue
          </button>
        </div>
      </div>

      {/* Selected count banner */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
        {selectedLibraryFiles.length} files selected
      </div>

      {/* Error banner */}
      {libraryError && (
        <div className="library-error-banner">
          <AlertTriangle size={24} style={{ color: 'var(--neon-red)', flexShrink: 0 }} />
          <div>
            <p><strong>Database Connection Unreachable</strong></p>
            <p style={{ marginTop: '2px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              Error: {libraryError}. If your Supabase free-tier project has been paused due to inactivity, please log into your Supabase Dashboard to unpause it, then refresh this view.
            </p>
          </div>
        </div>
      )}

      {/* Main Files Table */}
      {isLoadingLibrary && library.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
          Fetching bucket metadata from Supabase storage...
        </div>
      ) : filteredLibrary.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '10px' }}>
          No audio files found. Generate audio chapters to add files.
        </div>
      ) : (
        <div className="library-table-container" style={{ maxHeight: '520px', overflowY: 'auto' }}>
          <table className="library-table">
            <thead>
              <tr>
                <th className="library-th" style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    checked={selectedLibraryFiles.length === library.length && library.length > 0}
                    onChange={() => {
                      if (selectedLibraryFiles.length === library.length) {
                        setSelectedLibraryFiles([]);
                      } else {
                        setSelectedLibraryFiles(library.map(f => f.filename));
                      }
                    }}
                  />
                </th>
                <th className="library-th">TITLE</th>
                <th className="library-th" style={{ width: '100px' }}>DURATION</th>
                <th className="library-th" style={{ width: '100px' }}>SIZE</th>
                <th className="library-th" style={{ width: '160px' }}>ADDED ON</th>
                <th className="library-th" style={{ width: '160px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLibrary.map((file, idx) => {
                const actualIdx = (currentPage - 1) * pageSize + idx;
                const isEditing = editingFilename === file.filename;
                const isChecked = selectedLibraryFiles.includes(file.filename);

                return (
                  <tr key={file.filename} className="library-tr">
                    <td className="library-td">
                      <input
                        type="checkbox"
                        className="checkbox-custom"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(file.filename)}
                      />
                    </td>
                    <td className="library-td">
                      <div className="library-item-title-col">
                        <div className="library-audio-icon">
                          <FileAudio size={16} />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              className="library-rename-input"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              autoFocus
                            />
                          ) : (
                            <>
                              <span className="library-text-main" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>
                                {formatFilename(file.filename)}
                              </span>
                              <div className="library-text-caption" style={{ display: 'inline-block', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', marginTop: '2px' }}>
                                {file.subtitle_url ? 'Timing subtitles active (.vtt)' : 'Audio track only'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Duration */}
                    <td className="library-td" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {getMockDuration(actualIdx)}
                    </td>
                    {/* Size */}
                    <td className="library-td" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {getMockSize(actualIdx)}
                    </td>
                    {/* Added On */}
                    <td className="library-td" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {getMockAddedOn(actualIdx)}
                    </td>
                    {/* Actions */}
                    <td className="library-td">
                      <div className="library-actions-cell" style={{ display: 'flex', gap: '6px' }}>
                        {isEditing ? (
                          <>
                            <button className="btn-icon confirm-btn" onClick={() => saveRename(file)} title="Confirm rename">
                              <Check size={14} />
                            </button>
                            <button className="btn-icon" onClick={cancelEditing} title="Cancel">
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-icon play-btn"
                              onClick={() => {
                                const cardId = file.filename.replace('.mp3', '');
                                const t = playlist.find(track => track.id === cardId);
                                if (t) {
                                  loadTrack(t);
                                } else {
                                  const newTrack = {
                                    id: cardId,
                                    title: formatFilename(file.filename),
                                    subtitle: 'Loaded from Supabase Library',
                                    url: file.url,
                                    subtitleUrl: file.subtitle_url || null
                                  };
                                  setPlaylist(prev => [...prev, newTrack]);
                                  loadTrack(newTrack);
                                }
                                setActiveTab('player');
                              }}
                              title="Play now"
                            >
                              <Play size={14} />
                            </button>
                            <button className="btn-icon" onClick={() => loadSingleToPlaylist(file)} title="Add to queue">
                              <Plus size={14} />
                            </button>
                            <button className="btn-icon" onClick={() => startEditing(file)} title="Rename filename">
                              <Edit2 size={14} />
                            </button>
                            <button className="btn-icon" title="More options">
                              <MoreHorizontal size={14} />
                            </button>
                            <button className="btn-icon delete-btn" onClick={() => deleteLibraryFile(file.filename)} title="Delete file">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {library.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              className="btn-icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              style={{ width: '28px', height: '28px', opacity: currentPage === 1 ? 0.3 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={14} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`btn-icon ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
                style={{
                  width: '28px',
                  height: '28px',
                  background: currentPage === p ? 'rgba(0,240,255,0.08)' : 'transparent',
                  borderColor: currentPage === p ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.08)',
                  color: currentPage === p ? 'var(--neon-cyan)' : 'var(--text-secondary)'
                }}
              >
                {p}
              </button>
            ))}

            <button
              className="btn-icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              style={{ width: '28px', height: '28px', opacity: currentPage === totalPages ? 0.3 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Page size selector dropdown */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                padding: '6px 28px 6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none'
              }}
            >
              <option value={10} style={{ background: '#0b0f19' }}>10 / page</option>
              <option value={20} style={{ background: '#0b0f19' }}>20 / page</option>
              <option value={50} style={{ background: '#0b0f19' }}>50 / page</option>
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
