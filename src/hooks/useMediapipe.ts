import { useState, useEffect } from 'react';

let isLoading = false;
let isLoaded = false;

export const useMediapipe = () => {
  const [ready, setReady] = useState(isLoaded);

  useEffect(() => {
    if (isLoaded) return;
    if (isLoading) {
      // Just poll until it's loaded if another component started it
      const interval = setInterval(() => {
        if (isLoaded) {
          setReady(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
    isLoading = true;

    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const init = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        isLoaded = true;
        setReady(true);
      } catch (err) {
        console.error("Failed to load Mediapipe scripts", err);
      }
    };

    init();
  }, []);

  return { ready };
};
