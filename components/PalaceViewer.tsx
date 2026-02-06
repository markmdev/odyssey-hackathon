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
  onExit: () => void;
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
  onExit,
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
    <div className="relative flex h-dvh flex-col bg-black">
      {/* Top bar — static on mobile, absolute overlay on desktop */}
      <div className="flex shrink-0 items-center justify-between bg-black px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:absolute md:inset-x-0 md:top-0 md:z-20 md:bg-black/60 md:px-6 md:py-4 md:pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            aria-label="Back to home"
            className="rounded-lg bg-white/10 px-2.5 py-1 text-sm text-white/70 transition-colors hover:bg-white/20"
          >
            ← Back
          </button>
          <span className="font-display text-base italic text-white/90 md:text-xl">{room.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {isStreaming && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1">
              <div className="size-2 rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-400">LIVE</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalRooms }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full ${
                  i === roomIndex ? 'w-6 bg-accent' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Media area — fixed 16:9 on mobile, full bleed on desktop */}
      <div className="relative aspect-video w-full shrink-0 md:aspect-auto md:min-h-0 md:flex-1">
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
              className="h-full w-full object-cover md:object-contain"
            />
            {/* Transition overlay: only while actively starting a new stream */}
            {videoEnded && streamStatus === 'starting' && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-2xl bg-black/60 px-6 py-3">
                  <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
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
              className="h-full w-full object-cover md:object-contain"
            />
            {videosLoading && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                <div className="size-3 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
                <span className="text-xs text-white/60">Bringing to life...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <div className="size-10 animate-spin rounded-full border-[3px] border-white/10 border-t-accent" />
            <span className="text-sm">Loading room...</span>
          </div>
        )}
      </div>

      {/* Content — scrollable on mobile, absolute overlay on desktop */}
      <div className="flex flex-1 justify-center overflow-y-auto px-4 py-3 md:absolute md:inset-x-0 md:bottom-24 md:z-10 md:flex-none md:overflow-visible md:px-6 md:py-0">
        <div className="flex w-full max-w-2xl flex-col items-center gap-3 md:items-center">
          {/* Item to remember */}
          <div className="w-full rounded-2xl bg-black/70 px-6 py-3 text-center backdrop-blur-md">
            <p className="font-display text-pretty text-xl italic leading-snug text-white md:text-2xl">
              {room.itemToRemember}
            </p>
          </div>

          {/* Mnemonic description */}
          <div className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-center text-pretty text-sm leading-relaxed text-white/90 backdrop-blur-md md:px-6 md:py-4 md:text-base">
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
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:border-accent/40 hover:bg-accent/30 disabled:opacity-40"
                >
                  {interactingButton === i ? (
                    <span className="flex items-center gap-2">
                      <div className="size-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
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

      {/* Bottom navigation — static on mobile, absolute overlay on desktop */}
      <div className="flex shrink-0 items-center justify-center gap-4 bg-black px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:absolute md:inset-x-0 md:bottom-0 md:z-20 md:bg-black/60 md:px-6 md:py-5 md:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
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
