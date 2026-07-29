import { Component, input, output } from '@angular/core';
import { MAX_GUESSES, GameStatus } from '../../services/game';
import { Show } from '../../models/show';

@Component({
  selector: 'app-result-banner',
  standalone: true,
  templateUrl: './result-banner.html',
  styleUrl: './result-banner.css',
})
export class ResultBanner {
  readonly status = input.required<GameStatus>();
  readonly isUnlimited = input.required<boolean>();
  readonly guessCount = input.required<number>();
  readonly answer = input.required<Show | null>();
  readonly shareCopied = input.required<boolean>();
  readonly shareText = input.required<string | null>();

  readonly nextShow = output<void>();
  readonly share = output<void>();

  protected readonly maxGuesses = MAX_GUESSES;
}
