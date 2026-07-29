import { Component, computed, inject, signal } from '@angular/core';
import { GameService, MAX_GUESSES } from './services/game';
import { FieldHint } from './models/show';
import { Theme } from './models/theme';
import { Header } from './components/header/header';
import { HowToPlayModal } from './components/how-to-play-modal/how-to-play-modal';
import { InfoModal } from './components/info-modal/info-modal';
import { StatsModal } from './components/stats-modal/stats-modal';
import { ModeToggle } from './components/mode-toggle/mode-toggle';
import { GuessBoard } from './components/guess-board/guess-board';
import { ResultBanner } from './components/result-banner/result-banner';
import { GuessForm } from './components/guess-form/guess-form';

const THEME_STORAGE_KEY = 'corpsdle-theme';
const HOW_TO_PLAY_SEEN_KEY = 'corpsdle-how-to-play-seen';

const TAGLINES = [
  "Its pronounced 'Cor-dle.'",
  'Box five guesses only.',
  'General effect: guessing.',
  'No grandpa! They aren\'t booing!',
  'And this thing is - a Super Saiyan',
  'They\'re always ready!',
  'Alright drum corps, set up for a full run!',
  'Gush and go!',
  'Five minutes?? A whole Cadets free day!',
  'I · vii · I · vi · V'
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Header, HowToPlayModal, InfoModal, StatsModal, ModeToggle, GuessBoard, ResultBanner, GuessForm],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly game = inject(GameService);

  protected readonly guessInput = signal('');
  protected readonly suggestionsOpen = signal(false);
  protected readonly theme = signal<Theme>(this.loadInitialTheme());
  protected readonly howToPlayOpen = signal(false);
  protected readonly infoOpen = signal(false);
  protected readonly statsOpen = signal(false);
  protected readonly tagline = signal(TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);
  protected readonly shareCopied = signal(false);

  protected readonly suggestions = computed(() => this.game.suggestionsFor(this.guessInput()));

  protected readonly shareText = computed<string | null>(() => {
    const status = this.game.status();
    if (status !== 'won' && status !== 'lost') return null;

    const attempts = status === 'lost' ? 'X' : `${this.game.guesses().length}`;
    const lines = [`Corpsdle #${this.game.gameNumber} ${attempts}/${MAX_GUESSES}`];

    for (const g of this.game.guesses()) {
      const corps = g.corpsHint === 'match' ? '🟩' : '🟥';
      lines.push(corps + this.shareCell(g.yearHint) + this.shareCell(g.scoreHint) + this.shareCell(g.placementHint));
    }

    lines.push(`${location.origin}${location.pathname}`);

    return lines.join('\n');
  });

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

  openStats(): void {
    this.statsOpen.set(true);
  }

  closeStats(): void {
    this.statsOpen.set(false);
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

  shareResults(): void {
    const text = this.shareText();
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      this.shareCopied.set(true);
      setTimeout(() => this.shareCopied.set(false), 2000);
    });
  }

  private shareCell(hint: FieldHint): string {
    switch (hint) {
      case 'match':
        return '🟩';
      case 'close-higher':
      case 'close-lower':
        return '🟨';
      case 'higher':
      case 'lower':
        return '🟥';
    }
  }
}
