import { useState, useEffect } from 'react';

let isLoading = false;
let isLoaded = false;

// MediaPipe package exact versions for stability
const MEDIAPIPE_VERSION = '0.4.1675469240';
const CAMERA_UTILS_VERSION = '0.3.1675466862';
const DRAWING_UTILS_VERSION = '0.3.1675466124';
const CONTROL_UTILS_VERSION = '0.6.1675466023';

/**
 * Ensures MediaPipe Emscripten data loader never throws 
 * "Cannot read properties of undefined (reading 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands_solution_packed_assets.data')"
 */
function applyMediaPipeLoaderPatch() {
  if (typeof window === 'undefined') return;

  const globalScope = window as any;

  // Safe fallback Proxy for data downloads tracking
  const safeDataDownloads: Record<string, { loaded: number; total: number }> = new Proxy({}, {
    get(target, prop: string) {
      if (!(prop in target)) {
        target[prop] = { loaded: 0, total: 0 };
      }
      return target[prop];
    }
  });

  // Guard createMediapipeSolutionsPackedAssets
  const existingPackedAssets = globalScope.createMediapipeSolutionsPackedAssets || {};
  if (!existingPackedAssets.dataFileDownloads) {
    Object.defineProperty(existingPackedAssets, 'dataFileDownloads', {
      get: () => safeDataDownloads,
      set: () => {},
      configurable: true,
      enumerable: true
    });
  }
  globalScope.createMediapipeSolutionsPackedAssets = existingPackedAssets;
}

export const useMediapipe = () => {
  const [ready, setReady] = useState(isLoaded);

  useEffect(() => {
    applyMediaPipeLoaderPatch();

    if (isLoaded) {
      setReady(true);
      return;
    }
    if (isLoading) {
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
        script.onload = () => {
          applyMediaPipeLoaderPatch();
          resolve(true);
        };
        script.onerror = (e) => {
          console.warn(`Could not load script: ${src}`, e);
          reject(e);
        };
        document.head.appendChild(script);
      });
    };

    const init = async () => {
      try {
        applyMediaPipeLoaderPatch();
        await loadScript(`https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@${CAMERA_UTILS_VERSION}/camera_utils.js`);
        await loadScript(`https://cdn.jsdelivr.net/npm/@mediapipe/control_utils@${CONTROL_UTILS_VERSION}/control_utils.js`);
        await loadScript(`https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@${DRAWING_UTILS_VERSION}/drawing_utils.js`);
        await loadScript(`https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_VERSION}/hands.js`);
        applyMediaPipeLoaderPatch();
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
