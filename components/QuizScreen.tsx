'use client';

import { useState } from 'react';
import type { QuizQuestion } from '@/lib/types';

interface Props {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (choiceIndex: number) => void;
  lastAnswer: boolean | null;
}

export default function QuizScreen({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  lastAnswer,
}: Props) {
  const [answered, setAnswered] = useState<number | null>(null);

  const key = `${questionIndex}`;

  return (
    <div key={key} className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h2 className="font-display text-4xl italic text-balance text-white">Test Your Memory</h2>
        <p className="mt-2 text-pretty text-sm text-gray-500">
          Question {questionIndex + 1} of {totalQuestions}
        </p>
      </div>

      <p className="max-w-lg text-pretty text-center text-xl leading-relaxed text-gray-200">
        {question.question}
      </p>

      <div className="flex w-96 max-w-[90vw] flex-col gap-2.5">
        {question.options.map((option, i) => {
          let style = 'border-border bg-surface-raised hover:border-border-hover hover:bg-surface-hover';
          if (answered !== null) {
            if (i === question.correctIndex) {
              style = 'border-green-500/60 bg-green-500/10';
            } else if (i === answered && answered !== question.correctIndex) {
              style = 'border-red-500/60 bg-red-500/10';
            } else {
              style = 'border-white/5 bg-white/[0.02] opacity-40';
            }
          }

          return (
            <button
              key={i}
              disabled={answered !== null}
              onClick={() => {
                setAnswered(i);
                onAnswer(i);
              }}
              className={`rounded-xl border-2 px-5 py-3.5 text-left text-base transition-colors ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
