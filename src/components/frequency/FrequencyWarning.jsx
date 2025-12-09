import React from 'react';
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FrequencyWarning({ frequency, volume }) {
  const getWarning = () => {
    // Negative frequencies
    if (frequency < 0) {
      return {
        level: 'danger',
        message: 'Negative frequencies are experimental and may produce unpredictable results. Use with caution.',
      };
    }
    
    // Infrasound (below 20 Hz)
    if (frequency < 20 && frequency > 0) {
      return {
        level: 'danger',
        message: 'Infrasound frequencies below 20 Hz can cause nausea, disorientation, anxiety, and physical discomfort. Limit exposure time.',
      };
    }
    
    // Very low frequencies that can affect heart rhythm
    if (frequency >= 7 && frequency < 13) {
      return {
        level: 'warning',
        message: 'This frequency range (7-13 Hz) may affect heart rhythm and cause drowsiness. Use at low volume.',
      };
    }
    
    // Ultrasound (above 20,000 Hz)
    if (frequency > 20000) {
      return {
        level: 'danger',
        message: 'Ultrasound frequencies above 20 kHz can damage hearing even if inaudible. Keep volume low and limit exposure.',
      };
    }
    
    // High frequencies that can damage hearing
    if (frequency > 12000 && volume > 0.7) {
      return {
        level: 'warning',
        message: 'High frequencies above 12 kHz at high volume can cause hearing fatigue and damage. Reduce volume.',
      };
    }
    
    // Resonant frequency of human eyeballs (18-20 Hz)
    if (frequency >= 18 && frequency <= 20) {
      return {
        level: 'warning',
        message: 'This frequency range can resonate with human eyeballs causing visual distortions. Use briefly.',
      };
    }
    
    return null;
  };

  const warning = getWarning();

  if (!warning) return null;

  const colors = {
    danger: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: 'text-red-500',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: 'text-yellow-500',
    },
  };

  const style = colors[warning.level];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className={`${style.bg} ${style.border} border rounded-xl p-4 flex items-start gap-3`}
      >
        <AlertTriangle className={`w-5 h-5 ${style.icon} shrink-0 mt-0.5`} />
        <div className="flex-1">
          <div className={`text-sm ${style.text} leading-relaxed`}>
            {warning.message}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}