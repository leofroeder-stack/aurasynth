import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Sparkles, Palette, Zap, Layers, RotateCcw, Sun } from "lucide-react";
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
  setBloom
}) {
  const visualStyles = [
        { value: 'fractal', label: 'Fractal', icon: '✧' },
        { value: 'tunnel', label: 'Tunnel', icon: '◎' },
        { value: 'kaleidoscope', label: 'Kaleidoscope', icon: '❋' },
        { value: 'plasma', label: 'Plasma', icon: '◈' },
        { value: 'waveform', label: 'Waveform', icon: '∿' },
        { value: 'particles', label: 'Particles', icon: '✦' },
        { value: 'geometric', label: 'Geometric', icon: '⬡' },
        { value: 'spiral', label: 'Spiral', icon: '🌀' },
        { value: 'matrix', label: 'Matrix', icon: '▦' },
        { value: 'nebula', label: 'Nebula', icon: '☁' },
        { value: 'rings', label: 'Rings', icon: '◉' },
        { value: 'hexgrid', label: 'Hex Grid', icon: '⬢' },
        { value: 'chladni', label: 'Chladni', icon: '◫' },
        { value: 'aurora', label: 'Aurora', icon: '🌌' },
        { value: 'fireworks', label: 'Fireworks', icon: '🎆' },
        { value: 'mandala', label: 'Mandala', icon: '☸' },
        { value: 'liquid', label: 'Liquid', icon: '💧' },
        { value: 'electric', label: 'Electric', icon: '⚡' },
      ];

  const colorPalettes = [
        { value: 'cyber', label: 'Cyber', colors: ['#00f0ff', '#ff00aa', '#7b00ff'] },
        { value: 'fire', label: 'Fire', colors: ['#ff4400', '#ff8800', '#ffcc00'] },
        { value: 'nature', label: 'Nature', colors: ['#00ff88', '#88ff00', '#00ffcc'] },
        { value: 'ocean', label: 'Ocean', colors: ['#0044ff', '#0088ff', '#00ccff'] },
        { value: 'sunset', label: 'Sunset', colors: ['#ff6644', '#ff44aa', '#ffaa44'] },
        { value: 'neon', label: 'Neon', colors: ['#ff00ff', '#00ffff', '#ffff00'] },
        { value: 'aurora', label: 'Aurora', colors: ['#00ff99', '#6600ff', '#00ccff'] },
        { value: 'lava', label: 'Lava', colors: ['#ff0000', '#ff6600', '#330000'] },
        { value: 'ice', label: 'Ice', colors: ['#aaffff', '#4488ff', '#ffffff'] },
        { value: 'candy', label: 'Candy', colors: ['#ff69b4', '#ff1493', '#ff88cc'] },
        { value: 'galaxy', label: 'Galaxy', colors: ['#9933ff', '#ff33cc', '#3366ff'] },
      ];

  const sliderConfig = [
    { key: 'speed', label: 'Speed', icon: Zap, value: speed, setValue: setSpeed, min: 0.1, max: 3, step: 0.1 },
    { key: 'intensity', label: 'Intensity', icon: Sun, value: intensity, setValue: setIntensity, min: 0.1, max: 2, step: 0.1 },
    { key: 'complexity', label: 'Complexity', icon: Layers, value: complexity, setValue: setComplexity, min: 0.5, max: 2, step: 0.1 },
    { key: 'symmetry', label: 'Symmetry', icon: RotateCcw, value: symmetry, setValue: setSymmetry, min: 2, max: 12, step: 1 },
    { key: 'bloom', label: 'Bloom', icon: Sparkles, value: bloom, setValue: setBloom, min: 0, max: 1, step: 0.05 },
  ];

  return (
    <div className="space-y-6">
      {/* Visual Style Selection */}
      <div className="space-y-3">
        <Label className="text-sm text-gray-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Visual Style
        </Label>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {visualStyles.map((style) => (
            <motion.button
              key={style.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setVisualStyle(style.value)}
              className={`p-3 rounded-xl border transition-all duration-300 ${
                visualStyle === style.value
                  ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="text-xl mb-1">{style.icon}</div>
              <div className="text-xs">{style.label}</div>
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
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {colorPalettes.map((palette) => (
            <motion.button
              key={palette.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setColorPalette(palette.value)}
              className={`p-3 rounded-xl border transition-all duration-300 ${
                colorPalette === palette.value
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex justify-center gap-1 mb-2">
                {palette.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-300">{palette.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Parameter Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {sliderConfig.map((config) => {
          const Icon = config.icon;
          return (
            <div key={config.key} className="space-y-2">
              <Label className="text-sm text-gray-400 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon className="w-3 h-3" />
                  {config.label}
                </span>
                <span className="text-cyan-400 text-xs tabular-nums">
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
  );
}