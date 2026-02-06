import type { Challenge } from './types';

const PALACE_SYSTEM_PROMPT = `You are a Memory Palace architect using the Method of Loci technique. Given items to memorize, create vivid, bizarre, unforgettable rooms.

Return ONLY valid JSON with this structure:
{
  "rooms": [
    {
      "name": "Room name (evocative, 2-4 words)",
      "itemToRemember": "The exact item from the list",
      "mnemonic": "A vivid 1-2 sentence memory hook connecting the room to the item. Use bizarre, exaggerated, or humorous imagery.",
      "sceneDescription": "A detailed 3-4 sentence visual scene for AI image generation. Include specific colors, lighting, objects, textures, and atmosphere. Style: vivid photorealistic fantasy with dramatic lighting.",
      "odysseyPrompt": "A cinematic description of the same scene with gentle ambient motion — floating particles, flickering firelight, drifting mist, swaying elements. First-person POV standing in the room. Photorealistic, cinematic, wide-angle lens."
    }
  ]
}

Rules:
- Each room must be dramatically different from the others (different color palettes, environments, moods)
- Mnemonics should create strong visual/emotional associations with the item
- Scene descriptions should be painterly and rich — they will generate still images
- Odyssey prompts should describe the same scene but emphasize ambient animation and first-person perspective
- Make it memorable: the weirder and more vivid, the better
- IMPORTANT: Keep all imagery family-friendly. No violence, gore, weapons, nudity, or dark/disturbing content. Use whimsical, fantastical, colorful, and playful imagery instead. Think Pixar, not horror.`;

export const challenges: Challenge[] = [
  {
    id: 'solar-system',
    name: 'Solar System',
    description: 'Memorize all 8 planets in order from the Sun',
    icon: '🪐',
    items: [
      'Mercury',
      'Venus',
      'Earth',
      'Mars',
      'Jupiter',
      'Saturn',
      'Uranus',
      'Neptune',
    ],
    systemPrompt: `${PALACE_SYSTEM_PROMPT}

Topic: Solar System planets in order from the Sun.
Create one room per planet. Each room's theme and imagery should create an unforgettable association with that specific planet and its position in the sequence.`,
  },
  {
    id: 'world-capitals',
    name: 'World Capitals',
    description: 'Match 6 countries with their capital cities',
    icon: '🌍',
    items: [
      'Japan → Tokyo',
      'Brazil → Brasília',
      'Egypt → Cairo',
      'Australia → Canberra',
      'Canada → Ottawa',
      'Italy → Rome',
    ],
    systemPrompt: `${PALACE_SYSTEM_PROMPT}

Topic: World capitals — matching countries to their capital cities.
Create one room per country/capital pair. Each room should visually fuse elements of the country's culture with a bizarre mnemonic for the capital city name.`,
  },
  {
    id: 'historical-dates',
    name: 'Historical Dates',
    description: 'Remember 6 pivotal moments in history',
    icon: '📜',
    items: [
      'Moon Landing → 1969',
      'Fall of the Berlin Wall → 1989',
      'French Revolution → 1789',
      'First Flight (Wright Brothers) → 1903',
      'World Wide Web Invented → 1991',
      'Magna Carta Signed → 1215',
    ],
    systemPrompt: `${PALACE_SYSTEM_PROMPT}

Topic: Historical dates — matching events to their years.
Create one room per event. Each room should dramatize the historical event while embedding a vivid numerical mnemonic for the year.`,
  },
];
