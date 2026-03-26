import { useState } from 'react';

/**
 * Hook to manage fullscreen state for visualizations
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFullscreen = () => setIsFullscreen(true);
  const closeFullscreen = () => setIsFullscreen(false);
  const toggleFullscreen = () => setIsFullscreen(prev => !prev);

  return {
    isFullscreen,
    openFullscreen,
    closeFullscreen,
    toggleFullscreen,
  };
}
