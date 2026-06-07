import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore.js';

export function HistoryLog() {
  const { history, historyOpen, toggleHistory } = useGameStore();

  if (!historyOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center px-6 py-12"
        style={{ background: 'rgba(3,2,10,0.85)', backdropFilter: 'blur(16px)' }}
        onClick={toggleHistory}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="glass w-full max-w-md max-h-full rounded-3xl overflow-hidden flex flex-col border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="display text-xl font-bold text-white">Game History</h2>
            <button onClick={toggleHistory} className="text-smoke-400 hover:text-white text-xl">✕</button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {history.length === 0 && (
              <p className="text-smoke-600 text-center py-8">No events recorded yet.</p>
            )}
            {history.map((event, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono text-gold-400">
                    R{event.round}
                  </div>
                  {i < history.length - 1 && <div className="w-px flex-1 bg-white/5" />}
                </div>
                <div className="flex-1 pt-1">
                  {event.type === 'night' ? (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-smoke-500 text-[10px] uppercase tracking-widest font-mono">Dawn Break</p>
                      {event.lines.map((line, li) => (
                        <p key={li} className="text-white text-sm leading-relaxed">{line}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-smoke-500 text-[10px] uppercase tracking-widest font-mono">Town Execution</p>
                      <p className="text-white text-sm">
                        {event.executed 
                          ? `The town decided to execute ${event.executedName}.` 
                          : 'The town could not reach a majority. No one was executed.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/5">
            <button onClick={toggleHistory} className="btn btn-ghost w-full py-2.5">Close</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
