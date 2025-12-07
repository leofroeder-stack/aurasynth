import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, Volume2, Waves, Edit3, X, Settings2, Upload, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import TherapyFrequencyPicker from './TherapyFrequencyPicker';
import AmbientAnalyzer from './AmbientAnalyzer';
import AudioInputControls from './AudioInputControls';
import BackgroundAudioMixer from './BackgroundAudioMixer';
import AISoundscapeGenerator from './AISoundscapeGenerator';
import SoundscapeLibrary from './SoundscapeLibrary';
import DynamicVisualSync from './DynamicVisualSync';
import SoundscapeEditor from './SoundscapeEditor';
import AudioExporter from './AudioExporter';
import TherapySession from './TherapySession';

export default function AudioControls({ 
  frequency, 
  setFrequency, 
  volume, 
  setVolume, 
  waveType, 
  setWaveType, 
  isPlaying, 
  togglePlay,
  onHidePanel,
  onOpenVisuals,
  onFullscreen,
  minFreq = 20,
  maxFreq = 20000,
  recordingControls,
  onFileUpload,
  audioFileName,
  onApplyVisualStyle,
  audioContext,
  analyserNode,
  onApplyAIParameters,
  currentSoundscapeParams
}) {
  const [customFreqOpen, setCustomFreqOpen] = useState(false);
  const [customFreqValue, setCustomFreqValue] = useState('');
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleCustomFreqSubmit = () => {
    const val = parseFloat(customFreqValue);
    if (!isNaN(val) && val >= minFreq && val <= maxFreq) {
      setFrequency(Math.min(maxFreq, Math.max(minFreq, val)));
      setCustomFreqOpen(false);
      setCustomFreqValue('');
    }
  };

  const waveforms = [
    { value: 'sine', label: 'Sine', icon: '∿' },
    { value: 'square', label: 'Square', icon: '⊓' },
    { value: 'sawtooth', label: 'Sawtooth', icon: '⋀' },
    { value: 'triangle', label: 'Triangle', icon: '△' },
  ];

  const presetFrequencies = [
    { hz: 40, label: '40 Hz', desc: 'Gamma' },
    { hz: 100, label: '100 Hz', desc: 'Sub Bass' },
    { hz: 432, label: '432 Hz', desc: 'Healing' },
    { hz: 440, label: '440 Hz', desc: 'Concert A' },
    { hz: 528, label: '528 Hz', desc: 'Love' },
    { hz: 852, label: '852 Hz', desc: 'Intuition' },
    { hz: 2000, label: '2 kHz', desc: 'Mid' },
    { hz: 8000, label: '8 kHz', desc: 'Treble' },
    { hz: 15000, label: '15 kHz', desc: 'High' },
    ];

  return (
    <div className="space-y-8 relative">
      {/* Top bar with Therapy on left, controls on right */}
      <div className="flex items-center justify-between -mt-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
                            <TherapySession
                              onApplyParameters={onApplyAIParameters || (() => {})}
                              isPlaying={isPlaying}
                              onTogglePlay={togglePlay}
                              currentParameters={currentSoundscapeParams}
                            />
                            <AISoundscapeGenerator
                              onApplyParameters={onApplyAIParameters || (() => {})}
                              isPlaying={isPlaying}
                              currentParameters={{
                                frequency,
                                volume,
                                waveType,
                                layers: [],
                                visualStyle: '',
                                colorPalette: '',
                                speed: 1,
                                intensity: 1,
                                complexity: 1,
                                symmetry: 4,
                                bloom: 0.5,
                                binauralEnabled: false,
                                binauralFreq: 10,
                                isochronicEnabled: false,
                                isochronicFreq: 10,
                                isochronicDepth: 0.8
                              }}
                              onApplyVisualStyle={onApplyVisualStyle || (() => {})}
                            />
                            <SoundscapeLibrary
                              onLoadSoundscape={onApplyAIParameters || (() => {})}
                              isPlaying={isPlaying}
                            />
                            <div className="relative">
                              <DynamicVisualSync
                                analyserNode={analyserNode}
                                isPlaying={isPlaying}
                                onApplyVisualStyle={onApplyVisualStyle || (() => {})}
                                currentFrequency={frequency}
                                currentWaveType={waveType}
                              />
                            </div>
                            <SoundscapeEditor
                              currentParameters={currentSoundscapeParams}
                              onApplyChanges={onApplyAIParameters || (() => {})}
                              isPlaying={isPlaying}
                            />
                            <AudioExporter
                              audioContext={audioContext}
                              currentParameters={currentSoundscapeParams}
                              isPlaying={isPlaying}
                            />
                            <TherapyFrequencyPicker onSelectFrequency={setFrequency} />
                            <AmbientAnalyzer 
                              onApplyFrequency={setFrequency} 
                              onApplyVisualStyle={onApplyVisualStyle || (() => {})} 
                            />
                            <AudioInputControls />
                            <BackgroundAudioMixer 
                              audioContext={audioContext}
                              destinationNode={analyserNode}
                              isPlaying={isPlaying}
                            />
                          </div>

        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {onOpenVisuals && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenVisuals}
              className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
            >
              <Settings2 className="w-4 h-4" />
              <span className="text-xs hidden md:inline">Visuals</span>
            </Button>
          )}
          {recordingControls}
          <div className="hidden md:flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'
            }`} />
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {isPlaying ? 'Playing' : 'Ready'}
            </span>
          </div>
          {onFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onFullscreen}
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 md:w-auto md:h-auto"
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Main Frequency Display */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-baseline gap-2">
          <span className="text-7xl md:text-8xl font-thin tracking-tighter text-white tabular-nums">
            {frequency.toFixed(1)}
          </span>
          <span className="text-2xl text-cyan-400 font-light">Hz</span>
          <Dialog open={customFreqOpen} onOpenChange={setCustomFreqOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
              >
                <Edit3 className="w-6 h-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-white/10 text-white">
              <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Enter Custom Frequency</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCustomFreqOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </DialogTitle>
                </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  type="number"
                  placeholder="Enter frequency (20-20000 Hz)"
                  value={customFreqValue}
                  onChange={(e) => setCustomFreqValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomFreqSubmit()}
                  className="bg-white/5 border-white/10 text-white text-lg"
                  min={20}
                  max={20000}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCustomFreqOpen(false)} className="border-white/10 text-gray-300">
                    Cancel
                  </Button>
                  <Button onClick={handleCustomFreqSubmit} className="bg-cyan-600 hover:bg-cyan-700">
                    Set Frequency
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Frequency Slider - Logarithmic scale for better control */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-400">
          <span>{minFreq} Hz</span>
          <span>{maxFreq >= 1000 ? `${maxFreq/1000}k` : maxFreq} Hz</span>
        </div>
        <Slider
          value={[Math.log10(frequency)]}
          onValueChange={([val]) => setFrequency(Math.round(Math.pow(10, val) * 10) / 10)}
          min={Math.log10(minFreq)}
          max={Math.log10(maxFreq)}
          step={0.001}
          className="w-full"
        />
      </div>

      {/* Preset Frequencies */}
      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
        {presetFrequencies.map((preset) => (
          <motion.button
            key={preset.hz}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFrequency(preset.hz)}
            className={`p-3 rounded-xl border transition-all duration-300 ${
              Math.abs(frequency - preset.hz) < 1
                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <div className="text-sm font-medium">{preset.label}</div>
            <div className="text-xs opacity-60">{preset.desc}</div>
          </motion.button>
        ))}
      </div>

      {/* Controls Row */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        {/* Play Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={togglePlay}
            size="lg"
            className={`w-20 h-20 rounded-full transition-all duration-500 ${
              isPlaying
                ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 shadow-lg shadow-cyan-500/30'
                : 'bg-white/10 hover:bg-white/20 border border-white/20'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>
        </motion.div>

        {/* Upload Audio File */}
        <div className="flex flex-col items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>
          {audioFileName && (
            <span className="text-xs text-cyan-400 truncate max-w-[100px]">{audioFileName}</span>
          )}
        </div>

        {/* Waveform Selector */}
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-gray-400" />
          <Select value={waveType} onValueChange={setWaveType}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10">
              {waveforms.map((wave) => (
                <SelectItem 
                  key={wave.value} 
                  value={wave.value}
                  className="text-white hover:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{wave.icon}</span>
                    {wave.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 min-w-[180px]">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <Slider
            value={[volume * 100]}
            onValueChange={([val]) => setVolume(val / 100)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          <span className="text-sm text-gray-400 w-10 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Fine Tune Controls */}
      <div className="flex justify-center items-center gap-2 flex-wrap">
        {[-100, -10, -1, 1, 10, 100].map((delta) => (
          <Button
            key={delta}
            variant="outline"
            size="sm"
            onClick={() => setFrequency(Math.max(minFreq, Math.min(maxFreq, frequency + delta)))}
            className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            {delta > 0 ? '+' : ''}{delta}
          </Button>
        ))}
      </div>
      </div>
  );
}