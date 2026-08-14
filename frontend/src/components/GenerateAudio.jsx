import React from 'react';
import {
  Link,
  BookOpen,
  Play,
  Square,
  Globe,
  Sparkles,
  FileText,
  UploadCloud,
  FileAudio,
  AlertTriangle,
  Check
} from 'lucide-react';

export default function GenerateAudio({
  activeSubTab,
  setActiveSubTab,
  novelUrl,
  setNovelUrl,
  startChap,
  setStartChap,
  endChap,
  setEndChap,
  currentChap,
  setCurrentChap,
  jobId,
  setJobId,
  jobStatus,
  setJobStatus,
  isCheckingJob,
  textInput,
  setTextInput,
  rawTitle,
  setRawTitle,
  rawSubtitle,
  setRawSubtitle,
  isGeneratingText,
  triggerConvertJob,
  triggerTextGeneration,
  handleFileChange,
  fileInputRef,
  uploadFile,
  isUploadingFile
}) {
  return (
    <div className="card shadow-panel">
      {/* Sub-tabs toggles */}
      <div className="sub-tabs">
        <button
          className={`sub-tab ${activeSubTab === 'novel' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('novel')}
        >
          <BookOpen size={14} />
          Scrape & Sync Novel Chapters
        </button>
        <button
          className={`sub-tab ${activeSubTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('text')}
        >
          <FileText size={14} />
          Convert Custom Text / Manuscript
        </button>
        <button
          className={`sub-tab ${activeSubTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('upload')}
        >
          <UploadCloud size={14} />
          Upload Subtitles/Audio
        </button>
      </div>

      <div className="sub-tab-content">
        {/* SUBTAB 1: Novel chapters pipeline scraper */}
        {activeSubTab === 'novel' && (
          <div className="tab-pane-content">
            <h3 className="section-subtitle">Scrape Chapter Ranges</h3>
            <p className="description-secondary">
              Provide the base URL of a web novel. The system will crawl each page, extract the text contents, generate natural-sounding voice track files, and align timings.
            </p>

            <div className="form-group">
              <label className="form-label">Base Novel URL</label>
              <div className="input-wrapper">
                <span className="input-icon"><Link size={14} /></span>
                <input
                  type="url"
                  placeholder="https://example-webnovel.com/book/seven-years/chapter-1"
                  className="text-input"
                  value={novelUrl}
                  onChange={(e) => setNovelUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-three">
              <div className="form-group">
                <label className="form-label">Current Chapter</label>
                <div className="input-wrapper">
                  <span className="input-icon"><BookOpen size={14} /></span>
                  <input
                    type="number"
                    min="1"
                    className="text-input"
                    value={currentChap}
                    style={{ paddingLeft: '36px' }}
                    onChange={(e) => setCurrentChap(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Start Chapter</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Play size={14} /></span>
                  <input
                    type="number"
                    min="1"
                    className="text-input"
                    value={startChap}
                    style={{ paddingLeft: '36px' }}
                    onChange={(e) => setStartChap(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">End Chapter</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Square size={12} /></span>
                  <input
                    type="number"
                    min="1"
                    className="text-input"
                    value={endChap}
                    style={{ paddingLeft: '36px' }}
                    onChange={(e) => setEndChap(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary btn-generate"
              onClick={triggerConvertJob}
              disabled={isCheckingJob || !novelUrl}
              style={{ marginTop: '12px' }}
            >
              {isCheckingJob ? (
                <>
                  <span className="spinner-mini animate-spin" />
                  Generating Speech Track & Timing Captions...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Initialize Audio Generation Job
                </>
              )}
            </button>

            {jobId && (
              <div className="job-status-card" style={{ marginTop: '20px' }}>
                <div className="job-status-header">
                  <span className="job-status-label">Job Active</span>
                  <span className="job-id-tag">ID: {jobId}</span>
                </div>
                <div className="job-status-body">
                  <div className="job-status-row">
                    <span className="status-dot animate-pulse-cyan" />
                    <span>Pipeline Progress: <strong>{jobStatus}</strong></span>
                  </div>
                  <p className="job-status-desc">
                    Scraping HTML, converting speech sentences, and synchronizing time offsets. Check Audio Library when complete.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: Custom Text / Manuscript Converter */}
        {activeSubTab === 'text' && (
          <div className="tab-pane-content">
            <h3 className="section-subtitle">Convert Custom Manuscript Text</h3>
            <p className="description-secondary">
              Paste copy-edited narrative sentences directly. The system converts raw text to standard audio files with aligned timing subtitles.
            </p>

            <div className="form-row-two" style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Audiobook Track Title</label>
                <input
                  type="text"
                  placeholder="Chapter 1: The Dark Forest"
                  className="text-input"
                  style={{ paddingLeft: '14px' }}
                  value={rawTitle}
                  onChange={(e) => setRawTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sub-title / Author Metadata</label>
                <input
                  type="text"
                  placeholder="The Chronicles of Gondor by Aria Moon"
                  className="text-input"
                  style={{ paddingLeft: '14px' }}
                  value={rawSubtitle}
                  onChange={(e) => setRawSubtitle(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Narrative Text Content</label>
              <textarea
                placeholder="Paste paragraph sentences here..."
                rows="8"
                className="textarea-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary btn-generate"
              onClick={triggerTextGeneration}
              disabled={isGeneratingText || !textInput || !rawTitle}
              style={{ marginTop: '12px' }}
            >
              {isGeneratingText ? (
                <>
                  <span className="spinner-mini animate-spin" />
                  Generating Speech Track...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Convert Text to Speech
                </>
              )}
            </button>
          </div>
        )}

        {/* SUBTAB 3: Local file manual uploading tool */}
        {activeSubTab === 'upload' && (
          <div className="tab-pane-content">
            <h3 className="section-subtitle">Manual Upload to Supabase Storage</h3>
            <p className="description-secondary">
              If you have locally pre-generated speech recordings (`.mp3`) and aligned timing subtitles (`.vtt`), drop them directly into the bucket storage folders.
            </p>

            <div 
              className="drag-drop-zone"
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '10px', padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', transition: 'all 0.2s', marginTop: '12px' }}
            >
              <UploadCloud size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '600' }}>Click to select media files</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>Accepts .mp3, .vtt formats</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".mp3,.vtt"
                style={{ display: 'none' }}
                multiple
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={uploadFile}
              disabled={isUploadingFile}
              style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
            >
              {isUploadingFile ? (
                <>
                  <span className="spinner-mini animate-spin" style={{ marginRight: '8px' }} />
                  Uploading assets to bucket storage...
                </>
              ) : (
                <>
                  <UploadCloud size={16} style={{ marginRight: '8px' }} />
                  Upload Selection
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
