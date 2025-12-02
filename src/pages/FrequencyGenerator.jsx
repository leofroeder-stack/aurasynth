import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Settings2, X, Maximize2, Minimize2 } from "lucide-react";
import FrequencyOverlay from '../components/frequency/FrequencyOverlay';
import WebGLVisualizer from '../components/frequency/WebGLVisualizer';
import AudioControls from '../components/frequency/AudioControls';
import VisualControls from '../components/frequency/VisualControls';
import RecordingControls from '../components/frequency/RecordingControls';
import BeatsControls from '../components/frequency/BeatsControls';

export default function FrequencyGenerator() {
  const [frequency, setFrequency] = useState(440);
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
  const oscillatorRightRef = useRef(null);
  const pannerLeftRef = useRef(null);
  const pannerRightRef = useRef(null);
  const isochronicGainRef = useRef(null);
  const isochronicIntervalRef = useRef(null);

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
  }, [frequency, volume, waveType, initAudio, binauralEnabled, binauralFreq, isochronicEnabled, isochronicFreq, isochronicDepth]);

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
    if (containerRef.current && document.fullscreenEnabled) {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Sync state when user exits fullscreen via Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen]);

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

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      {/* Fullscreen frequency control overlay */}
      {isFullscreen && (
        <FrequencyOverlay 
          frequency={frequency}
          setFrequency={setFrequency}
          onDoubleTap={exitFullscreen}
        />
      )}

      {/* WebGL Background */}
      <div className="absolute inset-0 pointer-events-none">
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
                      />
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

        {/* Visual Controls Panel */}
        <AnimatePresence>
          {showVisualControls && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-4 right-4 md:left-8 md:right-8 z-20"
            >
              <div className="backdrop-blur-xl bg-black/50 rounded-2xl border border-white/10 p-6">
                <VisualControls
                  visualStyle={visualStyle}
                  setVisualStyle={(style) => { setVisualStyle(style); setShowVisualControls(false); }}
                  colorPalette={colorPalette}
                  setColorPalette={(palette) => { setColorPalette(palette); setShowVisualControls(false); }}
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
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}