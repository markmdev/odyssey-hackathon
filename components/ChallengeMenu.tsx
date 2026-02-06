import type { Challenge } from '@/lib/types';

interface Props {
  challenges: Challenge[];
  selectedId: string;
  onSelect: (id: string) => void;
  onBegin: () => void;
}

export default function ChallengeMenu({ challenges, selectedId, onSelect, onBegin }: Props) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8">
      <h1 className="bg-gradient-to-br from-violet-400 to-indigo-500 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
        Memory Palace
      </h1>
      <p className="text-gray-500">Train your memory with the Method of Loci</p>

      <div className="flex gap-4">
        {challenges.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-60 rounded-2xl border-2 p-7 text-center transition-all ${
              selectedId === c.id
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5'
            }`}
          >
            <div className="mb-3 text-4xl">{c.icon}</div>
            <h3 className="mb-1 text-lg font-semibold">{c.name}</h3>
            <p className="text-sm text-gray-500">{c.description}</p>
            <p className="mt-2 text-xs text-indigo-400">{c.items.length} items</p>
          </button>
        ))}
      </div>

      <button
        onClick={onBegin}
        className="rounded-xl bg-indigo-500 px-14 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-indigo-600"
      >
        Begin
      </button>
    </div>
  );
}
