import { Odyssey } from '@odysseyml/odyssey';

// -- Scenarios --

interface Scenario {
  name: string;
  description: string;
  startPrompt: string;
  keys: Record<string, { label: string; prompt: string }>;
}

// Prompts must be VERY detailed — re-describe the full scene every time.
// Model is bad at subtle movements — use dramatic scene changes.
// (From Odyssey team directly)

const scenarios: Record<string, Scenario> = {
  mountain: {
    name: 'Mountain Climb',
    description: 'Scale a cliff face in first person',
    startPrompt:
      'First person POV of a rock climber halfway up a massive granite cliff face in bright daylight. Rough grey rock fills the frame, the climber\'s chalked hands grip a jutting ledge. Far below, a green valley with a winding river is visible through wisps of cloud. Blue sky above, harsh sunlight casting deep shadows in the rock crevices. Cinematic, wide-angle lens, photorealistic, vertigo-inducing height.',
    keys: {
      w: {
        label: 'Climb up',
        prompt: 'First person POV of a rock climber who has pulled themselves up to a much higher position on a massive granite cliff. The climber\'s hands are now gripping the top of a rocky overhang. The valley below is now tiny and distant, barely visible through thick clouds. Strong wind is blowing. The summit ridge with snow patches is now visible above. Bright daylight, cinematic, wide-angle lens, photorealistic.',
      },
      s: {
        label: 'Look down',
        prompt: 'First person POV looking straight down from high on a massive granite cliff face. The climber\'s feet are visible on a narrow ledge. The drop is enormous — hundreds of meters of sheer rock falling away to a tiny green valley with a miniature river far below. Clouds drift between the climber and the ground. Vertigo-inducing depth, bright daylight, cinematic, photorealistic, wide-angle lens.',
      },
      a: {
        label: 'Go left',
        prompt: 'First person POV of a rock climber on a massive granite cliff face, now traversing along a dramatic narrow ledge to the left. A dark cave opening is visible in the rock wall ahead. The cliff face curves away revealing a frozen waterfall cascading down icy blue rock. Far below, a green valley. Bright daylight, wind-blown clouds, cinematic, wide-angle lens, photorealistic.',
      },
      d: {
        label: 'Go right',
        prompt: 'First person POV of a rock climber on a massive granite cliff face, now traversing along a ledge to the right. The rock face opens up to reveal a stunning panoramic view of snow-capped mountain peaks stretching to the horizon. An eagle soars at eye level nearby. Golden sunlight breaks through dramatic clouds. Far below, a glacial lake reflects the sky. Cinematic, wide-angle lens, photorealistic.',
      },
      ' ': {
        label: 'Leap',
        prompt: 'First person POV of a rock climber in mid-air, having just leaped across a massive gap in the cliff face. Both hands are outstretched reaching for a rocky pillar on the other side. The gap reveals a terrifying thousand-meter drop straight down to a misty valley floor. Time feels frozen in this moment of freefall. Bright daylight, motion blur, cinematic, photorealistic, adrenaline.',
      },
    },
  },
  dungeon: {
    name: 'Dungeon Crawl',
    description: 'Explore a dark stone dungeon',
    startPrompt:
      'First person POV standing at the entrance of a vast medieval stone dungeon. Massive stone archway frames the scene. A single burning torch on the left wall casts warm flickering orange light across wet cobblestone floors. Thick cobwebs hang from the vaulted ceiling. Water drips down moss-covered walls. A long dark corridor stretches ahead into blackness. Cold mist drifts along the floor. Mysterious, atmospheric, cinematic, deep focus, photorealistic.',
    keys: {
      w: {
        label: 'Walk forward',
        prompt: 'First person POV deep inside a medieval stone dungeon, having walked far down the main corridor. The passage has opened into a large underground chamber with massive stone pillars holding up a vaulted ceiling. Multiple torches on iron sconces illuminate ancient carved symbols on the walls. A stone altar sits in the center of the room covered in melted candle wax. Scattered bones on the floor. Two dark archways lead deeper into the dungeon. Cold mist, flickering firelight, cinematic, photorealistic.',
      },
      s: {
        label: 'Turn around',
        prompt: 'First person POV turning around in a medieval stone dungeon, now facing back toward the entrance. A long torchlit corridor stretches behind, the distant entrance is a small rectangle of pale daylight far away. The shadows seem darker now, the torches on the walls are guttering as if something disturbed the air. Fresh scratches are visible on the stone floor. Something moved in the darkness between the torches. Eerie, atmospheric, cinematic, photorealistic.',
      },
      a: {
        label: 'Turn left',
        prompt: 'First person POV in a medieval stone dungeon, now looking down a left passage that descends steeply via carved stone stairs. Blue-green bioluminescent moss grows thick on these walls, casting an otherworldly glow. The stairway spirals downward into a cavern where the sound of rushing underground water echoes. Strange crystalline formations glitter on the ceiling. Mist rises from below. Atmospheric, cinematic, deep focus, photorealistic.',
      },
      d: {
        label: 'Turn right',
        prompt: 'First person POV in a medieval stone dungeon, now looking down a right passage into a treasure vault. The room is filled with golden light from hundreds of coins, goblets, and jeweled artifacts piled high. Ornate wooden chests overflow with gems. A massive jewel-encrusted sword is mounted on the far wall above a stone throne. Dust particles float in shafts of light from cracks in the ceiling. Rich, warm tones, cinematic, photorealistic.',
      },
      ' ': {
        label: 'Open door',
        prompt: 'First person POV in a medieval stone dungeon. A massive ancient wooden door reinforced with iron bands has swung wide open, revealing an enormous underground cathedral-like space. Giant stone columns rise into darkness. In the center, a glowing magical portal swirls with purple and blue energy, illuminating everything in ethereal light. Ancient runes carved into the floor glow in response. Wind rushes through the doorway. Epic, dramatic, cinematic, photorealistic.',
      },
    },
  },
  space: {
    name: 'Space Walk',
    description: 'Float outside a space station',
    startPrompt:
      'First person POV of an astronaut in a white spacesuit floating in the void of space just outside the International Space Station. The massive solar panels and white hull modules of the station fill the right side of the frame. Planet Earth dominates the lower half — vivid blue oceans, swirling white cloud formations, green continents. Stars scattered across the infinite black void above. Sunlight glints off the helmet visor. Serene, majestic, cinematic, IMAX quality, photorealistic.',
    keys: {
      w: {
        label: 'Float forward',
        prompt: 'First person POV of an astronaut in a white spacesuit who has floated very close to the International Space Station hull. Gloved hands are reaching out to grab a yellow handrail on the station surface. Every rivet, thermal blanket, and panel seam on the station is visible in extreme detail. Earth\'s blue glow reflects off the white hull. A robotic arm extends in the background. Stars above. Cinematic, IMAX quality, photorealistic.',
      },
      s: {
        label: 'Look at Earth',
        prompt: 'First person POV of an astronaut in a white spacesuit looking directly down at planet Earth from orbit. The entire planet fills the view — a massive sphere of brilliant blue oceans, white hurricane spirals, brown mountain ranges, and green forests. The thin blue line of the atmosphere glows at the horizon. City lights are visible on the night side. The astronaut\'s boots float in the foreground. Awe-inspiring, majestic, cinematic, IMAX quality, photorealistic.',
      },
      a: {
        label: 'Roll left',
        prompt: 'First person POV of an astronaut in a white spacesuit slowly tumbling to the left in zero gravity. The entire scene is rotating — the International Space Station, Earth, and the star field are all spinning dramatically. The sun comes into view, blindingly bright with visible solar flare, partially blocked by one of the station\'s massive solar panel arrays. Disorienting, dynamic, cinematic, IMAX quality, photorealistic.',
      },
      d: {
        label: 'Roll right',
        prompt: 'First person POV of an astronaut in a white spacesuit tumbling to the right in zero gravity. A stunning orbital sunrise is happening — brilliant golden-orange light is exploding over Earth\'s curved horizon, painting the atmosphere in bands of red, orange, and blue. The space station\'s solar panels glow gold in the new light. Long dramatic shadows. The stars fade as sunlight floods the scene. Breathtaking, cinematic, IMAX quality, photorealistic.',
      },
      ' ': {
        label: 'Boost',
        prompt: 'First person POV of an astronaut in a white spacesuit firing jetpack thrusters, rocketing away from the International Space Station at high speed. The station is rapidly shrinking below, becoming a small glinting cross against the enormous blue sphere of Earth. The astronaut is alone in the vast emptiness of space, surrounded by stars in every direction. A visible gas jet trail streams behind. Exhilarating, terrifying isolation, cinematic, IMAX quality, photorealistic.',
      },
    },
  },
};

// -- DOM --

const menuScreen = document.getElementById('menu') as HTMLElement;
const gameScreen = document.getElementById('game') as HTMLElement;
const scenariosEl = document.getElementById('scenarios') as HTMLElement;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const menuStatus = document.getElementById('menuStatus') as HTMLElement;
const video = document.getElementById('video') as HTMLVideoElement;
const backBtn = document.getElementById('backBtn') as HTMLButtonElement;
const gameStatus = document.getElementById('gameStatus') as HTMLElement;
const actionLabel = document.getElementById('actionLabel') as HTMLElement;
const keyEls = document.querySelectorAll<HTMLElement>('.key[data-key]');

// -- State --

let client: Odyssey | null = null;
let connected = false;
let selectedScenario: string = 'mountain';
let interacting = false; // prevents key spam while an interact() is in flight
let playing = false;

// -- Screens --

function showScreen(id: 'menu' | 'game') {
  menuScreen.classList.toggle('active', id === 'menu');
  gameScreen.classList.toggle('active', id === 'game');
}

// -- Scenario cards --

for (const [id, scenario] of Object.entries(scenarios)) {
  const card = document.createElement('div');
  card.className = 'scenario-card' + (id === selectedScenario ? ' selected' : '');
  card.innerHTML = `<h3>${scenario.name}</h3><p>${scenario.description}</p>`;
  card.addEventListener('click', () => {
    selectedScenario = id;
    document.querySelectorAll('.scenario-card').forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
  });
  scenariosEl.appendChild(card);
}

// -- Connect on load --

const MAX_CONNECT_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connectWithRetry(attempt = 1): Promise<MediaStream> {
  try {
    client = new Odyssey({ apiKey: import.meta.env.VITE_ODYSSEY_API_KEY });
    return await client.connect({
      onStatusChange: (s, msg) => {
        if (!playing) menuStatus.textContent = msg ?? s;
        else gameStatus.textContent = msg ?? s;
      },
      onStreamStarted: () => {
        gameStatus.textContent = 'Use WASD + Space to play';
      },
      onStreamEnded: () => {
        gameStatus.textContent = 'Stream ended';
      },
      onInteractAcknowledged: () => {
        interacting = false;
      },
      onStreamError: (reason, msg) => {
        gameStatus.textContent = `Stream error: ${reason} — ${msg}`;
        interacting = false;
      },
      onError: (err, fatal) => {
        const text = `${fatal ? 'Fatal' : 'Error'}: ${err.message}`;
        if (!playing) menuStatus.textContent = text;
        else gameStatus.textContent = text;
        interacting = false;
      },
      onDisconnected: () => {
        connected = false;
        playBtn.disabled = true;
        menuStatus.textContent = 'Disconnected';
      },
    });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('concurrent sessions') && attempt < MAX_CONNECT_RETRIES) {
      menuStatus.textContent = `Session still clearing... retrying (${attempt}/${MAX_CONNECT_RETRIES})`;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectWithRetry(attempt + 1);
    }
    throw err;
  }
}

async function init() {
  const apiKey = import.meta.env.VITE_ODYSSEY_API_KEY;
  if (!apiKey) {
    menuStatus.textContent = 'Missing VITE_ODYSSEY_API_KEY in .env';
    return;
  }

  menuStatus.textContent = 'Connecting...';

  try {
    const stream = await connectWithRetry();
    video.srcObject = stream;
    connected = true;
    playBtn.disabled = false;
    menuStatus.textContent = 'Choose a scenario and press Play';
  } catch (err) {
    menuStatus.textContent = `Connection failed: ${(err as Error).message}`;
  }
}

// -- Play --

playBtn.addEventListener('click', async () => {
  if (!client || !connected) return;
  playing = true;
  showScreen('game');
  gameStatus.textContent = 'Starting stream...';
  actionLabel.textContent = '';

  const scenario = scenarios[selectedScenario];
  try {
    await client.startStream({ prompt: scenario.startPrompt, portrait: false });
  } catch (err) {
    gameStatus.textContent = `Start failed: ${(err as Error).message}`;
  }
});

// -- Back to menu --

backBtn.addEventListener('click', async () => {
  if (!client) return;
  playing = false;
  try {
    await client.endStream();
  } catch {
    // stream may not be active
  }
  showScreen('menu');
  menuStatus.textContent = 'Choose a scenario and press Play';
});

// -- Keyboard controls --

window.addEventListener('keydown', async (e) => {
  const key = e.key.toLowerCase();
  const mappedKey = key === ' ' ? ' ' : key;

  // Debug: show why key was ignored
  if (!playing || !client || interacting) {
    console.log(`[key:${mappedKey}] ignored — playing:${playing} client:${!!client} interacting:${interacting}`);
    return;
  }

  const scenario = scenarios[selectedScenario];
  const action = scenario.keys[mappedKey];
  if (!action) return;

  e.preventDefault();

  // Highlight key in HUD
  const keyEl = document.querySelector(`.key[data-key="${mappedKey}"]`) as HTMLElement | null;
  keyEl?.classList.add('active');

  actionLabel.textContent = action.label;
  gameStatus.textContent = `Sending: ${action.label}...`;
  interacting = true;

  try {
    await client.interact({ prompt: action.prompt });
    gameStatus.textContent = `Sent: ${action.label}`;
  } catch (err) {
    gameStatus.textContent = `Interact failed: ${(err as Error).message}`;
  } finally {
    interacting = false;
    keyEl?.classList.remove('active');
  }
});

// Visual feedback on keyup
window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  const keyEl = document.querySelector(`.key[data-key="${key === ' ' ? ' ' : key}"]`) as HTMLElement | null;
  keyEl?.classList.remove('active');
});

// -- Cleanup --

window.addEventListener('beforeunload', () => {
  client?.disconnect();
});

// -- Start --

init();
