import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-info-modal',
  standalone: true,
  templateUrl: './info-modal.html',
  styleUrl: './info-modal.css',
})
export class InfoModal {
  readonly open = input.required<boolean>();
  readonly closed = output<void>();
}
