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
  // Show scenario cards when scenarios exist and not in live mode
  if (scenarios.length > 0 && !isLiveMode) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-8 p-8">
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold">Memory Palace</h1>
          <p className="text-lg text-gray-400">Choose a topic to explore</p>
        </div>

        <div className="grid max-w-2xl grid-cols-2 gap-4">
          {scenarios.map((s) => (
            <button
              key={s.name}
              onClick={() => onSelectScenario(s.name)}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-indigo-500/50 hover:bg-white/10"
            >
              <span className="text-lg font-semibold">{s.displayName}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Freeform input UI (live mode or no scenarios)
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="bg-gradient-to-br from-violet-400 to-indigo-500 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
        Memory Palace
      </h1>
      <p className="text-gray-500">Learn anything by walking through it</p>

      <textarea
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="What do you want to memorize? Paste your study material here..."
        rows={7}
        className="w-full max-w-xl resize-none rounded-xl border-2 border-white/10 bg-white/5 px-5 py-4 text-[15px] leading-relaxed text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-indigo-500/50"
      />

      {/* Subject templates */}
      <div className="flex flex-wrap justify-center gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onInputChange(t.placeholder)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/5"
          >
            {t.icon} {t.name}
          </button>
        ))}
      </div>

      {/* Grade level */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Grade:</span>
        <div className="flex gap-1.5">
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => onGradeChange(g)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                gradeLevel === g
                  ? 'bg-indigo-500 text-white'
                  : 'border border-white/10 bg-white/5 hover:bg-white/10'
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
        className="rounded-xl bg-indigo-500 px-14 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Build My Palace
      </button>
    </div>
  );
}
