import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from '@/api/base44Client';

export default function DynamicVisualSync({
  analyserNode,
  isPlaying,
  onApplyVisualStyle,
  currentFrequency,
  currentWaveType
}) {
  const [enabled, setEnabled] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const intervalRef = useRef(null);
  const audioDataBuffer = useRef([]);

  const analyzeAudio = async () => {
    if (!analyserNode || !isPlaying || audioDataBuffer.current.length === 0) return;

    setAnalyzing(true);
    try {
      // Calculate audio characteristics from buffer
      const avgData = audioDataBuffer.current.reduce((acc, frame) => {
        frame.forEach((val, i) => {
          acc[i] = (acc[i] || 0) + val;
        });
        return acc;
      }, []).map(val => val / audioDataBuffer.current.length);

      // Analyze frequency distribution
      const lowFreq = avgData.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      const midFreq = avgData.slice(10, 20).reduce((a, b) => a + b, 0) / 10;
      const highFreq = avgData.slice(20, 32).reduce((a, b) => a + b, 0) / 10;
      
      const totalEnergy = avgData.reduce((a, b) => a + b, 0) / avgData.length;
      const variance = avgData.reduce((acc, val) => acc + Math.pow(val - totalEnergy, 2), 0) / avgData.length;
      const dynamicRange = Math.max(...avgData) - Math.min(...avgData);

      const prompt = `Analyze this real-time audio and suggest matching visuals:

Audio Characteristics:
- Main Frequency: ${currentFrequency} Hz
- Wave Type: ${currentWaveType}
- Low Frequencies (bass): ${(lowFreq * 100).toFixed(1)}%
- Mid Frequencies: ${(midFreq * 100).toFixed(1)}%
- High Frequencies: ${(highFreq * 100).toFixed(1)}%
- Energy Level: ${(totalEnergy * 100).toFixed(1)}%
- Variance: ${variance.toFixed(3)} (smoothness)
- Dynamic Range: ${dynamicRange.toFixed(3)}

Analysis:
${lowFreq > 0.6 ? '- Strong bass presence suggests flowing, organic visuals' : ''}
${highFreq > 0.6 ? '- High frequency content suggests sharp, geometric visuals' : ''}
${variance < 0.01 ? '- Very smooth/constant signal suggests calm, meditative visuals' : ''}
${dynamicRange > 0.7 ? '- High dynamic range suggests energetic, explosive visuals' : ''}

Available styles: fractal, tunnel, kaleidoscope, plasma, waveform, particles, geometric, spiral, matrix, nebula, rings, hexgrid, chladni, aurora, fireworks, mandala, liquid, electric, electrons, binary, seismograph

Available palettes: cyber, fire, nature, ocean, sunset, neon, aurora, lava, ice, candy, galaxy

Choose visuals that match the audio's energy and character. Return JSON with visualStyle, colorPalette, and brief reason.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            visualStyle: { type: "string" },
            colorPalette: { type: "string" },
            reason: { type: "string" }
          }
        }
      });

      onApplyVisualStyle(response.visualStyle, response.colorPalette);
      setLastUpdate(response.reason);
      
      // Clear buffer after analysis
      audioDataBuffer.current = [];
    } catch (error) {
      console.error('Dynamic visual analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Collect audio data continuously
  useEffect(() => {
    if (!enabled || !analyserNode || !isPlaying) return;

    const collectData = () => {
      const dataArray = new Uint8Array(32);
      analyserNode.getByteFrequencyData(dataArray);
      const normalized = Array.from(dataArray).map(v => v / 255);
      
      audioDataBuffer.current.push(normalized);
      
      // Keep buffer at max 100 frames (about 1.6 seconds at 60fps)
      if (audioDataBuffer.current.length > 100) {
        audioDataBuffer.current.shift();
      }
    };

    const animationInterval = setInterval(collectData, 16);

    return () => clearInterval(animationInterval);
  }, [enabled, analyserNode, isPlaying]);

  // Trigger AI analysis periodically
  useEffect(() => {
    if (!enabled || !isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Analyze every 8 seconds
    intervalRef.current = setInterval(analyzeAudio, 8000);

    // Initial analysis after 3 seconds
    const initialTimeout = setTimeout(analyzeAudio, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(initialTimeout);
    };
  }, [enabled, isPlaying, currentFrequency, currentWaveType]);

  const toggleSync = () => {
    setEnabled(!enabled);
    if (!enabled) {
      audioDataBuffer.current = [];
      setLastUpdate('');
    }
  };

  return (
    <>
      <Button
        onClick={toggleSync}
        variant="ghost"
        size="sm"
        className={`gap-2 ${
          enabled 
            ? 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20' 
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        {analyzing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
        <span className="text-xs hidden md:inline">
          {enabled ? 'AI Sync On' : 'AI Sync'}
        </span>
        {enabled && (
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
        )}
      </Button>

      <AnimatePresence>
        {enabled && lastUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-2 bg-purple-500/20 border border-purple-500/30 rounded-lg backdrop-blur-sm"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
              <div className="text-xs text-purple-200">{lastUpdate}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}