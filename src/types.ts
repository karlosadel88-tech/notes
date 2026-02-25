export type Tool = 'pen' | 'eraser' | 'tape' | 'lasso' | 'select' | 'highlighter';
export type TapeColor = 'yellow' | 'beige' | 'gray' | 'blue' | 'green';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingLine {
  id: string;
  points: number[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser' | 'highlighter';
  opacity?: number;
}

export interface TapeStrip {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: TapeColor;
  opacity: number;
  isRevealed: boolean;
  isLocked: boolean;
}

export interface NotePage {
  id: string;
  title: string;
  lines: DrawingLine[];
  tapes: TapeStrip[];
  background: 'white' | 'dark' | 'paper' | 'grid' | 'dots';
  backgroundImage?: string;
  orientation: 'portrait' | 'landscape';
}

export interface Notebook {
  id: string;
  title: string;
  pages: NotePage[];
  tags: string[];
  isFavorite: boolean;
}
