export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  items: string[];
  systemPrompt: string;
}

export interface Room {
  index: number;
  name: string;
  itemToRemember: string;
  mnemonic: string;
  sceneDescription: string;
  odysseyPrompt: string;
}

export interface QuizQuestion {
  roomIndex: number;
  question: string;
  options: string[];
  correctIndex: number;
}
