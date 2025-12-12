import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type SoundType = 'pause' | 'resume' | 'complete';

const CACHE_KEY_PREFIX = 'muzze_sound_';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedSound {
  audio: string;
  timestamp: number;
}

export const useSoundEffects = (volume: number = 0.5) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getCachedSound = (type: SoundType): string | null => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${type}`);
      if (!cached) return null;
      
      const parsed: CachedSound = JSON.parse(cached);
      const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION_MS;
      
      if (isExpired) {
        localStorage.removeItem(`${CACHE_KEY_PREFIX}${type}`);
        return null;
      }
      
      return parsed.audio;
    } catch {
      return null;
    }
  };

  const setCachedSound = (type: SoundType, audio: string) => {
    try {
      const cached: CachedSound = { audio, timestamp: Date.now() };
      localStorage.setItem(`${CACHE_KEY_PREFIX}${type}`, JSON.stringify(cached));
    } catch (e) {
      console.warn('Failed to cache sound:', e);
    }
  };

  const fetchSound = async (type: SoundType): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-sound', {
        body: { type }
      });

      if (error) {
        console.error('Error fetching sound:', error);
        return null;
      }

      return data?.audio || null;
    } catch (e) {
      console.error('Error invoking generate-sound:', e);
      return null;
    }
  };

  const playSound = useCallback(async (type: SoundType) => {
    try {
      // Try cache first
      let audioBase64 = getCachedSound(type);
      
      // If not cached, fetch from API
      if (!audioBase64) {
        audioBase64 = await fetchSound(type);
        if (audioBase64) {
          setCachedSound(type, audioBase64);
        }
      }

      if (!audioBase64) {
        console.warn(`No audio available for sound type: ${type}`);
        return;
      }

      // Create and play audio
      const audioSrc = `data:audio/mpeg;base64,${audioBase64}`;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioSrc);
      audioRef.current.volume = volume;
      
      await audioRef.current.play();
    } catch (e) {
      // Silent fallback - don't break the app if sound fails
      console.warn('Failed to play sound:', e);
    }
  }, [volume]);

  const preloadSounds = useCallback(async () => {
    const types: SoundType[] = ['pause', 'resume', 'complete'];
    
    for (const type of types) {
      if (!getCachedSound(type)) {
        const audio = await fetchSound(type);
        if (audio) {
          setCachedSound(type, audio);
        }
      }
    }
  }, []);

  return { playSound, preloadSounds };
};
