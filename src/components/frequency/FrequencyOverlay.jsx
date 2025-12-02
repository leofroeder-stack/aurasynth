import React, { useState, useRef, useCallback } from 'react';

export default function FrequencyOverlay({ frequency, setFrequency }) {
  const [isDragging, setIsDragging] = useState(false);
  const [showFrequency, setShowFrequency] = useState(false);
  const startXRef = useRef(0);
  const startFreqRef = useRef(frequency);

  const handleStart = useCallback((clientX) => {
    setIsDragging(true);
    setShowFrequency(true);
    startXRef.current = clientX;
    startFreqRef.current = frequency;
  }, [frequency]);

  const handleMove = useCallback((clientX) => {
    if (!isDragging) return;
    
    const deltaX = clientX - startXRef.current;
    const sensitivity = 2; // Hz per pixel
    const newFreq = Math.max(20, Math.min(2000, startFreqRef.current + deltaX * sensitivity));
    setFrequency(newFreq);
  }, [isDragging, setFrequency]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setTimeout(() => setShowFrequency(false), 1000);
  }, []);

  // Mouse events
  const onMouseDown = (e) => handleStart(e.clientX);
  const onMouseMove = (e) => handleMove(e.clientX);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDragging) handleEnd(); };

  // Touch events
  const onTouchStart = (e) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  return (
    <div
      className="absolute inset-0 z-20 cursor-ew-resize touch-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Frequency display */}
      {showFrequency && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`text-center transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-8xl md:text-9xl font-thin text-white/80 tabular-nums">
              {frequency.toFixed(1)}
            </div>
            <div className="text-2xl text-cyan-400/80 font-light">Hz</div>
            <div className="text-sm text-white/40 mt-4">← Slide to adjust →</div>
          </div>
        </div>
      )}
    </div>
  );
}