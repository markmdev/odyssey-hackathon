'use client';

import type { GradeLevel, SubjectTemplate } from '@/lib/types';

interface Props {
  templates: SubjectTemplate[];
  scenarios: { name: string; displayName: string }[];
  isLiveMode: boolean;
  inputText: string;
  gradeLevel: GradeLevel;
  onInputChange: (text: string) => void;
  onGradeChange: (grade: GradeLevel) => void;
  onBuild: () => void;
  onSelectScenario: (name: string) => void;
}

const GRADES: GradeLevel[] = ['K-3', '4-6', '7-9', '10-12'];

const SCENARIO_META: Record<string, { emoji: string; rooms: number }> = {
  dinosaurs: { emoji: '🦕', rooms: 6 },
  'solar-system': { emoji: '🪐', rooms: 6 },
  'world-wonders': { emoji: '🏛️', rooms: 6 },
  'human-body': { emoji: '🫀', rooms: 6 },
  'ocean-creatures': { emoji: '🐙', rooms: 6 },
};

export default function HomeScreen({
  templates,
  scenarios,
  isLiveMode,
  inputText,
  gradeLevel,
  onInputChange,
  onGradeChange,
  onBuild,
  onSelectScenario,
}: Props) {
  if (scenarios.length > 0 && !isLiveMode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-10 p-8">
        <div className="text-center">
          <h1 className="mb-3 font-display text-6xl font-normal italic tracking-tight text-white">
            Memory Palace
          </h1>
          <p className="text-lg text-gray-500">Choose a world to explore</p>
        </div>

        <div className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
          {scenarios.map((s) => {
            const meta = SCENARIO_META[s.name] ?? { emoji: '📚', rooms: 6 };
            return (
              <button
                key={s.name}
                onClick={() => onSelectScenario(s.name)}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface-raised text-left transition-all duration-200 hover:border-border-hover hover:bg-surface-hover"
              >
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={`/scenarios/${s.name}/room-0.png`}
                    alt={s.displayName}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <span className="font-display text-lg text-white">{s.displayName}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{meta.rooms} rooms</p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-sm text-gray-600">
          <a href="?live" className="transition-colors hover:text-gray-400">
            or create your own →
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="font-display text-6xl font-normal italic tracking-tight text-white">
        Memory Palace
      </h1>
      <p className="text-gray-500">Learn anything by walking through it</p>

      <textarea
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="What do you want to memorize? Paste your study material here..."
        rows={7}
        className="w-full max-w-xl resize-none rounded-xl border border-border bg-surface-raised px-5 py-4 text-[15px] leading-relaxed text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-border-hover"
      />

      <div className="flex flex-wrap justify-center gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onInputChange(t.placeholder)}
            className="rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm transition-colors hover:border-border-hover hover:bg-surface-hover"
          >
            {t.icon} {t.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Grade:</span>
        <div className="flex gap-1.5">
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => onGradeChange(g)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                gradeLevel === g
                  ? 'bg-accent text-white'
                  : 'border border-border bg-surface-raised hover:bg-surface-hover'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onBuild}
        disabled={!inputText.trim()}
        className="rounded-xl bg-accent px-14 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        Build My Palace
      </button>
    </div>
  );
}
