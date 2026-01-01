import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description?: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};

export const PLAYER_SHORTCUTS: KeyboardShortcut[] = [
  { key: ' ', callback: () => {}, description: 'Play/Pause' },
  { key: 'f', callback: () => {}, description: 'Toggle Fullscreen' },
  { key: 'm', callback: () => {}, description: 'Toggle Mute' },
  { key: 'ArrowLeft', callback: () => {}, description: 'Rewind 10s' },
  { key: 'ArrowRight', callback: () => {}, description: 'Forward 10s' },
  { key: 'ArrowUp', callback: () => {}, description: 'Volume Up' },
  { key: 'ArrowDown', callback: () => {}, description: 'Volume Down' },
  { key: 'Escape', callback: () => {}, description: 'Exit Fullscreen' },
];
