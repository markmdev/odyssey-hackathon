import type { GradeLevel, SubjectTemplate } from './types';

export const templates: SubjectTemplate[] = [
  {
    id: 'vocabulary',
    name: 'Vocabulary',
    icon: '🔤',
    placeholder: `Photosynthesis — the process plants use to convert sunlight into energy
Mitosis — cell division that produces two identical daughter cells
Osmosis — movement of water through a semipermeable membrane
Ecosystem — a community of living organisms and their environment
Metamorphosis — a transformation in body structure during development
Symbiosis — a close relationship between two different species`,
  },
  {
    id: 'history',
    name: 'History',
    icon: '📜',
    placeholder: `Moon Landing → 1969
Fall of the Berlin Wall → 1989
French Revolution → 1789
First Flight (Wright Brothers) → 1903
World Wide Web Invented → 1991
Magna Carta Signed → 1215`,
  },
  {
    id: 'science',
    name: 'Science',
    icon: '🔬',
    placeholder: `The Sun is a star made mostly of hydrogen and helium
Water boils at 100°C (212°F) at sea level
DNA carries the genetic instructions for all living things
Gravity pulls objects toward Earth at 9.8 m/s²
Light travels at approximately 300,000 km per second
The human body has 206 bones`,
  },
  {
    id: 'geography',
    name: 'Geography',
    icon: '🌍',
    placeholder: `Japan → Tokyo
Brazil → Brasília
Egypt → Cairo
Australia → Canberra
Canada → Ottawa
Italy → Rome`,
  },
];

const PALACE_BASE_PROMPT = `You are a Memory Palace architect using the Method of Loci technique. Given study material, extract the key items to memorize and create vivid, unforgettable rooms for each one. Maximum 8 rooms.

Return ONLY valid JSON with this structure:
{
  "rooms": [
    {
      "name": "Room name (evocative, 2-4 words)",
      "itemToRemember": "The key fact or item extracted from the input",
      "mnemonic": "A vivid 1-2 sentence memory hook connecting the room to the item. Bizarre, exaggerated, or humorous imagery works best.",
      "sceneDescription": "A detailed 3-4 sentence visual scene for AI image generation. Include specific colors, lighting, objects, textures, and atmosphere.",
      "odysseyPrompt": "A cinematic description of the same scene with gentle ambient motion — floating particles, flickering light, drifting mist, swaying elements. First-person POV standing in the room. Photorealistic, cinematic, wide-angle lens."
    }
  ]
}

Rules:
- Extract the most important items from the study material (max 8)
- Each room must be dramatically different (different colors, environments, moods)
- Mnemonics should create strong visual/emotional associations
- Scene descriptions should be painterly and rich
- Odyssey prompts should emphasize ambient animation and first-person perspective
- IMPORTANT: Keep all imagery family-friendly. No violence, gore, weapons, nudity, or dark/disturbing content. Use whimsical, fantastical, colorful, and playful imagery. Think Pixar, not horror.`;

const GRADE_GUIDANCE: Record<GradeLevel, string> = {
  'K-3': 'Target audience: young children (ages 5-8). Use very simple language. Bright, colorful, cartoon-like scenes in a Pixar/Disney style. Mnemonics should use rhymes, silly comparisons, funny animals, or familiar objects like toys and candy.',
  '4-6': 'Target audience: children (ages 9-11). Use age-appropriate language. Playful, imaginative scenes with magical elements — enchanted forests, floating islands, friendly dragons. Creative mnemonics with visual humor and adventure themes.',
  '7-9': 'Target audience: teenagers (ages 12-14). Use engaging language. Varied artistic styles with dramatic lighting and interesting environments — futuristic cities, underwater worlds, epic landscapes. Multi-layered mnemonics with clever wordplay.',
  '10-12': 'Target audience: young adults (ages 15-18). Use sophisticated language. Diverse artistic styles, complex compositions, surreal or abstract environments. Creative memory associations that reward deeper thinking.',
};

export function buildSystemPrompt(gradeLevel: GradeLevel): string {
  return `${PALACE_BASE_PROMPT}\n\n${GRADE_GUIDANCE[gradeLevel]}`;
}
