import { Component, input } from '@angular/core';

/** Sin símbolo: la marca es la palabra. */
@Component({
  selector: 'app-wordmark',
  template: `
    <span class="inline-flex items-baseline font-semibold tracking-tight"
          [class]="size() === 'lg' ? 'text-2xl' : 'text-lg'">
      <span>Gift</span><span class="text-primary">KBol</span>
    </span>
  `,
})
export class Wordmark {
  readonly size = input<'sm' | 'lg'>('sm');
}
