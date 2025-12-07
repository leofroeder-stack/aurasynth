import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Settings2, X, Maximize2, Minimize2 } from "lucide-react";
import FrequencyOverlay from '../components/frequency/FrequencyOverlay';
import WebGLVisualizer from '../components/frequency/WebGLVisualizer';
import AIImaginationView from '../components/frequency/AIImaginationView';
import AudioControls from '../components/frequency/AudioControls';
import VisualControls from '../components/frequency/VisualControls';
import RecordingControls from '../components/frequency/RecordingControls';
import BeatsControls from '../components/frequency/BeatsControls';
import GestureController from '../components/frequency/GestureController';
import MultiFrequencyLayers from '../components/frequency/MultiFrequencyLayers';
import ArchiveLibrary from '../components/frequency/ArchiveLibrary';
import PlaybackControls from '../components/frequency/PlaybackControls';
import { base44 } from '@/api/base44Client';

export default function FrequencyGenerator() {
  const [currentUser, setCurrentUser] = React.useState(null);
  
  React.useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      // Load user's default visual preferences
      if (user.default_visual_style) {
        setVisualStyle(user.default_visual_style);
      }
      if (user.default_color_palette) {
        setColorPalette(user.default_color_palette);
      }
    }).catch(() => {});
  }, []);
  const [frequency, setFrequency] = useState(440);
  const [layers, setLayers] = useState([]); // Additional frequency layers
  const [minFreq, setMinFreq] = useState(20);
  const [maxFreq, setMaxFreq] = useState(20000);
  const [volume, setVolume] = useState(0.5);
  const [waveType, setWaveType] = useState('sine');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Visual parameters
  const [showVisualControls, setShowVisualControls] = useState(false);
  const [visualStyle, setVisualStyle] = useState('fractal');
  const [colorPalette, setColorPalette] = useState('cyber');
  const [speed, setSpeed] = useState(1);
  const [intensity, setIntensity] = useState(1);
  const [complexity, setComplexity] = useState(1);
  const [symmetry, setSymmetry] = useState(4);
  const [bloom, setBloom] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const [analyserNode, setAnalyserNode] = useState(null);
  
  // Touch interaction state
  const [touchPoints, setTouchPoints] = useState([]);
  const [dragVelocity, setDragVelocity] = useState({ x: 0, y: 0 });
  const lastTouchRef = useRef({ x: 0, y: 0, time: 0 });
  
  // Binaural & Isochronic beats
  const [binauralEnabled, setBinauralEnabled] = useState(false);
  const [binauralFreq, setBinauralFreq] = useState(10);
  const [isochronicEnabled, setIsochronicEnabled] = useState(false);
  const [isochronicFreq, setIsochronicFreq] = useState(10);
  const [isochronicDepth, setIsochronicDepth] = useState(0.8);
  
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const audioElementRef = useRef(null);
  const audioSourceRef = useRef(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [currentArchiveTrack, setCurrentArchiveTrack] = useState(null);
  const oscillatorRightRef = useRef(null);
  const pannerLeftRef = useRef(null);
  const pannerRightRef = useRef(null);
  const isochronicGainRef = useRef(null);
  const isochronicIntervalRef = useRef(null);
  const layerOscillatorsRef = useRef([]); // For multi-frequency layers

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyser for visualization
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.connect(audioContextRef.current.destination);
      setAnalyserNode(analyserRef.current);
    }
    return audioContextRef.current;
  }, []);

  const startOscillator = useCallback(() => {
    const ctx = initAudio();
    
    // Resume audio context if suspended (iOS requirement)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Stop existing oscillators
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    if (oscillatorRightRef.current) {
      oscillatorRightRef.current.stop();
      oscillatorRightRef.current.disconnect();
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
    }
    if (isochronicIntervalRef.current) {
      clearInterval(isochronicIntervalRef.current);
    }

    // Create gain node
    gainNodeRef.current = ctx.createGain();
    gainNodeRef.current.gain.setValueAtTime(volume, ctx.currentTime);

    if (binauralEnabled) {
      // Binaural beats: different frequencies in each ear
      const leftFreq = frequency - binauralFreq / 2;
      const rightFreq = frequency + binauralFreq / 2;

      // Left channel
      oscillatorRef.current = ctx.createOscillator();
      oscillatorRef.current.type = waveType;
      oscillatorRef.current.frequency.setValueAtTime(leftFreq, ctx.currentTime);
      pannerLeftRef.current = ctx.createStereoPanner();
      pannerLeftRef.current.pan.setValueAtTime(-1, ctx.currentTime);
      oscillatorRef.current.connect(pannerLeftRef.current);
      pannerLeftRef.current.connect(gainNodeRef.current);

      // Right channel
      oscillatorRightRef.current = ctx.createOscillator();
      oscillatorRightRef.current.type = waveType;
      oscillatorRightRef.current.frequency.setValueAtTime(rightFreq, ctx.currentTime);
      pannerRightRef.current = ctx.createStereoPanner();
      pannerRightRef.current.pan.setValueAtTime(1, ctx.currentTime);
      oscillatorRightRef.current.connect(pannerRightRef.current);
      pannerRightRef.current.connect(gainNodeRef.current);

      oscillatorRef.current.start();
      oscillatorRightRef.current.start();
    } else {
      // Normal mono oscillator
      oscillatorRef.current = ctx.createOscillator();
      oscillatorRef.current.type = waveType;
      oscillatorRef.current.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillatorRef.current.connect(gainNodeRef.current);
      oscillatorRef.current.start();
    }

    // Isochronic tones: rhythmic amplitude modulation
    if (isochronicEnabled) {
      isochronicGainRef.current = ctx.createGain();
      gainNodeRef.current.connect(isochronicGainRef.current);
      isochronicGainRef.current.connect(analyserRef.current);

      const pulsePeriod = 1000 / isochronicFreq;
      let phase = 0;
      
      const modulateGain = () => {
        if (!isochronicGainRef.current || !ctx) return;
        const pulseValue = (Math.sin(phase) + 1) / 2;
        const gain = 1 - (isochronicDepth * (1 - pulseValue));
        isochronicGainRef.current.gain.setValueAtTime(gain, ctx.currentTime);
        phase += (2 * Math.PI) / (pulsePeriod / 16);
      };

      isochronicIntervalRef.current = setInterval(modulateGain, 16);
    } else {
      gainNodeRef.current.connect(analyserRef.current);
    }

    // Start layer oscillators
    startLayerOscillators(ctx);
  }, [frequency, volume, waveType, initAudio, binauralEnabled, binauralFreq, isochronicEnabled, isochronicFreq, isochronicDepth]);

  const startLayerOscillators = useCallback((ctx) => {
    // Stop existing layer oscillators
    layerOscillatorsRef.current.forEach(({ oscillator, gain }) => {
      oscillator.stop();
      oscillator.disconnect();
      gain.disconnect();
    });
    layerOscillatorsRef.current = [];

    // Create oscillators for each enabled layer
    layers.filter(l => l.enabled).forEach((layer) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = layer.waveType;
      osc.frequency.setValueAtTime(layer.frequency, ctx.currentTime);
      gain.gain.setValueAtTime(layer.volume, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(analyserRef.current);
      osc.start();
      
      layerOscillatorsRef.current.push({ id: layer.id, oscillator: osc, gain });
    });
  }, [layers]);

  const stopOscillator = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (oscillatorRightRef.current) {
      oscillatorRightRef.current.stop();
      oscillatorRightRef.current.disconnect();
      oscillatorRightRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (isochronicGainRef.current) {
      isochronicGainRef.current.disconnect();
      isochronicGainRef.current = null;
    }
    if (isochronicIntervalRef.current) {
      clearInterval(isochronicIntervalRef.current);
      isochronicIntervalRef.current = null;
    }
    // Stop layer oscillators
    layerOscillatorsRef.current.forEach(({ oscillator, gain }) => {
      oscillator.stop();
      oscillator.disconnect();
      gain.disconnect();
    });
    layerOscillatorsRef.current = [];
  }, []);

  const stopAudioFile = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
  }, []);

  const startAudioFile = useCallback(() => {
    if (!audioFile) return;
    
    const ctx = initAudio();
    
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      audioElementRef.current.loop = true;
      // Enable background playback
      audioElementRef.current.setAttribute('playsinline', '');
      audioElementRef.current.setAttribute('webkit-playsinline', '');
    }
    
    audioElementRef.current.src = URL.createObjectURL(audioFile);
    
    if (!audioSourceRef.current) {
      audioSourceRef.current = ctx.createMediaElementSource(audioElementRef.current);
      audioSourceRef.current.connect(analyserRef.current);
    }
    
    audioElementRef.current.play();
  }, [audioFile, initAudio]);

  const fullscreenTimerRef = useRef(null);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (audioFile) {
        stopAudioFile();
      } else {
        stopOscillator();
      }
      // Clear fullscreen timer when stopping
      if (fullscreenTimerRef.current) {
        clearTimeout(fullscreenTimerRef.current);
        fullscreenTimerRef.current = null;
      }
    } else {
      if (audioFile) {
        startAudioFile();
      } else {
        startOscillator();
      }
      // Auto fullscreen after 5 seconds
      fullscreenTimerRef.current = setTimeout(() => {
        enterFullscreen();
      }, 5000);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, audioFile, startOscillator, stopOscillator, startAudioFile, stopAudioFile]);

  const handleFileUpload = useCallback((file) => {
    if (isPlaying) {
      stopOscillator();
      stopAudioFile();
      setIsPlaying(false);
    }
    setAudioFile(file);
    setAudioFileName(file.name);
  }, [isPlaying, stopOscillator, stopAudioFile]);

  // Update frequency in real-time
  useEffect(() => {
    if (oscillatorRef.current && audioContextRef.current) {
      if (binauralEnabled) {
        const leftFreq = frequency - binauralFreq / 2;
        const rightFreq = frequency + binauralFreq / 2;
        oscillatorRef.current.frequency.setValueAtTime(leftFreq, audioContextRef.current.currentTime);
        if (oscillatorRightRef.current) {
          oscillatorRightRef.current.frequency.setValueAtTime(rightFreq, audioContextRef.current.currentTime);
        }
      } else {
        oscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      }
    }
  }, [frequency, binauralEnabled, binauralFreq]);

  // Restart oscillator when beat settings change while playing
  useEffect(() => {
    if (isPlaying && !audioFile) {
      stopOscillator();
      startOscillator();
    }
  }, [binauralEnabled, binauralFreq, isochronicEnabled, isochronicFreq, isochronicDepth]);

  // Update layer oscillators when layers change while playing
  useEffect(() => {
    if (isPlaying && !audioFile && audioContextRef.current) {
      startLayerOscillators(audioContextRef.current);
    }
  }, [layers, isPlaying, audioFile, startLayerOscillators]);

  // Update volume in real-time
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        volume, 
        audioContextRef.current.currentTime
      );
    }
  }, [volume]);

  // Update wave type (requires restart)
  useEffect(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.type = waveType;
    }
  }, [waveType]);

  // Handle browser fullscreen
  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    // Set status bar color to black on mobile
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', '#000000');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#000000';
      document.head.appendChild(meta);
    }
    
    // Ensure audio continues playing in fullscreen
    setTimeout(() => {
      // Resume audio context if suspended
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      // Resume main audio element if exists
      if (audioElementRef.current && audioElementRef.current.paused && isPlaying) {
        audioElementRef.current.play().catch(() => {});
      }
      // Resume all layer oscillators by restarting if playing
      if (isPlaying && !audioFile && oscillatorRef.current) {
        // Oscillators should continue playing automatically
      }
    }, 100);
    
    if (containerRef.current && document.fullscreenEnabled) {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  }, [isPlaying, audioFile]);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    // Restore original theme color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', '#0a0a0f');
    }
    // Resume audio context if suspended
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    // Resume audio element if exists
    if (audioElementRef.current && audioElementRef.current.paused && isPlaying) {
      audioElementRef.current.play().catch(() => {});
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [isPlaying]);

  const handlePlayArchiveTrack = useCallback(async (url, title) => {
    if (isPlaying) {
      stopOscillator();
      stopAudioFile();
      setIsPlaying(false);
    }
    
    const ctx = initAudio();
    
    // Create new audio element for archive track
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
    }
    
    // Disconnect old source if exists
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    
    audioElementRef.current = new Audio();
    audioElementRef.current.crossOrigin = 'anonymous';
    audioElementRef.current.loop = true;
    audioElementRef.current.setAttribute('playsinline', '');
    audioElementRef.current.setAttribute('webkit-playsinline', '');
    audioElementRef.current.src = url;
    
    audioSourceRef.current = ctx.createMediaElementSource(audioElementRef.current);
    audioSourceRef.current.connect(analyserRef.current);
    
    try {
      await audioElementRef.current.play();
      setIsPlaying(true);
      setAudioFileName(title);
      setCurrentArchiveTrack({ url, title });
      
      // Auto fullscreen after 3 seconds
      fullscreenTimerRef.current = setTimeout(() => {
        enterFullscreen();
      }, 3000);
    } catch (error) {
      console.error('Failed to play archive track:', error);
      throw new Error(`Playback failed: ${error.message}`);
    }
  }, [isPlaying, stopOscillator, stopAudioFile, initAudio, enterFullscreen]);

  const handleStopArchiveTrack = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current.src = '';
    }
    setIsPlaying(false);
    setCurrentArchiveTrack(null);
    setAudioFileName('');
    if (fullscreenTimerRef.current) {
      clearTimeout(fullscreenTimerRef.current);
      fullscreenTimerRef.current = null;
    }
  }, []);

  // Sync state when user exits fullscreen via Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
      // Resume audio on fullscreen change
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      if (audioElementRef.current && audioElementRef.current.paused && isPlaying) {
        audioElementRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen, isPlaying]);

  // Setup Media Session for background playback
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Frequency Generator',
        artist: 'Sound Therapy',
        album: 'Healing Frequencies'
      });
    }
  }, []);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        if (!isPlaying) togglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (isPlaying) togglePlay();
      });
    }
  }, [isPlaying, togglePlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopOscillator();
      stopAudioFile();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (fullscreenTimerRef.current) {
        clearTimeout(fullscreenTimerRef.current);
      }
    };
  }, [stopOscillator, stopAudioFile]);

  // Touch interaction handlers
  const getNormalizedCoords = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    return { x, y };
  }, []);

  const handleTouchStart = useCallback((e) => {
    const points = Array.from(e.touches).map(touch => 
      getNormalizedCoords(touch.clientX, touch.clientY)
    );
    setTouchPoints(points);
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      lastTouchRef.current = { 
        x: touch.clientX, 
        y: touch.clientY, 
        time: Date.now() 
      };
    }
  }, [getNormalizedCoords]);

  const handleTouchMove = useCallback((e) => {
    const points = Array.from(e.touches).map(touch => 
      getNormalizedCoords(touch.clientX, touch.clientY)
    );
    setTouchPoints(points);
    
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const now = Date.now();
      const dt = (now - lastTouchRef.current.time) / 1000;
      if (dt > 0) {
        const vx = (touch.clientX - lastTouchRef.current.x) / (window.innerWidth * dt) * 2;
        const vy = -(touch.clientY - lastTouchRef.current.y) / (window.innerHeight * dt) * 2;
        setDragVelocity({ x: vx * 0.1, y: vy * 0.1 });
      }
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY, time: now };
    }
  }, [getNormalizedCoords]);

  const handleTouchEnd = useCallback((e) => {
    const points = Array.from(e.touches).map(touch => 
      getNormalizedCoords(touch.clientX, touch.clientY)
    );
    setTouchPoints(points);
    if (e.touches.length === 0) {
      // Decay drag velocity
      setTimeout(() => setDragVelocity({ x: 0, y: 0 }), 500);
    }
  }, [getNormalizedCoords]);

  const handleMouseDown = useCallback((e) => {
    const point = getNormalizedCoords(e.clientX, e.clientY);
    setTouchPoints([point]);
    lastTouchRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  }, [getNormalizedCoords]);

  const handleMouseMove = useCallback((e) => {
    if (e.buttons !== 1) return;
    const point = getNormalizedCoords(e.clientX, e.clientY);
    setTouchPoints([point]);
    
    const now = Date.now();
    const dt = (now - lastTouchRef.current.time) / 1000;
    if (dt > 0) {
      const vx = (e.clientX - lastTouchRef.current.x) / (window.innerWidth * dt) * 2;
      const vy = -(e.clientY - lastTouchRef.current.y) / (window.innerHeight * dt) * 2;
      setDragVelocity({ x: vx * 0.1, y: vy * 0.1 });
    }
    lastTouchRef.current = { x: e.clientX, y: e.clientY, time: now };
  }, [getNormalizedCoords]);

  const handleMouseUp = useCallback(() => {
    setTouchPoints([]);
    setTimeout(() => setDragVelocity({ x: 0, y: 0 }), 500);
  }, []);

  return (
    <div ref={containerRef} className={`min-h-screen text-white overflow-hidden relative ${isFullscreen ? 'bg-black' : 'bg-[#0a0a0f]'}`} style={isFullscreen ? { paddingTop: 'env(safe-area-inset-top)', backgroundColor: '#000000' } : undefined}>
      {/* Fullscreen frequency control overlay */}
      {isFullscreen && (
        <FrequencyOverlay 
          frequency={frequency}
          setFrequency={setFrequency}
          onDoubleTap={exitFullscreen}
        />
      )}

      {/* WebGL Background */}
      <div 
        className="absolute inset-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {visualStyle === 'ai-imagination' ? (
          <AIImaginationView
            frequency={frequency}
            isPlaying={isPlaying}
            analyserNode={analyserNode}
            speed={speed}
            intensity={intensity}
            complexity={complexity}
            canvasRef={canvasRef}
          />
        ) : (
          <WebGLVisualizer
            frequency={frequency}
            isPlaying={isPlaying}
            waveType={waveType}
            analyserNode={analyserNode}
            visualStyle={visualStyle}
            colorPalette={colorPalette}
            speed={speed}
            intensity={intensity}
            complexity={complexity}
            symmetry={symmetry}
            bloom={bloom}
            canvasRef={canvasRef}
            binauralEnabled={binauralEnabled}
            binauralFreq={binauralFreq}
            isochronicEnabled={isochronicEnabled}
            isochronicFreq={isochronicFreq}
            isochronicDepth={isochronicDepth}
            touchPoints={touchPoints}
            dragVelocity={dragVelocity}
          />
        )}
      </div>

      {/* Overlay gradient for readability */}
      <div className={`absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/50 pointer-events-none transition-opacity duration-500 ${isFullscreen ? 'opacity-0' : ''}`} />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <AnimatePresence>
          {!isFullscreen && (
            <motion.header 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 md:p-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center">
                  <span className="text-xl">∿</span>
                </div>
                <div>
                  <h1 className="text-xl font-light tracking-wide">Frequency Generator</h1>
                  <p className="text-xs text-gray-500">Audio synthesis with WebGL visualization</p>
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Main Controls */}
        <AnimatePresence>
          {!isFullscreen && (
            <motion.main 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ delay: 0.2 }}
              className="flex-1 flex items-end pb-8 md:pb-12"
            >
              <div className="w-full px-4 md:px-8">
                <div className="max-w-4xl mx-auto backdrop-blur-xl bg-black/30 rounded-3xl border border-white/10 p-6 md:p-10">
                  <AudioControls
                    frequency={frequency}
                    setFrequency={setFrequency}
                    volume={volume}
                    setVolume={setVolume}
                    waveType={waveType}
                    setWaveType={setWaveType}
                    isPlaying={isPlaying}
                    togglePlay={togglePlay}
                    onFullscreen={enterFullscreen}
                    onOpenVisuals={() => setShowVisualControls(true)}
                    onApplyVisualStyle={(style, palette) => {
                                                setVisualStyle(style);
                                                setColorPalette(palette);
                                              }}
                                              onApplyAIParameters={(params) => {
                                                setFrequency(params.mainFrequency);
                                                setVolume(params.volume);
                                                setWaveType(params.waveType);
                                                setLayers(params.layers.map((layer, idx) => ({
                                                  id: Date.now() + idx,
                                                  frequency: layer.frequency,
                                                  volume: layer.volume,
                                                  waveType: layer.waveType,
                                                  enabled: true
                                                })));
                                                setVisualStyle(params.visualStyle);
                                                setColorPalette(params.colorPalette);
                                                setSpeed(params.speed);
                                                setIntensity(params.intensity);
                                                setComplexity(params.complexity);
                                                setSymmetry(params.symmetry);
                                                setBloom(params.bloom);
                                                setBinauralEnabled(params.binaural.enabled);
                                                setBinauralFreq(params.binaural.frequency);
                                                setIsochronicEnabled(params.isochronic.enabled);
                                                setIsochronicFreq(params.isochronic.frequency);
                                                setIsochronicDepth(params.isochronic.depth);
                                              }}
                                              audioContext={audioContextRef.current}
                                              analyserNode={analyserRef.current}
                                              minFreq={minFreq}
                                          maxFreq={maxFreq}
                                          onFileUpload={handleFileUpload}
                                          audioFileName={audioFileName}
                                          recordingControls={
                                                                    <>
                                                                      <BeatsControls
                                                                        binauralEnabled={binauralEnabled}
                                                                        setBinauralEnabled={setBinauralEnabled}
                                                                        binauralFreq={binauralFreq}
                                                                        setBinauralFreq={setBinauralFreq}
                                                                        isochronicEnabled={isochronicEnabled}
                                                                        setIsochronicEnabled={setIsochronicEnabled}
                                                                        isochronicFreq={isochronicFreq}
                                                                        setIsochronicFreq={setIsochronicFreq}
                                                                        isochronicDepth={isochronicDepth}
                                                                        setIsochronicDepth={setIsochronicDepth}
                                                                      />
                                                                      <RecordingControls
                                                                        audioContext={audioContextRef.current}
                                                                        gainNode={gainNodeRef.current}
                                                                        canvasRef={canvasRef}
                                                                        isPlaying={isPlaying}
                                                                      />
                                                                      <GestureController
                                                                        onSpeedChange={setSpeed}
                                                                        onIntensityChange={setIntensity}
                                                                        onComplexityChange={setComplexity}
                                                                        onBloomChange={setBloom}
                                                                        speed={speed}
                                                                        intensity={intensity}
                                                                        complexity={complexity}
                                                                        bloom={bloom}
                                                                      />
                                                                      <MultiFrequencyLayers
                                                                        layers={layers}
                                                                        setLayers={setLayers}
                                                                        isPlaying={isPlaying}
                                                                      />
                                                                      <ArchiveLibrary
                                                                        onPlayTrack={handlePlayArchiveTrack}
                                                                        currentUser={currentUser}
                                                                      />
                                                                      </>
                                                                      }
                                                                      />
                </div>
              </div>
            </motion.main>
          )}
        </AnimatePresence>

        {/* Fullscreen exit button - always visible in fullscreen mode */}
        {isFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 right-4 md:top-6 md:right-6 z-50"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={exitFullscreen}
              className="text-white bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full w-12 h-12"
            >
              <Minimize2 className="w-6 h-6" />
            </Button>
          </motion.div>
        )}

        {/* Playback Controls */}
        <AnimatePresence>
          {currentArchiveTrack && (
            <PlaybackControls
              audioElement={audioElementRef.current}
              trackTitle={currentArchiveTrack.title}
              onStop={handleStopArchiveTrack}
            />
          )}
        </AnimatePresence>

        {/* Visual Controls Panel */}
        <AnimatePresence>
          {showVisualControls && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-4 right-4 md:left-8 md:right-8 z-20"
            >
              <div className="backdrop-blur-xl bg-black/50 rounded-2xl border border-white/10 p-6 max-h-[70vh] overflow-y-auto">
                <VisualControls
                  visualStyle={visualStyle}
                  setVisualStyle={setVisualStyle}
                  colorPalette={colorPalette}
                  setColorPalette={setColorPalette}
                  speed={speed}
                  setSpeed={setSpeed}
                  intensity={intensity}
                  setIntensity={setIntensity}
                  complexity={complexity}
                  setComplexity={setComplexity}
                  symmetry={symmetry}
                  setSymmetry={setSymmetry}
                  bloom={bloom}
                  setBloom={setBloom}
                  onClose={() => setShowVisualControls(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}