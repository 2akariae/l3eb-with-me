// src/games/detective/components/lobby/PlayerSlot.jsx
// BUG FIX — Field name mismatch:
//   createRoom() writes: { name, avatar, isHost, uid, ... }
//   PlayerSlot was reading: player.displayName, player.avatarSeed
//   → both were undefined → "??" initials + broken avatar
//
// FIX: Read player.name and player.avatar — the actual field names
//   written by gameEngine.js createRoom() and joinRoom().

import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '../../../../components/ui/index.jsx';
import { DetectiveIcon } from '../shared/DetectiveSVGRegistry.jsx';

/**
 * @param {{ player: Object, isHost: boolean, isMe: boolean }} props
 */
export function PlayerSlot({ player, isHost, isMe }) {
  // ✅ FIXED: use player.name / player.avatar (written by createRoom / joinRoom)
  //    NOT player.displayName / player.avatarSeed (those fields don't exist)
  const displayName = player.name || player.displayName || '?';
  const avatarVal   = player.avatar || player.avatarSeed  || '';
  const isOnline    = player.connected !== false; // graceful-presence flag

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      <div className="relative">
        {/* Online presence glow */}
        {isOnline && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: -3,
              borderRadius: '35%',
              border: '1.5px solid rgba(59,158,255,0.4)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Avatar
            uid={player.uid}
            name={displayName}
            avatar={avatarVal}
            size="md"
          />
        </div>

        {/* Ready checkmark badge */}
        {player.isReady && (
          <div
            className="absolute -top-1 -right-1 rounded-full p-0.5"
            style={{ background: '#10b981', zIndex: 2 }}
          >
            <DetectiveIcon name="icon_check" size={10} color="white" />
          </div>
        )}
      </div>

      {/* Name label */}
      <span
        className="text-xs font-bold text-center max-w-[72px] truncate"
        style={{ color: isMe ? '#3B9EFF' : 'rgba(255,255,255,0.8)' }}
      >
        {displayName}{isMe ? ' (Me)' : ''}
      </span>

      {/* Host crown */}
      {isHost && (
        <DetectiveIcon name="icon_crown" size={14} color="#F59E0B" />
      )}
    </motion.div>
  );
}
