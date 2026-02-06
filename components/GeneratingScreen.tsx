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
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8">
      <div className="relative size-14">
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-white/5 border-t-accent" />
        <div className="absolute inset-2 animate-spin rounded-full border-[2px] border-white/5 border-b-accent/50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>

      <div className="text-center">
        <h2 className="font-display text-3xl italic text-balance text-white">Building your palace...</h2>
        <p className="mt-2 text-pretty text-sm text-gray-500">{PHASE_LABELS[phase]}</p>
      </div>

      <div className="h-1 w-72 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-accent transition-transform duration-200 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {rooms.length > 0 && imagesReady > 0 && (
        <div className="flex flex-wrap justify-center gap-2 px-8">
          {rooms.slice(0, imagesReady).map((room) =>
            room.imageDataUrl ? (
              <img
                key={room.index}
                src={room.imageDataUrl}
                alt={room.name}
                className="h-16 w-28 rounded-lg object-cover opacity-70 ring-1 ring-white/10"
              />
            ) : null,
          )}
        </div>
      )}

      {phase === 'painting' && totalRooms > 0 && (
        <p className="text-pretty text-xs text-gray-600">
          {imagesReady} of {totalRooms} images ready
        </p>
      )}
    </div>
  );
}
