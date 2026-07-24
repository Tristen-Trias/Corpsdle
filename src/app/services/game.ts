import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FieldHint, GuessResult, Show } from '../models/show';

export const MAX_GUESSES = 6;
const YEAR_CLOSE = 3;
const SCORE_CLOSE = 1.0;
const PLACEMENT_CLOSE = 2;

/** The date Corpsdle's puzzle numbering starts counting from day 1. */
const LAUNCH_DATE_KEY = '2026-07-23';
const DAILY_STORAGE_PREFIX = 'corpsdle-daily-';

type LoadState = 'loading' | 'ready' | 'error';
type Mode = 'daily' | 'unlimited';
export type GameStatus = 'playing' | 'won' | 'lost';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);

  private readonly shows = signal<Show[]>([]);
  readonly loadState = signal<LoadState>('loading');
  readonly guessError = signal<string | null>(null);

  /** Deterministic "today" - same puzzle for a player until the calendar date changes at their local midnight. */
  private readonly todayKey = this.getLocalDateKey();

  readonly gameNumber = this.getGameNumber();

  private readonly mode = signal<Mode>('daily');
  readonly isUnlimited = computed(() => this.mode() === 'unlimited');

  private readonly dailyGuesses = signal<GuessResult[]>(this.loadDailyGuesses());
  private readonly unlimitedGuesses = signal<GuessResult[]>([]);
  private readonly unlimitedAnswer = signal<Show | null>(null);

  readonly guesses = computed(() => (this.isUnlimited() ? this.unlimitedGuesses() : this.dailyGuesses()));

  private readonly dailyAnswer = computed<Show | null>(() => {
    const pool = this.shows();
    if (pool.length === 0) return null;
    const index = this.hashToIndex(this.todayKey, pool.length);
    return pool[index];
  });

  readonly answer = computed<Show | null>(() => (this.isUnlimited() ? this.unlimitedAnswer() : this.dailyAnswer()));

  readonly status = computed<GameStatus>(() => {
    const list = this.guesses();
    if (list.some((g) => g.isWinningGuess)) return 'won';
    if (list.length >= MAX_GUESSES) return 'lost';
    return 'playing';
  });

  readonly guessesRemaining = computed(() => MAX_GUESSES - this.guesses().length);

  readonly titlePool = computed(() => this.shows().map((s) => s.title));

  constructor() {
    this.loadShows();
    effect(() => {
      localStorage.setItem(this.dailyStorageKey(), JSON.stringify(this.dailyGuesses()));
    });
  }

  private loadShows(): void {
    this.http.get<{ shows: Show[] }>('data/shows.json').subscribe({
      next: (data) => {
        this.shows.set(data.shows);
        this.loadState.set('ready');
      },
      error: () => this.loadState.set('error'),
    });
  }

  suggestionsFor(query: string): Show[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const guessedTitles = new Set(this.guesses().map((g) => g.show.title));
    const candidates = this.shows().filter((s) => !guessedTitles.has(s.title));
    const startsWith = candidates
      .filter((s) => s.title.toLowerCase().startsWith(q))
      .sort((a, b) => a.year - b.year);
    if (startsWith.length > 0) return startsWith.slice(0, 6);

    return candidates
      .filter((s) => s.title.toLowerCase().includes(q))
      .sort((a, b) => a.year - b.year)
      .slice(0, 6);
  }

  submitGuess(title: string): void {
    this.guessError.set(null);
    const answer = this.answer();
    if (!answer || this.status() !== 'playing') return;

    const trimmed = title.trim().toLowerCase();
    const show = this.shows().find((s) => s.title.toLowerCase() === trimmed);
    if (!show) {
      this.guessError.set("That's not a show in today's pool, pick one from the suggestions.");
      return;
    }
    if (this.guesses().some((g) => g.show.title === show.title)) {
      this.guessError.set('Already tried that one.');
      return;
    }

    const result: GuessResult = {
      show,
      corpsHint: show.corps === answer.corps ? 'match' : 'far',
      yearHint: this.compareNumeric(show.year, answer.year, YEAR_CLOSE),
      scoreHint: this.compareNumeric(show.score, answer.score, SCORE_CLOSE),
      placementHint: this.comparePlace(show.placement, answer.placement, PLACEMENT_CLOSE),
      isWinningGuess: show.title === answer.title,
    };

    if (this.isUnlimited()) {
      this.unlimitedGuesses.update((list) => [...list, result]);
    } else {
      this.dailyGuesses.update((list) => [...list, result]);
    }
  }

  toggleUnlimited(): void {
    if (this.isUnlimited()) {
      this.mode.set('daily');
      return;
    }
    this.mode.set('unlimited');
    this.startUnlimitedRound();
  }

  startUnlimitedRound(): void {
    const pool = this.shows();
    if (pool.length === 0) return;
    const index = Math.floor(Math.random() * pool.length);
    this.unlimitedAnswer.set(pool[index]);
    this.unlimitedGuesses.set([]);
    this.guessError.set(null);
  }

  private compareNumeric(guessVal: number, answerVal: number, closeThreshold: number): FieldHint {
    if (guessVal === answerVal) return 'match';
    const diff = answerVal - guessVal;
    const isClose = Math.abs(diff) <= closeThreshold;
    if (diff > 0) return isClose ? 'close-higher' : 'higher';
    return isClose ? 'close-lower' : 'lower';
  }

  private comparePlace(guess: number, answer: number, closeThreshold: number): FieldHint {
    if (guess === answer) return 'match';
    const diff = answer - guess;
    const isClose = Math.abs(diff) <= closeThreshold;
    if (diff > 0) return isClose ? 'close-lower' : 'lower';
    return isClose ? 'close-higher' : 'higher';
  }

  private getGameNumber(): number {
    const msPerDay = 1000 * 3600 * 24;
    const timeDifference = Date.parse(this.todayKey) - Date.parse(LAUNCH_DATE_KEY);
    const dayDifference = timeDifference / msPerDay;

    return Math.round(dayDifference) + 1;
  }

  private dailyStorageKey(): string {
    return `${DAILY_STORAGE_PREFIX}${this.todayKey}`;
  }

  private loadDailyGuesses(): GuessResult[] {
    try {
      const raw = localStorage.getItem(this.dailyStorageKey());
      return raw ? (JSON.parse(raw) as GuessResult[]) : [];
    } catch {
      return [];
    }
  }

  /** Today's calendar date in the browser's local time zone, as YYYY-MM-DD. */
  private getLocalDateKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Simple deterministic string hash so the same date always maps to the same show. */
  private hashToIndex(key: string, length: number): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    return hash % length;
  }
}
