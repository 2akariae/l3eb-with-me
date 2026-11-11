// ─── THE PLATFORM — AvatarMatrix.jsx (v10) ───────────────────────────────────
// Premium agent avatar selection grid. 24 geometric personas rendered as SVG.
// Each avatar has a unique gradient + one of 6 silhouette shapes (A–F).
// Used in SettingsPanel for profile avatar selection.
import React from 'react';
import { motion } from 'framer-motion';
import { AGENT_AVATARS } from '../../constants/game.js';

// ── Shape silhouettes (inline SVG paths) ─────────────────────────────────────
// 6 distinct geometric head/mask shapes, purely abstract — no trademarked IP.
const SHAPES = {
  A: ( // Angular mask — straight lines, sharp jaw
    <g>
      <polygon points="16,4 28,4 32,12 32,22 24,30 8,30 4,22 4,12" fill="rgba(255,255,255,0.85)" />
      <circle cx="16" cy="14" r="4" fill="rgba(0,0,0,0.35)" />
      <rect x="10" y="22" width="12" height="3" rx="1.5" fill="rgba(0,0,0,0.25)" />
    </g>
  ),
  B: ( // Rounded hood
    <g>
      <ellipse cx="16" cy="16" rx="12" ry="14" fill="rgba(255,255,255,0.85)" />
      <ellipse cx="16" cy="13" rx="5" ry="5.5" fill="rgba(0,0,0,0.35)" />
      <rect x="10" y="21" width="12" height="3" rx="1.5" fill="rgba(0,0,0,0.25)" />
    </g>
  ),
  C: ( // Hexagonal
    <g>
      <polygon points="16,3 27,9 27,23 16,29 5,23 5,9" fill="rgba(255,255,255,0.85)" />
      <circle cx="16" cy="15" r="4.5" fill="rgba(0,0,0,0.35)" />
      <rect x="11" y="22" width="10" height="2.5" rx="1.25" fill="rgba(0,0,0,0.25)" />
    </g>
  ),
  D: ( // Diamond / kite
    <g>
      <polygon points="16,2 30,16 16,30 2,16" fill="rgba(255,255,255,0.85)" />
      <circle cx="16" cy="14" r="4" fill="rgba(0,0,0,0.35)" />
      <ellipse cx="16" cy="21" rx="5" ry="2" fill="rgba(0,0,0,0.25)" />
    </g>
  ),
  E: ( // Sleek oval (spy visor)
    <g>
      <ellipse cx="16" cy="16" rx="13" ry="12" fill="rgba(255,255,255,0.85)" />
      <rect x="8" y="12" width="16" height="6" rx="3" fill="rgba(0,0,0,0.4)" />
      <rect x="11" y="21" width="10" height="2.5" rx="1.25" fill="rgba(0,0,0,0.25)" />
    </g>
  ),
  F: ( // Cross / cross-hair
    <g>
      <rect x="12" y="3" width="8" height="26" rx="4" fill="rgba(255,255,255,0.85)" />
      <rect x="3" y="12" width="26" height="8" rx="4" fill="rgba(255,255,255,0.85)" />
      <circle cx="16" cy="16" r="4" fill="rgba(0,0,0,0.4)" />
    </g>
  ),
};

// ── Single Agent Avatar Tile ──────────────────────────────────────────────────
export function AgentAvatarTile({ agent, size = 48, selected = false, onClick }) {
  const [from, to] = agent.gradient;
  const gradId = `g-${agent.id}`;
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.06 }}
      onClick={onClick}
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <clipPath id={`clip-${agent.id}`}>
            <rect x="0" y="0" width="32" height="32" rx="8" />
          </clipPath>
        </defs>
        <rect x="0" y="0" width="32" height="32" rx="8" fill={`url(#${gradId})`} />
        <g clipPath={`url(#clip-${agent.id})`}>
          {SHAPES[agent.shape]}
        </g>
        {selected && (
          <rect x="0" y="0" width="32" height="32" rx="8"
            fill="none" stroke="white" strokeWidth="2.5" />
        )}
      </svg>
    </motion.button>
  );
}

// ── Full Grid ──────────────────────────────────────────────────────────────────
export default function AvatarMatrix({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-6 gap-2.5 p-1">
      {AGENT_AVATARS.map((agent) => (
        <AgentAvatarTile
          key={agent.id}
          agent={agent}
          size={44}
          selected={selected === agent.id}
          onClick={() => onSelect(agent.id)}
        />
      ))}
    </div>
  );
}

// ── Render avatar from agent id (used in Avatar component) ───────────────────
export function renderAgentSVG(agentId, size = 48) {
  const agent = AGENT_AVATARS.find((a) => a.id === agentId);
  if (!agent) return null;
  return <AgentAvatarTile agent={agent} size={size} />;
}
