// ─── THE MAFIA — games/mafia/hooks/useMafiaEngine.js (v8) ────────────────────
// This file is the Mafia game's named export surface.
// It re-exports everything from the central gameEngine so components can import
// from either path without breaking — while the engine itself stays in one place.
// FIX: previously this file was a full duplicate of gameEngine.js, causing
//      two separate module instances with potentially different import paths.
//      Now it's a thin re-export layer.
export * from '../../../services/gameEngine.js';
