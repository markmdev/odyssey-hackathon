'use client';

import { useState, useCallback } from 'react';
import type { Room, QuizQuestion, GradeLevel } from '@/lib/types';
import { templates } from '@/lib/templates';
import { generatePalace, generateAllImages } from '@/lib/api-client';
import { generateQuizQuestions } from '@/lib/quiz';
import HomeScreen from './HomeScreen';
import GeneratingScreen, { type GenPhase } from './GeneratingScreen';
import PalaceViewer from './PalaceViewer';
import QuizScreen from './QuizScreen';
import ResultsScreen from './ResultsScreen';

type Screen = 'home' | 'generating' | 'palace' | 'quiz' | 'results';

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

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

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

      // Phase 3: Odyssey batch simulate — runs in background after all images ready
      const { Odyssey } = await import('@odysseyml/odyssey');
      const apiKey = process.env.NEXT_PUBLIC_ODYSSEY_API_KEY;

      if (apiKey) {
        setVideosLoading(true);
        const client = new Odyssey({ apiKey });

        const job = await client.simulate({
          scripts: newRooms.map((room, i) =>
            room.odysseyKeyframes.map((kf, ki) => {
              if (ki === 0) {
                return { timestamp_ms: kf.timestamp_ms, start: { prompt: kf.prompt!, image: imageDataUrls[i] } };
              }
              if (kf.end) {
                return { timestamp_ms: kf.timestamp_ms, end: {} };
              }
              return { timestamp_ms: kf.timestamp_ms, interact: { prompt: kf.prompt! } };
            })
          ),
          portrait: false,
        });

        // Poll in background — update rooms as videos arrive
        let status = await client.getSimulateStatus(job.job_id);

        while (!['completed', 'failed', 'cancelled'].includes(status.status)) {
          await new Promise((r) => setTimeout(r, 3000));
          status = await client.getSimulateStatus(job.job_id);

          // Eagerly update any streams that have video_url already
          if (status.streams) {
            let updated = false;
            for (const stream of status.streams) {
              if (stream.video_url && !newRooms[stream.script_index].videoUrl) {
                newRooms[stream.script_index].videoUrl = stream.video_url;
                updated = true;
              }
            }
            if (updated) setRooms([...newRooms]);
          }
        }

        // Final update when completed
        if (status.status === 'completed') {
          for (const stream of status.streams) {
            if (stream.video_url) {
              newRooms[stream.script_index].videoUrl = stream.video_url;
            }
          }
          setRooms([...newRooms]);
        }

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

  // Navigate between rooms
  const navigateRoom = useCallback(
    (direction: 1 | -1) => {
      const nextIndex = currentRoom + direction;
      if (nextIndex < 0) return;

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

      setCurrentRoom(nextIndex);
    },
    [currentRoom, rooms],
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
    <div className="h-screen overflow-hidden">
      {screen === 'home' && (
        <HomeScreen
          templates={templates}
          inputText={inputText}
          gradeLevel={gradeLevel}
          onInputChange={setInputText}
          onGradeChange={setGradeLevel}
          onBuild={buildPalace}
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
