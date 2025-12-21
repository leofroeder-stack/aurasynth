import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, Library, Sparkles, Brain, Settings, Archive, Save, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Sidebar({ isOpen, onClose }) {
  const menuItems = [
    { icon: Music, label: 'Frequency Generator', section: 'generator' },
    { icon: Brain, label: 'Therapy Sessions', section: 'therapy' },
    { icon: Sparkles, label: 'AI Soundscapes', section: 'ai-generate' },
    { icon: Save, label: 'Saved Soundscapes', section: 'library' },
    { icon: Archive, label: 'Music Library', section: 'archive' },
    { icon: TestTube, label: 'Frequency Tester', section: 'tester' },
    { icon: Settings, label: 'Visual Settings', section: 'visuals' },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-full w-80 bg-[#0a0a0f]/95 backdrop-blur-xl border-r border-white/10 z-50 lg:translate-x-0 lg:static"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center">
                <span className="text-xl">∿</span>
              </div>
              <div>
                <h2 className="text-lg font-light text-white">Frequency</h2>
                <p className="text-xs text-gray-500">Sound Therapy</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.section}
                  onClick={() => {
                    // Scroll to section or trigger action
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <Icon className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="text-xs text-gray-500 text-center">
              <p>Healing frequencies for mind & body</p>
              <p className="mt-1 text-gray-600">v1.0.0</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}