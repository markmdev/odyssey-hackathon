import type { Room } from '@/lib/types';

export type GenPhase = 'designing' | 'painting' | 'animating' | 'rendering';

interface Props {
  phase: GenPhase;
  rooms: Room[];
  imagesReady: number;
  totalRooms: number;
}

const PHASE_LABELS: Record<GenPhase, string> = {
  designing: 'Designing your rooms...',
  painting: 'Painting your rooms...',
  animating: 'Bringing rooms to life...',
  rendering: 'Rendering animations...',
};

export default function GeneratingScreen({ phase, rooms, imagesReady, totalRooms }: Props) {
  const progress =
    phase === 'designing'
      ? 0.15
      : phase === 'painting'
        ? 0.2 + (imagesReady / Math.max(totalRooms, 1)) * 0.4
        : phase === 'animating'
          ? 0.65
          : 0.8;

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-white/10 border-t-indigo-500" />
      <h2 className="text-2xl font-semibold">Building your palace...</h2>
      <p className="text-sm text-gray-500">{PHASE_LABELS[phase]}</p>

      {/* Progress bar */}
      <div className="h-1 w-72 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {/* Image thumbnails as they appear */}
      {rooms.length > 0 && imagesReady > 0 && (
        <div className="flex flex-wrap justify-center gap-2 px-8">
          {rooms.slice(0, imagesReady).map((room) =>
            room.imageDataUrl ? (
              <img
                key={room.index}
                src={room.imageDataUrl}
                alt={room.name}
                className="h-16 w-28 rounded-lg object-cover opacity-80"
              />
            ) : null,
          )}
        </div>
      )}

      {phase === 'painting' && totalRooms > 0 && (
        <p className="text-xs text-gray-600">
          {imagesReady} of {totalRooms} images ready
        </p>
      )}
    </div>
  );
}
