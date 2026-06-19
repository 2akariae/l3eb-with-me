// src/games/detective/hooks/useDetectiveRoom.js
// Firebase room synchronization hook for "The Detective".

import { useEffect, useRef } from 'react';
import { useDetectiveStore } from '../store/detectiveStore.js';
import { syncRoomPlayers, syncPhase, syncChat, detachRoomListeners } from '../utils/detectiveFirebase.js';

export function useDetectiveRoom(roomId, myUid) {
  const initRoom = useDetectiveStore((s) => s.initRoom);
  const setPlayers = useDetectiveStore((s) => s.setPlayers);
  const advancePhase = useDetectiveStore((s) => s.advancePhase);
  const addChatMessage = useDetectiveStore((s) => s.addChatMessage);
  
  const listenersRef = useRef([]);

  useEffect(() => {
    if (!roomId || !myUid) return;

    initRoom(roomId, myUid);

    const unsubPlayers = syncRoomPlayers(roomId, (players) => {
      setPlayers(players);
    });

    const unsubPhase = syncPhase(roomId, (roomData) => {
      if (roomData?.phase) {
        advancePhase(roomData.phase.current, roomData.phase.deadline);
      }
    });

    const unsubChat = syncChat(roomId, (message) => {
      addChatMessage(message);
    });

    listenersRef.current = [unsubPlayers, unsubPhase, unsubChat];

    return () => {
      detachRoomListeners(listenersRef.current);
    };
  }, [roomId, myUid, initRoom, setPlayers, advancePhase, addChatMessage]);
}
