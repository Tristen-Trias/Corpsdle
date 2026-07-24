export interface Show {
  title: string;
  corps: string;
  year: number;
  score: number;
  placement: number;
}

/** Direction hints: 'higher'/'lower' point toward where the true answer sits relative to the guess. */
export type FieldHint = 'match' | 'higher' | 'lower' | 'close-higher' | 'close-lower';

export interface GuessResult {
  show: Show;
  corpsHint: 'match' | 'far';
  yearHint: FieldHint;
  scoreHint: FieldHint;
  placementHint: FieldHint;
  isWinningGuess: boolean;
}
