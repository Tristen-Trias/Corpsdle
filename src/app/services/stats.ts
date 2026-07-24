import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { GameService, MAX_GUESSES } from './game';

const STATS_STORAGE_KEY = 'corpsdle-stats';

interface StatsData {
  gamesPlayed: number;
  gamesWon: number;
  guessDistribution: number[];
  /** Date key of the last daily result folded into these totals, so a completed game is only counted once. */
  lastRecordedDate: string | null;
}

function emptyStats(): StatsData {
  return { gamesPlayed: 0, gamesWon: 0, guessDistribution: Array(MAX_GUESSES).fill(0), lastRecordedDate: null };
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly game = inject(GameService);

  private readonly stats = signal<StatsData>(this.loadStats());

  readonly gamesPlayed = computed(() => this.stats().gamesPlayed);
  readonly gamesWon = computed(() => this.stats().gamesWon);
  readonly winPercent = computed(() => {
    const played = this.gamesPlayed();
    return played === 0 ? 0 : Math.round((this.gamesWon() / played) * 100);
  });
  readonly guessDistribution = computed(() => this.stats().guessDistribution);
  readonly maxDistributionValue = computed(() => Math.max(1, ...this.guessDistribution()));

  constructor() {
    effect(() => {
      const status = this.game.dailyStatus();
      if (status === 'playing') return;

      const today = this.game.todayKey;
      const current = this.stats();
      if (current.lastRecordedDate === today) return;

      const guessCount = this.game.dailyGuessCount();
      const guessDistribution = [...current.guessDistribution];
      if (status === 'won') {
        guessDistribution[guessCount - 1]++;
      }

      const next: StatsData = {
        gamesPlayed: current.gamesPlayed + 1,
        gamesWon: current.gamesWon + (status === 'won' ? 1 : 0),
        guessDistribution,
        lastRecordedDate: today,
      };
      this.stats.set(next);
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(next));
    });
  }

  private loadStats(): StatsData {
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (!raw) return emptyStats();
      const parsed = JSON.parse(raw) as StatsData;
      if (!Array.isArray(parsed.guessDistribution) || parsed.guessDistribution.length !== MAX_GUESSES) {
        return emptyStats();
      }
      return parsed;
    } catch {
      return emptyStats();
    }
  }
}
