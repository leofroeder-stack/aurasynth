import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, StopCircle, SkipBack, SkipForward } from "lucide-react";
import { motion } from "framer-motion";

export default function PlaybackControls({ 
  audioElement,
  trackTitle,
  onStop,
  onClose
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audioElement) return;

    const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
    const handleDurationChange = () => setDuration(audioElement.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('durationchange', handleDurationChange);
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);

    setIsPlaying(!audioElement.paused);
    setDuration(audioElement.duration || 0);
    setCurrentTime(audioElement.currentTime || 0);

    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('durationchange', handleDurationChange);
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioElement]);

  const handlePlayPause = () => {
    if (!audioElement) return;
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
  };

  const handleSeek = (value) => {
    if (!audioElement) return;
    audioElement.currentTime = value;
  };

  const handleSkipBackward = () => {
    if (!audioElement) return;
    audioElement.currentTime = Math.max(0, audioElement.currentTime - 10);
  };

  const handleSkipForward = () => {
    if (!audioElement) return;
    audioElement.currentTime = Math.min(duration, audioElement.currentTime + 10);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-30"
    >
      <div className="backdrop-blur-xl bg-black/80 rounded-2xl border border-white/20 p-4 shadow-2xl">
        {/* Track Title */}
        <div className="mb-3">
          <div className="text-sm font-medium text-white truncate">{trackTitle}</div>
          <div className="text-xs text-gray-400">Archive.org Library</div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            onValueChange={([val]) => handleSeek(val)}
            min={0}
            max={duration || 100}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkipBackward}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <SkipBack className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPause}
            className="text-white hover:bg-white/10 rounded-full w-12 h-12"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkipForward}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <SkipForward className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onStop}
            className="text-red-400 hover:bg-red-500/10 rounded-full ml-2"
          >
            <StopCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}