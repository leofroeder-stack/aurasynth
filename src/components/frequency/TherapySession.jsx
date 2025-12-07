import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Heart, Play, Pause, X, Loader2, CheckCircle2, TrendingUp, Clock, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function TherapySession({ 
  onApplyParameters,
  isPlaying,
  onTogglePlay,
  currentParameters
}) {
  const [open, setOpen] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionGoal, setSessionGoal] = useState('');
  const [sessionDuration, setSessionDuration] = useState(10);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('intro');
  const [sessionId, setSessionId] = useState(null);
  const [feedbackPrompt, setFeedbackPrompt] = useState(null);
  const [userFeeling, setUserFeeling] = useState(3);
  const [parameterHistory, setParameterHistory] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const queryClient = useQueryClient();
  const timerRef = useRef(null);
  const feedbackTimerRef = useRef(null);

  const goals = [
    { value: 'stress_reduction', label: '🧘 Stress Reduction', duration: 15 },
    { value: 'focus', label: '🎯 Focus Enhancement', duration: 20 },
    { value: 'sleep', label: '😴 Sleep Preparation', duration: 30 },
    { value: 'anxiety_relief', label: '💙 Anxiety Relief', duration: 20 },
    { value: 'meditation', label: '🕉️ Deep Meditation', duration: 25 },
    { value: 'energy_boost', label: '⚡ Energy Boost', duration: 10 },
    { value: 'creativity', label: '🎨 Creativity Flow', duration: 15 },
    { value: 'pain_relief', label: '🌿 Pain Management', duration: 20 },
  ];

  useEffect(() => {
    if (sessionActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          if (newTime >= sessionDuration * 60) {
            handleCompleteSession();
          }
          return newTime;
        });
      }, 1000);

      // Schedule feedback prompts
      feedbackTimerRef.current = setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance every interval
          promptFeedback();
        }
      }, 120000); // Every 2 minutes

      return () => {
        clearInterval(timerRef.current);
        clearInterval(feedbackTimerRef.current);
      };
    }
  }, [sessionActive, sessionDuration]);

  const startSession = async (goal) => {
    setLoading(true);
    try {
      const startTime = new Date().toISOString();
      
      // Create session record
      const session = await base44.entities.TherapySession.create({
        goal: goal,
        duration: sessionDuration,
        start_time: startTime,
        parameters_history: [],
        feedback: [],
        completion_status: 'ongoing'
      });

      setSessionId(session.id);
      setSessionGoal(goal);
      setSessionStartTime(startTime);
      setSessionActive(true);
      setElapsedTime(0);
      setCurrentPhase('intro');
      setParameterHistory([]);
      setFeedback([]);

      // Generate initial soundscape for the goal
      await generatePhaseParameters('intro', goal);
      
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePhaseParameters = async (phase, goal) => {
    try {
      const goalConfig = goals.find(g => g.value === goal);
      
      const prompt = `Generate therapeutic audio parameters for a ${goalConfig.label} session.
Current phase: ${phase}
Elapsed time: ${elapsedTime} seconds of ${sessionDuration * 60} total
User feedback: ${feedback.length > 0 ? feedback[feedback.length - 1].feeling + '/5' : 'none yet'}

Session phases:
- intro (0-20%): Gentle entry, establish base frequency
- buildup (20-40%): Gradually increase intensity
- peak (40-70%): Maximum therapeutic effect
- integration (70-90%): Consolidate benefits
- closure (90-100%): Gentle exit, prepare for return

Therapeutic guidelines by goal:
- stress_reduction: Low frequencies (100-300 Hz), theta/alpha waves (4-12 Hz), calming visuals
- focus: Mid frequencies (300-600 Hz), beta waves (14-30 Hz), geometric visuals
- sleep: Very low frequencies (50-150 Hz), delta waves (0.5-4 Hz), flowing visuals
- anxiety_relief: Grounding frequencies (174-396 Hz), slow binaural (4-8 Hz)
- meditation: Solfeggio frequencies (528, 852 Hz), theta waves (4-8 Hz)
- energy_boost: Higher frequencies (600-1000 Hz), gamma waves (30-40 Hz), bright colors
- creativity: Varied layers, alpha waves (8-12 Hz), complex fractals
- pain_relief: 174 Hz, 285 Hz, isochronic pulses

Return JSON with complete soundscape configuration optimized for this phase and goal.`;

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
            guidance: { type: "string" }
          }
        }
      });

      // Apply parameters
      const params = {
        ...response,
        frequency: response.mainFrequency,
        timestamp: Date.now(),
        phase: phase
      };

      onApplyParameters(params);
      
      // Record parameter change
      setParameterHistory(prev => [...prev, params]);

      // Start playing if not already
      if (!isPlaying) {
        onTogglePlay();
      }

    } catch (error) {
      console.error('Failed to generate parameters:', error);
    }
  };

  const promptFeedback = () => {
    setFeedbackPrompt(true);
  };

  const submitFeedback = async () => {
    const feedbackEntry = {
      timestamp: Date.now(),
      elapsed_seconds: elapsedTime,
      feeling: userFeeling,
      phase: currentPhase
    };

    setFeedback(prev => [...prev, feedbackEntry]);
    setFeedbackPrompt(false);

    // Adjust parameters based on feedback
    if (userFeeling < 3) {
      // User not feeling well, make adjustments
      await generatePhaseParameters(currentPhase, sessionGoal);
    }
  };

  const handleCompleteSession = async () => {
    setLoading(true);
    try {
      const endTime = new Date().toISOString();

      // Generate AI summary
      const summaryPrompt = `Analyze this therapeutic session and provide insights:

Goal: ${sessionGoal}
Duration: ${sessionDuration} minutes
Parameters used: ${parameterHistory.length} adjustments
Feedback collected: ${feedback.length} responses
Average user feeling: ${feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.feeling, 0) / feedback.length).toFixed(1) : 'N/A'}/5

Provide:
1. Session effectiveness analysis
2. What worked well
3. Recommendations for next session
4. Suggested session parameters to try

Keep it concise and actionable. 150 words max.`;

      const summaryResponse = await base44.integrations.Core.InvokeLLM({
        prompt: summaryPrompt
      });

      // Update session record
      await base44.entities.TherapySession.update(sessionId, {
        end_time: endTime,
        parameters_history: parameterHistory,
        feedback: feedback,
        effectiveness_rating: feedback.length > 0 ? 
          Math.round(feedback.reduce((sum, f) => sum + f.feeling, 0) / feedback.length) : 3,
        ai_summary: summaryResponse,
        completion_status: 'completed'
      });

      setSummary(summaryResponse);
      setSessionActive(false);
      queryClient.invalidateQueries({ queryKey: ['therapy-sessions'] });

    } catch (error) {
      console.error('Failed to complete session:', error);
      alert('Failed to save session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSession = async () => {
    if (sessionId) {
      await base44.entities.TherapySession.update(sessionId, {
        end_time: new Date().toISOString(),
        parameters_history: parameterHistory,
        feedback: feedback,
        completion_status: 'interrupted'
      });
    }
    setSessionActive(false);
    setSessionGoal('');
    setSummary(null);
    clearInterval(timerRef.current);
    clearInterval(feedbackTimerRef.current);
  };

  // Update phase based on progress
  useEffect(() => {
    if (!sessionActive) return;
    
    const progress = elapsedTime / (sessionDuration * 60);
    let newPhase = 'intro';
    
    if (progress < 0.2) newPhase = 'intro';
    else if (progress < 0.4) newPhase = 'buildup';
    else if (progress < 0.7) newPhase = 'peak';
    else if (progress < 0.9) newPhase = 'integration';
    else newPhase = 'closure';

    if (newPhase !== currentPhase) {
      setCurrentPhase(newPhase);
      generatePhaseParameters(newPhase, sessionGoal);
    }
  }, [elapsedTime, sessionActive, currentPhase, sessionGoal, sessionDuration]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (elapsedTime / (sessionDuration * 60)) * 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
        >
          <Heart className="w-4 h-4" />
          <span className="text-xs hidden md:inline">Therapy</span>
          {sessionActive && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              Therapeutic Session
            </span>
            {sessionActive && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStopSession}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4 pt-4">
            {!sessionActive && !summary ? (
              <>
                <p className="text-sm text-gray-400">
                  Select a therapeutic goal for a guided AI session
                </p>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Session Duration</label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[sessionDuration]}
                      onValueChange={([val]) => setSessionDuration(val)}
                      min={5}
                      max={60}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-lg font-medium text-cyan-400 w-16 text-right">
                      {sessionDuration}m
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {goals.map((goal) => (
                    <Button
                      key={goal.value}
                      onClick={() => startSession(goal.value)}
                      disabled={loading}
                      className="bg-gradient-to-br from-purple-600/20 to-cyan-600/20 hover:from-purple-600/30 hover:to-cyan-600/30 border border-purple-500/30 text-white h-auto py-3"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-sm">{goal.label}</span>
                      )}
                    </Button>
                  ))}
                </div>
              </>
            ) : sessionActive ? (
              <>
                {/* Active Session UI */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Progress Bar */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Session Progress</span>
                      <span className="text-lg font-medium text-cyan-400">
                        {formatTime(elapsedTime)} / {formatTime(sessionDuration * 60)}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Current Phase */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">Current Phase</span>
                    </div>
                    <div className="text-lg font-medium capitalize">{currentPhase}</div>
                  </div>

                  {/* Feedback Prompt */}
                  <AnimatePresence>
                    {feedbackPrompt && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <MessageCircle className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-medium text-cyan-300">How are you feeling?</span>
                        </div>
                        <div className="space-y-3">
                          <Slider
                            value={[userFeeling]}
                            onValueChange={([val]) => setUserFeeling(val)}
                            min={1}
                            max={5}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Not Good</span>
                            <span>Neutral</span>
                            <span>Great</span>
                          </div>
                          <Button
                            onClick={submitFeedback}
                            className="w-full bg-cyan-600 hover:bg-cyan-700"
                          >
                            Submit Feedback
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Adjustments</div>
                      <div className="text-xl font-medium">{parameterHistory.length}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Feedback</div>
                      <div className="text-xl font-medium">{feedback.length}</div>
                    </div>
                  </div>

                  <Button
                    onClick={handleCompleteSession}
                    variant="outline"
                    className="w-full border-white/10 text-gray-300 hover:bg-white/10"
                  >
                    End Session Early
                  </Button>
                </motion.div>
              </>
            ) : summary ? (
              <>
                {/* Post-Session Summary */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                    <span className="text-xl font-medium text-green-400">Session Complete!</span>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Session Stats</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-2xl font-medium text-cyan-400">{sessionDuration}</div>
                        <div className="text-xs text-gray-400">Minutes</div>
                      </div>
                      <div>
                        <div className="text-2xl font-medium text-purple-400">{parameterHistory.length}</div>
                        <div className="text-xs text-gray-400">Adjustments</div>
                      </div>
                      <div>
                        <div className="text-2xl font-medium text-pink-400">
                          {feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.feeling, 0) / feedback.length).toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">Avg. Rating</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="text-sm font-medium text-purple-300 mb-2">AI Analysis</div>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap">{summary}</div>
                  </div>

                  <Button
                    onClick={() => {
                      setSummary(null);
                      setOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                  >
                    Start New Session
                  </Button>
                </motion.div>
              </>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}