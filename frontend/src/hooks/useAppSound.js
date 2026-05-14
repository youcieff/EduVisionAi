import { useCallback } from 'react';
import soundEngine from '../utils/soundEngine';

export const useAppSound = () => {
  // Safe wrappers that ensure the audio context is initialized
  const playXpPop = useCallback(() => {
    try {
      soundEngine.playXpPop();
    } catch (e) {
      console.warn('Audio Context error:', e);
    }
  }, []);

  const playLevelUp = useCallback(() => {
    try {
      soundEngine.playLevelUp();
    } catch (e) {
      console.warn('Audio Context error:', e);
    }
  }, []);

  const playBadgeUnlock = useCallback(() => {
    try {
      soundEngine.playBadgeUnlock();
    } catch (e) {
      console.warn('Audio Context error:', e);
    }
  }, []);

  const playSwoosh = useCallback(() => {
    try {
      soundEngine.playSwoosh();
    } catch (e) {
      console.warn('Audio Context error:', e);
    }
  }, []);

  // Expose toggle capability
  const toggleSound = useCallback((enabled) => {
    soundEngine.enabled = enabled !== undefined ? enabled : !soundEngine.enabled;
    return soundEngine.enabled;
  }, []);

  return {
    playXpPop,
    playLevelUp,
    playBadgeUnlock,
    playSwoosh,
    toggleSound,
    isSoundEnabled: soundEngine.enabled
  };
};

export default useAppSound;
