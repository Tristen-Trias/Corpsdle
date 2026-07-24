import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameService, MAX_GUESSES } from './services/game';
import { FieldHint } from './models/show';

const THEME_STORAGE_KEY = 'corpsdle-theme';
const HOW_TO_PLAY_SEEN_KEY = 'corpsdle-how-to-play-seen';

const TAGLINES = [
  "Its pronounced 'Cor-dle.'",
  'Box five guesses only.',
  'General effect: guessing.',
  'No pa! They aren\'t booing!',
  'And this thing is - a Super Saiyan',
  'THeY\'Re alWaYs REaDY!1!',
];

type Theme = 'dark' | 'light';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly game = inject(GameService);
  protected readonly maxGuesses = MAX_GUESSES;

  protected readonly guessInput = signal('');
  protected readonly suggestionsOpen = signal(false);
  protected readonly theme = signal<Theme>(this.loadInitialTheme());
  protected readonly howToPlayOpen = signal(false);
  protected readonly infoOpen = signal(false);
  protected readonly tagline = signal(TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);

  protected readonly suggestions = computed(() => this.game.suggestionsFor(this.guessInput()));

  constructor() {
    this.applyTheme(this.theme());

    if (!localStorage.getItem(HOW_TO_PLAY_SEEN_KEY)) {
      this.howToPlayOpen.set(true);
      localStorage.setItem(HOW_TO_PLAY_SEEN_KEY, 'true');
    }
  }

  private loadInitialTheme(): Theme {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleTheme(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.applyTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  }

  openHowToPlay(): void {
    this.howToPlayOpen.set(true);
  }

  closeHowToPlay(): void {
    this.howToPlayOpen.set(false);
  }

  openInfo(): void {
    this.infoOpen.set(true);
  }

  closeInfo(): void {
    this.infoOpen.set(false);
  }

  onInputChange(value: string): void {
    this.guessInput.set(value);
    this.suggestionsOpen.set(value.trim().length > 0);
    this.game.guessError.set(null);
  }

  pickSuggestion(title: string): void {
    this.guessInput.set(title);
    this.suggestionsOpen.set(false);
    this.submit();
  }

  submit(): void {
    const value = this.guessInput();
    if (!value.trim()) return;
    this.game.submitGuess(value);
    this.guessInput.set('');
    this.suggestionsOpen.set(false);
  }

  onBlur(): void {
    // slight delay so a suggestion click registers before the list closes
    setTimeout(() => this.suggestionsOpen.set(false), 120);
  }

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
