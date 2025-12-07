import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Loader2, Wand2, Save, Play } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function AISoundscapeGenerator({
  onApplyParameters,
  isPlaying,
  currentParameters,
  onApplyVisualStyle
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [masteringLoading, setMasteringLoading] = useState(false);
  const [visualGenLoading, setVisualGenLoading] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [mood, setMood] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [lastGenerated, setLastGenerated] = useState(null);
  const [assistantResponse, setAssistantResponse] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const queryClient = useQueryClient();

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
      // Map mainFrequency to frequency for compatibility
      const mappedParams = {
        ...response,
        frequency: response.mainFrequency
      };
      onApplyParameters(mappedParams);
      setShowSaveDialog(true);
      setSaveName(`${mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : 'Custom'} Soundscape`);
      
    } catch (error) {
      console.error('Failed to generate soundscape:', error);
      alert('Failed to generate soundscape. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMaster = async () => {
    if (!currentParameters?.frequency) {
      setAssistantResponse('⚠️ No audio parameters to master. Generate a soundscape first.');
      return;
    }
    
    setMasteringLoading(true);
    setAssistantResponse('');
    try {
      const prompt = `You are an expert audio mastering engineer. Analyze and optimize these audio parameters for the best listening experience:

Current Settings:
- Main Frequency: ${currentParameters.frequency} Hz
- Volume: ${currentParameters.volume || 0.5}
- Wave Type: ${currentParameters.waveType || 'sine'}
- Layers: ${currentParameters.layers?.length || 0} layers
- Speed: ${currentParameters.speed || 1}
- Intensity: ${currentParameters.intensity || 1}

Optimize for:
1. Frequency balance - ensure no frequency masking or conflicts
2. Loudness optimization - find the sweet spot for volume levels
3. Harmonic richness - adjust layers for pleasant harmonics
4. Dynamic range - balance intensity and bloom for depth

Return optimized parameters in JSON with the same structure as input, including explanation of changes made.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            mainFrequency: { type: "number" },
            volume: { type: "number" },
            intensity: { type: "number" },
            complexity: { type: "number" },
            bloom: { type: "number" },
            layers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  frequency: { type: "number" },
                  volume: { type: "number" }
                }
              }
            },
            explanation: { type: "string" }
          }
        }
      });

      // Apply optimized parameters
      const optimizedParams = {
        ...currentParameters,
        mainFrequency: response.mainFrequency,
        frequency: response.mainFrequency, // Map for compatibility
        volume: response.volume,
        intensity: response.intensity,
        complexity: response.complexity,
        bloom: response.bloom
      };

      if (response.layers?.length > 0 && currentParameters.layers?.length > 0) {
        optimizedParams.layers = response.layers.map((layer, idx) => ({
          ...(currentParameters.layers[idx] || {}),
          frequency: layer.frequency,
          volume: layer.volume
        }));
      }

      onApplyParameters(optimizedParams);
      setAssistantResponse(`✨ Mastering Complete: ${response.explanation}`);
      
    } catch (error) {
      console.error('Auto-mastering failed:', error);
      setAssistantResponse(`❌ Auto-mastering failed: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setMasteringLoading(false);
    }
  };

  const handleGenerateVisuals = async () => {
    if (!currentParameters) {
      alert('No audio playing. Generate a soundscape first.');
      return;
    }
    
    setVisualGenLoading(true);
    try {
      const prompt = `Based on these audio characteristics, suggest the perfect visual style and color palette:

Audio Analysis:
- Main Frequency: ${currentParameters.frequency} Hz (${currentParameters.frequency < 200 ? 'deep bass' : currentParameters.frequency < 600 ? 'low-mid' : currentParameters.frequency < 1200 ? 'mid' : 'high'})
- Wave Type: ${currentParameters.waveType}
- Complexity: ${currentParameters.complexity}
- Intensity: ${currentParameters.intensity}
- Has Layers: ${currentParameters.layers && currentParameters.layers.length > 0}

Consider:
- Low frequencies = flowing, organic visuals (liquid, nebula, aurora)
- High frequencies = sharp, geometric visuals (geometric, electric, binary)
- Complex waveforms = intricate patterns (fractal, mandala, chladni)
- High intensity = energetic visuals with bright colors
- Smooth waves = flowing visuals (plasma, waveform, tunnel)

Available visual styles: fractal, tunnel, kaleidoscope, plasma, waveform, particles, geometric, spiral, matrix, nebula, rings, hexgrid, chladni, aurora, fireworks, mandala, liquid, electric, electrons, binary, seismograph

Available color palettes: cyber, fire, nature, ocean, sunset, neon, aurora, lava, ice, candy, galaxy

Return JSON with visualStyle, colorPalette, and explanation.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            visualStyle: { type: "string" },
            colorPalette: { type: "string" },
            explanation: { type: "string" }
          }
        }
      });

      onApplyVisualStyle(response.visualStyle, response.colorPalette);
      setAssistantResponse(`🎨 Visual Match: ${response.explanation}`);
      
    } catch (error) {
      console.error('Visual generation failed:', error);
      alert('Visual generation failed. Please try again.');
    } finally {
      setVisualGenLoading(false);
    }
  };

  const handleAskAssistant = async () => {
    if (!currentParameters) {
      setAssistantResponse('No soundscape is currently active. Generate one first to get started!');
      return;
    }
    
    setAssistantLoading(true);
    try {
      const prompt = `You are a sound therapy and audio synthesis expert. Describe the current soundscape configuration and provide insights:

Current Configuration:
- Main Frequency: ${currentParameters.frequency} Hz
- Wave Type: ${currentParameters.waveType}
- Volume: ${currentParameters.volume}
- Layers: ${currentParameters.layers ? JSON.stringify(currentParameters.layers) : 'none'}
- Visual: ${currentParameters.visualStyle || 'not set'} with ${currentParameters.colorPalette || 'default'} palette
- Binaural: ${currentParameters.binauralEnabled ? `Yes (${currentParameters.binauralFreq} Hz)` : 'No'}
- Isochronic: ${currentParameters.isochronicEnabled ? `Yes (${currentParameters.isochronicFreq} Hz)` : 'No'}

Provide:
1. Description of what the user is hearing
2. Therapeutic/wellness benefits
3. Best use cases (meditation, focus, sleep, etc.)
4. Suggestions for improvement
5. Frequency healing properties if applicable

Be conversational and insightful. Keep it under 200 words.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      setAssistantResponse(response);
      
    } catch (error) {
      console.error('AI assistant failed:', error);
      setAssistantResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleSaveSoundscape = async () => {
    if (!lastGenerated || !saveName.trim()) {
      setAssistantResponse('⚠️ Please enter a name for your soundscape');
      return;
    }

    setSaveLoading(true);
    try {
      // Ensure parameters are properly structured for the entity
      const paramsToSave = {
        mainFrequency: lastGenerated.mainFrequency || lastGenerated.frequency || 432,
        volume: lastGenerated.volume || 0.5,
        waveType: lastGenerated.waveType || 'sine',
        layers: (lastGenerated.layers || []).map(layer => ({
          frequency: layer.frequency || 440,
          volume: layer.volume || 0.3,
          waveType: layer.waveType || 'sine',
          enabled: layer.enabled !== false
        })),
        visualStyle: lastGenerated.visualStyle || 'fractal',
        colorPalette: lastGenerated.colorPalette || 'cyber',
        speed: lastGenerated.speed || 1,
        intensity: lastGenerated.intensity || 1,
        complexity: lastGenerated.complexity || 1,
        symmetry: lastGenerated.symmetry || 4,
        bloom: lastGenerated.bloom || 0.5,
        binaural: {
          enabled: lastGenerated.binaural?.enabled || false,
          frequency: lastGenerated.binaural?.frequency || 10
        },
        isochronic: {
          enabled: lastGenerated.isochronic?.enabled || false,
          frequency: lastGenerated.isochronic?.frequency || 10,
          depth: lastGenerated.isochronic?.depth || 0.8
        }
      };

      await base44.entities.SavedSoundscape.create({
        name: saveName.trim(),
        mood: mood || '',
        genre: genre || '',
        description: description || '',
        parameters: paramsToSave,
        explanation: lastGenerated.explanation || ''
      });

      queryClient.invalidateQueries({ queryKey: ['saved-soundscapes'] });
      setShowSaveDialog(false);
      setAssistantResponse(`✅ Soundscape "${saveName}" saved to your library!`);
      setSaveName('');
    } catch (error) {
      console.error('Failed to save soundscape:', error);
      setAssistantResponse(`❌ Failed to save: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePreview = () => {
    if (lastGenerated) {
      const mappedParams = {
        ...lastGenerated,
        frequency: lastGenerated.mainFrequency
      };
      onApplyParameters(mappedParams);
      setAssistantResponse('▶️ Preview started! The soundscape is now playing.');
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
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            AI Soundscape Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4 overflow-y-auto pr-2">
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

          {/* AI Assistant Response */}
          {assistantResponse && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 max-h-48 overflow-y-auto"
            >
              <div className="text-xs text-cyan-300 font-medium mb-1">AI Assistant:</div>
              <div className="text-xs text-gray-300 whitespace-pre-wrap">{assistantResponse}</div>
            </motion.div>
          )}

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

          {/* AI Tools Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading || (!mood && !genre && !description)}
              className="col-span-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 gap-2"
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

            {/* Preview Button */}
            {lastGenerated && (
              <Button
                onClick={handlePreview}
                disabled={loading}
                className="col-span-2 bg-green-600 hover:bg-green-700 gap-2"
              >
                <Play className="w-4 h-4" />
                Preview Soundscape
              </Button>
            )}

            {/* Auto Master */}
            <Button
              onClick={handleAutoMaster}
              disabled={masteringLoading || !currentParameters}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2"
            >
              {masteringLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                '🎚️'
              )}
              <span className="text-xs">Auto Master</span>
            </Button>

            {/* Generate Visuals */}
            <Button
              onClick={handleGenerateVisuals}
              disabled={visualGenLoading || !currentParameters}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2"
            >
              {visualGenLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                '🎨'
              )}
              <span className="text-xs">Match Visuals</span>
            </Button>

            {/* Ask AI Assistant */}
            <Button
              onClick={handleAskAssistant}
              disabled={assistantLoading}
              variant="outline"
              className="col-span-2 bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2"
            >
              {assistantLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  💬 Ask AI About This Soundscape
                </>
              )}
            </Button>
          </div>

          {isPlaying && (
            <p className="text-xs text-center text-amber-400">
              ⚠️ Currently playing. Changes will apply when you restart.
            </p>
          )}

          <p className="text-xs text-center text-gray-500">
            AI-powered soundscape generation, mastering, and visual matching
          </p>

          {/* Save Dialog */}
          {showSaveDialog && lastGenerated && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Save className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">Save this soundscape?</span>
              </div>
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter a name..."
                className="bg-white/5 border-white/10 text-white mb-3"
                disabled={saveLoading}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveSoundscape}
                  disabled={saveLoading || !saveName.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {saveLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
                <Button
                  onClick={() => setShowSaveDialog(false)}
                  variant="outline"
                  className="border-white/10 text-gray-300 hover:bg-white/10"
                  disabled={saveLoading}
                >
                  Skip
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}