import { useEffect, useRef } from 'react';

type WakeLockSentinelLike = {
  release?: () => Promise<void>;
  addEventListener?: (type: string, listener: () => void) => void;
};

export function useWakeLock(enabled: boolean) {
  const enabledRef = useRef(enabled);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const requestInFlightRef = useRef(false);

  const release = async () => {
    const sentinel = sentinelRef.current;
    sentinelRef.current = null;
    if (!sentinel?.release) return;
    try {
      await sentinel.release();
    } catch {
      return;
    }
  };

  const request = async () => {
    if (!enabledRef.current) return;
    if (document.visibilityState !== 'visible') return;
    if (sentinelRef.current) return;
    const wl = (navigator as any)?.wakeLock;
    if (!wl?.request) return;
    if (requestInFlightRef.current) return;

    requestInFlightRef.current = true;
    try {
      const sentinel = (await wl.request('screen')) as WakeLockSentinelLike;
      sentinelRef.current = sentinel;
      sentinel.addEventListener?.('release', () => {
        sentinelRef.current = null;
        requestInFlightRef.current = false;
        if (enabledRef.current && document.visibilityState === 'visible') {
          void request();
        }
      });
    } catch {
      return;
    } finally {
      requestInFlightRef.current = false;
    }
  };

  useEffect(() => {
    enabledRef.current = enabled;
    if (enabled) void request();
    else void release();
  }, [enabled]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (enabledRef.current) void request();
      } else {
        void release();
      }
    };

    const onUserGesture = () => {
      if (enabledRef.current) void request();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onUserGesture);
    window.addEventListener('pointerdown', onUserGesture, { passive: true });
    window.addEventListener('touchstart', onUserGesture, { passive: true });
    window.addEventListener('keydown', onUserGesture);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onUserGesture);
      window.removeEventListener('pointerdown', onUserGesture);
      window.removeEventListener('touchstart', onUserGesture);
      window.removeEventListener('keydown', onUserGesture);
      void release();
    };
  }, []);
}
