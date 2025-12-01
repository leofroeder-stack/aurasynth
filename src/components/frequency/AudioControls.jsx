import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Volume2, Waves } from "lucide-react";
import { motion } from "framer-motion";

export default function AudioControls({ 
  frequency, 
  setFrequency, 
  volume, 
  setVolume, 
  waveType, 
  setWaveType, 
  isPlaying, 
  togglePlay 
}) {
  const waveforms = [
    { value: 'sine', label: 'Sine', icon: '∿' },
    { value: 'square', label: 'Square', icon: '⊓' },
    { value: 'sawtooth', label: 'Sawtooth', icon: '⋀' },
    { value: 'triangle', label: 'Triangle', icon: '△' },
  ];

  const presetFrequencies = [
    { hz: 432, label: '432 Hz', desc: 'Healing' },
    { hz: 440, label: '440 Hz', desc: 'Concert A' },
    { hz: 528, label: '528 Hz', desc: 'Love' },
    { hz: 639, label: '639 Hz', desc: 'Connection' },
    { hz: 741, label: '741 Hz', desc: 'Awakening' },
    { hz: 852, label: '852 Hz', desc: 'Intuition' },
  ];

  return (
    <div className="space-y-8">
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
        </div>
      </motion.div>

      {/* Frequency Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-400">
          <span>20 Hz</span>
          <span>2000 Hz</span>
        </div>
        <Slider
          value={[frequency]}
          onValueChange={([val]) => setFrequency(val)}
          min={20}
          max={2000}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Preset Frequencies */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
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
      <div className="flex justify-center gap-2">
        {[-10, -1, -0.1, 0.1, 1, 10].map((delta) => (
          <Button
            key={delta}
            variant="outline"
            size="sm"
            onClick={() => setFrequency(Math.max(20, Math.min(2000, frequency + delta)))}
            className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            {delta > 0 ? '+' : ''}{delta}
          </Button>
        ))}
      </div>
    </div>
  );
}