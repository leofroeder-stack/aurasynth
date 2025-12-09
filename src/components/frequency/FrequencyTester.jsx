import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlaskConical, Play, Pause, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function FrequencyTester({ onSetFrequency, currentFrequency }) {
  const [open, setOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [startFreq, setStartFreq] = useState(100);
  const [endFreq, setEndFreq] = useState(1000);
  const [increment, setIncrement] = useState(1);
  const [duration, setDuration] = useState(5); // minutes per frequency
  const [currentTestFreq, setCurrentTestFreq] = useState(null);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testedCount, setTestedCount] = useState(0);
  const intervalRef = useRef(null);
  const testStartTimeRef = useRef(null);

  const totalFrequencies = Math.floor((endFreq - startFreq) / increment) + 1;
  const totalDuration = totalFrequencies * duration * 60; // in seconds

  useEffect(() => {
    if (isRunning && currentTestFreq !== null) {
      testStartTimeRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - testStartTimeRef.current) / 1000);
        const remaining = duration * 60 - elapsed;
        
        setTimeRemaining(remaining);
        setProgress((elapsed / (duration * 60)) * 100);
        
        if (remaining <= 0) {
          // Move to next frequency
          const nextFreq = currentTestFreq + increment;
          if (nextFreq <= endFreq) {
            setCurrentTestFreq(nextFreq);
            setTestedCount(prev => prev + 1);
            onSetFrequency(nextFreq);
            testStartTimeRef.current = Date.now();
          } else {
            // Test complete
            handleStop();
            alert('Frequency test complete!');
          }
        }
      }, 100);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isRunning, currentTestFreq, duration, increment, endFreq, onSetFrequency]);

  const handleStart = () => {
    if (startFreq >= endFreq) {
      alert('Start frequency must be less than end frequency');
      return;
    }
    setIsRunning(true);
    setCurrentTestFreq(startFreq);
    setTestedCount(0);
    setProgress(0);
    onSetFrequency(startFreq);
  };

  const handlePause = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleResume = () => {
    if (currentTestFreq !== null) {
      setIsRunning(true);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setCurrentTestFreq(null);
    setProgress(0);
    setTimeRemaining(0);
    setTestedCount(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
        >
          <FlaskConical className="w-4 h-4" />
          <span className="text-xs hidden md:inline">Test</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            Frequency Tester
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isRunning && currentTestFreq === null ? (
            <>
              {/* Configuration */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Start Frequency (Hz)</Label>
                  <Input
                    type="number"
                    value={startFreq}
                    onChange={(e) => setStartFreq(parseFloat(e.target.value) || 0)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">End Frequency (Hz)</Label>
                  <Input
                    type="number"
                    value={endFreq}
                    onChange={(e) => setEndFreq(parseFloat(e.target.value) || 0)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Increment (Hz)</Label>
                  <Input
                    type="number"
                    value={increment}
                    onChange={(e) => setIncrement(parseFloat(e.target.value) || 1)}
                    className="bg-white/5 border-white/10 text-white"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Duration per Frequency (minutes)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
                    className="bg-white/5 border-white/10 text-white"
                    step="0.5"
                    min="0.1"
                  />
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>Total Frequencies: <span className="text-cyan-400">{totalFrequencies}</span></div>
                    <div>Total Duration: <span className="text-cyan-400">{Math.floor(totalDuration / 60)} minutes</span></div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 gap-2"
              >
                <Play className="w-4 h-4" />
                Start Test
              </Button>
            </>
          ) : (
            <>
              {/* Test Running */}
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl p-6 border border-cyan-500/20"
                >
                  <div className="text-center space-y-2">
                    <div className="text-sm text-gray-400">Testing Frequency</div>
                    <div className="text-4xl font-bold text-cyan-400 tabular-nums">
                      {currentTestFreq?.toFixed(1)} Hz
                    </div>
                    <div className="text-xs text-gray-500">
                      {testedCount} / {totalFrequencies} tested
                    </div>
                  </div>
                </motion.div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-cyan-400">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="text-center text-sm text-gray-500">
                    {formatTime(timeRemaining)} remaining
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                  {isRunning ? (
                    <Button
                      onClick={handlePause}
                      variant="outline"
                      className="flex-1 border-white/10 text-white hover:bg-white/10 gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      onClick={handleResume}
                      variant="outline"
                      className="flex-1 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Resume
                    </Button>
                  )}
                  <Button
                    onClick={handleStop}
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Stop
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}