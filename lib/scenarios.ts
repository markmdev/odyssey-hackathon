import type { PreparedScenario, Room, QuizQuestion } from './types';

export async function listScenarios(): Promise<{ name: string; displayName: string }[]> {
  try {
    const res = await fetch('/scenarios/index.json');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function loadScenario(name: string): Promise<{ rooms: Room[]; quizQuestions: QuizQuestion[] }> {
  const res = await fetch(`/scenarios/${name}/manifest.json`);
  if (!res.ok) throw new Error(`Failed to load scenario: ${name}`);
  const scenario: PreparedScenario = await res.json();

  const rooms: Room[] = scenario.rooms.map((r) => ({
    index: r.index,
    name: r.name,
    itemToRemember: r.itemToRemember,
    mnemonic: r.mnemonic,
    sceneDescription: r.sceneDescription,
    odysseyKeyframes: r.odysseyKeyframes,
    imageDataUrl: r.imageFile ? `/scenarios/${name}/${r.imageFile}` : undefined,
    videoUrl: r.videoFile ? `/scenarios/${name}/${r.videoFile}` : undefined,
  }));

  return { rooms, quizQuestions: scenario.quizQuestions };
}
