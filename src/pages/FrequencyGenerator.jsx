import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Settings2, X } from "lucide-react";
import WebGLVisualizer from '@/components/frequency/WebGLVisualizer.js';
import AudioControls from '@/components/frequency/AudioControls.js';
import VisualControls from '@/components/frequency/VisualControls.js';

export default function FrequencyGenerator() {
  const [frequency, setFrequency] = useState(440);
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
  
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyser for visualization
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, []);

  const startOscillator = useCallback(() => {
    const ctx = initAudio();
    
    // Stop existing oscillator
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
    }

    // Create new oscillator
    oscillatorRef.current = ctx.createOscillator();
    gainNodeRef.current = ctx.createGain();

    oscillatorRef.current.type = waveType;
    oscillatorRef.current.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNodeRef.current.gain.setValueAtTime(volume, ctx.currentTime);

    oscillatorRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(analyserRef.current);

    oscillatorRef.current.start();
  }, [frequency, volume, waveType, initAudio]);

  const stopOscillator = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopOscillator();
    } else {
      startOscillator();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, startOscillator, stopOscillator]);

  // Update frequency in real-time
  useEffect(() => {
    if (oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(
        frequency, 
        audioContextRef.current.currentTime
      );
    }
  }, [frequency]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopOscillator();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopOscillator]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      {/* WebGL Background */}
      <div className="absolute inset-0">
        <WebGLVisualizer
          frequency={frequency}
          isPlaying={isPlaying}
          waveType={waveType}
          analyserNode={analyserRef.current}
          visualStyle={visualStyle}
          colorPalette={colorPalette}
          speed={speed}
          intensity={intensity}
          complexity={complexity}
          symmetry={symmetry}
          bloom={bloom}
        />
      </div>

      {/* Overlay gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/50 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
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

        {/* Main Controls */}
        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
              />
            </div>
          </div>
        </motion.main>

        {/* Status indicator and Visual Controls Toggle */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="absolute top-6 right-6 flex items-center gap-4"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVisualControls(!showVisualControls)}
            className={`text-gray-400 hover:text-white hover:bg-white/10 ${
              showVisualControls ? 'bg-white/10 text-white' : ''
            }`}
          >
            {showVisualControls ? <X className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
            <span className="ml-2 text-xs">Visuals</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'
            }`} />
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {isPlaying ? 'Playing' : 'Ready'}
            </span>
          </div>
        </motion.div>

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
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}