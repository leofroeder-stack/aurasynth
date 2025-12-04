import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, CameraOff, Hand, X, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GestureController({ 
  onSpeedChange, 
  onIntensityChange, 
  onComplexityChange,
  onBloomChange,
  speed,
  intensity,
  complexity,
  bloom
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [gestureData, setGestureData] = useState({ x: 0.5, y: 0.5, motion: 0 });
  const [controlMode, setControlMode] = useState('speed-intensity'); // 'speed-intensity' or 'complexity-bloom'
  const [showGuide, setShowGuide] = useState(true);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const prevPositionRef = useRef({ x: 0, y: 0 });
  const smoothedPositionRef = useRef({ x: 0.5, y: 0.5 });

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 320, height: 240 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsActive(true);
      detectMotion();
    } catch (error) {
      console.error('Camera access denied:', error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsActive(false);
  }, []);

  const detectMotion = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 160;
    canvas.height = 120;

    let prevFrame = null;

    const analyze = () => {
      if (!video.videoWidth) {
        animationRef.current = requestAnimationFrame(analyze);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (prevFrame) {
        let totalMotion = 0;
        let motionX = 0;
        let motionY = 0;
        let motionPoints = 0;

        // Analyze motion by comparing frames
        for (let y = 0; y < canvas.height; y += 4) {
          for (let x = 0; x < canvas.width; x += 4) {
            const i = (y * canvas.width + x) * 4;
            
            const diff = Math.abs(currentFrame.data[i] - prevFrame.data[i]) +
                        Math.abs(currentFrame.data[i + 1] - prevFrame.data[i + 1]) +
                        Math.abs(currentFrame.data[i + 2] - prevFrame.data[i + 2]);
            
            if (diff > 50) { // Motion threshold
              totalMotion += diff;
              motionX += x;
              motionY += y;
              motionPoints++;
            }
          }
        }

        if (motionPoints > 10) {
          // Calculate center of motion
          const centerX = motionX / motionPoints / canvas.width;
          const centerY = motionY / motionPoints / canvas.height;
          
          // Smooth the position
          const smoothFactor = 0.3;
          smoothedPositionRef.current.x += (centerX - smoothedPositionRef.current.x) * smoothFactor;
          smoothedPositionRef.current.y += (centerY - smoothedPositionRef.current.y) * smoothFactor;

          // Calculate motion intensity
          const motionIntensity = Math.min(1, totalMotion / 50000);

          setGestureData({
            x: smoothedPositionRef.current.x,
            y: smoothedPositionRef.current.y,
            motion: motionIntensity
          });

          // Apply controls based on mode
          if (controlMode === 'speed-intensity') {
            // X axis controls speed (0.1 - 3)
            const newSpeed = 0.1 + smoothedPositionRef.current.x * 2.9;
            onSpeedChange(Math.round(newSpeed * 10) / 10);
            
            // Y axis controls intensity (0.1 - 2)
            const newIntensity = 0.1 + (1 - smoothedPositionRef.current.y) * 1.9;
            onIntensityChange(Math.round(newIntensity * 10) / 10);
          } else {
            // X axis controls complexity (0.5 - 2)
            const newComplexity = 0.5 + smoothedPositionRef.current.x * 1.5;
            onComplexityChange(Math.round(newComplexity * 10) / 10);
            
            // Y axis controls bloom (0 - 1)
            const newBloom = 1 - smoothedPositionRef.current.y;
            onBloomChange(Math.round(newBloom * 20) / 20);
          }
        }

        prevPositionRef.current = { x: motionX, y: motionY };
      }

      prevFrame = currentFrame;
      animationRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, [controlMode, onSpeedChange, onIntensityChange, onComplexityChange, onBloomChange]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (isActive) {
      stopCamera();
      startCamera();
    }
  }, [controlMode]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-fuchsia-400 hover:bg-fuchsia-400/10 gap-2"
      >
        <Hand className="w-4 h-4" />
        <span className="text-xs hidden md:inline">Gesture</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) stopCamera(); }}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Hand className="w-5 h-5 text-fuchsia-400" />
                Gesture Control
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setIsOpen(false); stopCamera(); }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Camera Preview */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover transform scale-x-[-1]"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Camera not active</p>
                  </div>
                </div>
              )}

              {/* Gesture indicator overlay */}
              {isActive && (
                <div className="absolute inset-0 pointer-events-none">
                  <motion.div
                    className="absolute w-8 h-8 rounded-full border-2 border-fuchsia-400 bg-fuchsia-400/20"
                    animate={{
                      left: `${(1 - gestureData.x) * 100}%`,
                      top: `${gestureData.y * 100}%`,
                      scale: 1 + gestureData.motion * 0.5
                    }}
                    style={{ transform: 'translate(-50%, -50%)' }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              )}
            </div>

            {/* Control Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={controlMode === 'speed-intensity' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setControlMode('speed-intensity')}
                className={controlMode === 'speed-intensity' 
                  ? 'flex-1 bg-fuchsia-600 hover:bg-fuchsia-700' 
                  : 'flex-1 border-white/10 text-gray-300'}
              >
                Speed & Intensity
              </Button>
              <Button
                variant={controlMode === 'complexity-bloom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setControlMode('complexity-bloom')}
                className={controlMode === 'complexity-bloom' 
                  ? 'flex-1 bg-fuchsia-600 hover:bg-fuchsia-700' 
                  : 'flex-1 border-white/10 text-gray-300'}
              >
                Complexity & Bloom
              </Button>
            </div>

            {/* Camera Controls */}
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isActive ? stopCamera : startCamera}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-red-500/20 border-2 border-red-500 text-red-400' 
                    : 'bg-fuchsia-500/20 border-2 border-fuchsia-500 text-fuchsia-400'
                }`}
              >
                {isActive ? (
                  <CameraOff className="w-6 h-6" />
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </motion.button>
            </div>

            {/* Current Values */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 gap-2"
                >
                  {controlMode === 'speed-intensity' ? (
                    <>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                        <div className="text-xs text-gray-500 mb-1">Speed</div>
                        <div className="text-xl font-light text-cyan-400">{speed.toFixed(1)}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                        <div className="text-xs text-gray-500 mb-1">Intensity</div>
                        <div className="text-xl font-light text-fuchsia-400">{intensity.toFixed(1)}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                        <div className="text-xs text-gray-500 mb-1">Complexity</div>
                        <div className="text-xl font-light text-cyan-400">{complexity.toFixed(1)}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                        <div className="text-xs text-gray-500 mb-1">Bloom</div>
                        <div className="text-xl font-light text-fuchsia-400">{bloom.toFixed(2)}</div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Guide */}
            {showGuide && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-gray-400">
                    <p className="mb-1"><strong>How it works:</strong></p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Move your hand left/right to adjust the first parameter</li>
                      <li>Move up/down to adjust the second parameter</li>
                      <li>Fast movements create more dramatic changes</li>
                    </ul>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowGuide(false)}
                    className="text-gray-500 hover:text-white h-5 w-5 shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}