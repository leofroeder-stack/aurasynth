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
  const [realtimeHistory, setRealtimeHistory] = useState([]);
  const [environmentScore, setEnvironmentScore] = useState(null);
  const [frequencyBands, setFrequencyBands] = useState({ low: 0, mid: 0, high: 0 });
  const [heartRateEstimate, setHeartRateEstimate] = useState(null);
  const [activeTab, setActiveTab] = useState('analyze');
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationRef = useRef(null);
  const dataArrayRef = useRef(null);
  const historyIntervalRef = useRef(null);
  const peakHistoryRef = useRef([]);

  const getStressInfo = (level) => {
    if (level <= STRESS_THRESHOLDS.low.max) return { ...STRESS_THRESHOLDS.low, key: 'calm' };
    if (level <= STRESS_THRESHOLDS.moderate.max) return { ...STRESS_THRESHOLDS.moderate, key: 'moderate' };
    if (level <= STRESS_THRESHOLDS.elevated.max) return { ...STRESS_THRESHOLDS.elevated, key: 'elevated' };
    if (level <= STRESS_THRESHOLDS.high.max) return { ...STRESS_THRESHOLDS.high, key: 'high' };
    return { ...STRESS_THRESHOLDS.extreme, key: 'extreme' };
  };

  const detectNoisePattern = (dataArray, frequencyBands) => {
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const variance = dataArray.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / dataArray.length;
    const stdDev = Math.sqrt(variance);
    
    // Enhanced pattern detection
    const { low, mid, high } = frequencyBands;
    
    if (avg < 25 && stdDev < 15) return { type: 'quiet', desc: 'Silent environment', icon: '🌙' };
    if (low > mid * 1.5 && low > high * 2) return { type: 'rumble', desc: 'Low frequency rumble (traffic, HVAC)', icon: '🚗' };
    if (high > mid * 1.5 && high > low * 1.5) return { type: 'sharp', desc: 'High frequency noise (electronics)', icon: '📺' };
    if (stdDev > 70) return { type: 'chaotic', desc: 'Unpredictable noise bursts', icon: '⚡' };
    if (avg > 150 && stdDev < 35) return { type: 'constant', desc: 'Steady background noise', icon: '🔊' };
    if (stdDev > 25 && stdDev < 55) return { type: 'rhythmic', desc: 'Rhythmic or musical pattern', icon: '🎵' };
    if (mid > low && mid > high) return { type: 'speech', desc: 'Voice or conversation detected', icon: '🗣️' };
    return { type: 'mixed', desc: 'Variable mixed frequencies', icon: '🌊' };
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

  const analyzeFrequencyBands = (dataArray) => {
    const len = dataArray.length;
    const lowEnd = Math.floor(len * 0.1);
    const midEnd = Math.floor(len * 0.4);
    
    const low = dataArray.slice(0, lowEnd).reduce((a, b) => a + b, 0) / lowEnd;
    const mid = dataArray.slice(lowEnd, midEnd).reduce((a, b) => a + b, 0) / (midEnd - lowEnd);
    const high = dataArray.slice(midEnd).reduce((a, b) => a + b, 0) / (len - midEnd);
    
    return { low, mid, high };
  };

  const calculateEnvironmentScore = (stress, pattern, bands) => {
    // 0-100 score where higher is better (calmer)
    const stressScore = (1 - stress) * 40;
    const patternScore = pattern.type === 'quiet' ? 30 : pattern.type === 'rhythmic' ? 20 : pattern.type === 'chaotic' ? 5 : 15;
    const balanceScore = Math.max(0, 30 - Math.abs(bands.low - bands.mid) * 0.2 - Math.abs(bands.mid - bands.high) * 0.2);
    return Math.round(stressScore + patternScore + balanceScore);
  };

  const estimateStressFromAudio = (dataArray, prevPeaks) => {
    // Sophisticated multi-factor stress detection
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const max = Math.max(...dataArray);
    const variance = dataArray.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / dataArray.length;
    const stdDev = Math.sqrt(variance);
    
    // Sudden changes indicate stress
    const suddenChange = prevPeaks.length > 0 ? Math.abs(max - prevPeaks[prevPeaks.length - 1]) / 255 : 0;
    
    // High frequency content often correlates with stress
    const highFreqRatio = dataArray.slice(Math.floor(dataArray.length * 0.6)).reduce((a, b) => a + b, 0) / 
                         (dataArray.reduce((a, b) => a + b, 0) || 1);
    
    // Weighted stress calculation
    const intensity = avg / 255;
    const chaos = stdDev / 100;
    const spikes = suddenChange;
    const sharpness = highFreqRatio;
    
    const stress = Math.min(1, 
      intensity * 0.35 + 
      chaos * 0.25 + 
      spikes * 0.2 + 
      sharpness * 0.2
    );
    
    return stress;
  };

  const generateRecommendations = (stress, pattern) => {
    const filtered = FREQUENCY_RECOMMENDATIONS.filter(
      rec => stress >= rec.stressRange[0] && stress <= rec.stressRange[1]
    );
    
    // Sort by relevance to stress level and pattern
    filtered.sort((a, b) => {
      const aMid = (a.stressRange[0] + a.stressRange[1]) / 2;
      const bMid = (b.stressRange[0] + b.stressRange[1]) / 2;
      return Math.abs(stress - aMid) - Math.abs(stress - bMid);
    });
    
    return filtered.slice(0, 4);
  };

  const getVisualSuggestions = (stressKey) => {
    return VISUAL_SUGGESTIONS[stressKey] || VISUAL_SUGGESTIONS.moderate;
  };

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096; // Higher resolution for better analysis
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      peakHistoryRef.current = [];
      setRealtimeHistory([]);
      
      setIsListening(true);
      
      // Record history every second
      historyIntervalRef.current = setInterval(() => {
        setRealtimeHistory(prev => {
          const newEntry = {
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            stress: stressLevel,
            env: environmentScore || 50
          };
          const updated = [...prev, newEntry].slice(-30); // Keep last 30 seconds
          return updated;
        });
      }, 1000);
      
      const analyze = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const dataArray = Array.from(dataArrayRef.current);
        
        // Analyze frequency bands
        const bands = analyzeFrequencyBands(dataArray);
        setFrequencyBands(bands);
        
        // Calculate stress using sophisticated algorithm
        const stress = estimateStressFromAudio(dataArray, peakHistoryRef.current);
        
        // Track peaks for sudden change detection
        const max = Math.max(...dataArray);
        peakHistoryRef.current = [...peakHistoryRef.current.slice(-10), max];
        
        const pattern = detectNoisePattern(dataArray, bands);
        const envScore = calculateEnvironmentScore(stress, pattern, bands);
        
        setStressLevel(stress);
        setNoisePattern(pattern);
        setEnvironmentScore(envScore);
        setDominantFrequency(findDominantFrequency(dataArray, audioContextRef.current.sampleRate));
        setRecommendations(generateRecommendations(stress, pattern));
        
        animationRef.current = requestAnimationFrame(analyze);
      };
      
      analyze();
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  }, [stressLevel, environmentScore]);

  const stopListening = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (historyIntervalRef.current) {
      clearInterval(historyIntervalRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    
    // Save to history with more data
    if (stressLevel > 0) {
      setAnalysisHistory(prev => [...prev.slice(-9), {
        time: new Date().toLocaleTimeString(),
        stress: stressLevel,
        pattern: noisePattern?.type || 'unknown',
        envScore: environmentScore,
        avgStress: realtimeHistory.length > 0 
          ? (realtimeHistory.reduce((a, b) => a + b.stress, 0) / realtimeHistory.length).toFixed(2)
          : stressLevel.toFixed(2)
      }]);
    }
  }, [stressLevel, noisePattern, environmentScore, realtimeHistory]);

  const applyRecommendation = (rec) => {
    onApplyFrequency(rec.frequency);
    onApplyVisualStyle(rec.visualStyle, rec.colorPalette);
    setIsOpen(false);
    stopListening();
  };

  const applyVisualSuggestion = (suggestion) => {
    onApplyVisualStyle(suggestion.style, suggestion.palette);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (historyIntervalRef.current) clearInterval(historyIntervalRef.current);
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const stressInfo = getStressInfo(stressLevel);
  const visualSuggestions = getVisualSuggestions(stressInfo.key);

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
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
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

          <div className="space-y-4 pt-2">
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
                >
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-white/5">
                      <TabsTrigger value="analyze" className="data-[state=active]:bg-cyan-500/20 text-xs">
                        <Brain className="w-3 h-3 mr-1" /> Analysis
                      </TabsTrigger>
                      <TabsTrigger value="history" className="data-[state=active]:bg-cyan-500/20 text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" /> Trends
                      </TabsTrigger>
                      <TabsTrigger value="visuals" className="data-[state=active]:bg-cyan-500/20 text-xs">
                        <Eye className="w-3 h-3 mr-1" /> Visuals
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="analyze" className="space-y-4 mt-4">
                      {/* Environment Score */}
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <div className="text-4xl font-thin text-cyan-400">{environmentScore || '--'}</div>
                          <div className="text-xs text-gray-500">Environment Score</div>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div className="text-center">
                          <div className={`text-2xl font-light ${stressInfo.color}`}>{stressInfo.label}</div>
                          <div className="text-xs text-gray-500">Stress Level</div>
                        </div>
                      </div>

                      {/* Stress Level Meter */}
                      <div className="space-y-2">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${stressInfo.bg}`}
                            animate={{ width: `${stressLevel * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">{stressInfo.recommendation}</p>
                      </div>

                      {/* Frequency Bands */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                          <div className="text-xs text-gray-500 mb-1">Low</div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-blue-400" animate={{ width: `${Math.min(100, frequencyBands.low / 2)}%` }} />
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                          <div className="text-xs text-gray-500 mb-1">Mid</div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-green-400" animate={{ width: `${Math.min(100, frequencyBands.mid / 2)}%` }} />
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                          <div className="text-xs text-gray-500 mb-1">High</div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-purple-400" animate={{ width: `${Math.min(100, frequencyBands.high / 2)}%` }} />
                          </div>
                        </div>
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
                            <span>{noisePattern?.icon || '🔊'}</span>
                            Pattern
                          </div>
                          <div className="text-sm font-light text-fuchsia-400 capitalize">
                            {noisePattern?.type || 'analyzing'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{noisePattern?.desc}</div>
                        </div>
                      </div>

                      {/* Recommendations */}
                      {recommendations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm text-gray-400 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-cyan-400" />
                            Recommended Frequencies
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {recommendations.map((rec, i) => (
                              <motion.button
                                key={rec.frequency}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => applyRecommendation(rec)}
                                className="bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/50 rounded-xl p-3 text-left transition-all"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="text-sm font-medium text-white">{rec.frequency} Hz</div>
                                    <div className="text-xs text-gray-500">{rec.label}</div>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">{rec.effect}</div>
                                <div className="text-xs text-cyan-400 mt-2">Apply + {rec.visualStyle} →</div>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4 mt-4">
                      {/* Real-time stress chart */}
                      <div className="space-y-2">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider">Real-time Stress Level</h4>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10 h-32">
                          {realtimeHistory.length > 2 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={realtimeHistory}>
                                <defs>
                                  <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                  labelStyle={{ color: '#9ca3af' }}
                                />
                                <Area type="monotone" dataKey="stress" stroke="#06b6d4" fill="url(#stressGradient)" strokeWidth={2} />
                              </AreaChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                              Collecting data...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Environment score chart */}
                      <div className="space-y-2">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider">Environment Quality</h4>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10 h-32">
                          {realtimeHistory.length > 2 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={realtimeHistory}>
                                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                  labelStyle={{ color: '#9ca3af' }}
                                />
                                <Line type="monotone" dataKey="env" stroke="#a855f7" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                              Collecting data...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats summary */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                          <div className="text-lg font-light text-cyan-400">
                            {realtimeHistory.length > 0 
                              ? (realtimeHistory.reduce((a, b) => a + b.stress, 0) / realtimeHistory.length * 100).toFixed(0) + '%'
                              : '--'}
                          </div>
                          <div className="text-xs text-gray-500">Avg Stress</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                          <div className="text-lg font-light text-green-400">
                            {realtimeHistory.length > 0 
                              ? (Math.min(...realtimeHistory.map(h => h.stress)) * 100).toFixed(0) + '%'
                              : '--'}
                          </div>
                          <div className="text-xs text-gray-500">Lowest</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                          <div className="text-lg font-light text-red-400">
                            {realtimeHistory.length > 0 
                              ? (Math.max(...realtimeHistory.map(h => h.stress)) * 100).toFixed(0) + '%'
                              : '--'}
                          </div>
                          <div className="text-xs text-gray-500">Highest</div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="visuals" className="space-y-4 mt-4">
                      <h4 className="text-sm text-gray-400 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-fuchsia-400" />
                        Recommended Visuals for {stressInfo.label} Stress
                      </h4>
                      <div className="space-y-2">
                        {visualSuggestions.map((suggestion, i) => (
                          <motion.button
                            key={suggestion.style}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => applyVisualSuggestion(suggestion)}
                            className="w-full bg-white/5 hover:bg-fuchsia-500/10 border border-white/10 hover:border-fuchsia-500/50 rounded-xl p-4 text-left transition-all"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium text-white capitalize">{suggestion.style}</div>
                                <div className="text-xs text-gray-500 capitalize">Palette: {suggestion.palette}</div>
                              </div>
                              <div className="text-xs text-fuchsia-400">Apply →</div>
                            </div>
                            <div className="text-xs text-gray-400 mt-2">{suggestion.reason}</div>
                          </motion.button>
                        ))}
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Why These Visuals?</h5>
                        <p className="text-xs text-gray-400">
                          {stressInfo.key === 'calm' && 'Gentle, nature-inspired visuals maintain your peaceful state without overstimulation.'}
                          {stressInfo.key === 'moderate' && 'Balanced patterns with soothing colors help ease tension and promote relaxation.'}
                          {stressInfo.key === 'elevated' && 'Grounding cymatics and hypnotic spirals help release accumulated stress.'}
                          {stressInfo.key === 'high' && 'Cool-toned, structured visuals create a sense of order and calm.'}
                          {stressInfo.key === 'extreme' && 'Simple, predictable patterns reduce sensory overload and promote stability.'}
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>

            {/* History when not listening */}
            {!isListening && analysisHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider">Session History</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {analysisHistory.slice().reverse().map((entry, i) => (
                    <div key={i} className="flex justify-between items-center text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2">
                      <span>{entry.time}</span>
                      <span className={getStressInfo(parseFloat(entry.avgStress || entry.stress)).color}>
                        {getStressInfo(parseFloat(entry.avgStress || entry.stress)).label}
                      </span>
                      <span className="capitalize">{entry.pattern}</span>
                      <span className="text-cyan-400">{entry.envScore || '--'}</span>
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