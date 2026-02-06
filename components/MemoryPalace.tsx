'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Room, QuizQuestion, GradeLevel } from '@/lib/types';
import { templates } from '@/lib/templates';
import { generatePalace, generateAllImages } from '@/lib/api-client';
import { generateQuizQuestions } from '@/lib/quiz';
import { listScenarios, loadScenario } from '@/lib/scenarios';
import { imageToBlob } from '@/lib/image-utils';
import HomeScreen from './HomeScreen';
import GeneratingScreen, { type GenPhase } from './GeneratingScreen';
import PalaceViewer from './PalaceViewer';
import QuizScreen from './QuizScreen';
import ResultsScreen from './ResultsScreen';

type Screen = 'home' | 'generating' | 'palace' | 'quiz' | 'results';
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed';
type StreamStatus = 'idle' | 'starting' | 'streaming' | 'ending';

export default function MemoryPalace() {
  const [screen, setScreen] = useState<Screen>('home');

  // Input state
  const [inputText, setInputText] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('4-6');

  // Palace state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState(0);

  // Generating state
  const [genPhase, setGenPhase] = useState<GenPhase>('designing');
  const [imagesReady, setImagesReady] = useState(0);
  const [videosLoading, setVideosLoading] = useState(false);

  // Scenario state
  const [scenarios, setScenarios] = useState<{ name: string; displayName: string }[]>([]);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  // Interactive streaming state (prepared scenarios only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const odysseyClientRef = useRef<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
  const streamStatusRef = useRef<StreamStatus>('idle');
  const [interactiveStream, setInteractiveStream] = useState<MediaStream | null>(null);

  const isLiveMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('live');

  useEffect(() => {
    listScenarios().then(setScenarios);
  }, []);

  // Keep streamStatusRef in sync
  useEffect(() => {
    streamStatusRef.current = streamStatus;
  }, [streamStatus]);

  // Cleanup: disconnect on unmount + beforeunload
  useEffect(() => {
    const handleUnload = () => {
      odysseyClientRef.current?.disconnect();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      odysseyClientRef.current?.disconnect();
    };
  }, []);

  const connectOdyssey = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_ODYSSEY_API_KEY;
    if (!apiKey) {
      setConnectionStatus('failed');
      return;
    }
    try {
      setConnectionStatus('connecting');
      const { Odyssey } = await import('@odysseyml/odyssey');
      const client = new Odyssey({ apiKey });
      const stream = await client.connect({
        onStreamStarted: () => {
          setStreamStatus('streaming');
          streamStatusRef.current = 'streaming';
        },
        onStreamEnded: () => {
          setStreamStatus('idle');
          streamStatusRef.current = 'idle';
        },
        onInteractAcknowledged: () => {},
        onStreamError: (reason, message) => {
          console.error('Stream error:', reason, message);
          setStreamStatus('idle');
          streamStatusRef.current = 'idle';
        },
        onError: (err, fatal) => {
          console.error('Odyssey error:', err, fatal);
          if (fatal) setConnectionStatus('failed');
        },
        onDisconnected: () => {
          setConnectionStatus('idle');
          setInteractiveStream(null);
        },
      });
      odysseyClientRef.current = client;
      setInteractiveStream(stream);
      setConnectionStatus('connected');
    } catch (err) {
      console.error('Odyssey connect failed:', err);
      setConnectionStatus('failed');
    }
  }, []);

  const startStreamForRoom = useCallback(async (roomIndex: number) => {
    const client = odysseyClientRef.current;
    if (!client || connectionStatus !== 'connected') return;
    const room = rooms[roomIndex];
    if (!room?.imageDataUrl) return;
    try {
      setStreamStatus('starting');
      streamStatusRef.current = 'starting';
      const blob = await imageToBlob(room.imageDataUrl);
      await client.startStream({
        prompt: room.odysseyKeyframes[0]?.prompt ?? room.sceneDescription,
        image: blob,
        portrait: false,
      });
      // streamStatus set to 'streaming' by onStreamStarted handler
    } catch (err) {
      console.error('startStream failed:', err);
      setStreamStatus('idle');
      streamStatusRef.current = 'idle';
    }
  }, [connectionStatus, rooms]);

  const handleInteract = useCallback(async (prompt: string) => {
    const client = odysseyClientRef.current;
    if (!client || streamStatusRef.current !== 'streaming') return;
    try {
      await client.interact({ prompt });
    } catch (err) {
      console.error('Interact failed:', err);
    }
  }, []);

  const disconnectOdyssey = useCallback(() => {
    const client = odysseyClientRef.current;
    if (!client) return;
    client.disconnect();
    odysseyClientRef.current = null;
    setConnectionStatus('idle');
    setStreamStatus('idle');
    streamStatusRef.current = 'idle';
    setInteractiveStream(null);
  }, []);

  // Build palace pipeline
  const buildPalace = useCallback(async () => {
    setScreen('generating');
    setImagesReady(0);

    try {
      // Phase 1: GPT designs rooms
      setGenPhase('designing');
      const newRooms = await generatePalace(inputText, gradeLevel);
      setRooms(newRooms);

      // Phase 2: Gemini paints all rooms IN PARALLEL
      // Enter palace as soon as FIRST image arrives
      setGenPhase('painting');
      setVideosLoading(true);
      let enteredPalace = false;

      const imageDataUrls = await generateAllImages(newRooms, (i, dataUrl) => {
        newRooms[i].imageDataUrl = dataUrl;
        setRooms([...newRooms]);
        setImagesReady((prev) => prev + 1);

        // Enter palace on first image
        if (!enteredPalace) {
          enteredPalace = true;
          setCurrentRoom(0);
          setScreen('palace');
        }
      });

      // If no images succeeded at all, bail
      if (!enteredPalace) {
        setVideosLoading(false);
        setScreen('home');
        return;
      }

      // Phase 3: Odyssey — fire individual simulate per room, poll independently
      const { Odyssey } = await import('@odysseyml/odyssey');
      const apiKey = process.env.NEXT_PUBLIC_ODYSSEY_API_KEY;

      if (apiKey) {
        const client = new Odyssey({ apiKey });

        // Fire simulate calls in parallel — only for rooms that have images
        const simulatePromises = newRooms.map(async (room, i) => {
          if (!imageDataUrls[i]) return; // skip rooms with failed images

          try {
            const script = room.odysseyKeyframes.map((kf, ki) => {
              if (ki === 0) {
                return { timestamp_ms: kf.timestamp_ms, start: { prompt: kf.prompt!, image: imageDataUrls[i]! } };
              }
              if (kf.end) {
                return { timestamp_ms: kf.timestamp_ms, end: {} };
              }
              return { timestamp_ms: kf.timestamp_ms, interact: { prompt: kf.prompt! } };
            });

            const job = await client.simulate({ script, portrait: false });

            // Poll this room's job independently
            let status = await client.getSimulateStatus(job.job_id);
            while (!['completed', 'failed', 'cancelled'].includes(status.status)) {
              await new Promise((r) => setTimeout(r, 3000));
              status = await client.getSimulateStatus(job.job_id);
            }

            if (status.status === 'completed' && status.streams?.[0]?.video_url) {
              newRooms[i].videoUrl = status.streams[0].video_url;
              setRooms([...newRooms]);
            }
          } catch (err) {
            console.error(`Simulate failed for room ${i}:`, err);
          }
        });

        // Wait for all to finish, then clear loading
        Promise.all(simulatePromises).then(() => setVideosLoading(false));
      } else {
        setVideosLoading(false);
      }
    } catch (err) {
      console.error('Palace generation failed:', err);
      setVideosLoading(false);
      // If we have rooms + images, stay in palace (might already be there)
      if (rooms.length > 0 && rooms[0].imageDataUrl) {
        setCurrentRoom(0);
        setScreen('palace');
      } else {
        setScreen('home');
      }
    }
  }, [inputText, gradeLevel, rooms]);

  // Load a pre-generated scenario with fake loading simulation
  const loadPreparedScenario = useCallback(async (scenarioName: string) => {
    setScreen('generating');
    setImagesReady(0);

    // Pre-connect: start WebRTC connection while fake loading plays
    connectOdyssey();

    try {
      // Fake Phase 1: "Designing rooms..." (1.5s)
      setGenPhase('designing');
      await new Promise((r) => setTimeout(r, 1500));

      // Load the actual data
      const { rooms: loadedRooms, quizQuestions: loadedQuiz } = await loadScenario(scenarioName);
      setRooms(loadedRooms);

      // Fake Phase 2: "Painting rooms..." — reveal images one by one (300ms each)
      setGenPhase('painting');
      for (let i = 0; i < loadedRooms.length; i++) {
        await new Promise((r) => setTimeout(r, 300));
        setImagesReady(i + 1);
      }

      // Brief pause before entering palace
      await new Promise((r) => setTimeout(r, 500));

      // Store quiz questions from manifest
      setQuizQuestions(loadedQuiz);

      // Enter palace immediately with videos
      setRooms(loadedRooms);
      setCurrentRoom(0);
      setVideosLoading(false);
      setScreen('palace');
    } catch (err) {
      console.error('Failed to load scenario:', err);
      setScreen('home');
    }
  }, []);

  // Navigate between rooms
  const navigateRoom = useCallback(
    async (direction: 1 | -1) => {
      const nextIndex = currentRoom + direction;
      if (nextIndex < 0) return;

      // End active stream — fire and forget (next video plays for 10s,
      // plenty of time for endStream to complete before next startStream)
      const client = odysseyClientRef.current;
      if (client && streamStatusRef.current === 'streaming') {
        setStreamStatus('idle');
        streamStatusRef.current = 'idle';
        client.endStream().catch(() => {});
      }

      if (nextIndex >= rooms.length) {
        // Disconnect when leaving palace for quiz
        disconnectOdyssey();
        const questions = quizQuestions.length > 0 ? quizQuestions : generateQuizQuestions(rooms);
        setQuizQuestions(questions);
        setQuizIndex(0);
        setScore(0);
        setAnswers([]);
        setScreen('quiz');
        return;
      }

      setCurrentRoom(nextIndex);
    },
    [currentRoom, rooms, quizQuestions, disconnectOdyssey],
  );

  // Handle quiz answer
  const handleAnswer = useCallback(
    (choiceIndex: number) => {
      const q = quizQuestions[quizIndex];
      const correct = choiceIndex === q.correctIndex;
      const newAnswers = [...answers, correct];
      const newScore = correct ? score + 1 : score;
      setAnswers(newAnswers);
      setScore(newScore);

      setTimeout(() => {
        if (quizIndex + 1 >= quizQuestions.length) {
          setScreen('results');
        } else {
          setQuizIndex(quizIndex + 1);
        }
      }, 1000);
    },
    [quizQuestions, quizIndex, answers, score],
  );

  return (
    <div className="h-dvh overflow-hidden">
      {screen === 'home' && (
        <HomeScreen
          templates={templates}
          scenarios={scenarios}
          isLiveMode={isLiveMode}
          inputText={inputText}
          gradeLevel={gradeLevel}
          onInputChange={setInputText}
          onGradeChange={setGradeLevel}
          onBuild={buildPalace}
          onSelectScenario={loadPreparedScenario}
        />
      )}

      {screen === 'generating' && (
        <GeneratingScreen
          phase={genPhase}
          rooms={rooms}
          imagesReady={imagesReady}
          totalRooms={rooms.length}
        />
      )}

      {screen === 'palace' && rooms[currentRoom] && (
        <PalaceViewer
          room={rooms[currentRoom]}
          roomIndex={currentRoom}
          totalRooms={rooms.length}
          onNavigate={navigateRoom}
          isLastRoom={currentRoom === rooms.length - 1}
          isFirstRoom={currentRoom === 0}
          videosLoading={videosLoading}
          interactiveStream={interactiveStream}
          streamStatus={streamStatus}
          connectionStatus={connectionStatus}
          onInteract={handleInteract}
          onVideoEnded={() => startStreamForRoom(currentRoom)}
        />
      )}

      {screen === 'quiz' && quizQuestions[quizIndex] && (
        <QuizScreen
          question={quizQuestions[quizIndex]}
          questionIndex={quizIndex}
          totalQuestions={quizQuestions.length}
          onAnswer={handleAnswer}
          lastAnswer={answers.length > 0 ? answers[answers.length - 1] : null}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          score={score}
          total={quizQuestions.length}
          questions={quizQuestions}
          rooms={rooms}
          answers={answers}
          onRetry={buildPalace}
          onNewChallenge={() => setScreen('home')}
        />
      )}
    </div>
  );
}
