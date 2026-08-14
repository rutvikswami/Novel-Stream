import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { createClient } from '@supabase/supabase-js';
import { Disc, Library, Sparkles, ListMusic } from 'lucide-react';

// Subcomponents
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomPlayer from './components/BottomPlayer';
import NowPlayingQueue from './components/NowPlayingQueue';
import PlayQueue from './components/PlayQueue';
import AudioLibrary from './components/AudioLibrary';
import GenerateAudio from './components/GenerateAudio';
import FavoritesPlaceholder from './components/FavoritesPlaceholder';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;


// Bulletproof API URL resolution for local React development & Vercel
const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
  if (isLocal) {
    return 'http://localhost:8000';
  }
  return window.location.origin;
};
const API_BASE = getApiBase();

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('player'); // player, library, generate, queue

  // Forms State
  const [baseUrl, setBaseUrl] = useState('');
  const [currentChapter, setCurrentChapter] = useState('');
  const [startChapter, setStartChapter] = useState('');
  const [endChapter, setEndChapter] = useState('');
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);

  // Generate Audio Component States
  const [activeSubTab, setActiveSubTab] = useState('novel'); // novel, text, upload
  const [novelUrl, setNovelUrl] = useState('');
  const [startChap, setStartChap] = useState(1);
  const [endChap, setEndChap] = useState(1);
  const [currentChap, setCurrentChap] = useState(1);
  const [jobId, setJobId] = useState(null);
  const [isCheckingJob, setIsCheckingJob] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [rawTitle, setRawTitle] = useState('');
  const [rawSubtitle, setRawSubtitle] = useState('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [singleUrl, setSingleUrl] = useState('');
  const [isConvertingUrl, setIsConvertingUrl] = useState(false);
  const [urlConvertStatus, setUrlConvertStatus] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [isConvertingDoc, setIsConvertingDoc] = useState(false);
  const [docConvertStatus, setDocConvertStatus] = useState('');
  const fileInputRef = useRef(null);

  // Web Audio refs for volume boost & audio quality filter
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const filterNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);

  // Global Audio Player States
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  // Synced Captions (Lyrics)
  const [cues, setCues] = useState([]);
  const [activeCaption, setActiveCaption] = useState('');

  // Playlist Queue
  const [playlist, setPlaylist] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Library Store
  const [library, setLibrary] = useState([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryError, setLibraryError] = useState('');
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [selectedLibraryFiles, setSelectedLibraryFiles] = useState([]);
  const [editingFilename, setEditingFilename] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showSpeedPopover, setShowSpeedPopover] = useState(false);

  // Playback settings card states
  const [sleepTimer, setSleepTimer] = useState("Off");
  const [audioQuality, setAudioQuality] = useState("High");
  const [crossfade, setCrossfade] = useState("3 sec");
  const [volumeBoost, setVolumeBoost] = useState(true);

  // Cycle handlers for setting switches
  const cycleSleepTimer = () => {
    const options = ["Off", "15 min", "30 min", "60 min"];
    const next = (options.indexOf(sleepTimer) + 1) % options.length;
    setSleepTimer(options[next]);
  };

  const cycleAudioQuality = () => {
    const options = ["High", "Standard", "Data Saver"];
    const next = (options.indexOf(audioQuality) + 1) % options.length;
    setAudioQuality(options[next]);
  };

  const cycleCrossfade = () => {
    const options = ["Off", "3 sec", "5 sec", "12 sec"];
    const next = (options.indexOf(crossfade) + 1) % options.length;
    setCrossfade(options[next]);
  };

  const toggleVolumeBoost = () => {
    setVolumeBoost(!volumeBoost);
  };

  // const audioRef = useRef(null);
  const audioRef = useRef(null);
  const sleepTimerRef = useRef(null);

  // Setup Web Audio API gain and filter graph
  const setupAudioGraph = () => {
    if (!audioRef.current) return;
    if (audioContextRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      const source = ctx.createMediaElementSource(audioRef.current);
      const filterNode = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      filterNode.type = 'lowpass';
      filterNode.frequency.value = 20000;

      source.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(ctx.destination);

      audioContextRef.current = ctx;
      filterNodeRef.current = filterNode;
      gainNodeRef.current = gainNode;
      sourceNodeRef.current = source;

      // Apply initial state values
      gainNode.gain.value = volumeBoost ? 1.8 : 1.0;
      if (audioQuality === "Data Saver") {
        filterNode.frequency.setValueAtTime(6000, ctx.currentTime);
      } else if (audioQuality === "Standard") {
        filterNode.frequency.setValueAtTime(11000, ctx.currentTime);
      } else {
        filterNode.frequency.setValueAtTime(20000, ctx.currentTime);
      }
    } catch (err) {
      console.warn("Failed to initialize AudioGraph:", err);
    }
  };

  // Sync volume boost state
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volumeBoost ? 1.8 : 1.0;
    }
  }, [volumeBoost]);

  // Sync audio quality filter state
  useEffect(() => {
    if (filterNodeRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;
      if (audioQuality === "Data Saver") {
        filterNodeRef.current.frequency.setValueAtTime(6000, ctx.currentTime);
      } else if (audioQuality === "Standard") {
        filterNodeRef.current.frequency.setValueAtTime(11000, ctx.currentTime);
      } else {
        filterNodeRef.current.frequency.setValueAtTime(20000, ctx.currentTime);
      }
    }
  }, [audioQuality]);

  // Scraper & TTS Pipeline job trigger
  const triggerConvertJob = async () => {
    if (!novelUrl || !currentChap || !startChap || !endChap) {
      alert('Please fill in all Audiobook Job parameters.');
      return;
    }
    setIsCheckingJob(true);
    try {
      const response = await fetch(
        `${API_BASE}/create-job?base_url=${encodeURIComponent(novelUrl)}&current_chapter=${currentChap}&start=${startChap}&end=${endChap}`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (data.job_id) {
        setJobId(data.job_id);
        setCurrentJobId(data.job_id);
        setJobStatus({
          status: 'running',
          completed: [],
          total: endChap - startChap + 1,
          audio_files: {},
          subtitles_files: {}
        });
        setActiveTab('player'); // Switch to main screen to see progress
      } else {
        alert('Failed to initialize job.');
      }
    } catch (err) {
      console.error(err);
      alert('Error starting audiobook job.');
    } finally {
      setIsCheckingJob(false);
    }
  };

  // Convert Custom Text / Manuscript handler
  const triggerTextGeneration = async () => {
    if (!textInput || !rawTitle) {
      alert('Please enter title and narrative content.');
      return;
    }
    setIsGeneratingText(true);
    try {
      const response = await fetch(`${API_BASE}/convert-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textInput,
          title: rawTitle,
          subtitle: rawSubtitle
        })
      });
      const data = await response.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else if (data.url) {
        const tempId = data.filename.replace('.mp3', '');
        const newTrack = {
          id: tempId,
          title: data.title,
          subtitle: rawSubtitle || 'Text conversion',
          url: data.url,
          subtitleUrl: data.subtitle_url || null
        };
        setPlaylist(prev => [...prev, newTrack]);
        loadTrack(newTrack);
        setTextInput('');
        setRawTitle('');
        setRawSubtitle('');
        fetchLibrary();
        setActiveTab('player');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to convert text.');
    } finally {
      setIsGeneratingText(false);
    }
  };

  // Manual File Upload handler
  const uploadFile = async () => {
    if (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) {
      alert("Please select files first.");
      return;
    }
    setIsUploadingFile(true);
    try {
      const files = fileInputRef.current.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE}/upload-file`, {
          method: "POST",
          body: formData
        });
        const data = await response.json();
        if (data.error) {
          alert(`Failed to upload ${file.name}: ${data.error}`);
        }
      }
      alert("Files uploaded successfully.");
      fetchLibrary();
      setActiveTab('library');
    } catch (err) {
      console.error(err);
      alert("Error uploading files.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Load library initially
  useEffect(() => {
    fetchLibrary();
  }, []);

  // Poll active background scraper job
  useEffect(() => {
    let timer;
    if (currentJobId && jobStatus?.status === 'running') {
      timer = setTimeout(pollJobStatus, 3000);
    }
    return () => clearTimeout(timer);
  }, [currentJobId, jobStatus]);

  // Synchronize playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, currentTrack]);

  // Sync volume state to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Apple Music-style lyrics scrolling synchronization
  useEffect(() => {
    const activeIndex = cues.findIndex(c => currentTime >= c.start && currentTime <= c.end);
    if (activeIndex !== -1) {
      const el = document.getElementById(`lyric-line-${activeIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, cues]);

  // Sleep Timer
  useEffect(() => {
    // Clear any existing sleep timer
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    // If timer is Off, do nothing
    if (sleepTimer === "Off") {
      return;
    }

    // Convert "15 min", "30 min", "60 min" to minutes
    const minutes = parseInt(sleepTimer, 10);

    if (isNaN(minutes)) {
      return;
    }

    // Start the timer
    sleepTimerRef.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      setIsPlaying(false);

      // Reset the sleep timer after it fires
      setSleepTimer("Off");

      sleepTimerRef.current = null;
    }, minutes * 60 * 1000);

    // Cleanup when timer changes or component unmounts
    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }
    };
  }, [sleepTimer]);

  const formatFilename = (name) => {
    return name.replace(/\.mp3$/i, '');
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- API OPERATIONS ---

  // 1. Scraper Job Control
  const createJob = async () => {
    if (!baseUrl || !currentChapter || !startChapter || !endChapter) {
      alert('Please fill in all Audiobook Job parameters.');
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/create-job?base_url=${encodeURIComponent(baseUrl)}&current_chapter=${currentChapter}&start=${startChapter}&end=${endChapter}`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (data.job_id) {
        setCurrentJobId(data.job_id);
        setJobStatus({ status: 'running', completed: [], total: endChapter - startChapter + 1, audio_files: {}, subtitles_files: {} });
        setActiveTab('player'); // Switch to main screen to see progress
      } else {
        alert('Failed to initialize job.');
      }
    } catch (err) {
      console.error(err);
      alert('Error starting audiobook job.');
    }
  };

  const pollJobStatus = async () => {
    if (!currentJobId) return;
    try {
      const response = await fetch(`${API_BASE}/job/${currentJobId}`);
      const data = await response.json();
      if (data.error) {
        console.warn('Job poll error:', data.error);
        return;
      }
      setJobStatus(data);

      const novelTitle = 'novel';
      const audioFiles = data.audio_files || {};
      const subtitlesFiles = data.subtitles_files || {};

      Object.keys(audioFiles).forEach(ch => {
        const trackId = `${novelTitle}_${ch}`;
        if (!playlist.some(t => t.id === trackId)) {
          const audioUrl = audioFiles[ch];
          const subtitleUrl = subtitlesFiles[ch] || null;
          const displayTitle = formatFilename(audioUrl.split('/').pop());

          const newTrack = {
            id: trackId,
            title: displayTitle,
            subtitle: `Chapter ${ch} (Scraped Live)`,
            url: audioUrl,
            subtitleUrl: subtitleUrl
          };

          setPlaylist(prev => [...prev, newTrack]);

          // If no track is playing, play the first generated chapter automatically
          if (!currentTrack) {
            loadTrack(newTrack);
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const pauseJob = async () => {
    await fetch(`${API_BASE}/pause-job/${currentJobId}`, { method: 'POST' });
    pollJobStatus();
  };

  const resumeJob = async () => {
    await fetch(`${API_BASE}/resume-job/${currentJobId}`, { method: 'POST' });
    pollJobStatus();
  };

  const stopJob = async () => {
    if (confirm('Are you sure you want to stop this audiobook generation job?')) {
      await fetch(`${API_BASE}/stop-job/${currentJobId}`, { method: 'POST' });
      pollJobStatus();
    }
  };

  // 2. Single URL Converter
  const convertSingleUrl = async () => {
    if (!singleUrl) {
      alert('Please enter a valid webpage URL.');
      return;
    }
    setIsConvertingUrl(true);
    setUrlConvertStatus('Converting webpage to speech...');
    try {
      const response = await fetch(`${API_BASE}/convert-url?url=${encodeURIComponent(singleUrl)}`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
        setUrlConvertStatus('Failed to convert URL.');
      } else if (data.url) {
        setUrlConvertStatus('Complete! Loading to player...');
        const tempId = data.filename.replace('.mp3', '');
        const newTrack = {
          id: tempId,
          title: data.title,
          subtitle: 'Webpage conversion',
          url: data.url,
          subtitleUrl: data.subtitle_url || null
        };
        setPlaylist(prev => [...prev, newTrack]);
        loadTrack(newTrack);
        setSingleUrl('');
        fetchLibrary();
        setActiveTab('player');
        setTimeout(() => setUrlConvertStatus(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Connection failed.');
      setUrlConvertStatus('');
    } finally {
      setIsConvertingUrl(false);
    }
  };

  // 3. Document Converter
  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const convertDocument = async () => {
    if (!selectedFile) {
      alert('Please select or drop a file to upload.');
      return;
    }
    setIsConvertingDoc(true);
    setDocConvertStatus('Extracting text and generating speech...');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE}/convert-doc`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
        setDocConvertStatus('Failed to convert document.');
      } else if (data.url) {
        setDocConvertStatus('Complete! Loading to player...');
        const tempId = data.filename.replace('.mp3', '');
        const newTrack = {
          id: tempId,
          title: data.title,
          subtitle: 'Document conversion',
          url: data.url,
          subtitleUrl: data.subtitle_url || null
        };
        setPlaylist(prev => [...prev, newTrack]);
        loadTrack(newTrack);
        setSelectedFile(null);
        fetchLibrary();
        setActiveTab('player');
        setTimeout(() => setDocConvertStatus(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Connection failed.');
      setDocConvertStatus('');
    } finally {
      setIsConvertingDoc(false);
    }
  };

  // 4. Fetch Supabase Storage Files via Direct SDK or Backend Fallback
  const fetchLibrary = async () => {
    setIsLoadingLibrary(true);
    setLibraryError('');
    try {
      if (supabase) {
        // Fetch files directly from Supabase Storage
        const { data: files, error } = await supabase.storage.from("audio_files").list("", {
          limit: 100
        });
        if (error) throw error;

        // Build a set of all .vtt files for quick lookup
        const vttFiles = new Set(
          (files || [])
            .map(f => f.name)
            .filter(name => name && name.endsWith('.vtt'))
        );

        // Filter and format as audio library files
        const audioFiles = (files || [])
          .filter(f => f.name && f.name.endsWith('.mp3'))
          .map(f => {
            const name = f.name;
            const publicUrl = supabase.storage.from("audio_files").getPublicUrl(name).data.publicUrl;
            const vttName = name.replace('.mp3', '.vtt');
            const vttUrl = vttFiles.has(vttName)
              ? supabase.storage.from("audio_files").getPublicUrl(vttName).data.publicUrl
              : null;
            
            const metadata = f.metadata || {};
            const size = metadata.size || 0;
            const createdAt = f.created_at || '';

            return {
              filename: name,
              url: publicUrl,
              subtitle_url: vttUrl,
              size: size,
              created_at: createdAt
            };
          });

        // Natural sort helper function
        const naturalSort = (a, b) => {
          const parse = (str) => str.split(/(\d+)/).map(text => {
            const num = parseInt(text, 10);
            return isNaN(num) ? text.toLowerCase() : num;
          });
          const partsA = parse(a.filename);
          const partsB = parse(b.filename);
          for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            if (partsA[i] === undefined) return -1;
            if (partsB[i] === undefined) return 1;
            if (partsA[i] !== partsB[i]) {
              return partsA[i] < partsB[i] ? -1 : 1;
            }
          }
          return 0;
        };

        audioFiles.sort(naturalSort);
        setLibrary(audioFiles);
      } else {
        // Fallback to backend API
        const response = await fetch(`${API_BASE}/bucket-files`);
        const data = await response.json();
        if (data.error) {
          setLibraryError(data.error);
          setLibrary([]);
        } else {
          setLibrary(data);
        }
      }
    } catch (err) {
      console.error('Error fetching library:', err);
      setLibraryError(err.message || 'Failed to fetch library files.');
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  // Helper to update local states after rename
  const updateLocalStateAfterRename = (oldName, newName) => {
    // Update library list
    setLibrary(prev => prev.map(item => {
      if (item.filename === oldName) {
        const updatedUrl = item.url.replace(encodeURIComponent(oldName), encodeURIComponent(newName));
        const updatedSubtitleUrl = item.subtitle_url
          ? item.subtitle_url.replace(
            encodeURIComponent(oldName.replace('.mp3', '.vtt')),
            encodeURIComponent(newName.replace('.mp3', '.vtt'))
          )
          : null;
        return {
          ...item,
          filename: newName,
          url: updatedUrl,
          subtitle_url: updatedSubtitleUrl
        };
      }
      return item;
    }));

    // Update playlist queue
    setPlaylist(prev => prev.map(item => {
      const cardId = oldName.replace('.mp3', '');
      if (item.id === cardId) {
        const newCardId = newName.replace('.mp3', '');
        const updatedUrl = item.url.replace(encodeURIComponent(oldName), encodeURIComponent(newName));
        const updatedSubtitleUrl = item.subtitleUrl
          ? item.subtitleUrl.replace(
            encodeURIComponent(oldName.replace('.mp3', '.vtt')),
            encodeURIComponent(newName.replace('.mp3', '.vtt'))
          )
          : null;

        const updatedTrack = {
          ...item,
          id: newCardId,
          title: newName.replace('.mp3', ''),
          url: updatedUrl,
          subtitleUrl: updatedSubtitleUrl
        };

        // If it is the current track, sync active player info
        if (currentTrack?.id === cardId) {
          setCurrentTrack(updatedTrack);
        }

        return updatedTrack;
      }
      return item;
    }));

    setEditingFilename(null);
  };

  // Helper to update local states after delete
  const updateLocalStateAfterDelete = (filename) => {
    setLibrary(prev => prev.filter(f => f.filename !== filename));
    const cardId = filename.replace('.mp3', '');
    setPlaylist(prev => prev.filter(t => t.id !== cardId));
    if (currentTrack?.id === cardId) {
      if (audioRef.current) audioRef.current.pause();
      setCurrentTrack(null);
      setIsPlaying(false);
      setActiveCaption('');
      setCues([]);
    }
    setSelectedLibraryFiles(prev => prev.filter(f => f !== filename));
  };

  // Helper to update local states after bulk delete
  const updateLocalStateAfterBulkDelete = (filenames) => {
    setLibrary(prev => prev.filter(f => !filenames.includes(f.filename)));
    const cardIds = filenames.map(fn => fn.replace('.mp3', ''));
    setPlaylist(prev => prev.filter(t => !cardIds.includes(t.id)));
    if (cardIds.includes(currentTrack?.id)) {
      if (audioRef.current) audioRef.current.pause();
      setCurrentTrack(null);
      setIsPlaying(false);
      setActiveCaption('');
      setCues([]);
    }
    setSelectedLibraryFiles([]);
  };

  // 5. In-place Rename (CRUD Update)
  const startEditing = (file) => {
    setEditingFilename(file.filename);
    setEditValue(formatFilename(file.filename));
  };

  const cancelEditing = () => {
    setEditingFilename(null);
    setEditValue('');
  };

  const saveRename = async (file) => {
    if (!editValue.trim()) {
      alert('Filename cannot be empty.');
      return;
    }
    const cleanNewName = editValue.trim() + '.mp3';
    if (cleanNewName === file.filename) {
      cancelEditing();
      return;
    }
    try {
      if (supabase) {
        // Rename MP3 file via Supabase Storage directly
        const { error: moveError } = await supabase.storage.from("audio_files").move(file.filename, cleanNewName);
        if (moveError) throw moveError;

        // Try database update (best-effort)
        try {
          await supabase.from("audio_cleanup").update({ filename: cleanNewName }).eq("filename", file.filename);
        } catch (dbErr) {
          console.warn("DB audio_cleanup update failed:", dbErr);
        }

        // Rename VTT file if it exists
        const oldVtt = file.filename.replace('.mp3', '.vtt');
        const newVtt = cleanNewName.replace('.mp3', '.vtt');
        try {
          const { data: vttFiles } = await supabase.storage.from("audio_files").list("", {
            limit: 100
          });
          if (vttFiles && vttFiles.some(f => f.name === oldVtt)) {
            await supabase.storage.from("audio_files").move(oldVtt, newVtt);
            try {
              await supabase.from("audio_cleanup").update({ filename: newVtt }).eq("filename", oldVtt);
            } catch (dbErr) {
              console.warn("DB audio_cleanup VTT update failed:", dbErr);
            }
          }
        } catch (vttErr) {
          console.warn("VTT rename check failed:", vttErr);
        }

        updateLocalStateAfterRename(file.filename, cleanNewName);
      } else {
        // Fallback to backend API
        const response = await fetch(`${API_BASE}/bucket-file/rename`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            old_filename: file.filename,
            new_filename: cleanNewName
          })
        });
        const data = await response.json();
        if (data.status === 'success') {
          updateLocalStateAfterRename(file.filename, cleanNewName);
        } else {
          alert('Rename failed: ' + (data.error || 'Unknown error'));
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to rename: ' + err.message);
    }
  };

  // 6. Delete File (CRUD Delete)
  const deleteLibraryFile = async (filename) => {
    if (!confirm(`Are you sure you want to delete "${formatFilename(filename)}" from library?`)) {
      return;
    }
    try {
      if (supabase) {
        // Delete MP3 and corresponding VTT directly from Supabase Storage
        const filesToDelete = [filename, filename.replace('.mp3', '.vtt')];
        const { error: removeError } = await supabase.storage.from("audio_files").remove(filesToDelete);
        if (removeError) throw removeError;

        // Try database cleanup (best-effort)
        try {
          await supabase.from("audio_cleanup").delete().in("filename", filesToDelete);
        } catch (dbErr) {
          console.warn("DB audio_cleanup delete failed:", dbErr);
        }

        updateLocalStateAfterDelete(filename);
      } else {
        // Fallback to backend API
        const response = await fetch(`${API_BASE}/bucket-file/${encodeURIComponent(filename)}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.status === 'deleted') {
          updateLocalStateAfterDelete(filename);
        } else {
          alert('Delete failed: ' + (data.error || 'Unknown error'));
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete file: ' + err.message);
    }
  };

  // Bulk Actions
  const handleCheckboxChange = (filename) => {
    setSelectedLibraryFiles(prev =>
      prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
    );
  };

  const bulkDelete = async () => {
    if (selectedLibraryFiles.length === 0) return;
    if (!confirm(`Delete all ${selectedLibraryFiles.length} selected files from storage?`)) return;

    try {
      if (supabase) {
        // Prepare list of files to delete (MP3 and VTT)
        const filesToDelete = [];
        selectedLibraryFiles.forEach(fn => {
          filesToDelete.push(fn);
          filesToDelete.push(fn.replace('.mp3', '.vtt'));
        });

        // Delete directly from Supabase Storage
        const { error: removeError } = await supabase.storage.from("audio_files").remove(filesToDelete);
        if (removeError) throw removeError;

        // Try database cleanup (best-effort)
        try {
          await supabase.from("audio_cleanup").delete().in("filename", filesToDelete);
        } catch (dbErr) {
          console.warn("DB audio_cleanup bulk delete failed:", dbErr);
        }

        updateLocalStateAfterBulkDelete(selectedLibraryFiles);
      } else {
        // Fallback to backend API
        const response = await fetch(`${API_BASE}/bucket-files/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filenames: selectedLibraryFiles })
        });
        const data = await response.json();
        if (data.status === 'deleted') {
          updateLocalStateAfterBulkDelete(selectedLibraryFiles);
        } else {
          alert('Bulk delete failed: ' + (data.error || 'Unknown error'));
        }
      }
    } catch (err) {
      console.error(err);
      alert('Bulk delete failed: ' + err.message);
    }
  };

  const loadSingleToPlaylist = (file) => {
    const cardId = file.filename.replace('.mp3', '');
    if (!playlist.some(t => t.id === cardId)) {
      const newTrack = {
        id: cardId,
        title: formatFilename(file.filename),
        subtitle: 'Loaded from Supabase Library',
        url: file.url,
        subtitleUrl: file.subtitle_url || null
      };
      setPlaylist(prev => [...prev, newTrack]);
      if (!currentTrack) {
        loadTrack(newTrack);
      }
    }
  };

  const bulkLoadToPlaylist = () => {
    if (selectedLibraryFiles.length === 0) return;
    const addedTracks = [];
    selectedLibraryFiles.forEach(filename => {
      const file = library.find(f => f.filename === filename);
      if (file) {
        const cardId = file.filename.replace('.mp3', '');
        if (!playlist.some(t => t.id === cardId)) {
          addedTracks.push({
            id: cardId,
            title: formatFilename(file.filename),
            subtitle: 'Loaded from Supabase Library',
            url: file.url,
            subtitleUrl: file.subtitle_url || null
          });
        }
      }
    });
    if (addedTracks.length > 0) {
      setPlaylist(prev => [...prev, ...addedTracks]);
      if (!currentTrack) {
        loadTrack(addedTracks[0]);
      }
    }
    setSelectedLibraryFiles([]);
    setActiveTab('queue'); // Open queue
  };

  // --- AUDIO MEDIA PLAYER CORE CONTROLS ---

  const loadTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setActiveCaption('');
    setCues([]);

    if (track.subtitleUrl) {
      fetchAndParseSubtitles(track.subtitleUrl);
    }

    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().catch(err => console.warn('Playback error:', err));
    }
  };

  const togglePlay = () => {
    if (!currentTrack) {
      if (playlist.length > 0) {
        loadTrack(playlist[0]);
      } else if (library.length > 0) {
        const file = library[0];
        const cardId = file.filename.replace('.mp3', '');
        const newTrack = {
          id: cardId,
          title: formatFilename(file.filename),
          subtitle: 'Loaded from Supabase Library',
          url: file.url,
          subtitleUrl: file.subtitle_url || null
        };
        setPlaylist([newTrack]);
        loadTrack(newTrack);
      }
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.warn(err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleScrub = (val) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    const index = playlist.findIndex(t => t.id === currentTrack?.id);
    if (index !== -1 && index < playlist.length - 1) {
      loadTrack(playlist[index + 1]);
    } else if (index === playlist.length - 1) {
      // Loop queue back to the first track
      loadTrack(playlist[0]);
    }
  };

  const playPrev = () => {
    if (playlist.length === 0) return;
    const index = playlist.findIndex(t => t.id === currentTrack?.id);
    if (index > 0) {
      loadTrack(playlist[index - 1]);
    } else if (index === 0) {
      // Loop queue back to the last track
      loadTrack(playlist[playlist.length - 1]);
    }
  };

  const handleAudioEnded = () => {
    if (autoplayEnabled) {
      playNext();
    } else {
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = (e) => {
    const time = e.target.currentTime;
    setCurrentTime(time);

    // Sync active caption text
    const active = cues.find(c => time >= c.start && time <= c.end);
    setActiveCaption(active ? active.text : '');

    // Crossfade volume adjustments (Single HTML5 Audio element simulation)
    if (audioRef.current && crossfade !== "Off") {
      const fadeSecs = parseInt(crossfade, 10);
      if (!isNaN(fadeSecs) && duration > 0) {
        if (time >= duration - fadeSecs) {
          const timeLeft = duration - time;
          const factor = Math.max(0, Math.min(1, timeLeft / fadeSecs));
          audioRef.current.volume = factor * volume * (isMuted ? 0 : 1);
        } else if (time < fadeSecs) {
          const factor = Math.max(0, Math.min(1, time / fadeSecs));
          audioRef.current.volume = factor * volume * (isMuted ? 0 : 1);
        } else {
          audioRef.current.volume = isMuted ? 0 : volume;
        }
      }
    }
  };

  const fetchAndParseSubtitles = async (subtitleUrl) => {
    try {
      const response = await fetch(subtitleUrl);
      const text = await response.text();
      const parsedCues = parseVTT(text);
      setCues(parsedCues);
    } catch (err) {
      console.warn('Subtitles fetch error:', err);
      setCues([]);
      setActiveCaption('');
    }
  };

  const parseVTT = (vttText) => {
    const lines = vttText.split(/\r?\n/);
    const parsedCues = [];
    let currentCue = null;
    const timeRegex = /^(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/;

    const parseTime = (timeStr) => {
      const parts = timeStr.replace(',', '.').split(':');
      const secondsParts = parts[2].split('.');
      const hrs = parseInt(parts[0], 10);
      const mins = parseInt(parts[1], 10);
      const secs = parseInt(secondsParts[0], 10);
      const ms = parseInt(secondsParts[1], 10) || 0;
      return hrs * 3600 + mins * 60 + secs + ms / 1000;
    };

    for (let line of lines) {
      line = line.trim();
      if (!line) {
        if (currentCue) {
          parsedCues.push(currentCue);
          currentCue = null;
        }
        continue;
      }

      const match = line.match(timeRegex);
      if (match) {
        currentCue = {
          start: parseTime(match[1]),
          end: parseTime(match[2]),
          text: ''
        };
      } else if (currentCue) {
        currentCue.text = currentCue.text ? currentCue.text + ' ' + line : line;
      }
    }
    if (currentCue) {
      parsedCues.push(currentCue);
    }
    return parsedCues;
  };

  // --- DRAG AND DROP PLAYLIST HANDLERS ---
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const sourceIndex = draggedIndex;
    if (sourceIndex === null || sourceIndex === index) {
      handleDragEnd();
      return;
    }

    const reordered = [...playlist];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(index, 0, removed);

    setPlaylist(reordered);
    handleDragEnd();
  };

  // --- RENDERING TABS ---

  const getFormattedStorage = () => {
    const totalBytes = library.reduce((acc, file) => acc + (file.size || 0), 0);
    const limitBytes = 50 * 1024 * 1024 * 1024; // 50 GB
    const percentage = Math.max(0.1, parseFloat(((totalBytes / limitBytes) * 100).toFixed(2)));

    let formattedUsed = '';
    if (totalBytes < 1024 * 1024) {
      formattedUsed = `${(totalBytes / 1024).toFixed(1)} KB`;
    } else if (totalBytes < 1024 * 1024 * 1024) {
      formattedUsed = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      formattedUsed = `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }

    return {
      usedText: `${formattedUsed} / 50 GB`,
      percentage: percentage
    };
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        playlistCount={playlist.length}
        storageInfo={getFormattedStorage()}
      />

      {/* Main content display window */}
      <main className={`main-view ${activeTab === 'player' ? 'player-view' : ''}`}>
        {/* Dynamic global header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          librarySearch={librarySearch}
          setLibrarySearch={setLibrarySearch}
        />

        {/* Views Router */}
        {activeTab === 'player' && (
          <NowPlayingQueue
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            currentTime={currentTime}
            duration={duration}
            handleScrub={handleScrub}
            formatTime={formatTime}
            playPrev={playPrev}
            playNext={playNext}
            cues={cues}
            playlist={playlist}
            setPlaylist={setPlaylist}
            draggedIndex={draggedIndex}
            setDraggedIndex={setDraggedIndex}
            dragOverIndex={dragOverIndex}
            setDragOverIndex={setDragOverIndex}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragEnd={handleDragEnd}
            handleDrop={handleDrop}
            loadTrack={loadTrack}
            autoplayEnabled={autoplayEnabled}
            setAutoplayEnabled={setAutoplayEnabled}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}

            sleepTimer={sleepTimer}
            cycleSleepTimer={cycleSleepTimer}
            audioQuality={audioQuality}
            cycleAudioQuality={cycleAudioQuality}
            crossfade={crossfade}
            cycleCrossfade={cycleCrossfade}
            volumeBoost={volumeBoost}
            toggleVolumeBoost={toggleVolumeBoost}
          />
        )}

        {activeTab === 'queue' && (
          <PlayQueue
            playlist={playlist}
            setPlaylist={setPlaylist}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            draggedIndex={draggedIndex}
            setDraggedIndex={setDraggedIndex}
            dragOverIndex={dragOverIndex}
            setDragOverIndex={setDragOverIndex}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragEnd={handleDragEnd}
            handleDrop={handleDrop}
            loadTrack={loadTrack}
            autoplayEnabled={autoplayEnabled}
            setAutoplayEnabled={setAutoplayEnabled}
          />
        )}

        {activeTab === 'library' && (
          <AudioLibrary
            library={library}
            librarySearch={librarySearch}
            setLibrarySearch={setLibrarySearch}
            isLoadingLibrary={isLoadingLibrary}
            fetchLibrary={fetchLibrary}
            libraryError={libraryError}
            selectedLibraryFiles={selectedLibraryFiles}
            setSelectedLibraryFiles={setSelectedLibraryFiles}
            editingFilename={editingFilename}
            setEditingFilename={setEditingFilename}
            editValue={editValue}
            setEditValue={setEditValue}
            handleCheckboxChange={handleCheckboxChange}
            bulkDelete={bulkDelete}
            bulkLoadToPlaylist={bulkLoadToPlaylist}
            saveRename={saveRename}
            cancelEditing={cancelEditing}
            startEditing={startEditing}
            loadSingleToPlaylist={loadSingleToPlaylist}
            deleteLibraryFile={deleteLibraryFile}
            loadTrack={loadTrack}
            playlist={playlist}
            setActiveTab={setActiveTab}
            formatFilename={formatFilename}
          />
        )}

        {activeTab === 'generate' && (
          <GenerateAudio
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
            novelUrl={novelUrl}
            setNovelUrl={setNovelUrl}
            startChap={startChap}
            setStartChap={setStartChap}
            endChap={endChap}
            setEndChap={setEndChap}
            currentChap={currentChap}
            setCurrentChap={setCurrentChap}
            jobId={jobId}
            setJobId={setJobId}
            jobStatus={jobStatus}
            setJobStatus={setJobStatus}
            isCheckingJob={isCheckingJob}
            textInput={textInput}
            setTextInput={setTextInput}
            rawTitle={rawTitle}
            setRawTitle={setRawTitle}
            rawSubtitle={rawSubtitle}
            setRawSubtitle={setRawSubtitle}
            isGeneratingText={isGeneratingText}
            triggerConvertJob={triggerConvertJob}
            triggerTextGeneration={triggerTextGeneration}
            handleFileChange={handleFileChange}
            fileInputRef={fileInputRef}
            uploadFile={uploadFile}
            isUploadingFile={isUploadingFile}
          />
        )}

        {activeTab === 'favorites' && <FavoritesPlaceholder type="favorites" />}
        {activeTab === 'recently' && <FavoritesPlaceholder type="recently" />}
        {activeTab === 'completed' && <FavoritesPlaceholder type="completed" />}
      </main>

      {/* Hidden Global HTML5 Audio Element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onPlay={() => {
          setIsPlaying(true);
          setupAudioGraph();
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
          }
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={(e) => setDuration(e.target.duration)}
        onEnded={handleAudioEnded}
      />

      {/* Persistent Bottom Media Player Bar */}
      <BottomPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        currentTime={currentTime}
        duration={duration}
        handleScrub={handleScrub}
        formatTime={formatTime}
        playPrev={playPrev}
        playNext={playNext}
        playbackSpeed={playbackSpeed}
        setPlaybackSpeed={setPlaybackSpeed}
        showSpeedPopover={showSpeedPopover}
        setShowSpeedPopover={setShowSpeedPopover}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        volume={volume}
        setVolume={setVolume}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Mobile Bottom Tab Bar (only visible on mobile via CSS) */}
      <div className="mobile-bottom-nav">
        <button className={`mobile-nav-item ${activeTab === 'player' ? 'active' : ''}`} onClick={() => setActiveTab('player')}>
          <Disc size={20} />
          <span>Player</span>
        </button>
        <button className={`mobile-nav-item ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>
          <ListMusic size={20} />
          <span>Queue</span>
        </button>
        <button className={`mobile-nav-item ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
          <Library size={20} />
          <span>Library</span>
        </button>
        <button className={`mobile-nav-item ${activeTab === 'generate' ? 'active' : ''}`} onClick={() => setActiveTab('generate')}>
          <Sparkles size={20} />
          <span>Generate</span>
        </button>
      </div>
    </div>
  );
}
