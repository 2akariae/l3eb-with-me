// src/utils/device.js — Mobile/GPU tier detection (runs once at module load)
const ua         = navigator.userAgent.toLowerCase();
const isTouchDev = navigator.maxTouchPoints > 0;
const isSmallVP  = window.innerWidth <= 820;
const isMobileUA = /android|iphone|ipad|ipod|mobile|tablet/.test(ua);

export const IS_MOBILE = isTouchDev && (isSmallVP || isMobileUA);
export const GPU_TIER  = IS_MOBILE && (navigator.hardwareConcurrency ?? 4) <= 4 ? 'low' : 'high';
