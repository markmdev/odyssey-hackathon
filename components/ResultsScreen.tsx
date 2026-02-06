import type { QuizQuestion, Room } from '@/lib/types';

interface Props {
  score: number;
  total: number;
  questions: QuizQuestion[];
  rooms: Room[];
  answers: boolean[];
  onRetry: () => void;
  onNewChallenge: () => void;
}

export default function ResultsScreen({
  score,
  total,
  questions,
  rooms,
  answers,
  onRetry,
  onNewChallenge,
}: Props) {
  const pct = Math.round((score / total) * 100);
  const message =
    pct === 100
      ? 'Perfect! Your palace is built.'
      : pct >= 75
        ? 'Great recall! A few rooms to revisit.'
        : pct >= 50
          ? 'Good start — practice makes permanent.'
          : 'Keep building — the palace grows with practice.';

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <h2 className="text-3xl font-bold">Results</h2>

      <div className="bg-gradient-to-br from-violet-400 to-indigo-500 bg-clip-text text-7xl font-extrabold text-transparent">
        {score}/{total}
      </div>

      <p className="text-lg text-gray-500">{message}</p>

      {/* Breakdown */}
      <div className="flex max-h-48 w-[90vw] max-w-md flex-col gap-1.5 overflow-y-auto">
        {questions.map((q, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2 text-sm"
          >
            <span className="text-lg">{answers[i] ? '✓' : '✗'}</span>
            <span className={answers[i] ? 'text-green-400' : 'text-red-400'}>
              {rooms[q.roomIndex].itemToRemember}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="rounded-lg bg-indigo-500 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-600"
        >
          Try Again
        </button>
        <button
          onClick={onNewChallenge}
          className="rounded-lg border border-white/10 bg-white/5 px-8 py-3 text-base font-semibold transition-colors hover:bg-white/10"
        >
          New Challenge
        </button>
      </div>
    </div>
  );
}
