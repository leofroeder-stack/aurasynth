import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Plus, Trash2, Volume2, Waves, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SoundscapeEditor({ 
  currentParameters, 
  onApplyChanges,
  isPlaying 
}) {
  const [open, setOpen] = useState(false);
  const [editedParams, setEditedParams] = useState(null);

  React.useEffect(() => {
    if (open && currentParameters) {
      setEditedParams({
        ...currentParameters,
        layers: currentParameters.layers || []
      });
    }
  }, [open, currentParameters]);

  const waveforms = [
    { value: 'sine', label: 'Sine', icon: '∿' },
    { value: 'square', label: 'Square', icon: '⊓' },
    { value: 'sawtooth', label: 'Sawtooth', icon: '⋀' },
    { value: 'triangle', label: 'Triangle', icon: '△' },
  ];

  const updateMainParam = (key, value) => {
    setEditedParams(prev => ({ ...prev, [key]: value }));
  };

  const updateLayer = (index, key, value) => {
    setEditedParams(prev => ({
      ...prev,
      layers: prev.layers.map((layer, i) => 
        i === index ? { ...layer, [key]: value } : layer
      )
    }));
  };

  const addLayer = () => {
    setEditedParams(prev => ({
      ...prev,
      layers: [...prev.layers, {
        id: Date.now(),
        frequency: 440,
        volume: 0.3,
        waveType: 'sine',
        enabled: true
      }]
    }));
  };

  const removeLayer = (index) => {
    setEditedParams(prev => ({
      ...prev,
      layers: prev.layers.filter((_, i) => i !== index)
    }));
  };

  const toggleLayer = (index) => {
    setEditedParams(prev => ({
      ...prev,
      layers: prev.layers.map((layer, i) => 
        i === index ? { ...layer, enabled: !layer.enabled } : layer
      )
    }));
  };

  const handleApply = () => {
    if (editedParams) {
      onApplyChanges(editedParams);
      setOpen(false);
    }
  };

  if (!currentParameters) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
        >
          <Edit className="w-4 h-4" />
          <span className="text-xs hidden md:inline">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-cyan-400" />
              Soundscape Editor
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

        {editedParams && (
          <Tabs defaultValue="main" className="flex-1 flex flex-col min-h-0">
            <TabsList className="bg-white/5 border-b border-white/10">
              <TabsTrigger value="main">Main Tone</TabsTrigger>
              <TabsTrigger value="layers">Layers ({editedParams.layers.length})</TabsTrigger>
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="beats">Beats</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 pr-4">
              {/* Main Tone Tab */}
              <TabsContent value="main" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Frequency</label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={editedParams.frequency || editedParams.mainFrequency || 440}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updateMainParam('frequency', val);
                          updateMainParam('mainFrequency', val);
                        }}
                        min={20}
                        max={20000}
                        className="bg-white/5 border-white/10 text-white w-32"
                      />
                      <span className="text-sm text-gray-400">Hz</span>
                    </div>
                    <Slider
                      value={[Math.log10(editedParams.frequency || editedParams.mainFrequency || 440)]}
                      onValueChange={([val]) => {
                        const freq = Math.round(Math.pow(10, val) * 10) / 10;
                        updateMainParam('frequency', freq);
                        updateMainParam('mainFrequency', freq);
                      }}
                      min={Math.log10(20)}
                      max={Math.log10(20000)}
                      step={0.001}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 flex items-center justify-between">
                      <span>Volume</span>
                      <span className="text-cyan-400">{Math.round((editedParams.volume || 0.5) * 100)}%</span>
                    </label>
                    <Slider
                      value={[(editedParams.volume || 0.5) * 100]}
                      onValueChange={([val]) => updateMainParam('volume', val / 100)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Wave Type</label>
                    <Select 
                      value={editedParams.waveType || 'sine'} 
                      onValueChange={(val) => updateMainParam('waveType', val)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10">
                        {waveforms.map((wave) => (
                          <SelectItem key={wave.value} value={wave.value} className="text-white">
                            {wave.icon} {wave.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Layers Tab */}
              <TabsContent value="layers" className="space-y-4 mt-4">
                <AnimatePresence>
                  {editedParams.layers.map((layer, index) => (
                    <motion.div
                      key={layer.id || index}
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
                            onClick={() => toggleLayer(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              layer.enabled ? 'bg-cyan-400' : 'bg-gray-600'
                            }`}
                          />
                          <span className="text-sm font-medium">Layer {index + 1}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLayer(index)}
                          className="h-7 w-7 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            value={layer.frequency}
                            onChange={(e) => updateLayer(index, 'frequency', parseFloat(e.target.value))}
                            min={20}
                            max={20000}
                            disabled={!layer.enabled}
                            className="bg-white/5 border-white/10 text-white w-32"
                          />
                          <span className="text-sm text-gray-400">Hz</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Volume2 className="w-3 h-3 text-gray-400" />
                          <Slider
                            value={[layer.volume * 100]}
                            onValueChange={([val]) => updateLayer(index, 'volume', val / 100)}
                            min={0}
                            max={100}
                            disabled={!layer.enabled}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-400 w-8">{Math.round(layer.volume * 100)}%</span>
                        </div>

                        <Select 
                          value={layer.waveType} 
                          onValueChange={(val) => updateLayer(index, 'waveType', val)}
                          disabled={!layer.enabled}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-white/10">
                            {waveforms.map((wave) => (
                              <SelectItem key={wave.value} value={wave.value} className="text-white">
                                {wave.icon} {wave.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Button
                  onClick={addLayer}
                  disabled={editedParams.layers.length >= 5}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Layer {editedParams.layers.length >= 5 && '(Max 5)'}
                </Button>
              </TabsContent>

              {/* Visual Tab */}
              <TabsContent value="visual" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 flex items-center justify-between">
                    <span>Speed</span>
                    <span className="text-cyan-400">{editedParams.speed?.toFixed(1) || 1.0}</span>
                  </label>
                  <Slider
                    value={[editedParams.speed || 1]}
                    onValueChange={([val]) => updateMainParam('speed', val)}
                    min={0.1}
                    max={3}
                    step={0.1}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 flex items-center justify-between">
                    <span>Intensity</span>
                    <span className="text-cyan-400">{editedParams.intensity?.toFixed(1) || 1.0}</span>
                  </label>
                  <Slider
                    value={[editedParams.intensity || 1]}
                    onValueChange={([val]) => updateMainParam('intensity', val)}
                    min={0.1}
                    max={2}
                    step={0.1}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 flex items-center justify-between">
                    <span>Complexity</span>
                    <span className="text-cyan-400">{editedParams.complexity?.toFixed(1) || 1.0}</span>
                  </label>
                  <Slider
                    value={[editedParams.complexity || 1]}
                    onValueChange={([val]) => updateMainParam('complexity', val)}
                    min={0.5}
                    max={2}
                    step={0.1}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 flex items-center justify-between">
                    <span>Symmetry</span>
                    <span className="text-cyan-400">{Math.round(editedParams.symmetry || 4)}</span>
                  </label>
                  <Slider
                    value={[editedParams.symmetry || 4]}
                    onValueChange={([val]) => updateMainParam('symmetry', val)}
                    min={2}
                    max={12}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 flex items-center justify-between">
                    <span>Bloom</span>
                    <span className="text-cyan-400">{editedParams.bloom?.toFixed(2) || 0.5}</span>
                  </label>
                  <Slider
                    value={[editedParams.bloom || 0.5]}
                    onValueChange={([val]) => updateMainParam('bloom', val)}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                </div>
              </TabsContent>

              {/* Beats Tab */}
              <TabsContent value="beats" className="space-y-4 mt-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">Binaural Beats</label>
                    <button
                      onClick={() => updateMainParam('binauralEnabled', !editedParams.binauralEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        editedParams.binauralEnabled ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        editedParams.binauralEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  {editedParams.binauralEnabled && (
                    <div>
                      <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                        <span>Frequency</span>
                        <span className="text-cyan-400">{editedParams.binauralFreq || 10} Hz</span>
                      </label>
                      <Slider
                        value={[editedParams.binauralFreq || 10]}
                        onValueChange={([val]) => updateMainParam('binauralFreq', val)}
                        min={1}
                        max={40}
                        step={1}
                      />
                    </div>
                  )}
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">Isochronic Tones</label>
                    <button
                      onClick={() => updateMainParam('isochronicEnabled', !editedParams.isochronicEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        editedParams.isochronicEnabled ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        editedParams.isochronicEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  {editedParams.isochronicEnabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                          <span>Frequency</span>
                          <span className="text-cyan-400">{editedParams.isochronicFreq || 10} Hz</span>
                        </label>
                        <Slider
                          value={[editedParams.isochronicFreq || 10]}
                          onValueChange={([val]) => updateMainParam('isochronicFreq', val)}
                          min={1}
                          max={40}
                          step={1}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                          <span>Depth</span>
                          <span className="text-cyan-400">{editedParams.isochronicDepth?.toFixed(2) || 0.8}</span>
                        </label>
                        <Slider
                          value={[editedParams.isochronicDepth || 0.8]}
                          onValueChange={([val]) => updateMainParam('isochronicDepth', val)}
                          min={0}
                          max={1}
                          step={0.1}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>

            <div className="pt-4 border-t border-white/10 flex gap-2">
              <Button
                onClick={() => setOpen(false)}
                variant="outline"
                className="flex-1 border-white/10 text-gray-300 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 gap-2"
              >
                <Save className="w-4 h-4" />
                Apply Changes
              </Button>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}