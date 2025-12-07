import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from '@/api/base44Client';

export default function AISoundscapeGenerator({
  onApplyParameters,
  isPlaying
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [lastGenerated, setLastGenerated] = useState(null);

  const moods = [
    { value: 'calm', label: '🧘 Calm & Peaceful' },
    { value: 'energetic', label: '⚡ Energetic & Uplifting' },
    { value: 'meditative', label: '🕉️ Meditative & Spiritual' },
    { value: 'focus', label: '🎯 Focus & Concentration' },
    { value: 'sleep', label: '😴 Sleep & Relaxation' },
    { value: 'creative', label: '🎨 Creative & Inspiring' },
    { value: 'healing', label: '💚 Healing & Therapeutic' },
    { value: 'mysterious', label: '🌙 Mysterious & Ambient' },
  ];

  const genres = [
    { value: 'ambient', label: 'Ambient' },
    { value: 'drone', label: 'Drone' },
    { value: 'healing', label: 'Sound Healing' },
    { value: 'binaural', label: 'Binaural Beats' },
    { value: 'meditation', label: 'Meditation' },
    { value: 'nature', label: 'Nature-Inspired' },
    { value: 'electronic', label: 'Electronic' },
    { value: 'experimental', label: 'Experimental' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const prompt = `Generate a unique soundscape/audio synthesis configuration based on:
Mood: ${mood || 'not specified'}
Genre: ${genre || 'not specified'}
Description: ${description || 'user preference'}

Create a detailed audio configuration with:
1. Main frequency (20-2000 Hz) - choose based on mood and healing properties
2. Volume (0-1)
3. Wave type (sine, square, sawtooth, triangle)
4. Up to 3 additional frequency layers with their own frequency, volume, wave type
5. Visual style (fractal, tunnel, kaleidoscope, plasma, waveform, particles, geometric, spiral, matrix, nebula, rings, hexgrid, chladni, aurora, fireworks, mandala, liquid, electric, electrons, binary, seismograph)
6. Color palette (cyber, fire, nature, ocean, sunset, neon, aurora, lava, ice, candy, galaxy)
7. Speed (0.1-3)
8. Intensity (0.1-2)
9. Complexity (0.5-2)
10. Symmetry (2-12)
11. Bloom (0-1)
12. Binaural beats settings (enabled: boolean, frequency: 1-40 Hz for brainwave entrainment)
13. Isochronic tones settings (enabled: boolean, frequency: 1-40 Hz, depth: 0-1)

Consider:
- Healing frequencies (432 Hz, 528 Hz, etc.) for therapeutic moods
- Lower frequencies for calm/sleep, higher for energy/focus
- Binaural/isochronic for meditation and focus
- Visual aesthetics matching the mood
- Layered frequencies for richness

Return ONLY valid JSON with this exact structure:
{
  "mainFrequency": number,
  "volume": number,
  "waveType": "sine"|"square"|"sawtooth"|"triangle",
  "layers": [
    {"frequency": number, "volume": number, "waveType": "sine"|"square"|"sawtooth"|"triangle"}
  ],
  "visualStyle": string,
  "colorPalette": string,
  "speed": number,
  "intensity": number,
  "complexity": number,
  "symmetry": number,
  "bloom": number,
  "binaural": {"enabled": boolean, "frequency": number},
  "isochronic": {"enabled": boolean, "frequency": number, "depth": number},
  "explanation": "Brief explanation of the choices"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            mainFrequency: { type: "number" },
            volume: { type: "number" },
            waveType: { type: "string" },
            layers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  frequency: { type: "number" },
                  volume: { type: "number" },
                  waveType: { type: "string" }
                }
              }
            },
            visualStyle: { type: "string" },
            colorPalette: { type: "string" },
            speed: { type: "number" },
            intensity: { type: "number" },
            complexity: { type: "number" },
            symmetry: { type: "number" },
            bloom: { type: "number" },
            binaural: {
              type: "object",
              properties: {
                enabled: { type: "boolean" },
                frequency: { type: "number" }
              }
            },
            isochronic: {
              type: "object",
              properties: {
                enabled: { type: "boolean" },
                frequency: { type: "number" },
                depth: { type: "number" }
              }
            },
            explanation: { type: "string" }
          }
        }
      });

      setLastGenerated(response);
      onApplyParameters(response);
      
    } catch (error) {
      console.error('Failed to generate soundscape:', error);
      alert('Failed to generate soundscape. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs hidden md:inline">AI Generate</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            AI Soundscape Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Mood Selection */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Mood / Intention</label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select a mood..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10">
                {moods.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-white">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Genre Selection */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Genre / Style</label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select a genre..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10">
                {genres.map((g) => (
                  <SelectItem key={g.value} value={g.value} className="text-white">
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Description (Optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the soundscape you want... (e.g., 'gentle ocean waves with distant bells', 'deep space ambient with cosmic vibrations')"
              className="bg-white/5 border-white/10 text-white min-h-[80px]"
            />
          </div>

          {/* Last Generated Info */}
          {lastGenerated && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3"
            >
              <div className="text-xs text-purple-300 font-medium mb-1">Last Generated:</div>
              <div className="text-xs text-gray-300">{lastGenerated.explanation}</div>
            </motion.div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || (!mood && !genre && !description)}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Soundscape
              </>
            )}
          </Button>

          {isPlaying && (
            <p className="text-xs text-center text-amber-400">
              ⚠️ Currently playing. Generated soundscape will apply when you restart.
            </p>
          )}

          <p className="text-xs text-center text-gray-500">
            AI will create a unique audio configuration based on your preferences
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}