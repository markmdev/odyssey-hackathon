'use client';

import type { Room } from '@/lib/types';
import type { RefObject } from 'react';

interface Props {
  room: Room;
  roomIndex: number;
  totalRooms: number;
  imageUrl: string | null;
  isStreaming: boolean;
  status: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  onNavigate: (direction: 1 | -1) => void;
  isLastRoom: boolean;
  isFirstRoom: boolean;
}

export default function PalaceViewer({
  room,
  roomIndex,
  totalRooms,
  imageUrl,
  isStreaming,
  status,
  videoRef,
  onNavigate,
  isLastRoom,
  isFirstRoom,
}: Props) {
  const showLoading = !imageUrl && !isStreaming;

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-black/80 px-6 py-4 backdrop-blur">
        <span className="text-lg font-semibold">{room.name}</span>
        <span className="text-sm text-gray-500">
          Room {roomIndex + 1} of {totalRooms}
        </span>
      </div>

      {/* Media area */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black">
        {/* Loading spinner */}
        {showLoading && (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/10 border-t-indigo-500" />
            <span className="text-sm">{status || 'Generating room image...'}</span>
          </div>
        )}

        {/* Static image (shown when Odyssey isn't streaming) */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={room.name}
            className={`max-h-[70vh] object-contain ${isStreaming ? 'hidden' : ''}`}
          />
        )}

        {/* Odyssey video stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`max-h-[70vh] object-contain ${isStreaming ? '' : 'hidden'}`}
        />

        {/* Status overlay */}
        {status && !showLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/60 px-4 py-2 text-sm text-gray-400 backdrop-blur">
            {status}
          </div>
        )}
      </div>

      {/* Mnemonic overlay */}
      <div className="absolute bottom-20 left-1/2 z-10 w-[90%] max-w-2xl -translate-x-1/2 text-center">
        <div className="mb-2 text-xl font-bold text-white drop-shadow-lg">
          {room.itemToRemember}
        </div>
        <div className="rounded-xl bg-black/60 px-5 py-3 text-[15px] leading-relaxed text-white/85 backdrop-blur">
          {room.mnemonic}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-center gap-4 bg-black/80 px-6 py-4 backdrop-blur">
        <button
          onClick={() => onNavigate(-1)}
          disabled={isFirstRoom}
          className="rounded-lg border border-white/10 bg-white/5 px-7 py-2.5 text-[15px] transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          ← Previous
        </button>
        <button
          onClick={() => onNavigate(1)}
          className="rounded-lg bg-indigo-500 px-7 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-indigo-600"
        >
          {isLastRoom ? 'Start Quiz →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
