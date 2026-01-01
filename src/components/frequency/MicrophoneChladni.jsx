import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mic, MicOff, X } from "lucide-react";
import { motion } from "framer-motion";

export default function MicrophoneChladni() {
  const [open, setOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationRef = useRef(null);

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      source.connect(analyserRef.current);
      setIsActive(true);
      renderChladni();
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Please allow microphone access to use this feature');
    }
  };

  const stopMicrophone = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsActive(false);
  };

  const renderChladni = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate audio characteristics
      let sum = 0;
      let bass = 0;
      let mid = 0;
      let high = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
        if (i < bufferLength / 4) bass += dataArray[i];
        else if (i < bufferLength / 2) mid += dataArray[i];
        else high += dataArray[i];
      }
      
      const average = sum / bufferLength;
      bass = bass / (bufferLength / 4);
      mid = mid / (bufferLength / 4);
      high = high / (bufferLength / 2);
      
      // Normalize
      const intensity = average / 255;
      const bassNorm = bass / 255;
      const midNorm = mid / 255;
      const highNorm = high / 255;
      
      // Find dominant frequency
      let maxIndex = 0;
      let maxValue = 0;
      for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > maxValue) {
          maxValue = dataArray[i];
          maxIndex = i;
        }
      }
      const dominantFreq = (maxIndex * audioContextRef.current.sampleRate) / (analyserRef.current.fftSize * 2);
      
      // Clear with fade for trails
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
      ctx.fillRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2;
      const time = Date.now() / 1000;
      
      // Chladni pattern parameters driven by audio
      const m = 2 + bassNorm * 4;
      const n = 2 + midNorm * 4;
      const complexity = 2 + highNorm * 3;
      
      // Draw Chladni pattern
      const resolution = 180;
      const scale = Math.min(width, height) * 0.4;
      
      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          const x = (i / resolution) * 2 - 1;
          const y = (j / resolution) * 2 - 1;
          
          // Chladni equation with audio modulation
          const pattern = 
            Math.cos(m * Math.PI * x + time * bassNorm * 2) * 
            Math.cos(n * Math.PI * y + time * midNorm * 2) -
            Math.cos(n * Math.PI * x - time * midNorm) * 
            Math.cos(m * Math.PI * y + time * bassNorm);
          
          // Add frequency-based perturbation
          const freq = dominantFreq / 1000;
          const wobble = Math.sin(x * freq * 10 + time * 3) * 
                        Math.sin(y * freq * 10 - time * 2) * highNorm;
          
          const value = Math.abs(pattern + wobble * 0.3);
          
          // Sand accumulation threshold
          const threshold = 0.15 + Math.sin(time * 2 + x + y) * 0.05 * intensity;
          
          if (value < threshold) {
            const px = centerX + x * scale;
            const py = centerY + y * scale;
            
            // Color based on frequency content
            const r = Math.floor(100 + bassNorm * 155);
            const g = Math.floor(120 + midNorm * 135);
            const b = Math.floor(180 + highNorm * 75);
            const alpha = 0.7 + intensity * 0.3;
            
            // Particle size based on intensity
            const size = 1 + intensity * 2;
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.fillRect(px, py, size, size);
            
            // Add glow on strong signal
            if (intensity > 0.5) {
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${intensity * 0.2})`;
              ctx.fillRect(px - 1, py - 1, size + 2, size + 2);
            }
          }
        }
      }
      
      // Draw vibration waves on edges
      ctx.strokeStyle = `rgba(100, 200, 255, ${intensity * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const offset = Math.sin(angle * 8 + time * 5 + bassNorm * 10) * intensity * 20;
        const radius = scale + offset;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        if (angle === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      
      // Display frequency info
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px monospace';
      ctx.fillText(`Freq: ${Math.round(dominantFreq)} Hz`, 10, 20);
      ctx.fillText(`Bass: ${Math.round(bassNorm * 100)}%`, 10, 40);
      ctx.fillText(`Mid: ${Math.round(midNorm * 100)}%`, 10, 60);
      ctx.fillText(`High: ${Math.round(highNorm * 100)}%`, 10, 80);
    };

    draw();
  };

  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

  useEffect(() => {
    if (!open && isActive) {
      stopMicrophone();
    }
  }, [open]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && open) {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
        >
          <Mic className="w-4 h-4" />
          <span className="text-xs hidden md:inline">Mic Chladni</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-cyan-400" />
              Microphone Chladni Patterns
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

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex justify-center gap-3">
            {!isActive ? (
              <Button
                onClick={startMicrophone}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 gap-2"
              >
                <Mic className="w-4 h-4" />
                Start Microphone
              </Button>
            ) : (
              <Button
                onClick={stopMicrophone}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 gap-2"
              >
                <MicOff className="w-4 h-4" />
                Stop
              </Button>
            )}
          </div>

          {/* Visualization Canvas */}
          <div className="relative bg-[#0a0a0f] rounded-xl border border-white/10 overflow-hidden aspect-square">
            <canvas
              ref={canvasRef}
              className="w-full h-full"
            />
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Mic className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">Start microphone to see Chladni patterns</p>
                  <p className="text-xs mt-2">Make sounds or play music!</p>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-white/5 rounded-lg p-3 text-xs text-gray-400 border border-white/10">
            <p className="mb-1"><strong className="text-cyan-400">Chladni Patterns:</strong> Visualize sound as sand-like patterns on a vibrating plate</p>
            <p>• Different frequencies create unique geometric patterns</p>
            <p>• Colors show bass (red), mid (green), and high (blue) frequencies</p>
            <p>• Speak, sing, whistle, or play music into your microphone!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}