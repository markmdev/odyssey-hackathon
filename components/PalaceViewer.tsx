'use client';

import type { Room } from '@/lib/types';

interface Props {
  room: Room;
  roomIndex: number;
  totalRooms: number;
  onNavigate: (direction: 1 | -1) => void;
  isLastRoom: boolean;
  isFirstRoom: boolean;
  videosLoading: boolean;
}

export default function PalaceViewer({
  room,
  roomIndex,
  totalRooms,
  onNavigate,
  isLastRoom,
  isFirstRoom,
  videosLoading,
}: Props) {
  return (
    <div className="relative flex h-screen flex-col bg-black">
      {/* Top bar */}
      <div className="absolute top-0 right-0 left-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-6 py-4">
        <span className="font-display text-xl italic text-white/90">{room.name}</span>
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

      {/* Media area — full bleed */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {room.videoUrl ? (
          <video
            key={room.videoUrl}
            src={room.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-contain"
          />
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

      {/* Mnemonic overlay */}
      <div className="absolute right-0 bottom-24 left-0 z-10 flex justify-center px-6">
        <div className="w-full max-w-2xl">
          <div className="mb-3 rounded-2xl bg-black/70 px-6 py-3 text-center backdrop-blur-md">
            <p className="font-display text-2xl italic leading-snug text-white">
              {room.itemToRemember}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/70 px-6 py-4 text-center text-base leading-relaxed text-white/90 backdrop-blur-md">
            {room.mnemonic}
          </div>
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
