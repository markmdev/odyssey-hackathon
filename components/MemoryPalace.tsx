'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Room, QuizQuestion } from '@/lib/types';
import { challenges } from '@/lib/challenges';
import { generatePalace, generateRoomImage, type RoomImage } from '@/lib/api-client';
import { generateQuizQuestions } from '@/lib/quiz';
import ChallengeMenu from './ChallengeMenu';
import GeneratingScreen from './GeneratingScreen';
import PalaceViewer from './PalaceViewer';
import QuizScreen from './QuizScreen';
import ResultsScreen from './ResultsScreen';

type Screen = 'menu' | 'generating' | 'palace' | 'quiz' | 'results';

export default function MemoryPalace() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedId, setSelectedId] = useState(challenges[0].id);

  // Palace state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState(0);
  const [genStatus, setGenStatus] = useState('');
  const [genProgress, setGenProgress] = useState(0);

  // Odyssey state
  const odysseyRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [odysseyReady, setOdysseyReady] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [palaceStatus, setPalaceStatus] = useState('');

  // Image cache: roomIndex -> { dataUrl, blob }
  const imageCache = useRef<Map<number, RoomImage>>(new Map());
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  // Cleanup Odyssey on unmount / page close
  useEffect(() => {
    const handleUnload = () => odysseyRef.current?.disconnect();
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      odysseyRef.current?.disconnect();
    };
  }, []);

  // Connect to Odyssey (called during palace generation)
  const connectOdyssey = useCallback(async () => {
    if (odysseyRef.current) return; // already connected

    const apiKey = process.env.NEXT_PUBLIC_ODYSSEY_API_KEY;
    if (!apiKey) {
      setPalaceStatus('Missing NEXT_PUBLIC_ODYSSEY_API_KEY');
      return;
    }

    const { Odyssey } = await import('@odysseyml/odyssey');

    const MAX_RETRIES = 5;
    const RETRY_MS = 3000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const client = new Odyssey({ apiKey });
        const stream = await client.connect({
          onStreamStarted: () => setIsStreaming(true),
          onStreamEnded: () => setIsStreaming(false),
          onStreamError: (reason: string, msg: string) =>
            setPalaceStatus(`Stream error: ${reason} — ${msg}`),
          onError: (err: Error) => setPalaceStatus(`Error: ${err.message}`),
          onDisconnected: () => {
            setOdysseyReady(false);
            odysseyRef.current = null;
          },
        });

        odysseyRef.current = client;
        setOdysseyReady(true);

        // Attach stream to video when it mounts
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        return;
      } catch (err) {
        const msg = (err as Error).message;
        if (msg.includes('concurrent sessions') && attempt < MAX_RETRIES) {
          setPalaceStatus(`Session clearing... retry ${attempt}/${MAX_RETRIES}`);
          await new Promise((r) => setTimeout(r, RETRY_MS));
          continue;
        }
        setPalaceStatus(`Odyssey connection failed: ${msg}`);
        return;
      }
    }
  }, []);

  // Attach mediaStream to video element when both are available
  useEffect(() => {
    if (videoRef.current && odysseyRef.current?.mediaStream) {
      videoRef.current.srcObject = odysseyRef.current.mediaStream;
    }
  }, [screen, odysseyReady]);

  // Prefetch next room's image in background
  const prefetchImage = useCallback(
    (roomList: Room[], index: number) => {
      if (index >= roomList.length || imageCache.current.has(index)) return;
      generateRoomImage(roomList[index].sceneDescription)
        .then((img) => imageCache.current.set(index, img))
        .catch(() => {});
    },
    [],
  );

  // Show a specific room
  const showRoom = useCallback(
    async (index: number, roomList: Room[]) => {
      const room = roomList[index];
      setCurrentRoom(index);
      setPalaceStatus('Generating room image...');
      setCurrentImageUrl(null);

      // Get or generate image
      let img = imageCache.current.get(index);
      if (!img) {
        try {
          img = await generateRoomImage(room.sceneDescription);
          imageCache.current.set(index, img);
        } catch (err) {
          setPalaceStatus(`Image failed: ${(err as Error).message}`);
          return;
        }
      }

      setCurrentImageUrl(img.dataUrl);
      setPalaceStatus('Starting animation...');

      // Start Odyssey stream with the image
      if (odysseyRef.current) {
        try {
          await odysseyRef.current.startStream({
            prompt: room.odysseyPrompt,
            image: img.blob,
            portrait: false,
          });
          setPalaceStatus('');
        } catch (err) {
          setPalaceStatus('Animation unavailable — viewing static image');
        }
      } else {
        setPalaceStatus('');
      }

      // Prefetch next
      prefetchImage(roomList, index + 1);
    },
    [prefetchImage],
  );

  // Begin a challenge
  const beginChallenge = useCallback(async () => {
    const challenge = challenges.find((c) => c.id === selectedId)!;
    setScreen('generating');
    setGenStatus('Designing your memory palace...');
    setGenProgress(0.1);
    imageCache.current.clear();

    try {
      // Start Odyssey connection in parallel with palace generation
      const odysseyPromise = connectOdyssey();

      // Generate palace rooms
      const newRooms = await generatePalace(challenge);
      setRooms(newRooms);
      setGenProgress(0.5);

      // Generate first room image
      setGenStatus('Painting the first room...');
      const firstImage = await generateRoomImage(newRooms[0].sceneDescription);
      imageCache.current.set(0, firstImage);
      setGenProgress(0.8);

      // Wait for Odyssey (don't block if it fails)
      setGenStatus('Connecting to Odyssey...');
      await odysseyPromise;
      setGenProgress(1);

      // Enter palace
      setCurrentRoom(0);
      setCurrentImageUrl(firstImage.dataUrl);
      setScreen('palace');

      // Start stream for first room (after render so video element exists)
      setTimeout(async () => {
        if (odysseyRef.current && videoRef.current) {
          videoRef.current.srcObject = odysseyRef.current.mediaStream;
          try {
            await odysseyRef.current.startStream({
              prompt: newRooms[0].odysseyPrompt,
              image: firstImage.blob,
              portrait: false,
            });
            setPalaceStatus('');
          } catch {
            setPalaceStatus('Animation unavailable — viewing static image');
          }
        }
        // Prefetch room 1
        prefetchImage(newRooms, 1);
      }, 100);
    } catch (err) {
      setGenStatus(`Error: ${(err as Error).message}`);
    }
  }, [selectedId, connectOdyssey, showRoom, prefetchImage]);

  // Navigate between rooms
  const navigateRoom = useCallback(
    async (direction: 1 | -1) => {
      const nextIndex = currentRoom + direction;
      if (nextIndex < 0) return;

      // End current stream
      if (odysseyRef.current) {
        try {
          await odysseyRef.current.endStream();
        } catch {}
      }

      if (nextIndex >= rooms.length) {
        // Start quiz
        const questions = generateQuizQuestions(rooms);
        setQuizQuestions(questions);
        setQuizIndex(0);
        setScore(0);
        setAnswers([]);
        setScreen('quiz');
        return;
      }

      await showRoom(nextIndex, rooms);
    },
    [currentRoom, rooms, showRoom],
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

      // Auto-advance after delay
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

  // Retry same challenge
  const handleRetry = useCallback(() => {
    beginChallenge();
  }, [beginChallenge]);

  // Go back to menu
  const handleNewChallenge = useCallback(async () => {
    if (odysseyRef.current) {
      try {
        await odysseyRef.current.endStream();
      } catch {}
      odysseyRef.current.disconnect();
      odysseyRef.current = null;
      setOdysseyReady(false);
    }
    setScreen('menu');
  }, []);

  return (
    <div className="h-screen overflow-hidden">
      {screen === 'menu' && (
        <ChallengeMenu
          challenges={challenges}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onBegin={beginChallenge}
        />
      )}

      {screen === 'generating' && (
        <GeneratingScreen status={genStatus} progress={genProgress} />
      )}

      {screen === 'palace' && (
        <PalaceViewer
          room={rooms[currentRoom]}
          roomIndex={currentRoom}
          totalRooms={rooms.length}
          imageUrl={currentImageUrl}
          isStreaming={isStreaming}
          status={palaceStatus}
          videoRef={videoRef}
          onNavigate={navigateRoom}
          isLastRoom={currentRoom === rooms.length - 1}
          isFirstRoom={currentRoom === 0}
        />
      )}

      {screen === 'quiz' && (
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
          onRetry={handleRetry}
          onNewChallenge={handleNewChallenge}
        />
      )}
    </div>
  );
}
