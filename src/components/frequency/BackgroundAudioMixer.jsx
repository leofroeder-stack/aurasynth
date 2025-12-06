import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Music, Upload, X, Trash2, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";

export default function BackgroundAudioMixer({ 
  audioContext, 
  destinationNode,
  isPlaying 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [audioFiles, setAudioFiles] = useState([]);
  const [audioLevels, setAudioLevels] = useState(new Array(20).fill(0));
  
  const fileInputRef = useRef(null);
  const audioElementsRef = useRef([]);
  const audioSourcesRef = useRef([]);
  const gainNodesRef = useRef([]);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (audioContext && destinationNode && !analyserRef.current) {
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.connect(destinationNode);
      startVisualizer();
    }
  }, [audioContext, destinationNode]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const newFile = {
        id: Date.now() + Math.random(),
        name: file.name,
        file: file,
        volume: 0.7,
        loop: true,
        isPlaying: false
      };
      setAudioFiles(prev => [...prev, newFile]);
    });
  };

  const playAudioFile = (fileData) => {
    if (!audioContext || !analyserRef.current) return;

    const existingIndex = audioElementsRef.current.findIndex(a => a.fileId === fileData.id);
    if (existingIndex !== -1) {
      // Toggle existing
      const audio = audioElementsRef.current[existingIndex].element;
      if (audio.paused) {
        audio.play().catch(() => {});
        setAudioFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, isPlaying: true } : f
        ));
      } else {
        audio.pause();
        setAudioFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, isPlaying: false } : f
        ));
      }
      return;
    }

    // Create new audio element
    const audio = new Audio();
    audio.src = URL.createObjectURL(fileData.file);
    audio.loop = fileData.loop;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const source = audioContext.createMediaElementSource(audio);
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(fileData.volume, audioContext.currentTime);

    source.connect(gainNode);
    gainNode.connect(analyserRef.current);

    audioElementsRef.current.push({ fileId: fileData.id, element: audio });
    audioSourcesRef.current.push({ fileId: fileData.id, source, gainNode });
    gainNodesRef.current.push({ fileId: fileData.id, gainNode });

    audio.play().catch(() => {});
    setAudioFiles(prev => prev.map(f => 
      f.id === fileData.id ? { ...f, isPlaying: true } : f
    ));
  };

  const stopAudioFile = (fileId) => {
    const index = audioElementsRef.current.findIndex(a => a.fileId === fileId);
    if (index !== -1) {
      const audio = audioElementsRef.current[index].element;
      audio.pause();
      audio.currentTime = 0;
      setAudioFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, isPlaying: false } : f
      ));
    }
  };

  const removeAudioFile = (fileId) => {
    stopAudioFile(fileId);
    
    const index = audioElementsRef.current.findIndex(a => a.fileId === fileId);
    if (index !== -1) {
      URL.revokeObjectURL(audioElementsRef.current[index].element.src);
      audioElementsRef.current.splice(index, 1);
      audioSourcesRef.current.splice(index, 1);
      gainNodesRef.current.splice(index, 1);
    }
    
    setAudioFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateVolume = (fileId, volume) => {
    setAudioFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, volume } : f
    ));
    
    const gainData = gainNodesRef.current.find(g => g.fileId === fileId);
    if (gainData && audioContext) {
      gainData.gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    }
  };

  const toggleLoop = (fileId, loop) => {
    setAudioFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, loop } : f
    ));
    
    const audioData = audioElementsRef.current.find(a => a.fileId === fileId);
    if (audioData) {
      audioData.element.loop = loop;
    }
  };

  const startVisualizer = () => {
    const update = () => {
      if (!analyserRef.current) return;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
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

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audioElementsRef.current.forEach(({ element }) => {
        element.pause();
        URL.revokeObjectURL(element.src);
      });
    };
  }, []);

  const getBarColor = (level) => {
    if (level < 0.3) return 'bg-purple-500/30';
    if (level < 0.6) return 'bg-purple-500';
    if (level < 0.8) return 'bg-fuchsia-500';
    return 'bg-pink-500';
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
      >
        <Music className="w-4 h-4" />
        <span className="text-xs hidden md:inline">Mix</span>
        {audioFiles.some(f => f.isPlaying) && (
          <span className="text-xs bg-fuchsia-500/20 text-fuchsia-400 px-1.5 py-0.5 rounded-full">
            {audioFiles.filter(f => f.isPlaying).length}
          </span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Music className="w-5 h-5 text-fuchsia-400" />
                Background Audio Mixer
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* VU Meter */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Mixed Output Level</label>
              <div className="bg-black/30 rounded-xl p-3 border border-white/10">
                <div className="flex items-end justify-between gap-1 h-20">
                  {audioLevels.map((level, index) => (
                    <motion.div
                      key={index}
                      className={`flex-1 rounded-t transition-colors ${getBarColor(level)}`}
                      animate={{ height: `${level * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              multiple
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Audio Files
            </Button>

            {/* Audio Files List */}
            {audioFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No audio files uploaded</p>
                <p className="text-xs mt-1">Upload ambient sounds or music to mix</p>
              </div>
            ) : (
              <div className="space-y-3">
                {audioFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`bg-white/5 rounded-xl p-4 border ${
                      file.isPlaying ? 'border-fuchsia-500/50' : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {file.isPlaying ? 'Playing' : 'Stopped'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => file.isPlaying ? stopAudioFile(file.id) : playAudioFile(file)}
                          className={`h-8 w-8 ${
                            file.isPlaying 
                              ? 'text-fuchsia-400 hover:text-fuchsia-300' 
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {file.isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAudioFile(file.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Volume Control */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-400">Volume</Label>
                        <span className="text-xs text-fuchsia-400">{Math.round(file.volume * 100)}%</span>
                      </div>
                      <Slider
                        value={[file.volume * 100]}
                        onValueChange={([val]) => updateVolume(file.id, val / 100)}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Loop Toggle */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-400">Loop</Label>
                      <Switch
                        checked={file.loop}
                        onCheckedChange={(checked) => toggleLoop(file.id, checked)}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {audioFiles.length > 0 && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500 text-center">
                {audioFiles.filter(f => f.isPlaying).length} of {audioFiles.length} tracks playing
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}