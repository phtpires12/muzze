import { useCallback, useRef } from 'react';

type SoundType = 'pause' | 'resume' | 'complete';

const SOUND_FILES: Record<SoundType, string> = {
  pause: '/sounds/pause.mp3',
  resume: '/sounds/resume.mp3',
  complete: '/sounds/complete.mp3',
};

export const useSoundEffects = (volume: number = 0.5) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((type: SoundType) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(SOUND_FILES[type]);
      audioRef.current.volume = volume;
      audioRef.current.play().catch(e => {
        console.warn('Failed to play sound:', e);
      });
    } catch (e) {
      console.warn('Failed to play sound:', e);
    }
  }, [volume]);

  const preloadSounds = useCallback(() => {
    Object.values(SOUND_FILES).forEach(src => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = src;
    });
  }, []);

  return { playSound, preloadSounds };
};
