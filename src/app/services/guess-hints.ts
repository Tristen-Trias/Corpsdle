import { FieldHint, GuessResult, Show } from '../models/show';

const YEAR_CLOSE = 3;
const SCORE_CLOSE = 1.0;
const PLACEMENT_CLOSE = 2;

export function buildGuessResult(show: Show, answer: Show): GuessResult {
  return {
    show,
    corpsHint: show.corps === answer.corps ? 'match' : 'far',
    yearHint: compareNumeric(show.year, answer.year, YEAR_CLOSE),
    scoreHint: compareNumeric(show.score, answer.score, SCORE_CLOSE),
    placementHint: comparePlace(show.placement, answer.placement, PLACEMENT_CLOSE),
    isWinningGuess: show.title === answer.title,
  };
}

function compareNumeric(guessVal: number, answerVal: number, closeThreshold: number): FieldHint {
  if (guessVal === answerVal) return 'match';
  const diff = answerVal - guessVal;
  const isClose = Math.abs(diff) <= closeThreshold;
  if (diff > 0) return isClose ? 'close-higher' : 'higher';
  return isClose ? 'close-lower' : 'lower';
}

function comparePlace(guess: number, answer: number, closeThreshold: number): FieldHint {
  if (guess === answer) return 'match';
  const diff = answer - guess;
  const isClose = Math.abs(diff) <= closeThreshold;
  if (diff > 0) return isClose ? 'close-lower' : 'lower';
  return isClose ? 'close-higher' : 'higher';
}
