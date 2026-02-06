import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { buildSystemPrompt } from '../lib/templates';
import { generateQuizQuestions } from '../lib/quiz';
import type { GradeLevel, Room, OdysseyKeyframe, QuizQuestion } from '../lib/types';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  name: string;
  grade: GradeLevel;
  input?: string;
  displayName?: string;
} {
  const args = argv.slice(2);
  let name: string | undefined;
  let grade: GradeLevel = '4-6';
  let input: string | undefined;
  let displayName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--name':
        name = args[++i];
        break;
      case '--grade':
        grade = args[++i] as GradeLevel;
        break;
      case '--input':
        input = args[++i];
        break;
      case '--display-name':
        displayName = args[++i];
        break;
      case '--help':
        console.log(`Usage: npx tsx scripts/generate-scenario.ts --name <name> [options]

Options:
  --name <string>          Scenario directory name (lowercase, kebab-case) [required]
  --grade <string>         Grade level: K-3, 4-6, 7-9, 10-12 (default: 4-6)
  --input <string>         Input text directly. If omitted, reads from stdin.
  --display-name <string>  Human-readable name. Defaults to titleCase of name.
  --help                   Show this help message`);
        process.exit(0);
    }
  }

  if (!name) {
    console.error('[generate-scenario] Error: --name is required');
    process.exit(1);
  }

  return { name, grade, input, displayName };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toTitleCase(kebab: string): string {
  return kebab
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function log(msg: string) {
  console.log(`[generate-scenario] ${msg}`);
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data.trim()));
    process.stdin.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// API: OpenAI GPT-5.2
// ---------------------------------------------------------------------------

async function designRooms(
  inputText: string,
  gradeLevel: GradeLevel,
): Promise<Room[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.2',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(gradeLevel) },
        {
          role: 'user',
          content: `Create a memory palace for this study material:\n\n${inputText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const rooms: Room[] = JSON.parse(data.choices[0].message.content).rooms;

  // Ensure each room has an index
  return rooms.map((r, i) => ({ ...r, index: i }));
}

// ---------------------------------------------------------------------------
// API: Gemini Flash (sequential image generation)
// ---------------------------------------------------------------------------

async function generateRoomImage(
  sceneDescription: string,
  outputPath: string,
): Promise<boolean> {
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: sceneDescription,
      config: {
        responseModalities: ['Image'],
        imageConfig: { aspectRatio: '16:9' },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    for (const part of parts ?? []) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data!, 'base64');
        fs.writeFileSync(outputPath, buffer);
        return true;
      }
    }

    throw new Error('No image data in Gemini response');
  } catch (err) {
    console.error(`  Gemini error: ${(err as Error).message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// API: Odyssey Simulate (parallel per room)
// ---------------------------------------------------------------------------

async function simulateRoom(
  room: Room,
  imagePath: string,
  videoPath: string,
  scenarioName: string,
  roomIndex: number,
): Promise<boolean> {
  try {
    const { Odyssey } = await import('@odysseyml/odyssey');
    const client = new Odyssey({
      apiKey: process.env.NEXT_PUBLIC_ODYSSEY_API_KEY!,
    });

    // Build script from keyframes
    const script = room.odysseyKeyframes.map(
      (kf: OdysseyKeyframe, ki: number) => {
        if (ki === 0) {
          const imageBuffer = fs.readFileSync(imagePath);
          const dataUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
          return {
            timestamp_ms: kf.timestamp_ms,
            start: { prompt: kf.prompt ?? '', image: dataUrl },
          };
        }
        if (kf.end) {
          return { timestamp_ms: kf.timestamp_ms, end: {} as Record<string, never> };
        }
        return {
          timestamp_ms: kf.timestamp_ms,
          interact: { prompt: kf.prompt ?? '' },
        };
      },
    );

    const job = await client.simulate({ script, portrait: false });

    // Poll until done
    let status = await client.getSimulateStatus(job.job_id);
    while (
      !['completed', 'failed', 'cancelled'].includes(status.status)
    ) {
      process.stdout.write(` ${status.status}`);
      await new Promise((r) => setTimeout(r, 3000));
      status = await client.getSimulateStatus(job.job_id);
    }

    process.stdout.write(` ${status.status}`);

    // Download video
    if (
      status.status === 'completed' &&
      status.streams?.[0]?.video_url
    ) {
      const videoResponse = await fetch(status.streams[0].video_url);
      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
      fs.writeFileSync(videoPath, videoBuffer);
      return true;
    }

    return false;
  } catch (err) {
    console.error(`  Odyssey error: ${(err as Error).message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface ManifestRoom {
  index: number;
  name: string;
  itemToRemember: string;
  mnemonic: string;
  sceneDescription: string;
  odysseyKeyframes: OdysseyKeyframe[];
  imageFile: string | null;
  videoFile: string | null;
}

interface Manifest {
  name: string;
  displayName: string;
  gradeLevel: string;
  inputText: string;
  rooms: ManifestRoom[];
  quizQuestions: QuizQuestion[];
}

async function main() {
  const { name, grade, input, displayName } = parseArgs(process.argv);
  const display = displayName ?? toTitleCase(name);

  log(`Creating scenario: ${name} (grade ${grade})`);

  // ---- Input text ----
  let inputText: string;
  if (input) {
    inputText = input;
  } else {
    log('Reading input from stdin... (paste text, then Ctrl+D)');
    inputText = await readStdin();
  }

  if (!inputText) {
    console.error('[generate-scenario] Error: no input text provided');
    process.exit(1);
  }

  // ---- Output directory ----
  const outDir = path.resolve(
    process.cwd(),
    'public',
    'scenarios',
    name,
  );
  fs.mkdirSync(outDir, { recursive: true });

  // ---- Step 1: GPT designs rooms ----
  log('GPT: Designing rooms...');
  let rooms: Room[];
  try {
    rooms = await designRooms(inputText, grade);
    log(`GPT: Done — ${rooms.length} rooms designed`);
  } catch (err) {
    console.error(
      `[generate-scenario] GPT failed: ${(err as Error).message}`,
    );
    process.exit(1);
  }

  // ---- Step 2: Gemini generates images (sequential) ----
  const imageResults: boolean[] = [];
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const imgPath = path.join(outDir, `room-${i}.png`);
    process.stdout.write(
      `[generate-scenario] Gemini: Generating room ${i + 1}/${rooms.length} image...`,
    );
    const ok = await generateRoomImage(room.sceneDescription, imgPath);
    imageResults.push(ok);
    console.log(ok ? ' done \u2713' : ' FAILED');
  }

  // ---- Step 3: Odyssey simulate (parallel, one job per room) ----
  const videoPromises: Promise<boolean>[] = [];
  for (let i = 0; i < rooms.length; i++) {
    if (!imageResults[i]) {
      // Skip Odyssey if Gemini failed for this room
      videoPromises.push(Promise.resolve(false));
      continue;
    }
    const room = rooms[i];
    const imgPath = path.join(outDir, `room-${i}.png`);
    const vidPath = path.join(outDir, `room-${i}.mp4`);

    log(`Odyssey: Simulating room ${i + 1}/${rooms.length}...`);
    videoPromises.push(
      simulateRoom(room, imgPath, vidPath, name, i).then((ok) => {
        if (ok) {
          log(`Odyssey: Downloading room ${i + 1}/${rooms.length} video... done \u2713`);
        } else {
          log(`Odyssey: Room ${i + 1}/${rooms.length} video FAILED`);
        }
        return ok;
      }),
    );
  }

  const videoResults = await Promise.all(videoPromises);

  // ---- Step 4: Generate quiz ----
  const quizQuestions = generateQuizQuestions(rooms);

  // ---- Step 5: Write manifest ----
  const manifest: Manifest = {
    name,
    displayName: display,
    gradeLevel: grade,
    inputText,
    rooms: rooms.map((room, i) => ({
      index: i,
      name: room.name,
      itemToRemember: room.itemToRemember,
      mnemonic: room.mnemonic,
      sceneDescription: room.sceneDescription,
      odysseyKeyframes: room.odysseyKeyframes,
      imageFile: imageResults[i] ? `room-${i}.png` : null,
      videoFile: videoResults[i] ? `room-${i}.mp4` : null,
    })),
    quizQuestions,
  };

  const manifestPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  log(`Saved to public/scenarios/${name}/`);
  log(`Manifest: public/scenarios/${name}/manifest.json`);
}

main().catch((err) => {
  console.error(`[generate-scenario] Fatal error: ${err.message}`);
  process.exit(1);
});
