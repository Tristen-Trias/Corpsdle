import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GuessResult, Show } from '../models/show';
import { buildGuessResult } from './guess-hints';
import { getGameNumber, getLocalDateKey, mixIndex } from './puzzle-date';
import { findShowByGuess, matchSuggestions } from './show-search';

export const MAX_GUESSES = 6;
const DAILY_STORAGE_PREFIX = 'corpsdle-daily-';

/**
 * List is here so that it doesn't pick a duplicate show as the daily answer.
 * No backend is used yet to track past answers, so its hard coded for now
 * 
 * Will probably make a historical record of past answers sometime later
 */
const USED_ANSWERS: Record<string, string> = {
  '2026-07-23': 'A World of My Creation',
  '2026-07-24': 'Gasoline Rainbows',
  '2026-07-25': 'Somewhere New',
  '2026-07-26': 'Welcome to the VOID',
  '2026-07-27': 'The Gift',
  '2026-07-28': 'Dorothy',
  '2026-07-29': 'I Am',
};

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
  readonly todayKey = getLocalDateKey();

  readonly gameNumber = getGameNumber(this.todayKey);

  private readonly mode = signal<Mode>('daily');
  readonly isUnlimited = computed(() => this.mode() === 'unlimited');

  private readonly dailyGuesses = signal<GuessResult[]>(this.loadDailyGuesses());
  private readonly unlimitedGuesses = signal<GuessResult[]>([]);
  private readonly unlimitedAnswer = signal<Show | null>(null);

  readonly guesses = computed(() => (this.isUnlimited() ? this.unlimitedGuesses() : this.dailyGuesses()));

  /** Daily-only result, regardless of which mode the player currently has selected - used for stats tracking. */
  readonly dailyStatus = computed<GameStatus>(() => {
    const list = this.dailyGuesses();
    if (list.some((g) => g.isWinningGuess)) return 'won';
    if (list.length >= MAX_GUESSES) return 'lost';
    return 'playing';
  });

  readonly dailyGuessCount = computed(() => this.dailyGuesses().length);

  /** Unlimited-only result, regardless of which mode the player currently has selected - used for stats tracking. */
  readonly unlimitedStatus = computed<GameStatus>(() => {
    const list = this.unlimitedGuesses();
    if (list.some((g) => g.isWinningGuess)) return 'won';
    if (list.length >= MAX_GUESSES) return 'lost';
    return 'playing';
  });

  readonly unlimitedGuessCount = computed(() => this.unlimitedGuesses().length);

  private readonly dailyAnswer = computed<Show | null>(() => {
    const pool = this.shows();
    if (pool.length === 0) return null;

    const recordedTitle = USED_ANSWERS[this.todayKey];
    if (recordedTitle) {
      return pool.find((s) => s.title === recordedTitle) ?? null;
    }

    const usedTitles = new Set(Object.values(USED_ANSWERS));
    let index = mixIndex(this.gameNumber, pool.length);
    while (usedTitles.has(pool[index].title) && usedTitles.size < pool.length) {
      index = (index + 1) % pool.length;
    }
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
    const guessedTitles = new Set(this.guesses().map((g) => g.show.title));
    const candidates = this.shows().filter((s) => !guessedTitles.has(s.title));
    return matchSuggestions(query, candidates);
  }

  submitGuess(title: string): void {
    this.guessError.set(null);
    const answer = this.answer();
    if (!answer || this.status() !== 'playing') return;

    const show = findShowByGuess(this.shows(), title);
    if (!show) {
      this.guessError.set("That's not a show in today's pool, pick one from the suggestions.");
      return;
    }
    if (this.guesses().some((g) => g.show.title === show.title)) {
      this.guessError.set('Already tried that one.');
      return;
    }

    const result = buildGuessResult(show, answer);

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
}
