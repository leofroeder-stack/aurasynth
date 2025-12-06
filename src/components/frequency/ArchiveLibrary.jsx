import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, Plus, Play, Trash2, Library, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ArchiveLibrary({ onPlayTrack, currentUser }) {
  const [open, setOpen] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newUrl, setNewUrl] = useState('');
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
      setAddMode(false);
      setNewUrl('');
    },
  });

  const scanArchiveUrl = async (url) => {
    setIsScanning(true);
    try {
      // Extract item identifier from archive.org URL (supports both /details/ and /download/)
      const itemMatch = url.match(/archive\.org\/(?:details|download)\/([^\/]+)/);
      if (!itemMatch) {
        alert('Invalid archive.org URL. Use format: https://archive.org/details/item-id or https://archive.org/download/item-id');
        setIsScanning(false);
        return;
      }

      const itemId = itemMatch[1];
      
      // Fetch metadata from archive.org
      const metadataUrl = `https://archive.org/metadata/${itemId}`;
      const response = await fetch(metadataUrl);
      const data = await response.json();

      // Find audio files
      const audioFiles = data.files?.filter(file => 
        file.format === 'VBR MP3' || 
        file.format === 'Ogg Vorbis' ||
        file.format === '128Kbps MP3' ||
        file.name?.match(/\.(mp3|ogg|m4a)$/i)
      ) || [];

      if (audioFiles.length === 0) {
        alert('No audio files found in this archive');
        setIsScanning(false);
        return;
      }

      // Create tracks for each audio file
      const metadata = data.metadata || {};
      const baseTitle = metadata.title || itemId;
      const artist = metadata.creator || metadata.artist || 'Unknown Artist';
      const album = metadata.album || '';

      for (const file of audioFiles) {
        const trackUrl = `https://archive.org/download/${itemId}/${file.name}`;
        const title = file.title || file.name.replace(/\.[^/.]+$/, "");
        const duration = parseFloat(file.length) || 0;

        await createMutation.mutateAsync({
          url: trackUrl,
          title: audioFiles.length === 1 ? baseTitle : title,
          artist,
          album,
          duration,
          tags: metadata.subject || []
        });
      }

      alert(`Added ${audioFiles.length} track(s) from archive`);
    } catch (error) {
      console.error('Error scanning archive:', error);
      alert('Failed to scan archive. Make sure the URL is valid.');
    }
    setIsScanning(false);
  };

  const handleAddTrack = async () => {
    if (!newUrl.trim()) return;
    await scanArchiveUrl(newUrl);
  };

  const handlePlay = (track) => {
    if (onPlayTrack) {
      onPlayTrack(track.url, track.title);
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
          {/* Add Track Section (Admin Only) */}
          {isAdmin && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              {!addMode ? (
                <Button
                  onClick={() => setAddMode(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Archive.org Link
                </Button>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="https://archive.org/details/..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTrack()}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddTrack}
                      disabled={isScanning}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 gap-2"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add & Scan
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAddMode(false);
                        setNewUrl('');
                      }}
                      className="border-white/10 text-gray-300"
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Paste an archive.org details URL. The app will scan and add all audio files.
                  </p>
                </div>
              )}
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