// src/games/detective/components/lobby/PlayerSlot.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '../../../../components/ui/index.jsx';
import { DetectiveIcon } from '../shared/DetectiveSVGRegistry.jsx';

export function PlayerSlot({ player, isHost, isMe }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="relative">
        <Avatar uid={player.uid} name={player.displayName} avatar={player.avatarSeed} size="md" />
        {player.isReady && (
          <div className="absolute -top-1 -right-1 bg-[#10b981] rounded-full p-0.5">
            <DetectiveIcon name="icon_check" size={10} color="white" />
          </div>
        )}
      </div>
      <span className="text-xs font-bold text-white/80">{player.displayName} {isMe ? '(Me)' : ''}</span>
      {isHost && <DetectiveIcon name="icon_crown" size={14} color="#F59E0B" />}
    </motion.div>
  );
}
