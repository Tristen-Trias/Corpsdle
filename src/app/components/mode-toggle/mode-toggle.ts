import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-mode-toggle',
  standalone: true,
  templateUrl: './mode-toggle.html',
  styleUrl: './mode-toggle.css',
})
export class ModeToggle {
  readonly checked = input.required<boolean>();
  readonly toggled = output<void>();
}
