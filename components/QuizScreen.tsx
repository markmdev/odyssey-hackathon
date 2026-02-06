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

  // Reset when question changes
  const key = `${questionIndex}`;

  return (
    <div key={key} className="flex h-screen flex-col items-center justify-center gap-7">
      <h2 className="text-3xl font-bold">Test Your Memory</h2>
      <p className="text-sm text-gray-500">
        Question {questionIndex + 1} of {totalQuestions}
      </p>

      <p className="max-w-lg text-center text-xl font-medium leading-relaxed">
        {question.question}
      </p>

      <div className="flex w-96 max-w-[90vw] flex-col gap-2.5">
        {question.options.map((option, i) => {
          let style = 'border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5';
          if (answered !== null) {
            if (i === question.correctIndex) {
              style = 'border-green-500 bg-green-500/10';
            } else if (i === answered && answered !== question.correctIndex) {
              style = 'border-red-500 bg-red-500/10';
            } else {
              style = 'border-white/5 bg-white/[0.02] opacity-50';
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
              className={`rounded-xl border-2 px-5 py-3.5 text-left text-base transition-all ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
