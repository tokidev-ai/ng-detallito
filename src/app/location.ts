import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Business, GeoPoint } from './data';

/** Abre "cómo llegar" en Google Maps (app en el celular, web en la compu). Con el
 *  punto del mapa va exacto; sin él, busca la dirección escrita. */
export function directionsUrl(b: Pick<Business, 'address' | 'location' | 'name'>): string {
  const q = b.location ? `${b.location.lat},${b.location.lng}` : `${b.address}, ${b.name}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

/** Mapa de OpenStreetMap embebido, con el pin en el punto. Sin API key ni librería. */
export function osmEmbedUrl({ lat, lng }: GeoPoint): string {
  const d = 0.004;
  const bbox = [lng - d, lat - d * 0.6, lng + d, lat + d * 0.6].map(n => n.toFixed(5)).join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/** "Dónde canjearla": dirección, mapa y botón para llegar. No muestra nada si el
 *  comercio todavía no cargó su dirección. */
@Component({
  selector: 'app-business-location',
  template: `
  @if (b().address || b().location) {
    <div class="overflow-hidden rounded-2xl border border-base-300">
      @if (embed(); as src) {
        <iframe [src]="src" title="Mapa de {{ b().name }}" loading="lazy"
                class="block h-44 w-full border-0" referrerpolicy="no-referrer"></iframe>
      }
      <div class="flex items-center gap-3 p-3">
        <span class="grid size-9 shrink-0 place-items-center rounded-full bg-base-200" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4.5"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5"/></svg>
        </span>
        <p class="min-w-0 flex-1 text-sm">{{ b().address || b().name }}</p>
        <a [href]="directions()" target="_blank" rel="noopener" class="btn btn-sm shrink-0 rounded-full">Cómo llegar</a>
      </div>
    </div>
  }
  `,
})
export class BusinessLocation {
  private readonly sanitizer = inject(DomSanitizer);
  readonly b = input.required<Business>({ alias: 'business' });
  readonly directions = computed(() => directionsUrl(this.b()));
  // la URL sale solo de dos números: es seguro marcarla como confiable.
  readonly embed = computed(() => {
    const at = this.b().location;
    return typeof at?.lat === 'number' && typeof at.lng === 'number' ? this.sanitizer.bypassSecurityTrustResourceUrl(osmEmbedUrl(at)) : null;
  });
}
