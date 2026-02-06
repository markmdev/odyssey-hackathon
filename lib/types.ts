export type GradeLevel = 'K-3' | '4-6' | '7-9' | '10-12';

export interface Room {
  index: number;
  name: string;
  itemToRemember: string;
  mnemonic: string;
  sceneDescription: string;
  odysseyPrompt: string;
  imageDataUrl?: string;
  videoUrl?: string;
}

export interface SubjectTemplate {
  id: string;
  name: string;
  icon: string;
  placeholder: string;
}

export interface QuizQuestion {
  roomIndex: number;
  question: string;
  options: string[];
  correctIndex: number;
}
