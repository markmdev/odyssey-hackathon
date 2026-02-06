import { Odyssey } from '@odysseyml/odyssey';

type GameMode = 'precision' | 'wasd';
type GamePhase = 'MENU' | 'CONNECTING' | 'BASE_CAMP' | 'CLIMBING' | 'PAUSED' | 'FALLING' | 'SUMMIT';
type LimbId = 'lh' | 'rh' | 'lf' | 'rf';
type GripQuality = 'good' | 'fair' | 'poor';
type HoldType = 'fin' | 'frame' | 'bracket' | 'seam' | 'lattice' | 'glass' | 'corner';
type Zone = 'lower' | 'taper' | 'crown';
type Posture = 'stable' | 'precarious' | 'overextended';
type StaminaState = 'fresh' | 'tired' | 'critical';

type OverlayAction = {
  label: string;
  kind: 'main' | 'sub';
  onClick: () => void;
};

type RenderPromptReason =
  | 'start'
  | 'placement'
  | 'rest'
  | 'camera'
  | 'state_shift'
  | 'fall'
  | 'summit'
  | 'pause'
  | 'resume';

interface Hold {
  id: string;
  x: number;
  y: number;
  floor: number;
  zone: Zone;
  dead: boolean;
  load: 'any' | 'hand' | 'foot';
  type: HoldType;
  grip: GripQuality;
  slipperiness: number;
}

interface CameraState {
  orbit: number;
  elevation: number;
  zoom: number;
}

interface RunAtmosphere {
  light: string;
  weather: string;
  haze: string;
  outfit: string;
}

interface GameState {
  phase: GamePhase;
  mode: GameMode;
  selectedLimb: LimbId;
  limbs: Record<LimbId, string>;
  posture: Posture;
  staminaState: StaminaState;
  stamina: Record<LimbId, number>;
  floor: number;
  zone: Zone;
  timerMs: number;
  lastActionMs: number;
  restRemainingMs: number;
  runStartedAt: number;
  runId: string;
  atmosphere: RunAtmosphere;
  camera: CameraState;
  reachable: string[];
  targetHoldId: string | null;
  lastPromptSnapshot: {
    floor: number;
    posture: Posture;
    staminaState: StaminaState;
    zone: Zone;
  };
  statusLine: string;
  tutorialQueue: string[];
  tutorialRunning: boolean;
}

interface LeaderboardEntry {
  name: string;
  timeMs: number;
  timestamp: number;
}

interface Point {
  x: number;
  y: number;
}

const TIME_LIMIT_MS = 15 * 60 * 1000;
const TOTAL_FLOORS = 61;
const HESITATION_TIMEOUT_MS = 8000;
const REST_DURATION_MS = 3000;
const PROMPT_MIN_INTERVAL_MS = 400;
const LEADERBOARD_KEY = 'skyscraper_live_leaderboard_v1';
const PLAYER_NAME_KEY = 'skyscraper_live_name_v1';
const TUTORIAL_SEEN_KEY = 'skyscraper_live_tutorial_seen_v1';
const LIMBS: LimbId[] = ['lh', 'rh', 'lf', 'rf'];
const LIMB_LABEL: Record<LimbId, string> = {
  lh: 'left hand',
  rh: 'right hand',
  lf: 'left foot',
  rf: 'right foot',
};

const elem = <T extends HTMLElement>(id: string): T => {
  const found = document.getElementById(id);
  if (!found) {
    throw new Error(`Missing #${id}`);
  }
  return found as T;
};

const video = elem<HTMLVideoElement>('worldVideo');
const stageState = elem<HTMLElement>('stageState');
const stageStateTitle = elem<HTMLElement>('stageStateTitle');
const stageStateBody = elem<HTMLElement>('stageStateBody');
const canvas = elem<HTMLCanvasElement>('holdOverlay');
const hud = elem<HTMLElement>('hud');
const floorDisplay = elem<HTMLElement>('floorDisplay');
const timerDisplay = elem<HTMLElement>('timerDisplay');
const pauseBtn = elem<HTMLButtonElement>('pauseBtn');
const stabilityDisplay = elem<HTMLElement>('stabilityDisplay');
const statusLine = elem<HTMLElement>('statusLine');
const overlay = elem<HTMLElement>('overlay');
const overlayTitle = elem<HTMLElement>('overlayTitle');
const overlayBody = elem<HTMLElement>('overlayBody');
const overlayActions = elem<HTMLElement>('overlayActions');
const toast = elem<HTMLElement>('toast');

const apiKeyInput = elem<HTMLInputElement>('apiKey');
const connectBtn = elem<HTMLButtonElement>('connectBtn');
const disconnectBtn = elem<HTMLButtonElement>('disconnectBtn');
const connectionStatus = elem<HTMLElement>('connectionStatus');
const modePills = elem<HTMLElement>('modePills');
const overlayOpacityInput = elem<HTMLInputElement>('overlayOpacity');
const playerNameInput = elem<HTMLInputElement>('playerName');
const startRunBtn = elem<HTMLButtonElement>('startRunBtn');
const restartBtn = elem<HTMLButtonElement>('restartBtn');
const controlsHelp = elem<HTMLElement>('controlsHelp');
const leaderboardList = elem<HTMLElement>('leaderboardList');

const limbTagMap: Record<LimbId, HTMLElement> = {
  lh: document.querySelector('[data-limb-tag="lh"]') as HTMLElement,
  rh: document.querySelector('[data-limb-tag="rh"]') as HTMLElement,
  lf: document.querySelector('[data-limb-tag="lf"]') as HTMLElement,
  rf: document.querySelector('[data-limb-tag="rf"]') as HTMLElement,
};

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Canvas context unavailable');
}

const holds = createHoldMap();
const holdById = new Map<string, Hold>();
for (const hold of holds) {
  holdById.set(hold.id, hold);
}

const baseHolds = findBaseHolds();

let leaderboard: LeaderboardEntry[] = loadLeaderboard();
let client: Odyssey | null = null;
let connected = false;
let reconnecting = false;
let streamActive = false;
let expectedDisconnect = false;
let activeApiKey = '';
let draggingCamera = false;
let lastPointer = { x: 0, y: 0 };
let aimPoint: Point = { x: 0.5, y: 0.08 };
let directionalTargetHoldId: string | null = null;
let lastFrameMs = performance.now();
let rafId = 0;
let toastTimer: number | null = null;
let promptTimer: number | null = null;
let pendingPrompt: string | null = null;
let interacting = false;
let lastInteractMs = 0;
let reconnectResumePending = false;
let visualWatchdogTimer: number | null = null;
let streamRecoveryAttempted = false;
let streamStartPrompt: string | null = null;
let videoHasFrames = false;
let lastObservedVideoTime = 0;
let lastVideoProgressMs = 0;

const initialState = (): GameState => ({
  phase: 'MENU',
  mode: 'precision',
  selectedLimb: 'lh',
  limbs: { ...baseHolds },
  posture: 'stable',
  staminaState: 'fresh',
  stamina: { lh: 100, rh: 100, lf: 100, rf: 100 },
  floor: 1,
  zone: 'lower',
  timerMs: TIME_LIMIT_MS,
  lastActionMs: performance.now(),
  restRemainingMs: 0,
  runStartedAt: 0,
  runId: '',
  atmosphere: pickAtmosphere(),
  camera: { orbit: -24, elevation: 11, zoom: 1 },
  reachable: [],
  targetHoldId: null,
  lastPromptSnapshot: {
    floor: 1,
    posture: 'stable',
    staminaState: 'fresh',
    zone: 'lower',
  },
  statusLine: 'Connect to Odyssey, then start your climb.',
  tutorialQueue: [],
  tutorialRunning: false,
});

const state: GameState = initialState();

apiKeyInput.value = import.meta.env.VITE_ODYSSEY_API_KEY ?? '';
playerNameInput.value = localStorage.getItem(PLAYER_NAME_KEY) ?? '';

bindVideoEvents();
bindEvents();
renderLeaderboard();
setMode('precision', false);
setHudVisible(false);
updateConnectionStatus('Disconnected');
updateControlsState();
resizeCanvas();
refreshDerivedState();
computeAimTarget();
render();
showToast('Enter Odyssey API key to connect and begin the run.');

rafId = requestAnimationFrame(loop);

window.addEventListener('beforeunload', () => {
  stopPromptQueue();
  clearVisualWatchdog();
  if (client) {
    expectedDisconnect = true;
    client.disconnect();
    client = null;
  }
});

function bindVideoEvents(): void {
  const resumePlayback = () => {
    void ensureVideoPlayback();
  };

  video.addEventListener('loadedmetadata', resumePlayback);
  video.addEventListener('canplay', resumePlayback);
  video.addEventListener('waiting', resumePlayback);
  video.addEventListener('stalled', resumePlayback);
}

function attachVideoStream(stream: MediaStream): void {
  video.srcObject = stream;
  videoHasFrames = false;
  lastObservedVideoTime = 0;
  lastVideoProgressMs = 0;
  void ensureVideoPlayback();
  armVisualWatchdog();
}

async function ensureVideoPlayback(): Promise<void> {
  if (!(video.srcObject instanceof MediaStream)) {
    return;
  }

  try {
    await video.play();
  } catch {
    // Browser may reject temporarily; watchdog retries on stream events.
  }
}

function hasAdvancingVideo(): boolean {
  const stream = video.srcObject;
  if (!(stream instanceof MediaStream)) {
    return false;
  }

  if (!stream.getVideoTracks().length) {
    return false;
  }

  if (video.videoWidth <= 0 || video.videoHeight <= 0 || video.readyState < 2) {
    return false;
  }

  return video.currentTime > 0.05;
}

function clearVisualWatchdog(): void {
  if (visualWatchdogTimer !== null) {
    clearTimeout(visualWatchdogTimer);
    visualWatchdogTimer = null;
  }
}

function armVisualWatchdog(): void {
  clearVisualWatchdog();

  visualWatchdogTimer = window.setTimeout(() => {
    void runVisualRecoveryIfNeeded();
  }, 7000);
}

async function runVisualRecoveryIfNeeded(): Promise<void> {
  visualWatchdogTimer = null;

  if (!streamActive || !connected || !client) {
    return;
  }

  if (hasAdvancingVideo()) {
    return;
  }

  await ensureVideoPlayback();
  await sleep(1000);

  if (hasAdvancingVideo()) {
    return;
  }

  if (streamRecoveryAttempted) {
    showToast('Connected but visuals are delayed. Press Restart (R) or reconnect.', 5200);
    return;
  }

  streamRecoveryAttempted = true;
  showToast('No visuals detected. Attempting one stream refresh...', 4200);

  try {
    if (streamActive) {
      await client.endStream();
      streamActive = false;
    }

    const prompt = streamStartPrompt ?? compilePrompt('resume');
    await client.startStream({
      prompt,
      portrait: false,
    });
    streamActive = true;
    updateConnectionStatus('Connected · stream live');
    updateControlsState();
    await ensureVideoPlayback();
    armVisualWatchdog();
  } catch (error) {
    showToast(`Visual recovery failed: ${(error as Error).message}`, 5200);
  }
}

async function connectOdyssey(): Promise<void> {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showToast('API key required.');
    return;
  }

  if (connected) {
    showToast('Already connected.');
    return;
  }

  state.phase = 'CONNECTING';
  updateConnectionStatus('Connecting...');
  updateControlsState();

  activeApiKey = apiKey;
  expectedDisconnect = false;
  reconnectResumePending = false;
  client = new Odyssey({ apiKey });

  try {
    const stream = await client.connect({
      onStatusChange: (status, msg) => {
        updateConnectionStatus(msg ?? status);
      },
      onStreamStarted: () => {
        streamActive = true;
        streamRecoveryAttempted = false;
        updateConnectionStatus('Connected · stream live');
        updateControlsState();
        armVisualWatchdog();
      },
      onStreamEnded: () => {
        streamActive = false;
        clearVisualWatchdog();
        updateConnectionStatus('Connected · stream idle');
        updateControlsState();
      },
      onInteractAcknowledged: () => {
        // Keep this callback for observability without UI noise.
      },
      onStreamError: (reason, msg) => {
        showToast(`Stream error: ${reason}${msg ? ` (${msg})` : ''}`);
      },
      onError: (error, fatal) => {
        showToast(`${fatal ? 'Fatal' : 'Error'}: ${error.message}`);
        if (fatal) {
          connected = false;
          streamActive = false;
          updateControlsState();
        }
      },
      onDisconnected: () => {
        handleDisconnected();
      },
    });

    attachVideoStream(stream);
    connected = true;
    state.phase = 'MENU';
    updateConnectionStatus('Connected · ready to climb');
    updateControlsState();
    showToast('Odyssey connected. Start your climb when ready.');
  } catch (error) {
    connected = false;
    streamActive = false;
    state.phase = 'MENU';
    const message = (error as Error).message;
    updateConnectionStatus(`Connection failed: ${message}`);
    updateControlsState();
    showToast(message);
  }
}

async function disconnectOdyssey(quiet = false): Promise<void> {
  expectedDisconnect = true;
  reconnectResumePending = false;

  if (client) {
    try {
      if (streamActive) {
        await client.endStream();
      }
    } catch {
      // Ignore and continue disconnect path.
    }
    client.disconnect();
  }

  client = null;
  connected = false;
  streamActive = false;
  streamStartPrompt = null;
  clearVisualWatchdog();
  state.phase = 'MENU';
  setHudVisible(false);
  clearOverlay();
  updateConnectionStatus('Disconnected');
  updateControlsState();
  video.srcObject = null;

  if (!quiet) {
    showToast('Disconnected from Odyssey.');
  }
}

async function attemptReconnect(): Promise<void> {
  if (reconnecting || !activeApiKey) {
    return;
  }

  reconnecting = true;
  showOverlay('Reconnecting', 'Odyssey session dropped. Attempting recovery...', []);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await sleep(700 * attempt);
    if (connected) {
      reconnecting = false;
      clearOverlay();
      return;
    }

    client = new Odyssey({ apiKey: activeApiKey });
    expectedDisconnect = false;

    try {
      const stream = await client.connect({
        onStatusChange: (status, msg) => {
          updateConnectionStatus(msg ?? status);
        },
        onStreamStarted: () => {
          streamActive = true;
          streamRecoveryAttempted = false;
          updateConnectionStatus('Connected · stream live');
          updateControlsState();
          armVisualWatchdog();
        },
        onStreamEnded: () => {
          streamActive = false;
          clearVisualWatchdog();
          updateConnectionStatus('Connected · stream idle');
          updateControlsState();
        },
        onStreamError: (reason, msg) => {
          showToast(`Stream error: ${reason}${msg ? ` (${msg})` : ''}`);
        },
        onError: (error, fatal) => {
          showToast(`${fatal ? 'Fatal' : 'Error'}: ${error.message}`);
          if (fatal) {
            connected = false;
            streamActive = false;
            updateControlsState();
          }
        },
        onDisconnected: () => {
          handleDisconnected();
        },
      });

      connected = true;
      attachVideoStream(stream);
      updateConnectionStatus('Reconnected');
      updateControlsState();
      clearOverlay();
      reconnecting = false;

      if (reconnectResumePending) {
        reconnectResumePending = false;
        try {
          const resumePrompt = compilePrompt('resume');
          streamStartPrompt = resumePrompt;
          await client.startStream({
            prompt: resumePrompt,
            portrait: false,
          });
          streamActive = true;
          updateConnectionStatus('Connected · stream live');
          state.phase = 'CLIMBING';
          clearOverlay();
          showToast('Run resumed after reconnect.');
        } catch (error) {
          showToast(`Resume failed: ${(error as Error).message}`);
          triggerFall('Connection could not be restored in time.', true);
        }
      }
      return;
    } catch (error) {
      const message = (error as Error).message;
      updateConnectionStatus(`Reconnect ${attempt}/3 failed: ${message}`);
    }
  }

  reconnecting = false;
  showOverlay('Connection Lost', 'Reconnect failed. Restart the run or reconnect manually.', [
    {
      label: 'Reconnect',
      kind: 'main',
      onClick: () => {
        clearOverlay();
        void connectOdyssey();
      },
    },
    {
      label: 'Menu',
      kind: 'sub',
      onClick: () => {
        clearOverlay();
        state.phase = 'MENU';
        setHudVisible(false);
        updateControlsState();
      },
    },
  ]);
}

function handleDisconnected(): void {
  connected = false;
  streamActive = false;
  clearVisualWatchdog();
  updateControlsState();
  updateConnectionStatus('Disconnected');

  if (!expectedDisconnect && activeApiKey) {
    if (state.phase === 'CLIMBING' || state.phase === 'PAUSED') {
      reconnectResumePending = true;
      state.phase = 'PAUSED';
      state.statusLine = 'Connection dropped. Attempting reconnect...';
    } else {
      reconnectResumePending = false;
    }
    void attemptReconnect();
  }
}

async function startRun(force = false): Promise<void> {
  if (!connected || !client) {
    showToast('Connect to Odyssey first.');
    return;
  }

  if (!force && (state.phase === 'CLIMBING' || state.phase === 'PAUSED')) {
    showToast('Run already active.');
    return;
  }

  clearOverlay();
  resetRunState();
  state.phase = 'BASE_CAMP';
  setHudVisible(true);
  updateControlsState();

  try {
    streamRecoveryAttempted = false;
    const startPrompt = compilePrompt('start');
    streamStartPrompt = startPrompt;
    updateConnectionStatus('Starting stream...');
    await client.startStream({
      prompt: startPrompt,
      portrait: false,
    });
    streamActive = true;
    state.phase = 'CLIMBING';
    state.runStartedAt = performance.now();
    state.lastActionMs = performance.now();
    state.statusLine = 'Find a compact route and keep your center of gravity over support holds.';
    updateConnectionStatus('Connected · stream live');
    updateControlsState();
    refreshDerivedState();
    computeAimTarget();
    maybeRunTutorial();
    armVisualWatchdog();
    showToast('Climb started. Reach floor 61 before the timer expires.');
  } catch (error) {
    streamStartPrompt = null;
    state.phase = 'MENU';
    setHudVisible(false);
    updateControlsState();
    updateConnectionStatus('Connected · stream idle');
    showToast(`Start failed: ${(error as Error).message}`);
  }
}

async function restartRun(): Promise<void> {
  if (!connected || !client) {
    showToast('Connect first.');
    return;
  }

  if (streamActive) {
    try {
      await client.endStream();
      streamActive = false;
      clearVisualWatchdog();
      streamStartPrompt = null;
    } catch {
      // Continue with fresh stream attempt.
    }
  }

  state.phase = 'MENU';
  stopPromptQueue();
  await startRun(true);
}

function resetRunState(): void {
  const fresh = initialState();
  state.selectedLimb = fresh.selectedLimb;
  state.limbs = { ...fresh.limbs };
  state.posture = fresh.posture;
  state.staminaState = fresh.staminaState;
  state.stamina = { ...fresh.stamina };
  state.floor = 1;
  state.zone = 'lower';
  state.timerMs = TIME_LIMIT_MS;
  state.lastActionMs = performance.now();
  state.restRemainingMs = 0;
  state.runStartedAt = 0;
  state.runId = createRunId();
  state.atmosphere = pickAtmosphere();
  state.camera = { orbit: -24, elevation: 11, zoom: 1 };
  state.reachable = [];
  state.targetHoldId = null;
  state.lastPromptSnapshot = {
    floor: 1,
    posture: 'stable',
    staminaState: 'fresh',
    zone: 'lower',
  };
  state.statusLine = 'Base camp ready. Select a limb and place your first move.';
  state.tutorialQueue = [];
  state.tutorialRunning = false;

  aimPoint = { x: 0.5, y: 0.06 };
  directionalTargetHoldId = null;
}

function bindEvents(): void {
  connectBtn.addEventListener('click', () => {
    void connectOdyssey();
  });

  disconnectBtn.addEventListener('click', () => {
    void disconnectOdyssey();
  });

  startRunBtn.addEventListener('click', () => {
    void startRun();
  });

  restartBtn.addEventListener('click', () => {
    void restartRun();
  });

  pauseBtn.addEventListener('click', () => {
    togglePause();
  });

  overlayOpacityInput.addEventListener('input', () => {
    drawHoldOverlay();
  });

  playerNameInput.addEventListener('change', () => {
    const value = playerNameInput.value.trim().slice(0, 18);
    playerNameInput.value = value;
    localStorage.setItem(PLAYER_NAME_KEY, value);
  });

  modePills.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.mode === 'wasd' ? 'wasd' : 'precision';
      setMode(mode, true);
    });
  });

  const stage = canvas.parentElement as HTMLElement;

  stage.addEventListener('mousemove', (event) => {
    const point = toPoint(event);
    aimPoint = point;

    if (draggingCamera) {
      const dx = event.clientX - lastPointer.x;
      const dy = event.clientY - lastPointer.y;
      state.camera.orbit = clamp(state.camera.orbit + dx * 0.12, -180, 180);
      state.camera.elevation = clamp(state.camera.elevation - dy * 0.07, -12, 38);
      lastPointer = { x: event.clientX, y: event.clientY };
      queuePrompt(compilePrompt('camera'));
      return;
    }

    if (state.mode === 'precision') {
      computeAimTarget();
    }
  });

  stage.addEventListener('mousedown', (event) => {
    if (event.button === 2) {
      draggingCamera = true;
      lastPointer = { x: event.clientX, y: event.clientY };
      event.preventDefault();
      return;
    }

    if (event.button !== 0) {
      return;
    }

    if (state.mode !== 'precision' || !isRunActive()) {
      return;
    }

    event.preventDefault();
    attemptCommit(state.targetHoldId, 'precision');
  });

  stage.addEventListener('mouseup', (event) => {
    if (event.button === 2) {
      draggingCamera = false;
    }
  });

  stage.addEventListener('mouseleave', () => {
    draggingCamera = false;
  });

  stage.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  stage.addEventListener(
    'wheel',
    (event) => {
      if (!isRunActive()) {
        return;
      }
      event.preventDefault();
      state.camera.zoom = clamp(state.camera.zoom + event.deltaY * -0.0013, 0.7, 1.5);
      queuePrompt(compilePrompt('camera'));
    },
    { passive: false },
  );

  window.addEventListener('resize', resizeCanvas);

  window.addEventListener('keydown', (event) => {
    const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
    if (activeTag === 'INPUT' && event.key !== 'Escape') {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      togglePause();
      return;
    }

    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      if (connected) {
        void restartRun();
      }
      return;
    }

    if (!isRunActive()) {
      return;
    }

    if (state.mode === 'precision') {
      if (event.key === '1') {
        setSelectedLimb('lh');
      } else if (event.key === '2') {
        setSelectedLimb('rh');
      } else if (event.key === '3') {
        setSelectedLimb('lf');
      } else if (event.key === '4') {
        setSelectedLimb('rf');
      } else if (event.key === ' ') {
        event.preventDefault();
        performRest();
      }
    }

    if (state.mode === 'wasd') {
      const lower = event.key.toLowerCase();
      if (event.key === 'Tab') {
        event.preventDefault();
        cycleLimb();
        return;
      }

      if (lower === 'q' || event.key === ' ') {
        event.preventDefault();
        performRest();
        return;
      }

      if (lower === 'e') {
        event.preventDefault();
        attemptCommit(directionalTargetHoldId, 'wasd');
        return;
      }

      if (lower === 'w' || lower === 'a' || lower === 's' || lower === 'd') {
        event.preventDefault();
        nudgeDirectionalTarget(lower);
      }
    }
  });
}

function loop(now: number): void {
  const deltaMs = Math.min(80, now - lastFrameMs);
  lastFrameMs = now;

  update(deltaMs, now);
  render();

  rafId = requestAnimationFrame(loop);
}

function update(deltaMs: number, now: number): void {
  if (state.phase !== 'CLIMBING') {
    return;
  }

  if (state.restRemainingMs > 0) {
    state.restRemainingMs = Math.max(0, state.restRemainingMs - deltaMs);
  }

  state.timerMs -= deltaMs;
  if (state.timerMs <= 0) {
    state.timerMs = 0;
    triggerFall('Time expired. Grip fatigue took over.');
    return;
  }

  const drainByGrip: Record<GripQuality, number> = {
    good: 0.7,
    fair: 1.15,
    poor: 1.85,
  };

  const postureFactor = state.posture === 'stable' ? 1 : state.posture === 'precarious' ? 1.85 : 2.7;
  const zoneFactor = state.zone === 'lower' ? 1 : state.zone === 'taper' ? 1.2 : 1.4;

  for (const limb of LIMBS) {
    const hold = holdById.get(state.limbs[limb]);
    if (!hold) {
      continue;
    }

    const isRecovering = state.restRemainingMs > 0 && state.posture === 'stable';
    if (isRecovering) {
      state.stamina[limb] = clamp(state.stamina[limb] + 10.5 * (deltaMs / 1000), 0, 100);
    } else {
      const selectedPenalty = state.posture === 'overextended' && limb === state.selectedLimb ? 1.35 : 1;
      const baseDrain = drainByGrip[hold.grip] * postureFactor * zoneFactor * selectedPenalty;
      const slipperyPenalty = hold.slipperiness > 0 ? 1 + hold.slipperiness : 1;
      state.stamina[limb] = clamp(state.stamina[limb] - baseDrain * slipperyPenalty * (deltaMs / 1000), 0, 100);
    }

    if (state.stamina[limb] <= 0.1) {
      triggerFall(`${LIMB_LABEL[limb]} gave out from exhaustion.`);
      return;
    }
  }

  refreshDerivedState();

  if (state.posture !== 'stable' && now - state.lastActionMs > HESITATION_TIMEOUT_MS) {
    triggerFall('Hesitation in a precarious position caused a slip.');
    return;
  }

  if (state.floor >= TOTAL_FLOORS) {
    triggerSummit();
    return;
  }

  const last = state.lastPromptSnapshot;
  if (
    state.floor !== last.floor ||
    state.posture !== last.posture ||
    state.staminaState !== last.staminaState ||
    state.zone !== last.zone
  ) {
    state.lastPromptSnapshot = {
      floor: state.floor,
      posture: state.posture,
      staminaState: state.staminaState,
      zone: state.zone,
    };
    queuePrompt(compilePrompt('state_shift'));
  }
}

function triggerFall(reason: string, skipPrompt = false): void {
  if (state.phase !== 'CLIMBING' && state.phase !== 'PAUSED') {
    return;
  }

  state.phase = 'FALLING';
  setHudVisible(false);
  state.statusLine = reason;

  if (!skipPrompt) {
    queuePrompt(compilePrompt('fall'), true);
  }

  window.setTimeout(() => {
    void endActiveStream();
    const elapsedMs = TIME_LIMIT_MS - state.timerMs;
    showOverlay(
      'You Fell',
      `${reason} Reached floor ${state.floor} in ${formatTime(elapsedMs)}.`,
      [
        {
          label: 'Try Again',
          kind: 'main',
          onClick: () => {
            clearOverlay();
            void startRun();
          },
        },
        {
          label: 'Menu',
          kind: 'sub',
          onClick: () => {
            clearOverlay();
            state.phase = 'MENU';
            state.statusLine = 'Ready for another attempt.';
            setHudVisible(false);
            updateControlsState();
          },
        },
      ],
    );
  }, 1200);

  updateControlsState();
}

function triggerSummit(): void {
  if (state.phase !== 'CLIMBING') {
    return;
  }

  state.phase = 'SUMMIT';
  setHudVisible(false);
  queuePrompt(compilePrompt('summit'), true);

  window.setTimeout(() => {
    void endActiveStream();
    const elapsed = TIME_LIMIT_MS - state.timerMs;
    showOverlay('Summit!', `You topped out in ${formatTime(elapsed)}. Save your leaderboard run?`, [
      {
        label: 'Save + Replay',
        kind: 'main',
        onClick: () => {
          saveSummit(elapsed);
          clearOverlay();
          void startRun();
        },
      },
      {
        label: 'Save + Menu',
        kind: 'sub',
        onClick: () => {
          saveSummit(elapsed);
          clearOverlay();
          state.phase = 'MENU';
          state.statusLine = 'Connected and ready.';
          setHudVisible(false);
          updateControlsState();
        },
      },
    ]);
  }, 1200);

  updateControlsState();
}

function saveSummit(timeMs: number): void {
  const fallback = 'Climber';
  const name = playerNameInput.value.trim().slice(0, 18) || fallback;
  playerNameInput.value = name;
  localStorage.setItem(PLAYER_NAME_KEY, name);

  leaderboard.push({
    name,
    timeMs,
    timestamp: Date.now(),
  });

  leaderboard = leaderboard
    .sort((a, b) => a.timeMs - b.timeMs)
    .slice(0, 100);

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  renderLeaderboard();
  showToast(`Saved summit time: ${name} · ${formatTime(timeMs)}`);
}

async function endActiveStream(): Promise<void> {
  if (!client || !streamActive) {
    return;
  }

  try {
    await client.endStream();
  } catch {
    // Best effort stream cleanup.
  } finally {
    streamActive = false;
    streamStartPrompt = null;
    clearVisualWatchdog();
    updateControlsState();
    updateConnectionStatus(connected ? 'Connected · stream idle' : 'Disconnected');
  }
}

function setMode(mode: GameMode, announce = true): void {
  state.mode = mode;
  modePills.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
    const selected = button.dataset.mode === mode;
    button.classList.toggle('active', selected);
  });

  controlsHelp.innerHTML = mode === 'precision'
    ? '<div>1/2/3/4 select limb, mouse to aim, click to commit</div><div>Right-drag orbit camera, scroll zoom</div><div>Space rest, Esc pause, R quick restart</div>'
    : '<div>Tab cycles limbs, WASD picks direction to nearest hold</div><div>E commits highlighted hold, Q rests in stable posture</div><div>Right-drag orbit camera, Esc pause, R quick restart</div>';

  directionalTargetHoldId = null;
  computeAimTarget();

  if (announce) {
    showToast(mode === 'precision' ? 'Precision mode active.' : 'WASD mode active.');
  }
}

function togglePause(): void {
  if (state.phase === 'CLIMBING') {
    state.phase = 'PAUSED';
    showOverlay('Paused', 'Timer paused. Press Esc or Resume to continue.', [
      {
        label: 'Resume',
        kind: 'main',
        onClick: () => {
          clearOverlay();
          state.phase = 'CLIMBING';
          state.lastActionMs = performance.now();
          queuePrompt(compilePrompt('resume'));
          updateControlsState();
        },
      },
      {
        label: 'Restart',
        kind: 'sub',
        onClick: () => {
          clearOverlay();
          void restartRun();
        },
      },
    ]);
    queuePrompt(compilePrompt('pause'));
    updateControlsState();
  } else if (state.phase === 'PAUSED') {
    clearOverlay();
    state.phase = 'CLIMBING';
    state.lastActionMs = performance.now();
    queuePrompt(compilePrompt('resume'));
    updateControlsState();
  }
}

function attemptCommit(targetId: string | null, source: GameMode): void {
  if (!isRunActive()) {
    return;
  }

  if (!targetId) {
    showToast('No hold selected. Aim at a hold before committing.');
    return;
  }

  const hold = holdById.get(targetId);
  if (!hold) {
    showToast('Invalid hold target.');
    return;
  }

  const selected = state.selectedLimb;
  const occupiedByOther = LIMBS.some((limb) => limb !== selected && state.limbs[limb] === hold.id);
  if (occupiedByOther) {
    showToast('That hold is already occupied.');
    return;
  }

  if (hold.dead) {
    triggerFall('Committed to dead glass zone. Immediate slip.');
    return;
  }

  const reachable = computeReachable(state.selectedLimb);
  const canReach = reachable.some((candidate) => candidate.id === hold.id);

  if (!canReach) {
    triggerFall('Overextension collapse. The move exceeded reach.');
    return;
  }

  const currentHold = holdById.get(state.limbs[selected]);
  const moveDistance = currentHold ? distance(currentHold, hold) : 0;
  const moveCost = (moveDistance * 130) + (hold.grip === 'poor' ? 16 : hold.grip === 'fair' ? 9 : 5);

  state.limbs[selected] = hold.id;
  state.lastActionMs = performance.now();
  state.restRemainingMs = 0;
  state.stamina[selected] = clamp(state.stamina[selected] - moveCost, 0, 100);

  refreshDerivedState();

  if (state.staminaState === 'critical' && (state.posture !== 'stable' || hold.grip === 'poor')) {
    triggerFall('Critical fatigue during a demanding move. Grip failed.');
    return;
  }

  state.statusLine = `${capitalize(LIMB_LABEL[selected])} moved to floor ${hold.floor} (${hold.type}).`;
  queuePrompt(compilePrompt('placement'), source === 'wasd');
  computeAimTarget();
}

function performRest(): void {
  if (!isRunActive()) {
    return;
  }

  if (state.posture !== 'stable') {
    showToast('Rest requires a stable position.');
    return;
  }

  state.lastActionMs = performance.now();
  state.restRemainingMs = REST_DURATION_MS;
  state.statusLine = 'Resting against the wall to recover stamina.';
  queuePrompt(compilePrompt('rest'));
}

function setSelectedLimb(limb: LimbId): void {
  if (state.selectedLimb === limb) {
    return;
  }
  state.selectedLimb = limb;
  state.lastActionMs = performance.now();
  directionalTargetHoldId = null;
  computeAimTarget();
}

function cycleLimb(): void {
  const index = LIMBS.indexOf(state.selectedLimb);
  const next = LIMBS[(index + 1) % LIMBS.length];
  setSelectedLimb(next);
}

function nudgeDirectionalTarget(key: string): void {
  const currentHold = holdById.get(state.limbs[state.selectedLimb]);
  if (!currentHold) {
    return;
  }

  const reachable = computeReachable(state.selectedLimb);
  if (!reachable.length) {
    directionalTargetHoldId = null;
    showToast('No reachable holds in current posture.');
    return;
  }

  const directionVector: Record<string, Point> = {
    w: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    s: { x: 0, y: -1 },
    d: { x: 1, y: 0 },
  };

  const direction = directionVector[key];
  let best: Hold | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidate of reachable) {
    const vx = candidate.x - currentHold.x;
    const vy = candidate.y - currentHold.y;
    const mag = Math.hypot(vx, vy);
    if (mag < 0.0001) {
      continue;
    }

    const dot = (vx / mag) * direction.x + (vy / mag) * direction.y;
    const gripBonus = candidate.grip === 'good' ? 0.2 : candidate.grip === 'fair' ? 0.1 : 0;
    const score = (dot * 2) - (mag * 1.2) + gripBonus;

    if (score > bestScore && dot > 0.2) {
      bestScore = score;
      best = candidate;
    }
  }

  if (!best) {
    showToast('No valid hold in that direction.');
    return;
  }

  directionalTargetHoldId = best.id;
  state.targetHoldId = best.id;
  state.lastActionMs = performance.now();
}

function computeAimTarget(): void {
  const reachable = computeReachable(state.selectedLimb);
  state.reachable = reachable.map((hold) => hold.id);

  if (!reachable.length) {
    state.targetHoldId = null;
    directionalTargetHoldId = null;
    return;
  }

  let nearestReachable = reachable[0];
  let nearestDist = distance(aimPoint, nearestReachable);

  for (const hold of reachable) {
    const d = distance(aimPoint, hold);
    if (d < nearestDist) {
      nearestReachable = hold;
      nearestDist = d;
    }
  }

  let nearestAny = holds[0];
  let nearestAnyDist = distance(aimPoint, nearestAny);

  for (const hold of holds) {
    const d = distance(aimPoint, hold);
    if (d < nearestAnyDist) {
      nearestAny = hold;
      nearestAnyDist = d;
    }
  }

  if (nearestAny.dead && nearestAnyDist < 0.055) {
    state.targetHoldId = nearestAny.id;
    if (state.mode === 'wasd') {
      directionalTargetHoldId = nearestAny.id;
    }
    return;
  }

  state.targetHoldId = nearestReachable.id;
  if (state.mode === 'wasd') {
    directionalTargetHoldId = nearestReachable.id;
  }
}

function computeReachable(limb: LimbId): Hold[] {
  const selectedHold = holdById.get(state.limbs[limb]);
  if (!selectedHold) {
    return [];
  }

  const hands = limb === 'lh' || limb === 'rh';
  const maxReach = hands ? 0.21 : 0.19;
  const maxVerticalFloors = hands ? 9 : 8;

  const anchored: Hold[] = LIMBS
    .filter((id) => id !== limb)
    .map((id) => holdById.get(state.limbs[id]))
    .filter((hold): hold is Hold => Boolean(hold));

  if (anchored.length !== 3) {
    return [];
  }

  const anchorCenter = centroid(anchored);

  const reachable = holds.filter((candidate) => {
    if (candidate.dead) {
      return false;
    }

    if (candidate.id === selectedHold.id) {
      return true;
    }

    if (LIMBS.some((other) => other !== limb && state.limbs[other] === candidate.id)) {
      return false;
    }

    if (hands && candidate.load === 'foot') {
      return false;
    }

    if (!hands && candidate.load === 'hand') {
      return false;
    }

    const anchorDist = distance(anchorCenter, candidate);
    const hopDist = distance(selectedHold, candidate);
    if (anchorDist > maxReach || hopDist > maxReach + 0.06) {
      return false;
    }

    const floorDelta = Math.abs(candidate.floor - selectedHold.floor);
    if (floorDelta > maxVerticalFloors) {
      return false;
    }

    if (candidate.zone !== selectedHold.zone && floorDelta > 5) {
      return false;
    }

    return true;
  });

  const sorted = reachable.sort((a, b) => {
    const scoreA = distance(a, aimPoint) + holdRankBias(a) * 0.02;
    const scoreB = distance(b, aimPoint) + holdRankBias(b) * 0.02;
    return scoreA - scoreB;
  });

  return sorted.slice(0, 20);
}

function holdRankBias(hold: Hold): number {
  if (hold.grip === 'good') {
    return -1;
  }
  if (hold.grip === 'fair') {
    return 0;
  }
  return 1;
}

function refreshDerivedState(): void {
  const limbHolds = LIMBS
    .map((limb) => holdById.get(state.limbs[limb]))
    .filter((hold): hold is Hold => Boolean(hold));

  const avgY = limbHolds.reduce((sum, hold) => sum + hold.y, 0) / limbHolds.length;
  const maxY = limbHolds.reduce((max, hold) => Math.max(max, hold.y), 0);
  const progressY = (maxY * 0.62) + (avgY * 0.38);

  state.floor = clamp(Math.round(progressY * (TOTAL_FLOORS - 1)) + 1, 1, TOTAL_FLOORS);
  state.zone = zoneForFloor(state.floor);

  state.posture = evaluatePosture(limbHolds);

  const avgStamina = LIMBS.reduce((sum, limb) => sum + state.stamina[limb], 0) / LIMBS.length;
  if (avgStamina > 60) {
    state.staminaState = 'fresh';
  } else if (avgStamina > 30) {
    state.staminaState = 'tired';
  } else {
    state.staminaState = 'critical';
  }
}

function evaluatePosture(limbHolds: Hold[]): Posture {
  if (limbHolds.length < 4) {
    return 'precarious';
  }

  const center = centroid(limbHolds);
  const minX = Math.min(...limbHolds.map((hold) => hold.x));
  const maxX = Math.max(...limbHolds.map((hold) => hold.x));
  const minY = Math.min(...limbHolds.map((hold) => hold.y));
  const maxY = Math.max(...limbHolds.map((hold) => hold.y));
  const spreadX = maxX - minX;
  const spreadY = maxY - minY;

  const maxDistance = Math.max(...limbHolds.map((hold) => distance(hold, center)));
  if (maxDistance > 0.27 || spreadY > 0.31) {
    return 'overextended';
  }

  if (spreadX < 0.12 || spreadY < 0.05) {
    return 'precarious';
  }

  const centerInside = center.x > minX + 0.025 && center.x < maxX - 0.025 && center.y > minY + 0.015 && center.y < maxY - 0.015;
  if (!centerInside) {
    return 'precarious';
  }

  return 'stable';
}

function compilePrompt(reason: RenderPromptReason): string {
  const limbSummary = LIMBS.map((limb) => {
    const hold = holdById.get(state.limbs[limb]);
    if (!hold) {
      return `${LIMB_LABEL[limb]} searching`;
    }
    return `${LIMB_LABEL[limb]} on ${describeHold(hold)} near floor ${hold.floor}`;
  }).join(', ');

  const selectedHold = holdById.get(state.limbs[state.selectedLimb]);
  const activeLimbLine = selectedHold
    ? `Active limb: ${LIMB_LABEL[state.selectedLimb]}, aiming from floor ${selectedHold.floor}.`
    : `Active limb: ${LIMB_LABEL[state.selectedLimb]}.`;

  const postureLine = postureDescription(state.posture, state.staminaState);
  const zoneLine = zoneDescription(state.zone);
  const cameraLine = `Camera orbit ${state.camera.orbit.toFixed(1)} degrees, elevation ${state.camera.elevation.toFixed(1)} degrees, zoom ${state.camera.zoom.toFixed(2)}.`;
  const eventLine = reasonDescription(reason);
  const windLine = windDescription(state.zone, state.staminaState);
  const atmosphere = `${state.atmosphere.light}, ${state.atmosphere.weather}, ${state.atmosphere.haze}.`;

  return [
    'Photorealistic cinematic third-person drone footage of a single free-solo climber on the exterior of Salesforce Tower, San Francisco.',
    'Keep the same climber appearance and wardrobe continuity throughout the run.',
    `Outfit: ${state.atmosphere.outfit}.`,
    `Current position: floor ${state.floor} of 61 in the ${state.zone} zone.`,
    zoneLine,
    `Limb placements: ${limbSummary}.`,
    activeLimbLine,
    postureLine,
    windLine,
    `Atmosphere: ${atmosphere}`,
    cameraLine,
    eventLine,
    'No HUD text, no subtitles, no overlays; only cinematic world footage.',
  ].join(' ');
}

function reasonDescription(reason: RenderPromptReason): string {
  if (reason === 'start') {
    return 'Scene starts at street-level base camp, climber looks upward before first move.';
  }
  if (reason === 'placement') {
    return 'The climber commits one deliberate limb placement while three limbs stay anchored.';
  }
  if (reason === 'rest') {
    return 'The climber presses into the wall in a compact rest posture, deep breathing visible.';
  }
  if (reason === 'camera') {
    return 'Camera smoothly adjusts perspective while preserving climbing continuity.';
  }
  if (reason === 'pause') {
    return 'Momentary stillness; climber maintains hold without advancing.';
  }
  if (reason === 'resume') {
    return 'Climb resumes with subtle body motion and continuous environmental continuity.';
  }
  if (reason === 'summit') {
    return 'Cinematic summit orbit around the climber at the crown with sweeping Bay Area panorama.';
  }
  return 'The climber loses grip and falls past the facade; brief follow shot then fade to black.';
}

function describeHold(hold: Hold): string {
  if (hold.type === 'fin') {
    return 'white aluminum fin edge';
  }
  if (hold.type === 'frame') {
    return 'window frame edge';
  }
  if (hold.type === 'bracket') {
    return 'sunshade bracket';
  }
  if (hold.type === 'seam') {
    return 'narrow facade seam';
  }
  if (hold.type === 'lattice') {
    return 'crown lattice steel beam';
  }
  if (hold.type === 'corner') {
    return 'curved glass corner';
  }
  return 'flat glass panel';
}

function postureDescription(posture: Posture, staminaState: StaminaState): string {
  const staminaCue =
    staminaState === 'fresh'
      ? 'steady breathing and smooth motion'
      : staminaState === 'tired'
        ? 'labored breathing with slight limb tremor'
        : 'critical exhaustion with visible shaking and strained grip';

  if (posture === 'stable') {
    return `Posture is stable and compact, center of gravity balanced; ${staminaCue}.`;
  }

  if (posture === 'precarious') {
    return `Posture is precarious, body twisted away from wall; ${staminaCue}.`;
  }

  return `Posture is overextended, one limb near maximum reach and visibly straining; ${staminaCue}.`;
}

function zoneDescription(zone: Zone): string {
  if (zone === 'lower') {
    return 'Lower tower fin grid is dense and regular; city streets and transit center still feel close below.';
  }
  if (zone === 'taper') {
    return 'Taper zone geometry narrows with curved glass corners and wider hold spacing; Bay Bridge emerges in the distance.';
  }
  return 'Crown zone exposes open lattice steel with sparse irregular beams and full skyline drop beneath.';
}

function windDescription(zone: Zone, staminaState: StaminaState): string {
  if (zone === 'lower') {
    return 'Wind is light; urban ambient motion remains grounded near street level.';
  }
  if (zone === 'taper') {
    return staminaState === 'critical'
      ? 'Medium gusts push clothing and pull the climber off-axis.'
      : 'Moderate wind brushes clothing as fog hangs below portions of the city.';
  }
  return 'Strong multidirectional wind roars around open crown beams; atmosphere is exposed and high-altitude.';
}

function queuePrompt(prompt: string, force = false): void {
  if (!client || !streamActive || state.phase === 'MENU' || state.phase === 'CONNECTING') {
    return;
  }

  pendingPrompt = prompt;

  if (force) {
    void flushPromptQueue(true);
    return;
  }

  schedulePromptFlush();
}

function schedulePromptFlush(): void {
  if (promptTimer !== null) {
    return;
  }

  const now = performance.now();
  const delay = Math.max(0, PROMPT_MIN_INTERVAL_MS - (now - lastInteractMs));
  promptTimer = window.setTimeout(() => {
    promptTimer = null;
    void flushPromptQueue();
  }, delay);
}

async function flushPromptQueue(force = false): Promise<void> {
  if (!client || !streamActive || interacting || !pendingPrompt) {
    return;
  }

  const now = performance.now();
  if (!force && now - lastInteractMs < PROMPT_MIN_INTERVAL_MS) {
    schedulePromptFlush();
    return;
  }

  const prompt = pendingPrompt;
  pendingPrompt = null;
  interacting = true;

  try {
    await client.interact({ prompt });
    lastInteractMs = performance.now();
  } catch (error) {
    showToast(`Interact failed: ${(error as Error).message}`);
  } finally {
    interacting = false;
    if (pendingPrompt) {
      schedulePromptFlush();
    }
  }
}

function stopPromptQueue(): void {
  pendingPrompt = null;
  interacting = false;
  if (promptTimer !== null) {
    clearTimeout(promptTimer);
    promptTimer = null;
  }
}

function maybeRunTutorial(): void {
  if (localStorage.getItem(TUTORIAL_SEEN_KEY) === '1') {
    return;
  }

  state.tutorialQueue = [
    'Press 1-4 to select limbs. Move one limb at a time.',
    'In Precision mode, mouse aims and left-click commits.',
    'Compact stances recover faster. Overextension drains stamina quickly.',
    'Space (or Q in WASD mode) rests only in stable posture.',
    'Esc pauses. R restarts the run from street level.',
  ];

  state.tutorialRunning = true;
  runTutorialStep();
  localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
}

function runTutorialStep(): void {
  if (!state.tutorialRunning) {
    return;
  }

  const next = state.tutorialQueue.shift();
  if (!next) {
    state.tutorialRunning = false;
    return;
  }

  showToast(next, 3200);
  window.setTimeout(() => {
    runTutorialStep();
  }, 3400);
}

function updateVideoFlowState(nowMs: number): void {
  const stream = video.srcObject;
  if (!(stream instanceof MediaStream) || !streamActive) {
    videoHasFrames = false;
    lastObservedVideoTime = 0;
    lastVideoProgressMs = 0;
    return;
  }

  if (!stream.getVideoTracks().length) {
    videoHasFrames = false;
    return;
  }

  const currentTime = video.currentTime;
  const dimensionsReady = video.videoWidth > 0 && video.videoHeight > 0;
  const decodable = video.readyState >= 2;

  if (currentTime > lastObservedVideoTime + 0.01) {
    lastObservedVideoTime = currentTime;
    lastVideoProgressMs = nowMs;
    if (dimensionsReady && decodable) {
      videoHasFrames = true;
    }
  }

  if (currentTime > 0.05 && dimensionsReady && decodable) {
    videoHasFrames = true;
    if (lastVideoProgressMs === 0) {
      lastVideoProgressMs = nowMs;
    }
  }

  if (lastVideoProgressMs > 0 && nowMs - lastVideoProgressMs > 3500) {
    videoHasFrames = false;
  }
}

function setStageState(title: string, body: string): void {
  stageStateTitle.textContent = title;
  stageStateBody.textContent = body;
  stageState.classList.remove('hidden');
}

function updateStageStateUI(nowMs: number): void {
  updateVideoFlowState(nowMs);

  if (state.phase === 'CONNECTING') {
    setStageState('Connecting To Odyssey', 'Creating a real-time WebRTC session. This can take a few seconds.');
    video.classList.add('idle');
    return;
  }

  if (!connected) {
    setStageState('Odyssey Disconnected', 'Enter your API key and connect to open a live rendering session.');
    video.classList.add('idle');
    return;
  }

  if (!streamActive) {
    setStageState('Connection Ready', 'Press Start Climb to request Odyssey world-model visuals.');
    video.classList.add('idle');
    return;
  }

  if (!videoHasFrames) {
    const recoveryHint = streamRecoveryAttempted
      ? 'If this persists, press Restart (R) or reconnect.'
      : 'Waiting for the first rendered frames from Odyssey.';
    setStageState('Warming Up Visual Stream', recoveryHint);
    video.classList.add('idle');
    return;
  }

  stageState.classList.add('hidden');
  video.classList.remove('idle');
}

function render(): void {
  updateStageStateUI(performance.now());
  drawHoldOverlay();

  const elapsed = state.runStartedAt > 0 ? TIME_LIMIT_MS - state.timerMs : 0;
  const timerValue = state.phase === 'MENU' ? formatTime(TIME_LIMIT_MS) : formatTime(state.timerMs);
  timerDisplay.textContent = timerValue;
  floorDisplay.textContent = `F${state.floor}`;

  timerDisplay.classList.toggle('urgent', state.phase === 'CLIMBING' && state.timerMs <= 2 * 60 * 1000);

  const postureClass = state.staminaState === 'critical' ? 'critical' : state.posture;
  stabilityDisplay.className = postureClass;
  stabilityDisplay.textContent = postureLabel();

  statusLine.textContent = state.statusLine;

  for (const limb of LIMBS) {
    limbTagMap[limb].classList.toggle('active', state.selectedLimb === limb);
  }

  if (state.phase === 'MENU') {
    statusLine.textContent = connected
      ? 'Connected. Start a climb to begin.'
      : 'Disconnected. Connect to Odyssey to begin.';
  }

  if (state.phase === 'SUMMIT') {
    statusLine.textContent = `Summit reached in ${formatTime(elapsed)}.`;
  }

  updateControlsState();
}

function postureLabel(): string {
  if (state.staminaState === 'critical') {
    return 'Critical';
  }
  if (state.posture === 'stable') {
    return state.restRemainingMs > 0 ? 'Resting' : 'Stable';
  }
  if (state.posture === 'precarious') {
    return 'Precarious';
  }
  return 'Overextended';
}

function drawHoldOverlay(): void {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (!isVisualPhase()) {
    return;
  }

  const alpha = clamp(parseFloat(overlayOpacityInput.value || '0.45'), 0.05, 0.95);

  const reachableSet = new Set(state.reachable);
  for (const holdId of state.reachable) {
    const hold = holdById.get(holdId);
    if (!hold) {
      continue;
    }

    const { x, y } = toCanvas(hold);
    const radius = hold.grip === 'good' ? 7 : hold.grip === 'fair' ? 6 : 5;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = hold.grip === 'good'
      ? `rgba(113, 214, 168, ${alpha})`
      : hold.grip === 'fair'
        ? `rgba(126, 201, 255, ${alpha})`
        : `rgba(255, 187, 148, ${alpha})`;
    ctx.fill();
  }

  if (state.targetHoldId) {
    const target = holdById.get(state.targetHoldId);
    if (target) {
      const { x, y } = toCanvas(target);
      const isReachable = reachableSet.has(target.id);
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.strokeStyle = isReachable
        ? 'rgba(255, 225, 197, 0.95)'
        : target.dead
          ? 'rgba(255, 111, 74, 0.94)'
          : 'rgba(255, 160, 119, 0.94)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  for (const limb of LIMBS) {
    const hold = holdById.get(state.limbs[limb]);
    if (!hold) {
      continue;
    }

    const { x, y } = toCanvas(hold);
    ctx.beginPath();
    ctx.arc(x, y, limb === state.selectedLimb ? 5.5 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = limb === state.selectedLimb ? '#f7b272' : 'rgba(221, 240, 255, 0.86)';
    ctx.fill();
  }

  if (state.mode === 'precision' && isRunActive()) {
    const cursor = toCanvas(aimPoint);
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 248, 255, 0.85)';
    ctx.fill();
  }
}

function resizeCanvas(): void {
  drawHoldOverlay();
}

function showOverlay(title: string, body: string, actions: OverlayAction[]): void {
  overlayTitle.textContent = title;
  overlayBody.textContent = body;
  overlayActions.innerHTML = '';

  for (const action of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = action.kind === 'main' ? 'btn-main' : 'btn-sub';
    button.textContent = action.label;
    button.addEventListener('click', action.onClick);
    overlayActions.appendChild(button);
  }

  overlay.classList.remove('hidden');
}

function clearOverlay(): void {
  overlay.classList.add('hidden');
  overlayActions.innerHTML = '';
}

function showToast(message: string, durationMs = 2400): void {
  toast.textContent = message;
  toast.classList.add('visible');

  if (toastTimer !== null) {
    clearTimeout(toastTimer);
  }

  toastTimer = window.setTimeout(() => {
    toast.classList.remove('visible');
    toastTimer = null;
  }, durationMs);
}

function setHudVisible(visible: boolean): void {
  hud.classList.toggle('hidden', !visible);
}

function updateConnectionStatus(text: string): void {
  connectionStatus.textContent = text;
}

function updateControlsState(): void {
  connectBtn.disabled = connected;
  disconnectBtn.disabled = !connected;
  apiKeyInput.disabled = connected;
  startRunBtn.disabled = !connected || state.phase === 'CONNECTING' || state.phase === 'CLIMBING' || state.phase === 'PAUSED';
  restartBtn.disabled = !connected || (state.phase !== 'CLIMBING' && state.phase !== 'PAUSED' && state.phase !== 'FALLING' && state.phase !== 'SUMMIT');
  pauseBtn.disabled = !(state.phase === 'CLIMBING' || state.phase === 'PAUSED');
}

function renderLeaderboard(): void {
  leaderboardList.innerHTML = '';
  if (!leaderboard.length) {
    const empty = document.createElement('li');
    empty.className = 'leaderboard-empty';
    empty.textContent = 'No summit times yet.';
    leaderboardList.appendChild(empty);
    return;
  }

  leaderboard.forEach((entry, index) => {
    const item = document.createElement('li');
    const rank = document.createElement('strong');
    rank.textContent = `${index + 1}. ${entry.name}`;

    const time = document.createElement('span');
    time.textContent = formatTime(entry.timeMs);

    item.append(rank, time);
    leaderboardList.appendChild(item);
  });
}

function loadLeaderboard(): LeaderboardEntry[] {
  const raw = localStorage.getItem(LEADERBOARD_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry): entry is LeaderboardEntry => {
        if (typeof entry !== 'object' || entry === null) {
          return false;
        }
        const record = entry as Partial<LeaderboardEntry>;
        return typeof record.name === 'string' && typeof record.timeMs === 'number' && typeof record.timestamp === 'number';
      })
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, 100);
  } catch {
    return [];
  }
}

function createHoldMap(): Hold[] {
  const mapped: Hold[] = [];
  let counter = 0;

  const push = (
    x: number,
    floor: number,
    options: {
      type: HoldType;
      grip: GripQuality;
      dead?: boolean;
      load?: 'any' | 'hand' | 'foot';
      slipperiness?: number;
    },
  ): void => {
    const zone = zoneForFloor(floor);
    const y = floorToY(floor);

    mapped.push({
      id: `h-${counter += 1}`,
      x: clamp(x, 0.04, 0.96),
      y,
      floor,
      zone,
      dead: options.dead ?? false,
      load: options.load ?? 'any',
      type: options.type,
      grip: options.grip,
      slipperiness: options.slipperiness ?? 0,
    });
  };

  for (let floor = 1; floor <= TOTAL_FLOORS; floor += 1) {
    const zone = zoneForFloor(floor);

    if (zone === 'lower') {
      const offset = Math.sin(floor * 0.45) * 0.008;
      const xs = [0.24, 0.34, 0.46, 0.56, 0.68, 0.78];
      for (let i = 0; i < xs.length; i += 1) {
        const x = xs[i] + offset;
        const cycle = i % 4;
        if (cycle === 0) {
          push(x, floor, { type: 'fin', grip: 'good' });
        } else if (cycle === 1) {
          push(x, floor, { type: 'frame', grip: 'fair' });
        } else if (cycle === 2) {
          push(x, floor, { type: 'bracket', grip: 'good' });
        } else {
          push(x, floor, { type: 'seam', grip: 'poor', load: 'hand' });
        }
      }

      push(0.14, floor, { type: 'glass', grip: 'poor', dead: true, slipperiness: 0.5 });
      push(0.88, floor, { type: 'glass', grip: 'poor', dead: true, slipperiness: 0.5 });
      continue;
    }

    if (zone === 'taper') {
      const t = (floor - 27) / (50 - 27);
      const halfWidth = lerp(0.29, 0.2, t);
      const center = 0.5 + (Math.sin(floor * 0.33) * 0.012);
      const xs = [center - halfWidth, center - halfWidth * 0.35, center + halfWidth * 0.22, center + halfWidth];

      for (let i = 0; i < xs.length; i += 1) {
        const x = xs[i];
        if (i === 0 || i === xs.length - 1) {
          push(x, floor, { type: 'frame', grip: 'fair', slipperiness: 0.1 });
        } else if (i === 1) {
          push(x, floor, { type: 'fin', grip: 'good' });
        } else {
          push(x, floor, { type: 'seam', grip: 'poor', load: 'hand', slipperiness: 0.2 });
        }
      }

      if (floor % 2 === 0) {
        push(center, floor, { type: 'bracket', grip: 'good', load: 'foot' });
      }

      push(center - (halfWidth + 0.06), floor, { type: 'corner', grip: 'poor', dead: true, slipperiness: 0.8 });
      push(center + (halfWidth + 0.06), floor, { type: 'corner', grip: 'poor', dead: true, slipperiness: 0.8 });
      continue;
    }

    const crownPulse = Math.sin(floor * 0.62) * 0.028;
    const crownXs = [0.31 + crownPulse, 0.5, 0.69 - crownPulse];

    for (let i = 0; i < crownXs.length; i += 1) {
      const x = crownXs[i];
      if (i === 1) {
        push(x, floor, { type: 'lattice', grip: 'good' });
      } else {
        push(x, floor, { type: 'lattice', grip: 'fair' });
      }
    }

    if (floor % 2 === 1) {
      push(0.43, floor, { type: 'lattice', grip: 'good', load: 'hand' });
      push(0.57, floor, { type: 'lattice', grip: 'good', load: 'foot' });
    }

    push(0.2, floor, { type: 'glass', grip: 'poor', dead: true, slipperiness: 0.7 });
    push(0.8, floor, { type: 'glass', grip: 'poor', dead: true, slipperiness: 0.7 });
  }

  return mapped;
}

function findBaseHolds(): Record<LimbId, string> {
  const floorOneTwo = holds.filter((hold) => hold.floor <= 2 && !hold.dead);

  const pick = (predicate: (hold: Hold) => boolean, fallbackIndex: number): string => {
    const found = floorOneTwo.find(predicate);
    if (found) {
      return found.id;
    }
    return floorOneTwo[fallbackIndex]?.id ?? holds[0].id;
  };

  return {
    lh: pick((hold) => hold.floor === 2 && hold.x < 0.49 && hold.load !== 'foot', 0),
    rh: pick((hold) => hold.floor === 2 && hold.x > 0.51 && hold.load !== 'foot', 1),
    lf: pick((hold) => hold.floor === 1 && hold.x < 0.5 && hold.load !== 'hand', 2),
    rf: pick((hold) => hold.floor === 1 && hold.x > 0.5 && hold.load !== 'hand', 3),
  };
}

function isRunActive(): boolean {
  return state.phase === 'CLIMBING';
}

function isVisualPhase(): boolean {
  return state.phase !== 'MENU' && state.phase !== 'CONNECTING';
}

function toPoint(event: MouseEvent): Point {
  const rect = canvas.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const y = clamp(1 - ((event.clientY - rect.top) / rect.height), 0, 1);
  return { x, y };
}

function toCanvas(point: Point): Point {
  return {
    x: point.x * canvas.clientWidth,
    y: (1 - point.y) * canvas.clientHeight,
  };
}

function centroid(points: Point[]): Point {
  const sum = points.reduce((acc, point) => {
    return { x: acc.x + point.x, y: acc.y + point.y };
  }, { x: 0, y: 0 });

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}

function formatTime(ms: number): string {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function floorToY(floor: number): number {
  return clamp((floor - 1) / (TOTAL_FLOORS - 1), 0, 1);
}

function zoneForFloor(floor: number): Zone {
  if (floor <= 26) {
    return 'lower';
  }
  if (floor <= 50) {
    return 'taper';
  }
  return 'crown';
}

function pickAtmosphere(): RunAtmosphere {
  const palette: RunAtmosphere[] = [
    {
      light: 'clear late-afternoon light',
      weather: 'dry wind over downtown San Francisco',
      haze: 'mild marine haze toward the bay',
      outfit: 'graphite shell jacket, slate climbing pants, amber chalk bag',
    },
    {
      light: 'cool bright midday light',
      weather: 'crisp air with gusts around the taper zone',
      haze: 'soft fog bank in distant neighborhoods',
      outfit: 'charcoal technical top, matte black pants, rust chalk bag',
    },
    {
      light: 'golden-hour sidelight',
      weather: 'warmer updrafts against the facade',
      haze: 'thin fog layer below the high floors',
      outfit: 'dark navy wind shell, basalt pants, burnt-orange chalk bag',
    },
  ];

  const index = Math.floor(Math.random() * palette.length);
  return palette[index];
}

function createRunId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function capitalize(value: string): string {
  return value.length ? value[0].toUpperCase() + value.slice(1) : value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

// Keep TypeScript from tree-shaking the loop in dev HMR updates.
void rafId;
