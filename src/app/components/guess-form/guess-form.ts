import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Show } from '../../models/show';

@Component({
  selector: 'app-guess-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './guess-form.html',
  styleUrl: './guess-form.css',
})
export class GuessForm {
  readonly guessInput = input.required<string>();
  readonly suggestionsOpen = input.required<boolean>();
  readonly suggestions = input.required<Show[]>();
  readonly guessError = input.required<string | null>();
  readonly guessesRemaining = input.required<number>();

  readonly inputChange = output<string>();
  readonly blurred = output<void>();
  readonly submitted = output<void>();
  readonly suggestionPicked = output<string>();
}
