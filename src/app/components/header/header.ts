import { Component, input, output } from '@angular/core';
import { Theme } from '../../models/theme';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly theme = input.required<Theme>();
  readonly isUnlimited = input.required<boolean>();
  readonly gameNumber = input.required<number>();
  readonly tagline = input.required<string>();

  readonly howToPlay = output<void>();
  readonly stats = output<void>();
  readonly info = output<void>();
  readonly themeToggled = output<void>();
}
