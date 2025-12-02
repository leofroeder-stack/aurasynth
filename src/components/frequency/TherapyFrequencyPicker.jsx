import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, X } from "lucide-react";
import { motion } from "framer-motion";
import { frequencyCategories } from './sound_therapy_frequencies';

export default function TherapyFrequencyPicker({ onSelectFrequency }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (freq) => {
    onSelectFrequency(freq.frequency);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white gap-2"
        >
          <Heart className="w-4 h-4 text-pink-400" />
          Therapy
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              Therapy Frequencies
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
        
        <Tabs defaultValue="solfeggio" className="w-full">
          <TabsList className="grid grid-cols-5 bg-white/5">
            {Object.entries(frequencyCategories).map(([key, cat]) => (
              <TabsTrigger key={key} value={key} className="text-xs data-[state=active]:bg-white/10">
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(frequencyCategories).map(([key, cat]) => (
            <TabsContent key={key} value={key} className="mt-4">
              <p className="text-xs text-gray-500 mb-3">{cat.description}</p>
              <ScrollArea className="h-[300px] pr-4">
                <div className="grid grid-cols-1 gap-2">
                  {cat.frequencies.map((freq, i) => (
                    <motion.button
                      key={`${freq.frequency}-${i}`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelect(freq)}
                      className="w-full p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-400 font-medium">{freq.label}</span>
                        <span className="text-xs text-gray-500">{freq.frequency} Hz</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{freq.effect}</p>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}