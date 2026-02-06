# @odysseyml/odyssey SDK

**Version:** 1.0.0
**Package:** `@odysseyml/odyssey`
**Sources:** node_modules type definitions + official website docs (`.meridian/api-docs/odyssey/`)

## Overview

TypeScript/JavaScript client for Odyssey's audio-visual intelligence platform. Provides real-time interactive video generation via WebRTC streaming, plus async simulation (batch video generation).

Two entry points:
- `@odysseyml/odyssey` — core `Odyssey` class (vanilla JS/TS)
- `@odysseyml/odyssey/react` — `useOdyssey` hook (React)

## Requirements

- **Node.js:** >=18.0.0
- **Browser:** Chrome/Edge 90+, Firefox 88+, Safari 14.1+ (WebRTC required)
- **Peer deps (optional):** `react ^18.0.0`, `ws ^8.14.0` (Node.js WebSocket)

## Authentication

```typescript
const client = new Odyssey({ apiKey: 'ody_your_api_key_here' });
```

Single config option: `apiKey: string` (required). The SDK exchanges this for an auth token internally.

## Core Lifecycle

```
new Odyssey() → connect() → startStream() → interact() → endStream() → disconnect()
```

### connect(handlers?): Promise<MediaStream>

Establishes WebRTC connection. Returns `MediaStream` when video + data channel are ready. Idempotent — safe in React strict mode double-mount.

Supports two usage patterns:
- **Await style**: `const stream = await client.connect()` — sequential, Promise-based
- **Callback style**: `client.connect({ onConnected: (stream) => {...} })` — event-driven

No artificial delay needed between `connect()` and `startStream()`.

```typescript
const stream = await client.connect({
  onConnected: (stream) => { /* video ready */ },
  onStreamStarted: (streamId) => { /* stream started, streamId for recordings */ },
  onInteractAcknowledged: (prompt) => { /* interaction processed */ },
  onStreamError: (reason, message) => { /* stream failed */ },
  onError: (error, fatal) => { /* general error */ },
  onStatusChange: (status, message?) => { /* status transition */ },
});
```

### disconnect(): void

Tears down WebRTC connection and cleans up all resources.

### startStream(options?): Promise<string>

Starts an interactive stream session. Returns stream ID (used for recordings).

| Option | Type | Default | Description |
|---|---|---|---|
| `prompt` | `string` | `''` | Initial prompt to generate video content |
| `portrait` | `boolean` | `true` | `true` = portrait (704x1280), `false` = landscape (1280x704) |
| `image` | `File \| Blob` | — | Optional image for image-to-video generation |

**Image-to-video requirements:**
- Max size: 25MB
- Supported formats: JPEG, PNG, WebP, GIF, BMP, HEIC, HEIF, AVIF
- Images are resized to target resolution automatically

```typescript
// Text-to-video
const streamId = await client.startStream({ prompt: 'A cat sleeping on a couch' });

// Image-to-video
const streamId = await client.startStream({
  prompt: 'A robot dancing',
  image: fileOrBlob,
  portrait: false,  // landscape 1280x704
});
```

### interact(options): Promise<string>

Sends a prompt to modify the running video. Resolves with the acknowledged prompt.

```typescript
const ack = await client.interact({ prompt: 'The cat wakes up and stretches' });
```

### endStream(): Promise<void>

Ends the current stream session.

### attachToVideo(element): HTMLVideoElement | null

Convenience method to attach the media stream to a `<video>` element.

```typescript
client.attachToVideo(document.querySelector('video'));
```

## Properties

| Property | Type | Description |
|---|---|---|
| `isConnected` | `boolean` | Connected and ready |
| `currentStatus` | `ConnectionStatus` | Current status |
| `currentSessionId` | `string \| null` | Active session ID |
| `mediaStream` | `MediaStream \| null` | Video stream |
| `connectionState` | `RTCPeerConnectionState \| null` | WebRTC state |
| `iceConnectionState` | `RTCIceConnectionState \| null` | ICE connection state |

### ConnectionStatus

`'authenticating' | 'connecting' | 'reconnecting' | 'connected' | 'disconnected' | 'failed'`

## Event Handlers (OdysseyEventHandlers)

| Handler | Signature | When |
|---|---|---|
| `onConnected` | `(stream: MediaStream) => void` | Video stream established |
| `onDisconnected` | `() => void` | Video stream closed |
| `onStreamStarted` | `(streamId: string) => void` | Interactive stream ready |
| `onStreamEnded` | `() => void` | Interactive stream ended |
| `onInteractAcknowledged` | `(prompt: string) => void` | Interaction processed |
| `onStreamError` | `(reason: string, message: string) => void` | Stream failed (e.g., model crash) |
| `onError` | `(error: Error, fatal: boolean) => void` | General error |
| `onStatusChange` | `(status: ConnectionStatus, message?: string) => void` | Status transition |

**Fatal vs non-fatal errors:** When `fatal: true`, the connection cannot continue — return user to connect page. When `fatal: false`, the error is recoverable.

## Recordings API

Recording and listing methods can be called without an active connection — they only require a valid API key.

### getRecording(streamId): Promise<Recording>

Returns presigned URLs (valid ~1 hour) for a stream's artifacts.

```typescript
const recording = await client.getRecording('stream-123');
// recording.video_url    — full recording (MP4)
// recording.events_url   — events log (JSONL)
// recording.thumbnail_url — thumbnail (JPEG)
// recording.preview_url  — preview video (MP4)
// recording.frame_count, .duration_seconds
```

### listStreamRecordings(options?): Promise<StreamRecordingsListResponse>

Paginated list of the user's stream recordings, newest first. Default limit: 50, max: 100.

```typescript
const result = await client.listStreamRecordings({ limit: 20, offset: 0 });
// result.recordings[].stream_id, .width, .height, .started_at, .ended_at, .duration_seconds
// result.total, .limit, .offset
```

## Simulate API (Async Batch Video Generation)

Simulate methods can be called without an active connection — they only require a valid API key.

### simulate(options): Promise<SimulateResult>

Submit a scripted video generation job. Runs asynchronously on the server.

```typescript
// Single script
const job = await client.simulate({
  script: [
    { timestamp_ms: 0, start: { prompt: 'A cat sleeping' } },
    { timestamp_ms: 5000, interact: { prompt: 'The cat wakes up' } },
    { timestamp_ms: 10000, end: {} },
  ],
  portrait: true,
});
// job.job_id, .status, .priority, .created_at, .estimated_wait_minutes

// Image-to-video (File/Blob or base64 data URL string)
const job2 = await client.simulate({
  script: [
    { timestamp_ms: 0, start: { prompt: 'Robot dancing', image: imageFile } },
    { timestamp_ms: 10000, end: {} },
  ],
});

// Batch mode: multiple scripts in one job
const batchJob = await client.simulate({
  scripts: [script1, script2, script3],
});

// URL to hosted script JSON
const urlJob = await client.simulate({ script_url: 'https://...' });
```

**Script event types:**
- `start` — begins generation (prompt required, image optional as File/Blob/base64 string)
- `interact` — changes the scene mid-stream (prompt required)
- `end` — stops the stream (empty object)

### getSimulateStatus(jobId): Promise<SimulateStatus>

Poll for job completion.

```typescript
const status = await client.getSimulateStatus(job.job_id);
// status.status: 'pending' | 'dispatched' | 'processing' | 'completed' | 'failed' | 'cancelled'
// status.streams[].video_url, .events_url, .thumbnail_url, .preview_url
// status.streams[].frame_count, .duration_seconds, .script_index
```

**Polling pattern:**
```typescript
async function waitForCompletion(client: Odyssey, jobId: string) {
  while (true) {
    const status = await client.getSimulateStatus(jobId);
    if (status.status === 'completed') return status;
    if (status.status === 'failed') throw new Error(status.error_message ?? 'Simulation failed');
    if (status.status === 'cancelled') throw new Error('Simulation cancelled');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
```

### listSimulations(options?): Promise<SimulationsList>

```typescript
const list = await client.listSimulations({
  status: 'completed',   // filter by status
  active: true,          // only pending/dispatched/processing
  limit: 20,             // default 20, max 100
  offset: 0,
});
// list.jobs[].job_id, .status, .priority, .created_at, .completed_at, .error_message
// list.total, .limit, .offset
```

### cancelSimulation(jobId): Promise<{ job_id, status }>

Cancel a pending or dispatched job. Cannot cancel already-processing jobs.

## React Hook

```typescript
import { useOdyssey } from '@odysseyml/odyssey/react';
```

### useOdyssey(options: UseOdysseyOptions): OdysseyClient

Wraps the `Odyssey` class with React state management. Returns an `OdysseyClient` with all the same methods plus reactive state:

```typescript
const odyssey = useOdyssey({
  apiKey: 'ody_...',
  handlers: {
    onConnected: (stream) => {},
    onStreamStarted: (streamId) => {},
    onInteractAcknowledged: (prompt) => {},
    onStreamError: (reason, message) => {},
    onError: (error, fatal) => {},
    // Note: onStatusChange is managed by hook internally, not exposed in handlers
  },
});

// Reactive state
odyssey.status;       // ConnectionStatus
odyssey.error;        // string | null
odyssey.isConnected;  // boolean
odyssey.mediaStream;  // MediaStream | null
odyssey.sessionId;    // string | null

// Methods (same as Odyssey class)
odyssey.connect();
odyssey.disconnect();
odyssey.startStream(options?);
odyssey.interact(options);
odyssey.endStream();
odyssey.attachToVideo(element);
odyssey.getRecording(streamId);
odyssey.listStreamRecordings(options?);
odyssey.simulate(options);
odyssey.getSimulateStatus(jobId);
odyssey.listSimulations(options?);
odyssey.cancelSimulation(jobId);
```

Always call `connect()` inside a `useEffect`. Use `isConnected` to disable UI until ready.

## Exported Types

From `@odysseyml/odyssey`:
- `Odyssey` (class)
- `ClientConfig`
- `ConnectionStatus`
- `OdysseyEventHandlers`
- `Recording`
- `StreamRecordingSummary`
- `StreamRecordingsListResponse`
- `ListStreamRecordingsOptions`

From `@odysseyml/odyssey/react`:
- `useOdyssey` (function)
- `UseOdysseyOptions`
- `UseOdysseyHandlers`
- `OdysseyClient`

Plus re-exports of all recording/simulation types.

## Common Error Messages

| Error | Cause |
|---|---|
| `Odyssey: config object is required...` | Constructor called without config |
| `Odyssey: apiKey is required and must be a string...` | Missing or non-string API key |
| `Odyssey: apiKey cannot be empty...` | Empty string API key |
| `Invalid API key` | Invalid API key (401) |
| `Invalid API key format...` | Malformed key (422) |
| `API key access denied` | Valid key but access denied (403, e.g., suspended) |
| `Maximum concurrent sessions (N) reached` | Concurrent session quota exceeded (429) |
| `No available sessions` | No streamers available |
| `Streamer not available` | Assigned streamer not responding |
| `Streamer disconnected` | Streamer disconnected mid-session |
| `Timed out waiting for a streamer` | Queue timeout expired |

## Gotchas

- `connect()` is idempotent — duplicate calls during React strict mode are safe
- `startStream` image accepts `File | Blob`; `simulate` also accepts base64 data URL strings
- Presigned recording URLs expire after ~1 hour
- `cancelSimulation` only works on pending/dispatched jobs, not processing ones
- `portrait: true` = 704x1280, `portrait: false` = 1280x704 (resolution may vary by model)
- The React hook manages `onStatusChange` internally — don't pass it in `handlers`
- Simulate, recording, and listing methods work without an active WebRTC connection
