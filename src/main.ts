import { Odyssey } from '@odysseyml/odyssey';

// -- Scenarios --

interface Scenario {
  name: string;
  description: string;
  startPrompt: string;
  keys: Record<string, { label: string; prompt: string }>;
}

const scenarios: Record<string, Scenario> = {
  mountain: {
    name: 'Mountain Climb',
    description: 'Scale a cliff face in first person',
    startPrompt:
      'First person POV of a rock climber on a massive cliff face, bright daylight, dramatic height, rocky texture in detail, looking upward, cinematic, wide-angle lens',
    keys: {
      w: { label: 'Climb up', prompt: 'The climber is reaching upward, pulling themselves higher on the rock face, hands gripping a new ledge' },
      s: { label: 'Look down', prompt: 'The climber is looking down at the vast drop below, the ground far away, vertigo-inducing depth' },
      a: { label: 'Go left', prompt: 'The climber is traversing left along a narrow ledge, shifting weight carefully sideways' },
      d: { label: 'Go right', prompt: 'The climber is traversing right across the rock face, finding new footholds' },
      ' ': { label: 'Leap', prompt: 'The climber is leaping to grab a distant handhold, a moment of freefall before catching the rock' },
    },
  },
  dungeon: {
    name: 'Dungeon Crawl',
    description: 'Explore a dark stone dungeon',
    startPrompt:
      'First person POV walking through a dark medieval stone dungeon, flickering torchlight casting shadows on wet walls, cobwebs, mysterious atmosphere, cinematic, deep focus',
    keys: {
      w: { label: 'Walk forward', prompt: 'Moving forward through the dungeon corridor, torchlight revealing more of the stone passage ahead' },
      s: { label: 'Turn around', prompt: 'Turning around to look back down the dark corridor, shadows shifting in the torchlight' },
      a: { label: 'Turn left', prompt: 'Turning left at an intersection, a new passage stretches into darkness with faint light at the end' },
      d: { label: 'Turn right', prompt: 'Turning right into a wider chamber, ancient markings are visible on the walls' },
      ' ': { label: 'Open door', prompt: 'A heavy wooden door is creaking open, revealing a new room with something glinting inside' },
    },
  },
  space: {
    name: 'Space Walk',
    description: 'Float outside a space station',
    startPrompt:
      'First person POV of an astronaut floating in space outside a space station, Earth visible below with blue oceans and white clouds, stars in the background, helmet visor reflections, cinematic, IMAX quality',
    keys: {
      w: { label: 'Float forward', prompt: 'The astronaut is floating forward toward the space station hull, gloved hands reaching out' },
      s: { label: 'Look at Earth', prompt: 'The astronaut is looking down at Earth below, the curvature of the planet fills the view, sunrise on the horizon' },
      a: { label: 'Roll left', prompt: 'The astronaut is slowly rolling left, the stars and station rotating in view, weightless motion' },
      d: { label: 'Roll right', prompt: 'The astronaut is rolling right, Earth and the station swapping positions in the viewport' },
      ' ': { label: 'Boost', prompt: 'The astronaut fires thrusters, a burst of gas propelling them upward away from the station, gaining altitude' },
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

async function init() {
  const apiKey = import.meta.env.VITE_ODYSSEY_API_KEY;
  if (!apiKey) {
    menuStatus.textContent = 'Missing VITE_ODYSSEY_API_KEY in .env';
    return;
  }

  client = new Odyssey({ apiKey });
  menuStatus.textContent = 'Connecting...';

  try {
    const stream = await client.connect({
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
  if (!playing || !client || interacting) return;

  const key = e.key.toLowerCase();
  const scenario = scenarios[selectedScenario];
  const action = scenario.keys[key === ' ' ? ' ' : key];
  if (!action) return;

  e.preventDefault();

  // Highlight key in HUD
  const keyEl = document.querySelector(`.key[data-key="${key === ' ' ? ' ' : key}"]`) as HTMLElement | null;
  keyEl?.classList.add('active');

  actionLabel.textContent = action.label;
  interacting = true;

  try {
    await client.interact({ prompt: action.prompt });
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
