import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Trash2, Library, Loader2, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SoundscapeLibrary({ onLoadSoundscape, isPlaying }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: soundscapes = [], isLoading } = useQuery({
    queryKey: ['saved-soundscapes'],
    queryFn: () => base44.entities.SavedSoundscape.list('-created_date'),
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedSoundscape.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-soundscapes'] });
    },
  });

  const handleLoad = (soundscape) => {
    onLoadSoundscape(soundscape.parameters);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
        >
          <Library className="w-4 h-4" />
          <span className="text-xs hidden md:inline">My Soundscapes</span>
          {soundscapes.length > 0 && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">
              {soundscapes.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="w-5 h-5 text-purple-400" />
            My Soundscape Library
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : soundscapes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Music className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No saved soundscapes</p>
              <p className="text-xs mt-2">Generate and save soundscapes to build your library</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {soundscapes.map((soundscape) => (
                  <motion.div
                    key={soundscape.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-500/30 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLoad(soundscape)}
                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 shrink-0"
                      >
                        <Play className="w-5 h-5" />
                      </Button>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1">{soundscape.name}</div>
                        
                        {(soundscape.mood || soundscape.genre) && (
                          <div className="flex gap-2 mb-2 flex-wrap">
                            {soundscape.mood && (
                              <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded">
                                {soundscape.mood}
                              </span>
                            )}
                            {soundscape.genre && (
                              <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">
                                {soundscape.genre}
                              </span>
                            )}
                          </div>
                        )}

                        {soundscape.explanation && (
                          <div className="text-xs text-gray-400 mb-2 line-clamp-2">
                            {soundscape.explanation}
                          </div>
                        )}

                        <div className="flex gap-2 text-xs text-gray-500 flex-wrap">
                          <span>{soundscape.parameters.mainFrequency} Hz</span>
                          <span>•</span>
                          <span>{soundscape.parameters.waveType}</span>
                          {soundscape.parameters.layers?.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{soundscape.parameters.layers.length} layers</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{soundscape.parameters.visualStyle}</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(soundscape.id)}
                        className="text-gray-500 hover:text-red-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {isPlaying && (
          <p className="text-xs text-center text-amber-400 pt-2 border-t border-white/10">
            ⚠️ Loading a soundscape will update settings. Restart playback to hear changes.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}