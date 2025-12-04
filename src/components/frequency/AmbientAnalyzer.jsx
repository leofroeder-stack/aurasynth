import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, MicOff, Activity, Waves, Zap, X, TrendingUp, Eye, Volume2, Brain, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart, Tooltip } from 'recharts';

const STRESS_THRESHOLDS = {
  low: { max: 0.25, label: 'Calm', color: 'text-green-400', bg: 'bg-green-400', recommendation: 'Your environment is peaceful. Maintain with alpha waves for sustained calm.' },
  moderate: { max: 0.45, label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-400', recommendation: 'Some environmental noise detected. Theta waves can help you relax and center.' },
  elevated: { max: 0.65, label: 'Elevated', color: 'text-orange-400', bg: 'bg-orange-400', recommendation: 'Elevated stress patterns detected. Delta frequencies recommended for deep relaxation.' },
  high: { max: 0.85, label: 'High', color: 'text-red-400', bg: 'bg-red-400', recommendation: 'High stress environment. Deep healing frequencies and calming visuals suggested.' },
  extreme: { max: 1, label: 'Extreme', color: 'text-red-500', bg: 'bg-red-500', recommendation: 'Very high stress levels. Immediate calming intervention recommended.' }
};

const FREQUENCY_RECOMMENDATIONS = [
  { frequency: 432, label: 'Universal Healing', effect: 'Reduces anxiety, promotes harmony', stressRange: [0, 0.3], visualStyle: 'aurora', colorPalette: 'nature' },
  { frequency: 528, label: 'Love & DNA Repair', effect: 'Transformation and miracles', stressRange: [0, 0.4], visualStyle: 'mandala', colorPalette: 'aurora' },
  { frequency: 396, label: 'Liberation', effect: 'Releases fear and guilt', stressRange: [0.3, 0.6], visualStyle: 'nebula', colorPalette: 'galaxy' },
  { frequency: 285, label: 'Tissue Healing', effect: 'Regenerates and heals tissue', stressRange: [0.4, 0.7], visualStyle: 'liquid', colorPalette: 'ocean' },
  { frequency: 174, label: 'Pain Reduction', effect: 'Natural anesthetic, reduces pain', stressRange: [0.5, 0.8], visualStyle: 'chladni', colorPalette: 'ice' },
  { frequency: 40, label: 'Gamma Clarity', effect: 'Focus and cognitive enhancement', stressRange: [0.2, 0.5], visualStyle: 'geometric', colorPalette: 'cyber' },
  { frequency: 7.83, label: 'Schumann Resonance', effect: 'Earth\'s frequency, grounding', stressRange: [0.3, 0.7], visualStyle: 'plasma', colorPalette: 'nature' },
  { frequency: 111, label: 'Cell Regeneration', effect: 'Deep healing and regeneration', stressRange: [0.6, 1], visualStyle: 'spiral', colorPalette: 'sunset' },
  { frequency: 639, label: 'Heart Connection', effect: 'Harmonizes relationships', stressRange: [0.2, 0.5], visualStyle: 'kaleidoscope', colorPalette: 'candy' },
  { frequency: 852, label: 'Intuition', effect: 'Awakens inner strength', stressRange: [0.1, 0.4], visualStyle: 'fractal', colorPalette: 'galaxy' },
];

const VISUAL_SUGGESTIONS = {
  calm: [
    { style: 'aurora', palette: 'nature', reason: 'Gentle waves maintain peaceful state' },
    { style: 'nebula', palette: 'ocean', reason: 'Soft cosmic clouds for meditation' },
  ],
  moderate: [
    { style: 'mandala', palette: 'aurora', reason: 'Sacred geometry promotes balance' },
    { style: 'liquid', palette: 'ocean', reason: 'Fluid motion calms the mind' },
  ],
  elevated: [
    { style: 'chladni', palette: 'ice', reason: 'Cymatics patterns ground energy' },
    { style: 'spiral', palette: 'sunset', reason: 'Hypnotic motion releases tension' },
  ],
  high: [
    { style: 'plasma', palette: 'ice', reason: 'Cool tones reduce mental heat' },
    { style: 'rings', palette: 'ocean', reason: 'Concentric patterns center focus' },
  ],
  extreme: [
    { style: 'waveform', palette: 'ice', reason: 'Simple patterns reduce overstimulation' },
    { style: 'geometric', palette: 'ocean', reason: 'Structured visuals create stability' },
  ]
};

export default function AmbientAnalyzer({ onApplyFrequency, onApplyVisualStyle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [stressLevel, setStressLevel] = useState(0);
  const [dominantFrequency, setDominantFrequency] = useState(null);
  const [noisePattern, setNoisePattern] = useState('analyzing');
  const [recommendations, setRecommendations] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationRef = useRef(null);
  const dataArrayRef = useRef(null);

  const getStressInfo = (level) => {
    if (level <= STRESS_THRESHOLDS.low.max) return STRESS_THRESHOLDS.low;
    if (level <= STRESS_THRESHOLDS.moderate.max) return STRESS_THRESHOLDS.moderate;
    if (level <= STRESS_THRESHOLDS.elevated.max) return STRESS_THRESHOLDS.elevated;
    return STRESS_THRESHOLDS.high;
  };

  const detectNoisePattern = (dataArray) => {
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const variance = dataArray.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / dataArray.length;
    const stdDev = Math.sqrt(variance);
    
    if (avg < 30 && stdDev < 20) return 'quiet';
    if (stdDev > 60) return 'chaotic';
    if (avg > 150 && stdDev < 40) return 'constant';
    if (stdDev > 30 && stdDev < 60) return 'rhythmic';
    return 'mixed';
  };

  const findDominantFrequency = (dataArray, sampleRate) => {
    let maxIndex = 0;
    let maxValue = 0;
    for (let i = 1; i < dataArray.length / 2; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }
    const nyquist = sampleRate / 2;
    const frequency = (maxIndex / (dataArray.length / 2)) * nyquist;
    return Math.round(frequency);
  };

  const generateRecommendations = (stress, pattern) => {
    const filtered = FREQUENCY_RECOMMENDATIONS.filter(
      rec => stress >= rec.stressRange[0] && stress <= rec.stressRange[1]
    );
    
    // Sort by relevance to stress level
    filtered.sort((a, b) => {
      const aMid = (a.stressRange[0] + a.stressRange[1]) / 2;
      const bMid = (b.stressRange[0] + b.stressRange[1]) / 2;
      return Math.abs(stress - aMid) - Math.abs(stress - bMid);
    });
    
    return filtered.slice(0, 3);
  };

  const getVisualRecommendation = (stress, pattern) => {
    if (stress < 0.3) return { style: 'aurora', palette: 'nature' };
    if (stress < 0.5) return { style: 'nebula', palette: 'ocean' };
    if (stress < 0.7) return { style: 'mandala', palette: 'aurora' };
    return { style: 'chladni', palette: 'ice' };
  };

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      setIsListening(true);
      
      const analyze = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const dataArray = Array.from(dataArrayRef.current);
        
        // Calculate stress from audio intensity and variance
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const max = Math.max(...dataArray);
        const variance = dataArray.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / dataArray.length;
        
        // Normalize stress level (0-1)
        const intensity = avg / 255;
        const chaos = Math.sqrt(variance) / 128;
        const stress = Math.min(1, (intensity * 0.6 + chaos * 0.4));
        
        setStressLevel(stress);
        setNoisePattern(detectNoisePattern(dataArray));
        setDominantFrequency(findDominantFrequency(dataArray, audioContextRef.current.sampleRate));
        setRecommendations(generateRecommendations(stress, detectNoisePattern(dataArray)));
        
        animationRef.current = requestAnimationFrame(analyze);
      };
      
      analyze();
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    
    // Save to history
    if (stressLevel > 0) {
      setAnalysisHistory(prev => [...prev.slice(-4), {
        time: new Date().toLocaleTimeString(),
        stress: stressLevel,
        pattern: noisePattern
      }]);
    }
  }, [stressLevel, noisePattern]);

  const applyRecommendation = (rec) => {
    onApplyFrequency(rec.frequency);
    const visual = getVisualRecommendation(stressLevel, noisePattern);
    onApplyVisualStyle(visual.style, visual.palette);
    setIsOpen(false);
    stopListening();
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const stressInfo = getStressInfo(stressLevel);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 gap-2"
      >
        <Activity className="w-4 h-4" />
        <span className="text-xs hidden md:inline">AI Analyzer</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) stopListening(); }}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                AI Frequency Analyzer
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setIsOpen(false); stopListening(); }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Mic Control */}
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isListening ? stopListening : startListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-red-500/20 border-2 border-red-500 text-red-400' 
                    : 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </motion.button>
            </div>

            <p className="text-center text-sm text-gray-400">
              {isListening ? 'Analyzing ambient sound...' : 'Tap to start listening'}
            </p>

            {/* Analysis Results */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Stress Level Meter */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Stress Level</span>
                      <span className={stressInfo.color}>{stressInfo.label}</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${stressInfo.bg.replace('/20', '')}`}
                        animate={{ width: `${stressLevel * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{stressInfo.recommendation}</p>
                  </div>

                  {/* Analysis Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <Waves className="w-3 h-3" />
                        Dominant Freq
                      </div>
                      <div className="text-lg font-light text-cyan-400">
                        {dominantFrequency ? `${dominantFrequency} Hz` : '-- Hz'}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <Zap className="w-3 h-3" />
                        Pattern
                      </div>
                      <div className="text-lg font-light text-fuchsia-400 capitalize">
                        {noisePattern}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm text-gray-400 flex items-center gap-2">
                        <span className="text-cyan-400">✦</span>
                        Recommended Frequencies
                      </h4>
                      <div className="space-y-2">
                        {recommendations.map((rec, i) => (
                          <motion.button
                            key={rec.frequency}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => applyRecommendation(rec)}
                            className="w-full bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/50 rounded-xl p-3 text-left transition-all"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium text-white">{rec.frequency} Hz</div>
                                <div className="text-xs text-gray-500">{rec.label}</div>
                              </div>
                              <div className="text-xs text-cyan-400">Apply →</div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{rec.effect}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* History */}
            {!isListening && analysisHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider">Recent Analysis</h4>
                <div className="space-y-1">
                  {analysisHistory.map((entry, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2">
                      <span>{entry.time}</span>
                      <span className={getStressInfo(entry.stress).color}>
                        {getStressInfo(entry.stress).label}
                      </span>
                      <span className="capitalize">{entry.pattern}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}