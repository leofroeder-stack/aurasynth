import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, Plus, Play, Trash2, Library, Loader2, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLibrary } from './archiveLibraryUtils';

export default function ArchiveLibrary({ onPlayTrack, currentUser }) {
  const [open, setOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const queryClient = useQueryClient();

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['archive-tracks'],
    queryFn: () => base44.entities.ArchiveTrack.list('-created_date'),
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ArchiveTrack.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive-tracks'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (track) => base44.entities.ArchiveTrack.create(track),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive-tracks'] });
    },
  });

  const handleLoadMozartLibrary = async () => {
    setIsScanning(true);
    try {
      const library = await getLibrary();
      
      for (const track of library) {
        await createMutation.mutateAsync({
          url: track.url,
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: track.duration,
          tags: ['classical', 'mozart']
        });
      }
      
      alert(`Successfully added ${library.length} Mozart tracks to library`);
    } catch (error) {
      console.error('Error loading Mozart library:', error);
      alert(`Failed to load Mozart library: ${error.message}`);
    }
    setIsScanning(false);
  };

  const handlePlay = async (track) => {
    if (onPlayTrack) {
      try {
        await onPlayTrack(track.url, track.title);
      } catch (error) {
        console.error('Failed to play track:', error);
        alert(`Failed to play: ${track.title}`);
      }
    }
    setOpen(false);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
        >
          <Library className="w-4 h-4" />
          <span className="text-xs hidden md:inline">Library</span>
          {tracks.length > 0 && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">
              {tracks.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Library className="w-5 h-5 text-purple-400" />
              Archive.org Music Library
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
          {/* Load Mozart Library (Admin Only) */}
          {isAdmin && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <Button
                onClick={handleLoadMozartLibrary}
                disabled={isScanning}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading Mozart Collection...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Load Mozart Library from Archive.org
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Loads all Mozart tracks from archive.org/details/mozart_202006
              </p>
            </div>
          )}

          {/* Tracks List */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No tracks in library</p>
                {isAdmin && <p className="text-xs mt-2">Add archive.org links to get started</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {tracks.map((track) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-purple-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlay(track)}
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 shrink-0"
                        >
                          <Play className="w-5 h-5" />
                        </Button>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{track.title}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {track.artist}
                            {track.album && ` • ${track.album}`}
                            {track.duration > 0 && ` • ${Math.floor(track.duration / 60)}:${(track.duration % 60).toFixed(0).padStart(2, '0')}`}
                          </div>
                          {track.tags?.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {track.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-xs bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(track.id)}
                            className="text-gray-500 hover:text-red-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}