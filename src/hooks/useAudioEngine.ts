import { useState, useRef, useEffect, useCallback } from "react";

export type AudioTrack = {
  id: string;
  nameKey: string; // Translation key
  category: "ambient" | "binaural" | "music";
  url: string;
};

const DEFAULT_TRACKS: AudioTrack[] = [
  { id: "rain", nameKey: "rain", category: "ambient", url: "https://www.soundjay.com/nature/sounds/rain-01.mp3" },
  { id: "cafe", nameKey: "cafe", category: "ambient", url: "https://www.soundjay.com/nature/sounds/river-1.mp3" }, // using placeholder
  { id: "alpha", nameKey: "alphaWaves", category: "binaural", url: "https://www.soundjay.com/misc/sounds/bell-ringing-01.mp3" }, // using placeholder
  { id: "gamma", nameKey: "gammaWaves", category: "binaural", url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3" }, // using placeholder
];

export function useAudioEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleTrack = useCallback((trackId: string) => {
    if (!audioRef.current) return;

    if (activeTrackId === trackId) {
      // Toggle play/pause if same track
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    } else {
      // Switch track
      const track = DEFAULT_TRACKS.find(t => t.id === trackId);
      if (track) {
        audioRef.current.src = track.url;
        audioRef.current.load();
        audioRef.current.play().catch(console.error);
        setActiveTrackId(trackId);
        setIsPlaying(true);
      }
    }
  }, [activeTrackId, isPlaying]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setActiveTrackId(null);
    }
  }, []);

  return {
    tracks: DEFAULT_TRACKS,
    activeTrackId,
    isPlaying,
    volume,
    setVolume,
    toggleTrack,
    stop,
  };
}
