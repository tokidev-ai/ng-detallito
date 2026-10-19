import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { envName } from '../environments/firebase';

/** En dev, una etiqueta fija para no confundir el ambiente de pruebas con producción. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <router-outlet />
    @if (dev) {
      <span class="pointer-events-none fixed bottom-2 left-2 z-[100] rounded-full bg-warning px-2.5 py-1 text-xs font-bold text-warning-content shadow">DEV</span>
    }
  `,
})
export class App {
  readonly dev = envName === 'dev';
}
