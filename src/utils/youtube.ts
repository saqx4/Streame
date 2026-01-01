let youtubeApiPromise: Promise<void> | null = null;
let youtubeBlocked = false;

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const loadYouTubeIFrameAPI = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();

  if (window.YT && window.YT.Player) return Promise.resolve();

  if (youtubeBlocked) return Promise.reject(new Error('YouTube is blocked'));

  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-youtube-iframe-api="true"]');
    if (existing) {
      const poll = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(poll);
          youtubeBlocked = false;
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(poll);
        youtubeBlocked = true;
        youtubeApiPromise = null;
        reject(new Error('YouTube IFrame API load timeout'));
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.defer = true;
    script.dataset.youtubeIframeApi = 'true';

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      youtubeBlocked = false;
      resolve();
    };

    script.onerror = () => {
      youtubeBlocked = true;
      youtubeApiPromise = null;
      reject(new Error('Failed to load YouTube IFrame API'));
    };

    document.head.appendChild(script);
  });

  return youtubeApiPromise;
};

export const isYouTubeBlocked = () => youtubeBlocked;

export {};
