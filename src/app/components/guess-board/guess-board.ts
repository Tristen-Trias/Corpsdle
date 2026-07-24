import { Component, input } from '@angular/core';
import { FieldHint, GuessResult } from '../../models/show';

@Component({
  selector: 'app-guess-board',
  standalone: true,
  templateUrl: './guess-board.html',
})
export class GuessBoard {
  readonly guesses = input.required<GuessResult[]>();

  hintClass(hint: FieldHint | 'match' | 'far'): string {
    switch (hint) {
      case 'match':
        return 'cell-match';
      case 'close-higher':
      case 'close-lower':
        return 'cell-close';
      case 'higher':
      case 'lower':
      case 'far':
        return 'cell-far';
      default:
        return '';
    }
  }

  hintArrow(hint: FieldHint): string {
    switch (hint) {
      case 'higher':
      case 'close-higher':
        return '↑';
      case 'lower':
      case 'close-lower':
        return '↓';
      default:
        return '';
    }
  }
}
