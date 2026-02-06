'use client';

import { useRef, useState, useEffect } from 'react';
import type { Room } from '@/lib/types';

interface Props {
  room: Room;
  roomIndex: number;
  totalRooms: number;
  onNavigate: (direction: 1 | -1) => void;
  isLastRoom: boolean;
  isFirstRoom: boolean;
  videosLoading: boolean;
  interactiveStream: MediaStream | null;
  streamStatus: 'idle' | 'starting' | 'streaming' | 'ending';
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'failed';
  onInteract: (prompt: string) => Promise<void>;
  onVideoEnded: () => void;
}

export default function PalaceViewer({
  room,
  roomIndex,
  totalRooms,
  onNavigate,
  isLastRoom,
  isFirstRoom,
  videosLoading,
  interactiveStream,
  streamStatus,
  connectionStatus,
  onInteract,
  onVideoEnded,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [interactingButton, setInteractingButton] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(false);

  const hasInteractiveSupport = connectionStatus !== 'failed' && !!room.interactionButtons?.length;
  const isStreaming = videoEnded && streamStatus === 'streaming';

  // Reset state on room change
  useEffect(() => {
    setVideoEnded(false);
    setInteractingButton(null);
    setCooldown(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [roomIndex]);

  // Swap to interactive stream when ready
  useEffect(() => {
    if (!videoRef.current || !videoEnded || !interactiveStream || streamStatus !== 'streaming') return;
    videoRef.current.src = '';
    videoRef.current.srcObject = interactiveStream;
    videoRef.current.play().catch(() => {});
  }, [videoEnded, interactiveStream, streamStatus]);

  const handleVideoEnded = () => {
    if (!hasInteractiveSupport) return;
    setVideoEnded(true);
    onVideoEnded();
  };

  const handleButtonClick = async (index: number, prompt: string) => {
    if (cooldown || interactingButton !== null) return;
    setInteractingButton(index);
    setCooldown(true);
    try {
      await onInteract(prompt);
    } finally {
      setInteractingButton(null);
      setTimeout(() => setCooldown(false), 2000);
    }
  };

  return (
    <div className="relative flex h-screen flex-col bg-black">
      {/* Top bar */}
      <div className="absolute top-0 right-0 left-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-6 py-4">
        <span className="font-display text-xl italic text-white/90">{room.name}</span>
        <div className="flex items-center gap-3">
          {isStreaming && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-400">LIVE</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalRooms }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === roomIndex ? 'w-6 bg-accent' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Media area — full bleed */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {room.videoUrl ? (
          <div className="relative h-full w-full">
            <video
              ref={videoRef}
              src={room.videoUrl}
              autoPlay
              loop={!hasInteractiveSupport}
              muted
              playsInline
              onEnded={handleVideoEnded}
              className="h-full w-full object-contain"
            />
            {/* Transition overlay: only while actively starting a new stream */}
            {videoEnded && streamStatus === 'starting' && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-2xl bg-black/60 px-6 py-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
                  <span className="text-sm text-white/70">Entering live mode...</span>
                </div>
              </div>
            )}
          </div>
        ) : room.imageDataUrl ? (
          <div className="relative h-full w-full">
            <img
              src={room.imageDataUrl}
              alt={room.name}
              className="h-full w-full object-contain"
            />
            {videosLoading && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
                <span className="text-xs text-white/60">Bringing to life...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/10 border-t-accent" />
            <span className="text-sm">Loading room...</span>
          </div>
        )}
      </div>

      {/* Bottom content overlay — mnemonic + optional interaction buttons */}
      <div className="absolute right-0 bottom-20 left-0 z-10 flex justify-center px-6">
        <div className="flex w-full max-w-2xl flex-col items-center gap-3">
          {/* Item to remember */}
          <div className="w-full rounded-2xl bg-black/70 px-6 py-3 text-center backdrop-blur-md">
            <p className="font-display text-2xl italic leading-snug text-white">
              {room.itemToRemember}
            </p>
          </div>

          {/* Mnemonic description */}
          <div className="w-full rounded-2xl border border-white/10 bg-black/70 px-6 py-4 text-center text-base leading-relaxed text-white/90 backdrop-blur-md">
            {room.mnemonic}
          </div>

          {/* Interaction buttons — shown below mnemonic when streaming */}
          {isStreaming && room.interactionButtons && (
            <div className="flex flex-wrap justify-center gap-2">
              {room.interactionButtons.map((btn, i) => (
                <button
                  key={i}
                  onClick={() => handleButtonClick(i, btn.prompt)}
                  disabled={cooldown || interactingButton !== null}
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-accent/40 hover:bg-accent/30 disabled:opacity-40"
                >
                  {interactingButton === i ? (
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      {btn.label}
                    </span>
                  ) : (
                    btn.label
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="absolute right-0 bottom-0 left-0 z-20 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent px-6 py-5">
        <button
          onClick={() => onNavigate(-1)}
          disabled={isFirstRoom}
          className="rounded-xl border border-white/10 bg-white/5 px-7 py-2.5 text-[15px] backdrop-blur-sm transition-colors hover:bg-white/10 disabled:opacity-20"
        >
          ← Previous
        </button>
        <button
          onClick={() => onNavigate(1)}
          className="rounded-xl bg-accent px-7 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          {isLastRoom ? 'Start Quiz →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
