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
      ? 'Perfect recall. Your palace stands strong.'
      : pct >= 75
        ? 'Strong memory. A few rooms to revisit.'
        : pct >= 50
          ? 'Good foundation. Practice deepens the palace.'
          : 'The palace grows with each visit.';

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <h2 className="font-display text-3xl italic text-balance text-white">Results</h2>

      <div className="font-display text-8xl font-normal text-accent">
        {score}/{total}
      </div>

      <p className="text-pretty text-lg text-gray-500">{message}</p>

      <div className="flex max-h-52 w-[90vw] max-w-md flex-col gap-1.5 overflow-y-auto">
        {questions.map((q, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm"
          >
            <span className={`text-lg ${answers[i] ? 'text-green-400' : 'text-red-400'}`}>
              {answers[i] ? '\u2713' : '\u2717'}
            </span>
            <span className={answers[i] ? 'text-gray-300' : 'text-gray-400'}>
              {rooms[q.roomIndex]?.itemToRemember}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="rounded-xl bg-accent px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Walk Again
        </button>
        <button
          onClick={onNewChallenge}
          className="rounded-xl border border-border bg-surface-raised px-8 py-3 text-base font-semibold transition-colors hover:bg-surface-hover"
        >
          New Topic
        </button>
      </div>
    </div>
  );
}
