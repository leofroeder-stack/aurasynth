import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Loader2, Music } from "lucide-react";
import { motion } from "framer-motion";

export default function AudioExporter({ 
  audioContext,
  currentParameters,
  isPlaying
}) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [duration, setDuration] = useState(60);

  const exportAudio = async (format) => {
    if (!audioContext || !currentParameters) {
      alert('No audio to export. Please generate a soundscape first.');
      return;
    }

    setExporting(true);
    try {
      // Create offline audio context for rendering
      const sampleRate = 44100;
      const channels = 2;
      const offlineContext = new OfflineAudioContext(
        channels,
        sampleRate * duration,
        sampleRate
      );

      // Create oscillators and layers
      const mainOsc = offlineContext.createOscillator();
      const mainGain = offlineContext.createGain();
      
      mainOsc.type = currentParameters.waveType || 'sine';
      mainOsc.frequency.value = currentParameters.frequency || currentParameters.mainFrequency || 440;
      mainGain.gain.value = currentParameters.volume || 0.5;
      
      mainOsc.connect(mainGain);
      mainGain.connect(offlineContext.destination);
      mainOsc.start(0);
      mainOsc.stop(duration);

      // Add layers
      if (currentParameters.layers && currentParameters.layers.length > 0) {
        currentParameters.layers.forEach(layer => {
          if (layer.enabled !== false) {
            const osc = offlineContext.createOscillator();
            const gain = offlineContext.createGain();
            
            osc.type = layer.waveType || 'sine';
            osc.frequency.value = layer.frequency || 440;
            gain.gain.value = layer.volume || 0.3;
            
            osc.connect(gain);
            gain.connect(offlineContext.destination);
            osc.start(0);
            osc.stop(duration);
          }
        });
      }

      // Render audio
      const renderedBuffer = await offlineContext.startRendering();
      
      // Convert to WAV
      const wav = audioBufferToWav(renderedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      
      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soundscape_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Convert AudioBuffer to WAV
  const audioBufferToWav = (buffer) => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF identifier
    setUint32(0x46464952);
    // file length
    setUint32(length - 8);
    // RIFF type
    setUint32(0x45564157);
    // format chunk identifier
    setUint32(0x20746d66);
    // format chunk length
    setUint32(16);
    // sample format (raw)
    setUint16(1);
    // channel count
    setUint16(buffer.numberOfChannels);
    // sample rate
    setUint32(buffer.sampleRate);
    // byte rate (sample rate * block align)
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    // block align (channel count * bytes per sample)
    setUint16(buffer.numberOfChannels * 2);
    // bits per sample
    setUint16(16);
    // data chunk identifier
    setUint32(0x61746164);
    // data chunk length
    setUint32(length - pos - 4);

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return arrayBuffer;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
          disabled={!currentParameters}
        >
          <Download className="w-4 h-4" />
          <span className="text-xs hidden md:inline">Export</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-cyan-400" />
            Export Soundscape
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="bg-white/5 rounded-lg p-4">
            <label className="text-sm text-gray-400 mb-2 block">Duration (seconds)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="300"
                step="10"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg font-medium text-cyan-400 w-16 text-right">
                {duration}s
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              File size: ~{((duration * 44100 * 2 * 2) / 1024 / 1024).toFixed(1)} MB
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400 mb-3">Export Format</p>
            
            <Button
              onClick={() => exportAudio('wav')}
              disabled={exporting}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export as WAV
                </>
              )}
            </Button>

            <div className="text-xs text-center text-gray-500 mt-4">
              WAV format provides uncompressed, high-quality audio
            </div>
          </div>

          {isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3"
            >
              <p className="text-xs text-amber-400 text-center">
                ⚠️ Audio is currently playing. Export will render separately.
              </p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}