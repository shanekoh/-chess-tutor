export type MoveClassification =
  | 'brilliant'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | null;

export interface PositionEval {
  cp: number;      // centipawns, white-positive; ±9999 for mate
  mate?: number;   // >0 white mates in N, <0 black mates in N
  bestMove: string; // UCI e.g. "e2e4"
  line: string[];  // first ~5 UCI moves of principal variation
}

export interface MoveResult {
  san: string;
  from: string;
  to: string;
  color: 'w' | 'b';
  fenBefore: string;
  fenAfter: string;
  evalBefore: PositionEval | null;
  evalAfter: PositionEval | null;
  classification: MoveClassification;
  cpLoss: number; // centipawn loss from moving player's POV
}

export interface ChessGame {
  url: string;
  pgn: string;
  time_control: string;
  time_class: string;
  end_time: number;
  white: { username: string; rating: number; result: string };
  black: { username: string; rating: number; result: string };
}

export interface ArchiveEntry {
  label: string;   // e.g. "April 2026"
  url: string;     // e.g. "https://api.chess.com/pub/player/Shane-Koh/games/2026/04"
  year: number;
  month: number;
}
