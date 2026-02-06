import type { Room, QuizQuestion } from './types';

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateQuizQuestions(rooms: Room[]): QuizQuestion[] {
  return rooms.map((room, i) => {
    const wrongItems = rooms
      .filter((_, j) => j !== i)
      .map((r) => r.itemToRemember);
    const distractors = shuffle(wrongItems).slice(0, 3);
    const options = shuffle([room.itemToRemember, ...distractors]);
    const correctIndex = options.indexOf(room.itemToRemember);

    return {
      roomIndex: i,
      question: `What was in the "${room.name}" room?`,
      options,
      correctIndex,
    };
  });
}
