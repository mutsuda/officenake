
export interface Point {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
  segments: Point[];
  angle: number;
  speed: number;
  isDead: boolean;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  type: 'coffee' | 'donut' | 'stapler' | 'laptop';
  value: number;
}

export interface GameState {
  players: Record<string, Player>;
  foods: Food[];
  worldWidth: number;
  worldHeight: number;
  status: 'lobby' | 'playing' | 'gameover';
}

export type NetworkMessage =
  | { type: 'STATE_UPDATE'; state: GameState }
  | { type: 'INPUT_UPDATE'; angle: number }
  | { type: 'JOIN_REQUEST'; name: string; color: string }
  | { type: 'CHAT_MESSAGE'; sender: string; text: string }
  | { type: 'AI_COMMENT'; text: string };
