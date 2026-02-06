import { Odyssey } from '@odysseyml/odyssey';

const video = document.getElementById('video') as HTMLVideoElement;
const status = document.getElementById('status') as HTMLElement;
const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
const promptInput = document.getElementById('prompt') as HTMLInputElement;
const interactInput = document.getElementById('interact') as HTMLInputElement;
const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement;
const disconnectBtn = document.getElementById('disconnectBtn') as HTMLButtonElement;
const orientBtn = document.getElementById('orientBtn') as HTMLButtonElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const endBtn = document.getElementById('endBtn') as HTMLButtonElement;
const interactBtn = document.getElementById('interactBtn') as HTMLButtonElement;

apiKeyInput.value = import.meta.env.VITE_ODYSSEY_API_KEY ?? '';

let client: Odyssey | null = null;
let portrait = true;

orientBtn.addEventListener('click', () => {
  portrait = !portrait;
  orientBtn.textContent = portrait ? 'Portrait' : 'Landscape';
});

function setStatus(msg: string) {
  status.textContent = msg;
}

function setConnectedUI(connected: boolean) {
  connectBtn.disabled = connected;
  apiKeyInput.disabled = connected;
  disconnectBtn.disabled = !connected;
  orientBtn.disabled = !connected;
  startBtn.disabled = !connected;
  endBtn.disabled = !connected;
  interactBtn.disabled = !connected;
}

connectBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    setStatus('Enter an API key first');
    return;
  }

  client = new Odyssey({ apiKey });
  setStatus('Connecting...');
  connectBtn.disabled = true;

  try {
    const stream = await client.connect({
      onStatusChange: (s, msg) => setStatus(msg ?? s),
      onStreamStarted: (id) => setStatus(`Stream started (${id.slice(0, 8)}...)`),
      onStreamEnded: () => setStatus('Stream ended'),
      onInteractAcknowledged: (prompt) => setStatus(`Ack: "${prompt}"`),
      onStreamError: (reason, msg) => setStatus(`Stream error: ${reason} — ${msg}`),
      onError: (err, fatal) => {
        setStatus(`${fatal ? 'Fatal' : 'Error'}: ${err.message}`);
        if (fatal) setConnectedUI(false);
      },
      onDisconnected: () => {
        setStatus('Disconnected');
        setConnectedUI(false);
      },
    });
    video.srcObject = stream;
    setConnectedUI(true);
    setStatus('Connected — enter a prompt and start a stream');
  } catch (err) {
    setStatus(`Connection failed: ${(err as Error).message}`);
    setConnectedUI(false);
  }
});

disconnectBtn.addEventListener('click', () => {
  client?.disconnect();
  video.srcObject = null;
  client = null;
  setConnectedUI(false);
  setStatus('Disconnected');
});

startBtn.addEventListener('click', async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    setStatus('Enter a prompt first');
    return;
  }
  setStatus('Starting stream...');
  startBtn.disabled = true;
  try {
    await client!.startStream({ prompt, portrait });
    promptInput.value = '';
  } catch (err) {
    setStatus(`Start failed: ${(err as Error).message}`);
  } finally {
    startBtn.disabled = false;
  }
});

endBtn.addEventListener('click', async () => {
  setStatus('Ending stream...');
  try {
    await client!.endStream();
  } catch (err) {
    setStatus(`End failed: ${(err as Error).message}`);
  }
});

interactBtn.addEventListener('click', async () => {
  const prompt = interactInput.value.trim();
  if (!prompt) return;
  interactBtn.disabled = true;
  try {
    await client!.interact({ prompt });
    interactInput.value = '';
  } catch (err) {
    setStatus(`Interact failed: ${(err as Error).message}`);
  } finally {
    interactBtn.disabled = false;
  }
});

// Clean up session on page close/refresh
window.addEventListener('beforeunload', () => {
  client?.disconnect();
});

// Submit on Enter
promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startBtn.click();
});
interactInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') interactBtn.click();
});
