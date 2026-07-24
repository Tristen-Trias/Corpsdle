import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { GameService, GameStatus, MAX_GUESSES } from './game';

const STATS_STORAGE_KEY = 'corpsdle-stats';

interface ModeStats {
  gamesPlayed: number;
  gamesWon: number;
  guessDistribution: number[];
}

interface StatsData {
  daily: ModeStats;
  unlimited: ModeStats;
  /** Date key of the last daily result folded into daily totals, so a completed game is only counted once. */
  lastRecordedDailyDate: string | null;
}

export interface ModeStatsView {
  gamesPlayed: number;
  gamesWon: number;
  winPercent: number;
  guessDistribution: number[];
  maxDistributionValue: number;
}

function emptyModeStats(): ModeStats {
  return { gamesPlayed: 0, gamesWon: 0, guessDistribution: Array(MAX_GUESSES).fill(0) };
}

function emptyStats(): StatsData {
  return { daily: emptyModeStats(), unlimited: emptyModeStats(), lastRecordedDailyDate: null };
}

function toView(mode: ModeStats): ModeStatsView {
  return {
    gamesPlayed: mode.gamesPlayed,
    gamesWon: mode.gamesWon,
    winPercent: mode.gamesPlayed === 0 ? 0 : Math.round((mode.gamesWon / mode.gamesPlayed) * 100),
    guessDistribution: mode.guessDistribution,
    maxDistributionValue: Math.max(1, ...mode.guessDistribution),
  };
}

function recordResult(mode: ModeStats, status: GameStatus, guessCount: number): ModeStats {
  const guessDistribution = [...mode.guessDistribution];
  if (status === 'won') {
    guessDistribution[guessCount - 1]++;
  }
  return {
    gamesPlayed: mode.gamesPlayed + 1,
    gamesWon: mode.gamesWon + (status === 'won' ? 1 : 0),
    guessDistribution,
  };
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly game = inject(GameService);

  private readonly stats = signal<StatsData>(this.loadStats());
  /** Guards a single unlimited round from being folded into totals twice; cleared the moment a new round starts. */
  private unlimitedRecordedForRound = false;

  readonly daily = computed<ModeStatsView>(() => toView(this.stats().daily));
  readonly unlimited = computed<ModeStatsView>(() => toView(this.stats().unlimited));

  constructor() {
    effect(() => {
      const status = this.game.dailyStatus();
      if (status === 'playing') return;

      const today = this.game.todayKey;
      const current = this.stats();
      if (current.lastRecordedDailyDate === today) return;

      this.save({
        ...current,
        daily: recordResult(current.daily, status, this.game.dailyGuessCount()),
        lastRecordedDailyDate: today,
      });
    });

    effect(() => {
      const status = this.game.unlimitedStatus();
      if (status === 'playing') {
        this.unlimitedRecordedForRound = false;
        return;
      }
      if (this.unlimitedRecordedForRound) return;
      this.unlimitedRecordedForRound = true;

      const current = this.stats();
      this.save({
        ...current,
        unlimited: recordResult(current.unlimited, status, this.game.unlimitedGuessCount()),
      });
    });
  }

  private save(next: StatsData): void {
    this.stats.set(next);
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(next));
  }

  private loadStats(): StatsData {
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (!raw) return emptyStats();
      const parsed = JSON.parse(raw) as Partial<StatsData>;
      if (!this.isValidModeStats(parsed.daily) || !this.isValidModeStats(parsed.unlimited)) {
        return emptyStats();
      }
      return parsed as StatsData;
    } catch {
      return emptyStats();
    }
  }

  private isValidModeStats(mode: ModeStats | undefined): mode is ModeStats {
    return !!mode && Array.isArray(mode.guessDistribution) && mode.guessDistribution.length === MAX_GUESSES;
  }
}
