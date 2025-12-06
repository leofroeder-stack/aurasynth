import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Palette, Zap, Layers, RotateCcw, Sun, Shuffle, RotateCw, X, Star } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from '@/api/base44Client';

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
  onClose
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
      { value: 'electrons', label: 'Electrons', icon: '⚛' },
      { value: 'ai-imagination', label: 'AI Mind', icon: '🧠' },
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

    const randomizeSettings = () => {
      setSpeed(Math.round((0.1 + Math.random() * 2.9) * 10) / 10);
      setIntensity(Math.round((0.1 + Math.random() * 1.9) * 10) / 10);
      setComplexity(Math.round((0.5 + Math.random() * 1.5) * 10) / 10);
      setSymmetry(Math.floor(2 + Math.random() * 10));
      setBloom(Math.round(Math.random() * 20) / 20);
    };

    const resetToDefaults = () => {
      setSpeed(1);
      setIntensity(1);
      setComplexity(1);
      setSymmetry(4);
      setBloom(0.5);
    };

    const randomizeAll = () => {
      const randomStyle = visualStyles[Math.floor(Math.random() * visualStyles.length)];
      const randomPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
      setVisualStyle(randomStyle.value);
      setColorPalette(randomPalette.value);
      randomizeSettings();
    };

    const saveAsDefault = async () => {
      try {
        await base44.auth.updateMe({
          default_visual_style: visualStyle,
          default_color_palette: colorPalette
        });
        alert('Saved as default visual preference!');
      } catch (error) {
        console.error('Failed to save default:', error);
        alert('Failed to save default');
      }
    };

  const sliderConfig = [
    { key: 'speed', label: 'Speed', icon: Zap, value: speed, setValue: setSpeed, min: 0.1, max: 3, step: 0.1 },
    { key: 'intensity', label: 'Intensity', icon: Sun, value: intensity, setValue: setIntensity, min: 0.1, max: 2, step: 0.1 },
    { key: 'complexity', label: 'Complexity', icon: Layers, value: complexity, setValue: setComplexity, min: 0.5, max: 2, step: 0.1 },
    { key: 'symmetry', label: 'Symmetry', icon: RotateCcw, value: symmetry, setValue: setSymmetry, min: 2, max: 12, step: 1 },
    { key: 'bloom', label: 'Bloom', icon: Sparkles, value: bloom, setValue: setBloom, min: 0, max: 1, step: 0.05 },
  ];

  return (
    <div className="space-y-6">
      {/* Close Button */}
      {onClose && (
        <div className="flex justify-end -mt-2 -mr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

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

                      {/* Quick Actions */}
                      <div className="flex justify-center gap-2 pt-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={saveAsDefault}
                          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 gap-2"
                        >
                          <Star className="w-3 h-3" />
                          Save as Default
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={randomizeSettings}
                          className="border-white/10 text-gray-300 hover:bg-white/10 hover:text-white gap-2"
                        >
                          <Shuffle className="w-3 h-3" />
                          Randomize Settings
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={randomizeAll}
                          className="border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-500/10 gap-2"
                        >
                          <Shuffle className="w-3 h-3" />
                          Randomize All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetToDefaults}
                          className="border-white/10 text-gray-300 hover:bg-white/10 hover:text-white gap-2"
                        >
                          <RotateCw className="w-3 h-3" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  );
                }