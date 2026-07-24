import { Component, input, output } from '@angular/core';
import { MAX_GUESSES } from '../../services/game';

@Component({
  selector: 'app-how-to-play-modal',
  standalone: true,
  templateUrl: './how-to-play-modal.html',
  styleUrl: './how-to-play-modal.css',
})
export class HowToPlayModal {
  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  protected readonly maxGuesses = MAX_GUESSES;
}
