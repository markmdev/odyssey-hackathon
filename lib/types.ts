export type GradeLevel = 'K-3' | '4-6' | '7-9' | '10-12';

export interface OdysseyKeyframe {
  timestamp_ms: number;
  prompt?: string;
  end?: boolean;
}

export interface Room {
  index: number;
  name: string;
  itemToRemember: string;
  mnemonic: string;
  sceneDescription: string;
  odysseyKeyframes: OdysseyKeyframe[];
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
