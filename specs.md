# Skyscraper Live: The Game — Product Requirements Document

**MVP Scope — Salesforce Tower, San Francisco**

| | |
|---|---|
| **Version** | 2.0 |
| **Date** | February 5, 2026 |
| **Status** | Draft |
| **Classification** | Confidential |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Game Overview](#3-game-overview)
4. [Climbing Mechanics (Cairn-Inspired)](#4-climbing-mechanics-cairn-inspired)
5. [The Building: Salesforce Tower](#5-the-building-salesforce-tower)
6. [Technical Architecture](#6-technical-architecture)
7. [User Experience](#7-user-experience)
8. [Visual Direction](#8-visual-direction)
9. [Audio Design](#9-audio-design)
10. [Leaderboard](#10-leaderboard)
11. [Platform & Compatibility](#11-platform--compatibility)
12. [Monetization](#12-monetization)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Future Roadmap](#14-future-roadmap-post-mvp)
15. [Open Questions](#15-open-questions)

---

## 1. Executive Summary

Skyscraper Live: The Game is a free-to-play, browser-based climbing game inspired by the Netflix special *Skyscraper Live*, in which Alex Honnold free-soloed Taipei 101 without ropes. Players take on the role of a free solo climber attempting to scale real-world skyscrapers under a time limit. The game's visuals are rendered entirely in real time by the **Odyssey 2-Pro world model**, producing cinematic, photorealistic third-person footage that responds dynamically to player input.

The climbing mechanics draw from **Cairn** by The Game Bakers — adapted into a lightweight browser-native control scheme. Like Cairn, climbing is not a traversal mechanic; it *is* the game. Players control individual limbs, read the building facade to plan their route, manage balance and stamina, and make deliberate, consequential decisions with every move. Unlike Cairn's analog-stick-driven simulation, our version maps limb selection and placement to keyboard and mouse — simple inputs, deep gameplay.

The MVP focuses on a single skyscraper — **Salesforce Tower in San Francisco** (61 stories, 1,070 feet) — with a solo gameplay experience. The game mechanic "vibe" also draws from *Messenger* by Abeto: accessible, browser-native, immediate, and surprisingly immersive.

---

## 2. Product Vision

### 2.1 Vision Statement

Deliver the visceral thrill of free-solo skyscraper climbing to anyone with a web browser — where every handhold is a decision, every glance down is vertiginous, and the graphics are generated in real time by the world's first AI world model for games.

### 2.2 Target Audience

- Fans of the Netflix *Skyscraper Live* special and Alex Honnold
- Players who loved Cairn but want a quicker, browser-accessible experience
- Casual and mid-core browser gamers (the Messenger audience)
- Extreme sports and climbing enthusiasts
- Tech-curious users interested in AI-generated visuals

### 2.3 Success Metrics (MVP)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Unique players (first 30 days) | 50,000+ | Analytics |
| Median session duration | ≥5 minutes | Analytics |
| Summit completion rate | 10–20% | Server events |
| Repeat play rate (7-day) | ≥30% | Analytics |

---

## 3. Game Overview

### 3.1 Concept

The player is a free solo climber at the base of Salesforce Tower. They must ascend the exterior of the building — navigating the obelisk-shaped glass-and-steel facade, its lattice of white aluminum fins, and its tapered crown — while a countdown timer ticks. The third-person camera, reminiscent of the drone and helicopter footage from the Netflix special, shows the climber against the building with the San Francisco skyline sprawling below.

Climbing works like a lightweight Cairn: the player selects individual limbs, aims them at holds on the building's surface, and commits each placement. The building facade is an open surface — there is no single "correct" path. The player reads the architecture, picks their route, and manages their climber's balance and stamina. One bad position held too long, one reach to a holdless surface, and the climber falls. Game over. Try again.

### 3.2 Core Loop

1. Start at the base of Salesforce Tower at street level.
2. Read the facade — identify the aluminum fins, window frame edges, sunshade brackets, and structural seams that serve as holds.
3. Select a limb, aim it at a hold, and commit the placement. One limb moves at a time.
4. Manage balance and stamina. Overextended positions drain stamina fast; compact, balanced positions let you rest.
5. Navigate architectural transitions: the taper zone, the curved corners, the open-lattice crown.
6. Reach the summit before the timer expires.
7. On success: summit celebration with panoramic city views. On failure: dramatic fall, then restart prompt.

### 3.3 Design Pillars

| Pillar | Description |
|--------|-------------|
| **Climbing *is* the game** | Directly inspired by Cairn's philosophy: climbing is not traversal, it's the core challenge. Every limb placement is a micro-decision. |
| **Simple inputs, deep gameplay** | Cairn achieves depth with a stick + one button. We achieve it with mouse aim + key presses. Easy to learn, hard to master. |
| **Tension** | Every moment should feel high-stakes. The height is ever-present. Vertigo is a feature, not a bug. |
| **No UI — read the climber** | Like Cairn, stamina and stress are communicated through the climber's body language (heavy breathing, trembling limbs), not health bars. The Odyssey world model renders these diegetic cues. |
| **Visual spectacle** | The Odyssey world model renders a photorealistic, cinematic experience — the player should feel like they're inside the Netflix special. |
| **Replayability** | The timer, leaderboard, route freedom, and one-mistake-death mechanic create a natural retry loop. Different routes mean different runs. |

---

## 4. Climbing Mechanics (Cairn-Inspired)

This is the heart of the game. The mechanic is a **lightweight browser adaptation of Cairn's climbing system**, designed for keyboard + mouse instead of a gamepad analog stick.

### 4.1 Core Principle: One Limb at a Time

Like Cairn and like real climbing, the player moves one limb at a time while the other three maintain contact with the building. This creates a deliberate, tactical rhythm. The player is always making a choice: *which* limb to move, *where* to place it, and *when*.

### 4.2 Controls

| Input | Action |
|-------|--------|
| **1** | Select left hand |
| **2** | Select right hand |
| **3** | Select left foot |
| **4** | Select right foot |
| **Mouse move** | Aim the selected limb — a subtle highlight/indicator shows reachable holds within range |
| **Left click** | Commit the limb to the targeted hold |
| **Mouse right-click + drag** | Orbit camera freely around the climber (look around, look down at the city) |
| **Scroll wheel** | Zoom camera in/out |
| **Space** | Rest — the climber presses into the wall and recovers stamina (only works in stable positions) |
| **R** | Quick restart from base |
| **Esc** | Pause (pauses timer) |

**Why this maps well to Cairn's philosophy:** Cairn uses the left stick to aim a limb and Square to grab. Our version uses the mouse to aim (more precise, natural for browser) and click to grab. Limb selection via number keys replaces Cairn's trigger-based limb switching. The result is the same: simple inputs, deep simulation.

**Alternative control scheme (WASD mode):** For players who prefer directional input, an alternative scheme is available:

| Input | Action |
|-------|--------|
| **W / A / S / D** | Move the currently selected limb up / left / down / right toward the nearest valid hold in that direction |
| **Tab** | Cycle through limbs (LH → RH → LF → RF) |
| **E** | Commit / grab the highlighted hold |
| **Q** | Rest |

Players choose their preferred scheme on the title screen. Both are supported simultaneously.

### 4.3 The Hold System

The building's exterior surface is divided into **holds** and **dead zones**.

**Valid holds (grippable surfaces):**
- Aluminum fin edges (the grid of white metal fins running the full height of the building) — the primary hold type
- Window frame edges — horizontal and vertical metal framing between glass panels
- Sunshade brackets — the perforated metal brises soleil on each floor, offering deep grip
- Structural seams — joints between facade panels
- Crown lattice beams — exposed steel in the top 9 stories

**Dead zones (no grip → slip → fall):**
- Flat glass panels — smooth, no purchase
- Smooth curved glass corners — especially treacherous in the taper zone (floors 27+)
- Wet or wind-affected surfaces — dynamic dead zones in later zones

**Hold properties (lightweight Cairn adaptation):**

| Property | Description |
|----------|-------------|
| **Grip quality** | Good (fins, deep brackets), Fair (window frames), Poor (narrow seams). Affects stamina drain rate while held. |
| **Reachability** | Each hold has a max reach radius from adjacent holds. Overextending (reaching too far) is possible but costly — stamina drains fast. |
| **Load bearing** | Some holds are hands-only or feet-only. Fins work for both; narrow seams are finger-only. |
| **Surface type** | Metal (standard), glass-adjacent (slippery — shorter hold time), exposed steel (crown zone — good grip but irregular spacing). |

### 4.4 Balance & Posture

Directly inspired by Cairn's posture system, simplified for browser:

- The climber's **center of gravity** is calculated from the four limb positions. If three limbs form a stable triangle with the CoG inside it, the position is stable. If the CoG is outside the support triangle, the position is **precarious**.
- **Stable positions:** Normal stamina drain. The climber can rest (Space) to recover.
- **Precarious positions:** Accelerated stamina drain. The climber's body visibly strains — the Odyssey world model renders trembling limbs, labored breathing, clothes pulling against gravity.
- **Overextended positions:** If any limb is stretched near its max reach, that limb's stamina drains at 3x rate. The world model renders the arm/leg shaking.
- **Compact positions:** Limbs close together, weight centered. Minimal stamina drain. Ideal for resting.

The player never sees a stamina bar. Like Cairn, they read the climber's body:
- **Fresh:** Smooth movements, steady breathing.
- **Tired:** Slower limb movement, audible breathing, slight tremor.
- **Critical:** Visible shaking, gasping, the climber's grip visibly slipping. One more bad move and they fall.

### 4.5 Route Freedom

Like Cairn's "climb anywhere" philosophy, the player is not on rails. The building facade is an **open surface** with hundreds of holds per zone. There is no single correct path — only better and worse routes.

- **Efficient routes** use high-quality holds in compact sequences, minimizing stamina drain. Skilled players learn the building's architecture and find optimal lines.
- **Risky routes** might be faster (more direct) but use lower-quality holds or require overextension.
- **The taper zone** forces route decisions: as the building narrows above floor 26, the viable climbing surface shrinks and the player must choose between the increasingly curved corners (risky, shorter path) or traversing to the flatter center sections (safer, longer path).

Different routes produce different Odyssey prompts, which means different visual experiences on every run.

### 4.6 Failure Conditions

| Condition | Trigger | Result |
|-----------|---------|--------|
| **Dead zone placement** | Player commits a limb to a holdless surface (flat glass) | Immediate slip → fall |
| **Stamina depletion** | Climber reaches critical exhaustion and the player makes one more demanding move | Grip fails → fall |
| **Overextension collapse** | Player stretches a limb beyond max reach | Limb gives out → fall |
| **Hesitation timeout** | No input for 8 seconds in a precarious position | Grip fatigue → fall |
| **Timer expiry** | Countdown reaches zero | Exhaustion → fall |

On failure, the Odyssey world model renders a dramatic falling sequence — the camera follows the climber briefly, the building facade rushes past, then cuts to black. A retry screen shows the floor reached and time elapsed.

**There is no partial progress save. Every attempt starts from street level.** This mirrors Cairn's Free Solo mode, where a fall is final.

### 4.7 Timer & Difficulty

| Parameter | MVP Value | Notes |
|-----------|-----------|-------|
| Time limit | 15 minutes | Tunable. Scaled from Honnold's 91-min Taipei 101 climb to 61 floors + game pacing. |
| Hesitation timeout | 8 seconds | In a precarious position without input before grip fails. |
| Building sections | 3 zones | Lower (floors 1–26), Taper (27–50), Crown (51–61+). |
| Rest recovery rate | ~3 sec to recover from "Tired" to "Fresh" in a stable, compact position | Only in stable positions. |
| Overextension penalty | 3x stamina drain on the stretched limb | Encourages compact climbing. |

---

## 5. The Building: Salesforce Tower

### 5.1 Real-World Reference

| Attribute | Detail |
|-----------|--------|
| **Location** | 415 Mission Street, SoMa, San Francisco |
| **Height** | 1,070 ft (326 m) to crown; 901 ft to top occupied floor |
| **Floors** | 61 above ground |
| **Architect** | César Pelli / Pelli Clarke Pelli Architects |
| **Form** | Obelisk-shaped; tapers above floor 26 with curved glass corners |
| **Exterior** | Glass + steel curtain wall; white aluminum fin grid; perforated sunshades |
| **Crown** | 9-story open latticework structure (Jim Campbell's "Day for Night" LED art installation) |
| **Surroundings** | Adjacent to Salesforce Transit Center & Park; views of Bay Bridge, Transamerica Pyramid, Millennium Tower |

### 5.2 Climbing Zones

#### Zone 1: Lower Tower (Floors 1–26) — "The Grid"

The building's full rectangular cross-section. The aluminum fin lattice provides a **dense, regular grid of holds** — predictable spacing, good grip quality. This is the learning zone where the player internalizes the limb-control rhythm and experiments with route-finding. Holds are plentiful and forgiving.

The city is close below — street noise, pedestrians visible, the Salesforce Transit Center park at eye level by floor 5. The Odyssey prompts emphasize proximity and warmth.

**Difficulty:** Low. Generous hold density. Few dead zones. Teaches the player to read the fin grid and sunshade bracket pattern.

#### Zone 2: Taper Zone (Floors 27–50) — "The Curve"

Above floor 26, each elevation curves and tapers away from the street. The hold geometry **becomes irregular** — the fin grid is still present but spacing widens on the curved corners. The glass corners become increasingly smooth and holdless, forcing the player to route-find actively.

Wind begins to affect the climber — the Odyssey world model renders clothes fluttering, the climber bracing against gusts. Some surfaces become intermittently slippery (wind-driven moisture).

The city below starts to look like a map. Cars become dots. The Bay comes into view. Fog may roll in below the climber.

**Difficulty:** Medium. Narrowing viable surface. Route choices matter. Stamina management becomes critical as holds are more spread out, requiring longer reaches.

#### Zone 3: The Crown (Floors 51–61+) — "The Lattice"

The final stretch transitions from enclosed glass to the **open latticework crown**. The climber is now fully exposed — wind from every direction, the open structure visible through to the other side. Hold type changes from architectural features to raw structural steel beams.

The hold pattern is **completely different** from the lower zones: wide-spaced, irregular steel members instead of the predictable fin grid. Players must re-learn their route-reading skills. The Jim Campbell LED art installation pulses around the climber, adding visual complexity.

Reaching the very top triggers the summit sequence.

**Difficulty:** High. Sparse, irregular holds on exposed steel. Maximum wind. Completely different climbing rhythm from the lower zones.

---

## 6. Technical Architecture

### 6.1 Odyssey 2-Pro Integration

The entire visual output of the game is rendered by Odyssey 2-Pro. The game client sends text prompts describing the current game state, and Odyssey streams back video frames via WebRTC. There is no traditional 3D rendering engine. The "graphics engine" is a generative AI world model.

#### 6.1.1 Connection Lifecycle

1. On page load, the client instantiates an Odyssey connection and calls `connect()` to establish a WebRTC media stream.
2. When the player starts a climb, the client calls `startStream()` with an initial prompt describing the scene at the base of Salesforce Tower.
3. As the player places limbs and the game state changes, the client calls `interact()` with updated prompts reflecting the climber's position, posture, the active limb, camera angle, and environmental conditions.
4. On failure or summit, the client sends a final `interact()` prompt for the cinematic sequence, then calls `endStream()`.
5. The client calls `disconnect()` on page unload via `beforeunload` handler.

#### 6.1.2 Prompt Engineering Layer

A critical component sits between the game logic and Odyssey: the **prompt engine**. It translates discrete game state into natural-language prompts optimized for visual fidelity and consistency. This layer is particularly important for the Cairn-inspired mechanics, because each limb placement changes the climber's body posture in ways the prompt must describe precisely.

**Prompt state variables:**
- Current floor / height percentage
- All four limb positions (which hold each is on)
- Which limb is currently "active" (being aimed by the player)
- Climber body posture: stable / precarious / overextended
- Stamina state: fresh / tired / critical (maps to visual cues)
- Camera orbit position relative to climber
- Time of day / lighting conditions
- Weather / wind intensity
- Zone-specific architectural details
- Special events: slip, fall, summit, rest

**Example prompt sequence:**

> *"Photorealistic third-person view, a solo climber in athletic wear grips the white aluminum fin grid on the exterior of Salesforce Tower at the 8th floor. Left hand on a horizontal fin edge, right hand on a window frame, both feet on sunshade brackets below. Stable, balanced posture. Daytime, clear sky. San Francisco street below with cars and pedestrians. Camera positioned slightly above and to the right."*

> *"The climber reaches their right hand upward toward the next fin edge, 12th floor. Body is slightly stretched — right arm extended above head while left hand anchors below. Moderate strain visible. The glass reflects the sky. Camera orbits to show the Bay Bridge in the distance."*

> *"35th floor, taper zone. The climber is in a compact rest position, pressed against the wall. Four limbs close together on a cluster of holds. Body relaxed, catching breath. The building curves away on either side. Wind is visible in clothes. Fog below."*

> *"55th floor, crown zone. The climber grips an exposed steel beam of the open latticework. Left foot dangles — searching for a hold on the next beam below. Precarious position. Limbs trembling. LED lights pulse purple and blue around the structure. The entire Bay Area is visible below. Camera pulls back to show the climber tiny against the open steel framework."*

#### 6.1.3 Odyssey SDK Usage

The game uses the `@odysseyml/odyssey` JavaScript SDK:

| Method | Usage in Game |
|--------|---------------|
| `new Odyssey()` | Initialized once with API key on page load. |
| `connect()` | Called on game load. Returns `MediaStream` bound to `<video>` element. |
| `startStream()` | Called when the player begins a climb attempt. Sends initial scene prompt. |
| `interact()` | Called on every limb placement, camera change, or significant state update. ~1–3 calls per second during active climbing. |
| `endStream()` | Called on fall, summit, or quit. |
| `disconnect()` | Called on page unload. Critical to free the session slot. |

#### 6.1.4 Session Management

Odyssey enforces a max-1 concurrent session per API key. The game must:

- Always register a `beforeunload` handler to call `disconnect()`.
- Implement connection-recovery: if the session drops, show a "Reconnecting..." overlay and re-call `connect()`.
- Be aware of the 40-second server-side timeout for stale connections.
- For multi-player scaling (post-MVP), coordinate with Odyssey on enterprise concurrency limits.

### 6.2 Game State Engine

The climbing simulation runs entirely client-side. This engine is the "game" — Odyssey is the "renderer."

**State machine:**
```
MENU → CONNECTING → BASE_CAMP → CLIMBING → FALLING → SUMMIT → MENU
                                    ↑          |
                                    └── RETRY ──┘
```

**Core simulation components:**

| Component | Responsibility |
|-----------|----------------|
| **Hold Map** | Data model of every hold on the building facade. Position, type, grip quality, reachability radius, load-bearing properties. Pre-authored data, not generated. |
| **Limb Manager** | Tracks which hold each of the 4 limbs is on. Validates placement (reachable? correct limb type? not a dead zone?). |
| **Balance Calculator** | Computes center of gravity from 4 limb positions. Determines stable/precarious/overextended state. |
| **Stamina System** | Per-limb stamina drain based on hold quality, posture, and overextension. Global fatigue accumulator. No UI — state is encoded into Odyssey prompts as visual cues. |
| **Reach Calculator** | Given 3 anchored limbs and the selected free limb, computes the set of reachable holds. Factors in body geometry and building surface. |
| **Prompt Compiler** | Takes full game state snapshot → generates natural-language prompt string for `interact()`. The most critical piece of the pipeline. |
| **Timer** | Countdown from 15:00. Pauses on Esc. |
| **Input Handler** | Keyboard + mouse event listeners. Debounces rapid inputs. Manages limb selection state. |

### 6.3 Client Architecture

The game client is a single-page web application. No server-side game logic is required for the MVP.

| Layer | Technology |
|-------|------------|
| **Framework** | Vanilla JS or Svelte. Minimal bundle for instant load. |
| **Video display** | HTML5 `<video>` element with Odyssey `MediaStream` as `srcObject`. |
| **Game state** | Client-side state machine + simulation engine (see above). |
| **HUD overlay** | HTML/CSS overlay on top of the `<video>`: timer, floor counter, limb indicator. Minimal — diegetic cues are primary. |
| **Hold visualization** | Lightweight SVG/Canvas overlay showing reachable holds for the active limb. Semi-transparent, subtle. Fades when not actively aiming. |
| **Input handling** | `keydown`/`keyup` listeners (number keys, WASD, Space). Mouse event listeners for aiming + camera orbit. |
| **Prompt engine** | JS module: `(gameState) → string` for Odyssey `interact()` calls. |
| **Leaderboard** | Supabase backend storing best times. Display on menu screen. |

### 6.4 Latency & the Cairn Adaptation Advantage

Because Odyssey streams video over WebRTC, there is inherent latency between player input and visual response. **The Cairn-inspired mechanic is uniquely suited to this constraint:**

- **Cairn's climbing is inherently deliberate.** Each limb placement takes 1–3 seconds of aiming and consideration. This naturally accommodates 200–500ms of visual latency — the player commits a placement, and by the time they're choosing the next limb, the visual has caught up.
- **No twitch reflex required.** Unlike an action game where 100ms matters, the climbing rhythm is aim → commit → observe → plan → aim. The latency hides inside the "observe → plan" phase.
- **Predictive HUD:** The hold overlay and limb indicator update instantly on input (client-side), even if the Odyssey visual stream lags slightly. The player gets immediate mechanical feedback; the cinematic visual follows.
- **Prompt batching:** The prompt engine debounces rapid inputs. A limb placement triggers one `interact()` call, not a stream of intermediate updates.

---

## 7. User Experience

### 7.1 Flow

1. **Landing page:** Title card ("Skyscraper Live: The Game"), hero shot of Salesforce Tower. Single CTA: "Climb." Control scheme selection (Precision / WASD).
2. **Loading / connection:** Odyssey connection established. Animated status: "Connecting to Salesforce Tower..."
3. **Base camp:** The player sees their climber at the base of the tower, looking up. Brief tutorial overlay: "Select a limb (1–4). Aim with mouse. Click to grab. Space to rest." A few highlighted holds glow to guide the first moves.
4. **Climbing:** Full-screen video with minimal HUD. The player is in the core loop — select, aim, commit, manage, repeat.
5. **Fall:** Dramatic falling sequence (~3 seconds). Screen fades to black. "You fell from floor 34 — 547 ft. Try again?" with time elapsed and floor reached.
6. **Summit:** Cinematic orbit sequence: camera circles the climber standing on the crown with 360° city views. "You summited in 11:23!" Share button + leaderboard entry prompt.

### 7.2 HUD Elements

The HUD is deliberately **near-invisible** — inspired by Cairn's zero-UI philosophy and Messenger's understated interface. The Odyssey video stream is the star.

| Element | Position | Details |
|---------|----------|---------|
| **Timer** | Top center | Countdown from 15:00. Semi-transparent white. Pulses red below 2:00. |
| **Floor indicator** | Top left | "F34" — small, unobtrusive. Updates as the climber passes each floor. |
| **Active limb indicator** | Bottom center | Small diagram of a human figure with the selected limb highlighted. Shows which limb (1/2/3/4) is active. |
| **Hold overlay** | On building surface | When a limb is selected, reachable holds glow subtly on the video. Fades when not aiming. This is the only non-diegetic climbing aid. |
| **Pause** | Center | On Esc press. "Paused — press Esc to resume." |

**What is NOT on the HUD:** Stamina bars, health indicators, grip meters, or any numeric readout of the climber's physical state. Like Cairn: you read the climber, not the UI.

### 7.3 Tutorial (First Run)

On the player's first attempt, the base camp phase includes a brief guided sequence:

1. "Press **1** to select your left hand." (Left hand highlights on the climber.)
2. "Move your **mouse** to aim. See the glowing holds? Those are within reach."
3. "**Click** to grab." (Climber's left hand moves to the hold.)
4. "Now press **4** for your right foot. Aim and click."
5. "Good. You're climbing. Keep your limbs close together — if you overextend, you'll tire fast."
6. "Press **Space** to rest when you find a stable position."
7. "The clock starts now. Reach the top of Salesforce Tower. Good luck."

The tutorial is skippable on subsequent runs.

---

## 8. Visual Direction

### 8.1 Reference: The Netflix Special

The visual target is the live broadcast footage from *Skyscraper Live*: a real human on a real building, shot from drones and helicopters, with the city stretching out below. The Odyssey prompts aim to reproduce this aesthetic — photorealistic, high-altitude, slightly vertiginous.

### 8.2 Cairn Influence on Visuals

Cairn communicates game state through the **climber's body**, not UI. The Odyssey prompts must encode this:

| Climber State | Visual Cue (in Odyssey prompt) |
|---------------|-------------------------------|
| **Fresh** | Smooth, confident movements. Steady grip. Relaxed shoulders. |
| **Tired** | Slower movement. Visible breathing. Slight arm tremor. |
| **Critical** | Shaking limbs. White-knuckle grip. Head drops. Gasping. |
| **Precarious position** | Body twisted awkwardly. Weight pulling away from the wall. |
| **Resting** | Pressed flat against the wall. Deep breaths. Momentary calm. |
| **Overextended** | One arm/leg stretched to limit. Straining. Fingers barely gripping. |

### 8.3 Key Visual Beats

- **Street level:** Warm, grounded. Close-up of the building's base architecture. Pedestrians below. The tower looming above.
- **Mid-climb (Zone 1):** The city starts to recede. The fin grid fills the frame. Rhythm of metal and glass.
- **Taper zone (Zone 2):** The building curves away. The sky opens up. The Bay and bridges come into view. Fog rolling in below.
- **Crown (Zone 3):** Fully exposed. Open steel lattice. Wind visible in everything. LED art pulses. The entire Bay Area panorama.
- **Fall:** Camera follows briefly, building facade rushes past in a blur. Cut to black.
- **Summit:** Golden hour light. Cinematic orbit. The climber silhouetted against the skyline. The city 1,070 feet below.

---

## 9. Audio Design

Audio is **critical** for the Cairn-inspired diegetic feedback system. Since there's no stamina UI, the player relies on sound as much as visuals.

| Layer | Description |
|-------|-------------|
| **Climber breathing** | The primary stamina indicator. Calm and rhythmic when fresh. Labored and ragged when tired. Gasping when critical. |
| **Grip sounds** | Metal pings and scrapes when grabbing fins. Glass squeaks near windows. Steel clangs in the crown zone. Each hold type has a distinct sound. |
| **Wind** | Absent at street level. Builds gradually. By the crown, it's a constant roar with directional gusts. |
| **City ambient** | Traffic, sirens, construction at ground level. Fades into abstraction by mid-climb. Gone by the crown — replaced by wind and silence. |
| **Heartbeat** | Subtle. Emerges only when the climber is in a critical state. Not a constant soundtrack element. |
| **Music** | Minimal, tension-building drone score. Low hum that builds imperceptibly across the climb. Inspired by the *Skyscraper Live* broadcast and Cairn's Martin Stig Andersen–influenced sound design. |
| **Fall** | Wind rush accelerating. Impact silence. Low tone. |
| **Summit** | Triumphant swell. Wind dies down. Faint crowd noise from far below. |

---

## 10. Leaderboard

A simple global leaderboard tracks the fastest summit times.

| Aspect | Implementation |
|--------|----------------|
| **Storage** | Supabase (Postgres). Single table: `player_name`, `time_seconds`, `route_data` (optional), `timestamp`. |
| **Display** | Shown on the landing page and the summit screen. Top 100 times. |
| **Identity** | No account required. Player enters a display name on summit. |
| **Route replay** | Post-MVP: store the sequence of hold placements so players can view the routes of top climbers. |
| **Anti-cheat** | MVP: server-side validation that time is plausible (>2 minutes, <15 minutes). Future: server-issued climb token + hold sequence validation. |

---

## 11. Platform & Compatibility

| Requirement | Specification |
|-------------|---------------|
| **Platform** | Web browser (desktop only for MVP). No install required. |
| **Browsers** | Chrome 90+, Firefox 90+, Edge 90+, Safari 16+. |
| **Connection** | Stable broadband (≥5 Mbps recommended for smooth WebRTC streaming). |
| **Input** | Physical keyboard + mouse. No gamepad support in MVP (ironic given Cairn's controller focus — but browser-first). |
| **Mobile** | Not supported in MVP. Future consideration with touch controls. |
| **Accessibility** | Pause function. Rebindable keys. Hold overlay with adjustable opacity. Tutorial skip. Colorblind-safe HUD. |

---

## 12. Monetization

The MVP is entirely **free-to-play** with no ads, paywalls, or microtransactions. The game serves as a technology showcase for Odyssey 2-Pro's real-time world model capabilities and a promotional tie-in with the Netflix *Skyscraper Live* property. Revenue considerations are deferred to post-MVP.

---

## 13. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Odyssey latency too high for climbing to feel responsive** | High | The Cairn-style deliberate mechanics naturally tolerate 200–500ms latency. Predictive HUD updates. Prompt debouncing. Extensive latency testing. |
| **Visual inconsistency between frames (flickering, object drift)** | High | Heavy investment in prompt engineering for scene consistency. Persistent scene anchors in every prompt (building name, zone, lighting). A/B test prompt templates. |
| **Odyssey can't render diegetic stamina cues (trembling, breathing) reliably** | High | Fallback: add minimal, optional UI stamina indicator. Audio cues (breathing SFX) are client-controlled and don't depend on Odyssey. |
| **Limb-control mechanic feels too complex for casual browser audience** | Medium | The WASD alternative scheme simplifies to directional input. Tutorial is gentle. Zone 1 is forgiving. Messenger-style "just jump in" ethos. |
| **Odyssey session limit (max 1 concurrent) blocks scaling** | High | Coordinate with Odyssey team on enterprise limits. Implement queue system for peak traffic. |
| **Building IP / trademark concerns from Salesforce** | Medium | Seek licensing or promotional partnership. Fallback: genericize to "SF-inspired" tower. |
| **Player motion sickness from AI-generated video** | Medium | Limit auto camera movement. Sensitivity settings. Warning on load. |
| **Hold map authoring is labor-intensive** | Medium | Build tooling for hold placement. The regular fin grid of the lower tower can be procedurally generated; only the taper and crown need hand-placement. |

---

## 14. Future Roadmap (Post-MVP)

### More Buildings
Expand to 20–50 iconic skyscrapers: Taipei 101 (the canonical building from the Netflix show), Burj Khalifa, Empire State Building, Petronas Towers, Shanghai Tower. Each with unique hold patterns derived from real architectural features.

### Progression System
Unlock harder buildings by summiting easier ones. Star ratings based on time. Cosmetic unlocks for the climber.

### Multiplayer
Race mode: two players climb the same building simultaneously. Ghost mode: race against your own best time or a friend's recorded run (Cairn's expedition mode influence).

### Gamepad Support
Map limb selection to triggers/bumpers and aiming to analog stick — bringing the control scheme closer to Cairn's original design.

### Mobile Support
Touch controls: tap to select limb, drag to aim, release to commit. Gyroscope for camera.

### Image-to-Video Mode
Players upload a photo of any building, and Odyssey's image-to-video capability generates a climbable version using `startStream({ prompt, image })`.

### Netflix Partnership
In-game tie-ins with future *Skyscraper Live* specials. The next building Honnold climbs becomes the next game level, released simultaneously with the broadcast.

### Monetization
Premium building packs, cosmetic skins, optional Netflix subscriber perks. No pay-to-win.

---

## 15. Open Questions

1. **Odyssey prompt frequency:** What is the achievable `interact()` call rate without degrading visual quality? Each limb placement needs a visual update — target is 1–3 calls/sec.
2. **Visual consistency over long sessions:** Can Odyssey maintain a consistent depiction of Salesforce Tower across hundreds of sequential `interact()` calls over a 15-minute session, or will the scene drift?
3. **Diegetic cue fidelity:** Can Odyssey reliably render subtle body language differences (trembling vs. steady, relaxed vs. strained) from prompt descriptions alone? This determines whether the Cairn-style zero-UI approach is viable or if we need fallback indicators.
4. **Enterprise concurrency:** What are Odyssey's multi-session limits? The 1-session-per-key constraint is a hard blocker for any meaningful player base.
5. **Hold map tooling:** What's the most efficient way to author the hold map? Can we derive hold positions from architectural drawings of Salesforce Tower, or do we need to hand-place them?
6. **Fall animation content:** Should the fall be explicit (full fall to street) or cut-away (brief fall then fade to black)? Content rating implications.
7. **Cairn licensing/attribution:** Do we need any formal arrangement with The Game Bakers for the "inspired by Cairn" positioning, or is this purely a design influence?
8. **Salesforce partnership:** Is Salesforce open to a promotional tie-in, or do we need to genericize the tower?

---

*— End of Document —*
