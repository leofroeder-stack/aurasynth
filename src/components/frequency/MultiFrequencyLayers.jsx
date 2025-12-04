import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Layers, Volume2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MultiFrequencyLayers({ 
  layers, 
  setLayers, 
  isPlaying 
}) {
  const [open, setOpen] = useState(false);

  const addLayer = () => {
    const newLayer = {
      id: Date.now(),
      frequency: 440,
      volume: 0.5,
      waveType: 'sine',
      enabled: true
    };
    setLayers([...layers, newLayer]);
  };

  const removeLayer = (id) => {
    setLayers(layers.filter(l => l.id !== id));
  };

  const updateLayer = (id, updates) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const waveforms = [
    { value: 'sine', label: 'Sine', icon: '∿' },
    { value: 'square', label: 'Square', icon: '⊓' },
    { value: 'sawtooth', label: 'Saw', icon: '⋀' },
    { value: 'triangle', label: 'Tri', icon: '△' },
  ];

  const presetFrequencies = [
    { hz: 174, label: '174 Hz' },
    { hz: 285, label: '285 Hz' },
    { hz: 396, label: '396 Hz' },
    { hz: 417, label: '417 Hz' },
    { hz: 432, label: '432 Hz' },
    { hz: 440, label: '440 Hz' },
    { hz: 528, label: '528 Hz' },
    { hz: 639, label: '639 Hz' },
    { hz: 741, label: '741 Hz' },
    { hz: 852, label: '852 Hz' },
    { hz: 963, label: '963 Hz' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
        >
          <Layers className="w-4 h-4" />
          <span className="text-xs hidden md:inline">Layers</span>
          {layers.length > 0 && (
            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">
              {layers.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Frequency Layers
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          <AnimatePresence>
            {layers.map((layer, index) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`bg-white/5 rounded-xl p-4 border ${
                  layer.enabled ? 'border-cyan-500/30' : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateLayer(layer.id, { enabled: !layer.enabled })}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        layer.enabled ? 'bg-cyan-400' : 'bg-gray-600'
                      }`}
                    />
                    <span className="text-sm font-medium">Layer {index + 1}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLayer(layer.id)}
                    className="h-7 w-7 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Frequency */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Frequency</span>
                    <span className="text-sm text-cyan-400 font-mono">{layer.frequency} Hz</span>
                  </div>
                  <Slider
                    value={[Math.log10(layer.frequency)]}
                    onValueChange={([val]) => updateLayer(layer.id, { 
                      frequency: Math.round(Math.pow(10, val)) 
                    })}
                    min={Math.log10(20)}
                    max={Math.log10(2000)}
                    step={0.01}
                    disabled={!layer.enabled}
                    className="w-full"
                  />
                  <div className="flex flex-wrap gap-1">
                    {presetFrequencies.slice(0, 6).map((preset) => (
                      <button
                        key={preset.hz}
                        onClick={() => updateLayer(layer.id, { frequency: preset.hz })}
                        disabled={!layer.enabled}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          layer.frequency === preset.hz
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        } disabled:opacity-50`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volume & Waveform Row */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <Volume2 className="w-3 h-3 text-gray-400" />
                    <Slider
                      value={[layer.volume * 100]}
                      onValueChange={([val]) => updateLayer(layer.id, { volume: val / 100 })}
                      min={0}
                      max={100}
                      disabled={!layer.enabled}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-400 w-8">{Math.round(layer.volume * 100)}%</span>
                  </div>
                  <Select 
                    value={layer.waveType} 
                    onValueChange={(val) => updateLayer(layer.id, { waveType: val })}
                    disabled={!layer.enabled}
                  >
                    <SelectTrigger className="w-24 h-8 bg-white/5 border-white/10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      {waveforms.map((wave) => (
                        <SelectItem key={wave.value} value={wave.value} className="text-white">
                          <span className="flex items-center gap-1">
                            <span>{wave.icon}</span>
                            <span>{wave.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {layers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No additional layers</p>
              <p className="text-xs mt-1">Add layers to play multiple frequencies</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/10">
          <Button
            onClick={addLayer}
            disabled={layers.length >= 5}
            className="w-full bg-cyan-600 hover:bg-cyan-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Layer {layers.length >= 5 && '(Max 5)'}
          </Button>
          {isPlaying && layers.length > 0 && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Changes apply in real-time
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}