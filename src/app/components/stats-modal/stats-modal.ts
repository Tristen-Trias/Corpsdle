import { Component, inject, input, output } from '@angular/core';
import { StatsService } from '../../services/stats';

@Component({
  selector: 'app-stats-modal',
  standalone: true,
  templateUrl: './stats-modal.html',
  styleUrl: './stats-modal.css',
})
export class StatsModal {
  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  protected readonly stats = inject(StatsService);

  barWidth(count: number, max: number): number {
    return (count / max) * 100;
  }
}
