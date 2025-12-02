import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, X } from "lucide-react";

const beatPresets = [
  { name: 'Deep Sleep', freq: 2, type: 'delta' },
  { name: 'Relaxation', freq: 6, type: 'theta' },
  { name: 'Meditation', freq: 8, type: 'alpha' },
  { name: 'Focus', freq: 14, type: 'beta' },
  { name: 'Creativity', freq: 10, type: 'alpha' },
  { name: 'Energy', freq: 20, type: 'beta' },
  { name: 'Peak Performance', freq: 40, type: 'gamma' },
];

export default function BeatsControls({ 
  binauralEnabled, 
  setBinauralEnabled,
  binauralFreq,
  setBinauralFreq,
  isochronicEnabled,
  setIsochronicEnabled,
  isochronicFreq,
  setIsochronicFreq,
  isochronicDepth,
  setIsochronicDepth
}) {
  const [open, setOpen] = useState(false);

  const applyPreset = (preset) => {
    setBinauralFreq(preset.freq);
    setIsochronicFreq(preset.freq);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 ${binauralEnabled || isochronicEnabled ? 'text-purple-400 bg-purple-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
        >
          <Brain className="w-4 h-4" />
          <span className="text-xs">Beats</span>
          {(binauralEnabled || isochronicEnabled) && (
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Brainwave Entrainment
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

        <div className="space-y-6 pt-4">
          {/* Presets */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {beatPresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="bg-white/5 border-white/10 text-gray-300 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/50"
                >
                  {preset.name} ({preset.freq}Hz)
                </Button>
              ))}
            </div>
          </div>

          {/* Binaural Beats */}
          <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Binaural Beats</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Different frequencies in each ear create perceived beat
                </p>
              </div>
              <Switch
                checked={binauralEnabled}
                onCheckedChange={setBinauralEnabled}
              />
            </div>
            
            {binauralEnabled && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Beat Frequency</span>
                  <span className="text-purple-400">{binauralFreq} Hz</span>
                </div>
                <Slider
                  value={[binauralFreq]}
                  onValueChange={([val]) => setBinauralFreq(val)}
                  min={1}
                  max={40}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 Hz (Delta)</span>
                  <span>40 Hz (Gamma)</span>
                </div>
              </div>
            )}
          </div>

          {/* Isochronic Tones */}
          <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Isochronic Tones</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Rhythmic pulses of sound at target frequency
                </p>
              </div>
              <Switch
                checked={isochronicEnabled}
                onCheckedChange={setIsochronicEnabled}
              />
            </div>
            
            {isochronicEnabled && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pulse Frequency</span>
                    <span className="text-purple-400">{isochronicFreq} Hz</span>
                  </div>
                  <Slider
                    value={[isochronicFreq]}
                    onValueChange={([val]) => setIsochronicFreq(val)}
                    min={1}
                    max={40}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pulse Depth</span>
                    <span className="text-purple-400">{Math.round(isochronicDepth * 100)}%</span>
                  </div>
                  <Slider
                    value={[isochronicDepth * 100]}
                    onValueChange={([val]) => setIsochronicDepth(val / 100)}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Delta (1-4 Hz):</strong> Deep sleep, healing</p>
            <p><strong>Theta (4-8 Hz):</strong> Meditation, creativity</p>
            <p><strong>Alpha (8-14 Hz):</strong> Relaxation, focus</p>
            <p><strong>Beta (14-30 Hz):</strong> Alertness, concentration</p>
            <p><strong>Gamma (30-40 Hz):</strong> Peak awareness, cognition</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}