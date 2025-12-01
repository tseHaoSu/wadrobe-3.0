"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);

    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-card rounded-2xl shadow-lg border-2 border-border p-4 flex items-center gap-3">
        <Button
          onClick={togglePlay}
          variant="default"
          size="icon"
          className="h-12 w-12 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all duration-200 bg-primary/70 hover:bg-primary/80"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        <div className="flex flex-col">
          <p className="text-sm font-semibold text-card-foreground">
            Morning Reset
          </p>
          <p className="text-xs text-muted-foreground">Yestalgia</p>
        </div>

        <Button
          onClick={toggleMute}
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-2 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>

        <audio ref={audioRef} loop>
          <source src="/Yestalgia - Morning Reset.mp3" type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
}
