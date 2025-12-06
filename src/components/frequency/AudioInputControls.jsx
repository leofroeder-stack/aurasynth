import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, X } from "lucide-react";
import { motion } from "framer-motion";

export default function AudioInputControls() {
  const [isOpen, setIsOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [audioLevels, setAudioLevels] = useState(new Array(20).fill(0));
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  // Get available audio input devices
  const getAudioDevices = async () => {
    try {
      const devicesList = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devicesList.filter(device => device.kind === 'audioinput');
      setDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting audio devices:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      getAudioDevices();
    }
  }, [isOpen]);

  const startListening = async () => {
    try {
      // Stop existing stream if any
      stopListening();

      const constraints = {
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Create audio context and analyser
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      setIsListening(true);
      visualize();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopListening = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
    setAudioLevels(new Array(20).fill(0));
  };

  const visualize = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const update = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate levels for 20 bars (VU meter style)
      const levels = [];
      const barsCount = 20;
      const binSize = Math.floor(dataArray.length / barsCount);
      
      for (let i = 0; i < barsCount; i++) {
        let sum = 0;
        for (let j = 0; j < binSize; j++) {
          sum += dataArray[i * binSize + j];
        }
        const average = sum / binSize / 255;
        levels.push(average);
      }
      
      setAudioLevels(levels);
      animationRef.current = requestAnimationFrame(update);
    };
    
    update();
  };

  const handleDeviceChange = (deviceId) => {
    setSelectedDeviceId(deviceId);
    if (isListening) {
      stopListening();
      setTimeout(() => {
        setSelectedDeviceId(deviceId);
        startListening();
      }, 100);
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const getBarColor = (level, index) => {
    const normalizedIndex = index / 20;
    if (level < 0.3) return 'bg-cyan-500/30';
    if (level < 0.6) return 'bg-green-500';
    if (level < 0.8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
      >
        <Mic className="w-4 h-4" />
        <span className="text-xs hidden md:inline">Input</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => { 
        setIsOpen(open); 
        if (!open) stopListening(); 
      }}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-cyan-400" />
                Audio Input
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setIsOpen(false); stopListening(); }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Device Selection */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Input Device</label>
              <Select value={selectedDeviceId} onValueChange={handleDeviceChange}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select input device" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  {devices.map((device) => (
                    <SelectItem 
                      key={device.deviceId} 
                      value={device.deviceId}
                      className="text-white hover:bg-white/10"
                    >
                      {device.label || `Microphone ${devices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* VU Meter Visualizer */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Input Level</label>
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <div className="flex items-end justify-between gap-1 h-32">
                  {audioLevels.map((level, index) => (
                    <motion.div
                      key={index}
                      className={`flex-1 rounded-t transition-colors ${getBarColor(level, index)}`}
                      animate={{ height: `${level * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  ))}
                </div>
                
                {/* Level markers */}
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            {/* Peak indicator */}
            {isListening && (
              <div className="flex items-center justify-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        Math.max(...audioLevels) > 0.2 + i * 0.3 
                          ? i === 2 ? 'bg-red-500' : i === 1 ? 'bg-yellow-500' : 'bg-green-500'
                          : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">
                  Peak: {Math.round(Math.max(...audioLevels) * 100)}%
                </span>
              </div>
            )}

            {/* Control Button */}
            <Button
              onClick={isListening ? stopListening : startListening}
              className={`w-full gap-2 ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-cyan-600 hover:bg-cyan-700'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Monitoring
                </>
              )}
            </Button>

            {/* Info */}
            <p className="text-xs text-gray-500 text-center">
              Monitor your audio input levels and select different devices
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}