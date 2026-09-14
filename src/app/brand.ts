import { Component, input } from '@angular/core';

/** El símbolo de tokidev: dos ángulos y una barra en diagonal. */
@Component({
  selector: 'app-mark',
  template: `
    <svg viewBox="0 0 48 48" fill="none" [attr.width]="size()" [attr.height]="size()" aria-hidden="true">
      <defs>
        <linearGradient [attr.id]="gid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e5794f"/>
          <stop offset="1" stop-color="#e2504a"/>
        </linearGradient>
      </defs>
      <g [attr.stroke]="'url(#' + gid + ')'" stroke-width="5.5" stroke-linecap="square">
        <path d="M30 8v12h12"/>
        <path d="M18 40V28H6"/>
        <path d="M12 12l24 24"/>
      </g>
    </svg>
  `,
})
export class Mark {
  readonly size = input(28);
  readonly gid = `mk${Math.random().toString(36).slice(2, 8)}`;
}

@Component({
  selector: 'app-wordmark',
  imports: [Mark],
  template: `
    <span class="inline-flex items-center gap-2">
      <app-mark [size]="size()" />
      <span class="text-lg font-semibold tracking-tight">GiftKBol</span>
    </span>
  `,
})
export class Wordmark {
  readonly size = input(26);
}
