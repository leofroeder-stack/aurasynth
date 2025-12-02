import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Circle, Square, Play, Pause, Download, Video, Mic, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RecordingControls({ 
  audioContext, 
  gainNode, 
  canvasRef,
  isPlaying 
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState(null); // 'audio' or 'video'
  const [recordings, setRecordings] = useState([]);
  const [showRecordings, setShowRecordings] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const videoPlayerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async (type) => {
    if (!audioContext || !gainNode) return;
    
    chunksRef.current = [];
    setRecordingType(type);
    setRecordingTime(0);
    
    if (type === 'audio') {
      // Audio only recording
      const dest = audioContext.createMediaStreamDestination();
      gainNode.connect(dest);
      
      const mediaRecorder = new MediaRecorder(dest.stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordings(prev => [...prev, {
          id: Date.now(),
          type: 'audio',
          url,
          blob,
          duration: recordingTime,
          date: new Date().toLocaleTimeString()
        }]);
        gainNode.disconnect(dest);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
    } else {
      // Video recording with audio
      const canvas = canvasRef?.current;
      if (!canvas) return;
      
      const canvasStream = canvas.captureStream(30);
      const dest = audioContext.createMediaStreamDestination();
      gainNode.connect(dest);
      
      const combinedStream = new MediaStream([
        ...canvasStream.getTracks(),
        ...dest.stream.getTracks()
      ]);
      
      streamRef.current = combinedStream;
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordings(prev => [...prev, {
          id: Date.now(),
          type: 'video',
          url,
          blob,
          duration: recordingTime,
          date: new Date().toLocaleTimeString()
        }]);
        gainNode.disconnect(dest);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    }
    
    setIsRecording(true);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const downloadRecording = (recording) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `frequency-${recording.type}-${recording.date.replace(/:/g, '-')}.${recording.type === 'audio' ? 'webm' : 'webm'}`;
    a.click();
  };

  const deleteRecording = (id) => {
    setRecordings(prev => {
      const recording = prev.find(r => r.id === id);
      if (recording) URL.revokeObjectURL(recording.url);
      return prev.filter(r => r.id !== id);
    });
  };

  const playRecording = (recording) => {
    if (playingId === recording.id) {
      if (recording.type === 'audio' && audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (recording.type === 'video' && videoPlayerRef.current) {
        videoPlayerRef.current.pause();
      }
      setPlayingId(null);
    } else {
      setPlayingId(recording.id);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Recording Controls */}
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startRecording('audio')}
              disabled={!isPlaying}
              className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-50"
              title="Record Audio"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startRecording('video')}
              disabled={!isPlaying}
              className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-50"
              title="Record Video"
            >
              <Video className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={stopRecording}
            className="text-red-500 hover:text-red-400 hover:bg-red-400/10 animate-pulse"
          >
            <Square className="w-4 h-4 mr-2" />
            <span className="text-xs">{formatTime(recordingTime)}</span>
          </Button>
        )}
        
        {recordings.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRecordings(true)}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <Circle className="w-4 h-4 mr-1 text-red-500" />
            <span className="text-xs">{recordings.length}</span>
          </Button>
        )}
      </div>

      {/* Recordings Dialog */}
      <Dialog open={showRecordings} onOpenChange={setShowRecordings}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-red-500" />
              Recordings ({recordings.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recordings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recordings yet</p>
            ) : (
              recordings.map((recording) => (
                <motion.div
                  key={recording.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {recording.type === 'audio' ? (
                        <Mic className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Video className="w-4 h-4 text-fuchsia-400" />
                      )}
                      <span className="text-sm capitalize">{recording.type}</span>
                      <span className="text-xs text-gray-500">{recording.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadRecording(recording)}
                        className="h-8 w-8 text-gray-400 hover:text-green-400"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRecording(recording.id)}
                        className="h-8 w-8 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {recording.type === 'audio' ? (
                    <audio
                      ref={playingId === recording.id ? audioPlayerRef : null}
                      src={recording.url}
                      controls
                      className="w-full h-10"
                      onEnded={() => setPlayingId(null)}
                    />
                  ) : (
                    <video
                      ref={playingId === recording.id ? videoPlayerRef : null}
                      src={recording.url}
                      controls
                      className="w-full rounded-lg"
                      onEnded={() => setPlayingId(null)}
                    />
                  )}
                </motion.div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recording indicator overlay */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/20 backdrop-blur-xl border border-red-500/50 rounded-full px-4 py-2 flex items-center gap-2"
          >
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-400 font-medium">
              REC {formatTime(recordingTime)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={stopRecording}
              className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/20 ml-2"
            >
              <Square className="w-3 h-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}