import type { Room, GradeLevel } from './types';
import { buildSystemPrompt } from './templates';

export async function generatePalace(text: string, gradeLevel: GradeLevel): Promise<Room[]> {
  const res = await fetch('/api/generate-palace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt: buildSystemPrompt(gradeLevel),
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Palace generation failed: ${body}`);
  }

  const data = await res.json();
  return data.rooms.map((r: Omit<Room, 'index'>, i: number) => ({ ...r, index: i }));
}

export async function generateRoomImage(sceneDescription: string): Promise<string> {
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: sceneDescription }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Image generation failed: ${body}`);
  }

  const { data, mimeType } = await res.json();
  return `data:${mimeType};base64,${data}`;
}

export async function generateAllImages(
  rooms: Room[],
  onImageReady: (index: number, dataUrl: string) => void,
): Promise<string[]> {
  const promises = rooms.map(async (room, i) => {
    const dataUrl = await generateRoomImage(room.sceneDescription);
    onImageReady(i, dataUrl);
    return dataUrl;
  });
  return Promise.all(promises);
}
