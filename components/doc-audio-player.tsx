'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

interface DocAudioPlayerProps {
  src: string;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 2];

export function DocAudioPlayer({ src }: DocAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);

  const updateDuration = useCallback(() => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (d && !isNaN(d) && isFinite(d)) {
        setDuration(d);
      }
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Check if duration is already loaded
    updateDuration();

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDuration = () => updateDuration();
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleDuration);
    audio.addEventListener('durationchange', handleDuration);
    audio.addEventListener('canplay', handleDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleDuration);
      audio.removeEventListener('durationchange', handleDuration);
      audio.removeEventListener('canplay', handleDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src, updateDuration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    updateDuration();
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleSpeed = () => {
    const nextIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIndex);
    const newSpeed = SPEED_OPTIONS[nextIndex];
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0 || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-950/90 px-4 py-2 text-xs text-neutral-200 shadow-sm backdrop-blur-md">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={updateDuration}
        onDurationChange={updateDuration}
        onCanPlay={updateDuration}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Play / Pause Toggle & Label */}
      <button
        type="button"
        onClick={togglePlay}
        className="flex items-center gap-2 font-medium hover:text-white transition-colors"
      >
        {isPlaying ? (
          <Pause className="size-3.5 fill-current text-white" />
        ) : (
          <Play className="size-3.5 fill-current text-white" />
        )}
        <span>Listen to audiobook</span>
      </button>

      <span className="text-neutral-700">·</span>

      {/* Duration */}
      <span className="font-mono text-[11px] text-neutral-400 shrink-0">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Progress Scrub Bar */}
      <div className="relative flex items-center w-24 sm:w-32">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 focus:outline-none"
          style={{
            background: `linear-gradient(to right, #ffffff 0%, #ffffff ${progressPercent}%, #333333 ${progressPercent}%, #333333 100%)`,
          }}
        />
      </div>

      {/* Speed Toggle */}
      <button
        type="button"
        onClick={toggleSpeed}
        className="font-mono text-[11px] font-medium text-neutral-400 hover:text-white transition-colors"
      >
        {SPEED_OPTIONS[speedIndex]}x
      </button>
    </div>
  );
}
