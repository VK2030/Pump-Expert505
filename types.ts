
export type AppSection = 'home' | 'history' | 'profile' | 'tasks' | 'progress';

export interface ModuleData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  progress?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface QuizQuestion {
  id?: string;
  text: string;
  options: string[];
  correct: number[]; // Changed from number to number[]
}
