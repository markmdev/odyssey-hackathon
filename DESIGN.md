# Memory Palace — Design Spec

A visual learning app that uses the Method of Loci (memory palace technique) combined with AI-generated imagery and video to help students memorize anything.

## Design Philosophy

**Immersive, not utilitarian.** The app should feel like stepping into a world — dark, rich, cinematic. Think: a museum at night, not a classroom. The AI-generated images and videos are the star; the UI is a frame that disappears when you're exploring.

**Calm confidence.** No flashy animations or over-designed elements. Clean type, generous spacing, subtle glass effects. The content does the heavy lifting.

**Two personality modes:**
- **Home / Quiz / Results** — structured, informational, card-based. The "lobby" of the experience.
- **Palace Viewer** — immersive, full-bleed media, minimal chrome. The "in-world" experience.

---

## Color & Theme

- **Background:** Near-black (`#0a0a0f`) — deep enough to make images pop
- **Accent:** Indigo-to-violet gradient (`violet-400` → `indigo-500`) — used sparingly for CTAs and emphasis
- **Text:** Light gray (`gray-200`) for body, `gray-500` for secondary, white for headings on dark
- **Glass surfaces:** `bg-white/5` with `backdrop-blur` for overlays and cards — the "frosted glass" look
- **Borders:** `border-white/10` — barely visible, just enough structure
- **Success:** Green-400/500 for correct answers
- **Error:** Red-400/500 for wrong answers

---

## Typography

- System font stack (or Inter/Geist if available)
- **Headings:** Bold, tight tracking, large sizes (3xl–5xl)
- **Body:** 15px base, relaxed line-height
- **Captions/labels:** sm (14px), gray-500

---

## Screen 1: Home (Scenario Selection)

The default landing when pre-generated scenarios exist.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              🏛️  Memory Palace                   │
│         Choose a topic to explore                │
│                                                  │
│   ┌──────────────────┐  ┌──────────────────┐    │
│   │                  │  │                  │    │
│   │  [scenario img]  │  │  [scenario img]  │    │
│   │                  │  │                  │    │
│   │  🦕 Dinosaurs    │  │  🪐 Solar System │    │
│   │  6 rooms         │  │  6 rooms         │    │
│   └──────────────────┘  └──────────────────┘    │
│                                                  │
│   ┌──────────────────┐  ┌──────────────────┐    │
│   │                  │  │                  │    │
│   │  [scenario img]  │  │  [scenario img]  │    │
│   │                  │  │                  │    │
│   │  🏛️ World Wonders│  │  🫀 Human Body   │    │
│   │  6 rooms         │  │  6 rooms         │    │
│   └──────────────────┘  └──────────────────┘    │
│                                                  │
│   ┌──────────────────┐                          │
│   │                  │                          │
│   │  [scenario img]  │                          │
│   │                  │                          │
│   │  🐙 Ocean Life   │                          │
│   │  6 rooms         │                          │
│   └──────────────────┘                          │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Design notes:**
- Each scenario card should show the **first room's image** as a thumbnail/cover — this makes the grid visually rich and gives a preview of what's inside
- Cards are ~280px wide, 16:9 aspect ratio image area + label below
- Cards have `rounded-2xl`, frosted glass border (`border-white/10`), subtle hover glow (`hover:border-indigo-500/50`)
- 2-column grid on desktop, single column on mobile
- Title uses the indigo-violet gradient text effect
- Subtitle is understated gray
- The whole page is vertically centered

**Nice-to-have:** A small "Create your own" link at the bottom that goes to live mode (`?live`).

---

## Screen 1b: Home (Live / Freeform Mode)

Shown when `?live` is in the URL or no pre-generated scenarios exist.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              🏛️  Memory Palace                   │
│       Learn anything by walking through it       │
│                                                  │
│   ┌──────────────────────────────────────────┐   │
│   │ What do you want to memorize?            │   │
│   │                                          │   │
│   │ Paste your study material here...        │   │
│   │                                          │   │
│   │                                          │   │
│   └──────────────────────────────────────────┘   │
│                                                  │
│   Quick start:                                   │
│   [🔤 Vocab] [📜 History] [🔬 Science] [🌍 Geo] │
│                                                  │
│   Grade:  (K-3) (4-6) (7-9) (10-12)             │
│                                                  │
│            [ Build My Palace ]                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Design notes:**
- Textarea: `max-w-xl`, frosted glass style, 7 rows, focus border transitions to indigo
- Template chips: small pill buttons, icon + label, click fills the textarea
- Grade selector: toggle group (like segmented control), selected state is solid indigo
- "Build My Palace" button: large, solid indigo, disabled when textarea is empty
- Everything centered vertically and horizontally

---

## Screen 2: Generating (Loading)

Multi-phase progress while AI generates the palace.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                   [spinner]                      │
│                                                  │
│           Building your palace...                │
│           Painting your rooms...                 │
│                                                  │
│   ════════════════════░░░░░░░░░░░  62%           │
│                                                  │
│   [thumb] [thumb] [thumb] [   ] [   ] [   ]      │
│                                                  │
│            3 of 6 images ready                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Design notes:**
- Centered spinner (indigo ring)
- Phase label updates: "Designing rooms..." → "Painting rooms..." → "Bringing to life..." → "Almost ready..."
- Thin progress bar (`h-1`, `w-72`, indigo fill)
- Image thumbnails appear one by one as Gemini completes each room — small rectangles (`h-16 w-28`), `rounded-lg`, slightly transparent
- Counter text below thumbnails
- For prepared scenarios: same UI but faster (~5s total with fake timing)

---

## Screen 3: Palace Viewer (Core Experience)

This is the main event — immersive full-screen room exploration.

```
┌──────────────────────────────────────────────────┐
│  Thunder Jaw Crater              Room 1 of 6     │ ← top bar (glass)
│──────────────────────────────────────────────────│
│                                                  │
│                                                  │
│                                                  │
│           ┌─────────────────────┐                │
│           │                     │                │
│           │    [VIDEO/IMAGE]    │                │
│           │                     │                │
│           │                     │                │
│           └─────────────────────┘                │
│                                                  │
│                                                  │
│   ┌──────────────────────────────────────────┐   │
│   │  Tyrannosaurus Rex — largest land        │   │ ← item to remember
│   │  predator, 40 feet long...               │   │
│   │                                          │   │
│   │  A T-Rex stomps into a volcanic crater   │   │ ← mnemonic (glass card)
│   │  and tries to clap its ridiculously tiny │   │
│   │  arms...                                 │   │
│   └──────────────────────────────────────────┘   │
│                                                  │
│──────────────────────────────────────────────────│
│       [← Previous]          [Next →]             │ ← bottom bar (glass)
└──────────────────────────────────────────────────┘
```

**Design notes:**

**Top bar:**
- Fixed at top, glass effect (`bg-black/80 backdrop-blur`)
- Room name (left, bold), room counter (right, gray-500)

**Media area:**
- Full-width black background, centered content
- Video: `max-h-[70vh]`, `object-contain`, autoplay + loop + muted
- When video isn't ready yet: show static image with a "Bringing to life..." pill badge (bottom-right corner, small spinner + text, frosted glass)
- Transition from image → video should be seamless (same dimensions)

**Mnemonic overlay:**
- Positioned at bottom of the media area, overlapping slightly
- **Item to remember** in bold white with drop-shadow (xl text)
- **Mnemonic** in a frosted glass card (`bg-black/60 backdrop-blur`, `rounded-xl`, `text-white/85`)
- Max-width ~640px, centered
- The text should be readable against any image/video background

**Bottom bar:**
- Fixed at bottom, glass effect matching top bar
- Two buttons: "← Previous" (ghost) and "Next →" (solid indigo)
- Last room: "Next →" becomes "Start Quiz →"
- First room: "← Previous" is disabled/dimmed

**Key UX detail:** When the user navigates to a room, the video starts from the beginning. Each room is a self-contained mini-story.

---

## Screen 4: Quiz

Multiple-choice recall test after walking through all rooms.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              Test Your Memory                    │
│           Question 3 of 6                        │
│                                                  │
│    Which dinosaur had plates along its back      │
│    and a spiked tail called a thagomizer?        │
│                                                  │
│   ┌──────────────────────────────────────────┐   │
│   │  Triceratops                             │   │
│   └──────────────────────────────────────────┘   │
│   ┌──────────────────────────────────────────┐   │
│   │  Stegosaurus                       ✓     │   │ ← green border
│   └──────────────────────────────────────────┘   │
│   ┌──────────────────────────────────────────┐   │
│   │  Velociraptor                             │   │
│   └──────────────────────────────────────────┘   │
│   ┌──────────────────────────────────────────┐   │
│   │  Brachiosaurus                           │   │
│   └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Design notes:**
- Centered layout, generous vertical spacing
- Question text: xl, medium weight, max-w-lg
- Answer buttons: full-width (within max-w), `rounded-xl`, `border-2`, frosted glass
- **Before answering:** Hover shows indigo border hint
- **After answering:** Correct = green border + green bg tint; Wrong = red border + red bg tint on selected, green on correct answer; Others = faded
- Auto-advance to next question after 1s delay
- Progress counter below title

---

## Screen 5: Results

Score breakdown after completing the quiz.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                   Results                        │
│                                                  │
│                    5/6                            │ ← big gradient number
│                                                  │
│         Great recall! A few rooms to revisit.    │
│                                                  │
│   ┌──────────────────────────────────────────┐   │
│   │ ✓  T-Rex — largest land predator...      │   │ ← green
│   │ ✓  Triceratops — three-horned...         │   │ ← green
│   │ ✗  Stegosaurus — plates along back...    │   │ ← red
│   │ ✓  Velociraptor — fast pack hunter...    │   │ ← green
│   │ ✓  Brachiosaurus — towering...           │   │ ← green
│   │ ✓  Pteranodon — giant flying reptile...  │   │ ← green
│   └──────────────────────────────────────────┘   │
│                                                  │
│        [Try Again]    [New Challenge]             │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Design notes:**
- Score number: 7xl, bold, gradient text (violet → indigo), the visual centerpiece
- Message adapts to score (100% = perfect, 75%+ = great, etc.)
- Breakdown list: scrollable if many items, each row has checkmark/X + color-coded text
- Two buttons: "Try Again" (solid indigo) replays the palace, "New Challenge" (ghost) returns to home
- Score animation would be a nice touch (count up from 0)

---

## Responsive Considerations

- **Mobile (< 640px):** Single-column scenario grid, smaller video (`max-h-[50vh]`), mnemonic text smaller, full-width buttons
- **Tablet (640–1024px):** 2-column grid, comfortable spacing
- **Desktop (1024+):** 2-column grid, max-width container (~1024px), generous whitespace

The palace viewer should be truly full-screen on all devices — no wasted space around the video.

---

## Motion & Transitions

Keep it subtle:
- Screen transitions: simple fade (200ms)
- Progress bar: smooth width transition (`transition-all duration-500`)
- Card hovers: border color transition (150ms)
- Image thumbnails in generating screen: fade-in as they appear
- Answer feedback: instant color change (no delay on the visual feedback itself, just the auto-advance)

No spring physics, no bouncing, no parallax. This is a learning tool with cinematic visuals — the AI content provides the wow factor, not the UI animations.

---

## Iconography

Minimal icons. Emoji for scenario cards and template buttons (they're colorful and universally understood). Arrow text (← →) for navigation. No icon library needed.

---

## Prepared Mode vs Live Mode

The UI is identical between modes — the only difference is speed and data source. The user shouldn't know or care whether content is pre-generated or live. The same generating screen plays in both cases (just faster for prepared).

A subtle "✨ Create your own" link on the home screen can lead to `?live` mode for adventurous users.
