import type { Challenge, Room } from './types';

export async function generatePalace(challenge: Challenge): Promise<Room[]> {
  const res = await fetch('/api/generate-palace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt: challenge.systemPrompt,
      items: challenge.items,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Palace generation failed: ${text}`);
  }

  const data = await res.json();
  return data.rooms.map((r: Omit<Room, 'index'>, i: number) => ({ ...r, index: i }));
}

export interface RoomImage {
  dataUrl: string;
  blob: Blob;
}

export async function generateRoomImage(sceneDescription: string): Promise<RoomImage> {
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: sceneDescription }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Image generation failed: ${text}`);
  }

  const { data, mimeType } = await res.json();
  const dataUrl = `data:${mimeType};base64,${data}`;

  const binaryStr = atob(data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });

  return { dataUrl, blob };
}
