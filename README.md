# Memory Palace

**Helping kids learn by turning study material into vivid, walkable AI-generated worlds.**

Memory Palace is an education tool built for K-12 classrooms. Students pick a topic — dinosaurs, ocean creatures, world wonders — and the app builds them a cinematic memory palace using the [Method of Loci](https://en.wikipedia.org/wiki/Method_of_loci), the same ancient technique used by memory champions. Each room is a vivid scene brought to life with **Odyssey-2 Pro** video generation, making abstract facts unforgettable.

A 4th grader doesn't need to imagine a T-Rex — they watch one slam its foot into volcanic rock and crush a boulder with its jaws. Then they're quizzed, and they remember.

## Why Odyssey

Memory palaces work because the brain remembers **vivid, moving scenes** far better than text on a page. Static images get you halfway there. Odyssey gets you the rest of the way.

Each room in the palace is a 10-second cinematic mini-story: a T-Rex slamming its foot into volcanic rock, a Blue Whale engulfing a cloud of krill, Saturn's rings glittering as the camera sweeps through ice particles. These aren't stock clips or pre-rendered animations — they're generated from a single image + prompt, unique to each learning session.

**Odyssey is the difference between a slideshow and an experience.**

### How Odyssey Is Used

- **Image-to-Video via Simulate API** — Each room starts as a Gemini-generated image, then Odyssey animates it into a looping 10-second video
- **Multi-keyframe scripts** — Not just "animate this image." Each room has 3-4 action beats (start → interact → interact → end) that tell a mini-story, pushing the model's ability to follow sequential prompts
- **Per-room parallel generation** — Individual simulate jobs per room, not batch. Videos trickle in independently and swap into the UI as they complete
- **Progressive loading UX** — Students enter the palace immediately on the first generated image. Videos render in the background and appear with a seamless crossfade. Perceived wait: ~15 seconds instead of ~4 minutes

## The Pipeline

```
Student Input → GPT-5.2 → Gemini 3 Pro → Odyssey Simulate → Interactive Palace → Quiz
```

1. **GPT-5.2** reads freeform text and designs palace rooms — locations, mnemonics, scene descriptions, and multi-keyframe Odyssey scripts
2. **Gemini 3 Pro** generates photorealistic 16:9 room images from the scene descriptions
3. **Odyssey Simulate** animates each image into a cinematic 10-second video using the multi-keyframe scripts
4. **React frontend** presents the palace as a walkable experience — navigate rooms, read mnemonics, watch scenes come alive
5. **Quiz** tests recall after the walkthrough

## Real-World Application

Memory Palace targets **K-12 education** — the demographic that benefits most from visual/spatial learning and struggles most with rote memorization.

- **Any subject, any grade level** — Dinosaurs, the solar system, world history, human anatomy, ocean biology. The AI adapts imagery and language complexity to the grade level
- **Proven technique** — The Method of Loci has thousands of years of evidence. Memory champions use it to memorize thousands of digits. We're making it accessible to a 4th grader
- **Teacher-friendly** — Pre-generated scenario library means zero setup time. Teachers click a topic, students explore. No API keys, no waiting
- **Assessment built in** — The quiz at the end provides immediate feedback on retention

## Demo

Five pre-generated scenarios are included, each with 6 rooms of Gemini Pro images + Odyssey videos:

- **Dinosaurs** — T-Rex, Triceratops, Stegosaurus, Velociraptor, Brachiosaurus, Pteranodon
- **Solar System** — Mercury, Venus, Mars, Jupiter, Saturn, Neptune
- **World Wonders** — Great Wall, Machu Picchu, Colosseum, Pyramids, Taj Mahal, Chichen Itza
- **Human Body** — Heart, Lungs, Brain, Skeleton, Digestive System, Muscles
- **Ocean Creatures** — Blue Whale, Great White Shark, Octopus, Jellyfish, Sea Turtle, Anglerfish

Live generation mode is available via `?live` URL parameter — type anything and watch the full pipeline run in real-time.

## Tech Stack

- **Next.js 16** + React 19 + Tailwind CSS v4
- **Odyssey SDK** (`@odysseyml/odyssey`) — Simulate API for image-to-video
- **OpenAI GPT-5.2** — Palace design and room generation
- **Google Gemini 3 Pro** — Photorealistic image generation
- **TypeScript** throughout

## Running Locally

```bash
npm install --legacy-peer-deps
cp .env.example .env  # Add your API keys
npm run dev
```

Environment variables:
- `NEXT_PUBLIC_ODYSSEY_API_KEY` — Odyssey API key (client-side, for Simulate)
- `OPENAI_API_KEY` — OpenAI (server-side)
- `GEMINI_API_KEY` — Google Gemini (server-side)

## Generating Scenarios

Pre-generate scenarios with the CLI script:

```bash
npx tsx scripts/generate-scenario.ts \
  --name dinosaurs \
  --manifest scripts/data/dinosaurs.json \
  --gemini-model gemini-3-pro-image-preview
```

Handcrafted room data in `scripts/data/` ensures high-quality demo content. The script handles Gemini image generation and Odyssey video simulation end-to-end.

## Built by

Mark, Oscar, and Javokhir — Odyssey Hackathon 2026
