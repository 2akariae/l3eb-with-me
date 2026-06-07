// ─── THE MAFIA — hooks/useTypewriter.js ──────────────────────────────────────
import { useState, useEffect } from 'react';

export function useTypewriter(text, speed = 35, onDone) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onDone?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]); // eslint-disable-line

  return { displayed, done };
}
