import { useEffect, useState } from 'react';

/** Owner review 2026-11-21: the launch screen stays at least this long so the logo and name can be read. */
export const SPLASH_MIN_MS = 2000;

const launchedAt = Date.now();

/** Milliseconds the splash still has to stay, measured from app start (0 once the minimum has passed). */
export function splashRemaining(now = Date.now(), startedAt = launchedAt, min = SPLASH_MIN_MS) {
  return Math.max(0, min - (now - startedAt));
}

/** True while the app is still inside its minimum splash time. Only the cold start is held; later visits pass at once. */
export function useSplashHold() {
  const [hold, setHold] = useState(() => splashRemaining() > 0);
  useEffect(() => {
    const id = setTimeout(() => setHold(false), splashRemaining());
    return () => clearTimeout(id);
  }, []);
  return hold;
}
