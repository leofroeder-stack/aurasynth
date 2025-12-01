import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Sparkles, Palette, Zap, Layers, RotateCcw, Sun, Aperture, Waves, Circle } from "lucide-react";
import { motion } from "framer-motion";

export default function VisualControls({
  visualStyle,
  setVisualStyle,
  colorPalette,
  setColorPalette,
  speed,
  setSpeed,
  intensity,
  setIntensity,
  complexity,
  setComplexity,
  symmetry,
  setSymmetry,
  bloom,
  setBloom,
  chromaticAberration,
  setChromaticAberration,
  noiseAmount,
  setNoiseAmount,
  pulseReactivity,
  setPulseReactivity
}) {
  const visualStyles = [
    { value: 'fractal', label: 'Fractal', icon: '✧' },
    { value: 'tunnel', label: 'Tunnel', icon: '◎' },
    { value: 'kaleidoscope', label: 'Kaleidoscope', icon: '❋' },
    { value: 'plasma', label: 'Plasma', icon: '◈' },
    { value: 'waveform', label: 'Waveform', icon: '∿' },
    { value: 'particles', label: 'Particles', icon: '✦' },
    { value: 'geometric', label: 'Geometric', icon: '⬡' },
    { value: 'volumetric', label: 'Volumetric', icon: '◉' },
    { value: 'nebula', label: 'Nebula', icon: '☁' },
  ];

  const colorPalettes = [
    { value: 'cyber', label: 'Cyber', colors: ['#00f0ff', '#ff00aa', '#7b00ff'] },
    { value: 'fire', label: 'Fire', colors: ['#ff4400', '#ff8800', '#ffcc00'] },
    { value: 'nature', label: 'Nature', colors: ['#00ff88', '#88ff00', '#00ffcc'] },
    { value: 'ocean', label: 'Ocean', colors: ['#0044ff', '#0088ff', '#00ccff'] },
    { value: 'sunset', label: 'Sunset', colors: ['#ff6644', '#ff44aa', '#ffaa44'] },
    { value: 'neon', label: 'Neon', colors: ['#ff00ff', '#00ffff', '#ffff00'] },
    { value: 'vaporwave', label: 'Vapor', colors: ['#ff71ce', '#01cdfe', '#05ffa1'] },
    { value: 'aurora', label: 'Aurora', colors: ['#00ff87', '#60efff', '#ff00ff'] },
  ];

  const mainSliders = [
    { key: 'speed', label: 'Speed', icon: Zap, value: speed, setValue: setSpeed, min: 0.1, max: 3, step: 0.1 },
    { key: 'intensity', label: 'Intensity', icon: Sun, value: intensity, setValue: setIntensity, min: 0.1, max: 2, step: 0.1 },
    { key: 'complexity', label: 'Complexity', icon: Layers, value: complexity, setValue: setComplexity, min: 0.5, max: 2, step: 0.1 },
    { key: 'symmetry', label: 'Symmetry', icon: RotateCcw, value: symmetry, setValue: setSymmetry, min: 2, max: 12, step: 1 },
  ];

  const effectSliders = [
    { key: 'bloom', label: 'Bloom', icon: Sparkles, value: bloom, setValue: setBloom, min: 0, max: 1, step: 0.05 },
    { key: 'chromatic', label: 'Chromatic', icon: Aperture, value: chromaticAberration, setValue: setChromaticAberration, min: 0, max: 1, step: 0.05 },
    { key: 'noise', label: 'Film Grain', icon: Circle, value: noiseAmount, setValue: setNoiseAmount, min: 0, max: 1, step: 0.05 },
    { key: 'pulse', label: 'Audio Pulse', icon: Waves, value: pulseReactivity, setValue: setPulseReactivity, min: 0, max: 1, step: 0.05 },
  ];

  return (
    <div className="space-y-6">
      {/* Visual Style Selection */}
      <div className="space-y-3">
        <Label className="text-sm text-gray-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Visual Style
        </Label>
        <div className="grid grid-cols-5 md:grid-cols-9 gap-2">
          {visualStyles.map((style) => (
            <motion.button
              key={style.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setVisualStyle(style.value)}
              className={`p-2 md:p-3 rounded-xl border transition-all duration-300 ${
                visualStyle === style.value
                  ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="text-lg md:text-xl mb-1">{style.icon}</div>
              <div className="text-[10px] md:text-xs truncate">{style.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Color Palette Selection */}
      <div className="space-y-3">
        <Label className="text-sm text-gray-400 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Color Palette
        </Label>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {colorPalettes.map((palette) => (
            <motion.button
              key={palette.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setColorPalette(palette.value)}
              className={`p-2 md:p-3 rounded-xl border transition-all duration-300 ${
                colorPalette === palette.value
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex justify-center gap-0.5 mb-1">
                {palette.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 md:w-3 md:h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="text-[10px] md:text-xs text-gray-300">{palette.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Parameter Sliders */}
      <div className="space-y-3">
        <Label className="text-sm text-gray-400">Animation Parameters</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mainSliders.map((config) => {
            const Icon = config.icon;
            return (
              <div key={config.key} className="space-y-2">
                <Label className="text-xs text-gray-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                  <span className="text-cyan-400 tabular-nums">
                    {config.value.toFixed(config.key === 'symmetry' ? 0 : 1)}
                  </span>
                </Label>
                <Slider
                  value={[config.value]}
                  onValueChange={([val]) => config.setValue(val)}
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Post-Processing Effects */}
      <div className="space-y-3">
        <Label className="text-sm text-gray-400">Post-Processing Effects</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {effectSliders.map((config) => {
            const Icon = config.icon;
            return (
              <div key={config.key} className="space-y-2">
                <Label className="text-xs text-gray-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                  <span className="text-cyan-400 tabular-nums">
                    {config.value.toFixed(2)}
                  </span>
                </Label>
                <Slider
                  value={[config.value]}
                  onValueChange={([val]) => config.setValue(val)}
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}