import { Component, ElementRef, OnDestroy, afterNextRender, effect, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type * as Leaflet from 'leaflet';
import { Business, GeoPoint, LIMITS } from '../data';

/** Centro de La Paz: dónde arranca el mapa si el comercio aún no marcó su punto. */
const LA_PAZ: GeoPoint = { lat: -16.4955, lng: -68.1336 };

/** Dirección escrita + punto en el mapa (OpenStreetMap con Leaflet, gratis y sin
 *  API key). El punto se marca tocando el mapa, arrastrando el pin, buscando la
 *  dirección o con "Usar mi ubicación". Lo usan el alta y "Editar página". */
@Component({
  selector: 'app-location-picker',
  imports: [FormsModule],
  template: `
  <label class="form-control block">
    <span class="mb-1 block text-xs font-medium uppercase tracking-wider text-base-content/50">Dirección del local</span>
    <input class="input input-bordered w-full" [ngModel]="b().address ?? ''" name="address" [maxlength]="limits.address"
           placeholder="Ej: Av. 20 de Octubre 2045, Sopocachi, La Paz" (ngModelChange)="change.emit({ address: $event })">
    <span class="mt-1 block text-xs text-base-content/50">
      Donde tus clientes canjean la gift card. Hasta {{ limits.address }} caracteres.
    </span>
  </label>

  <div class="mt-3">
    <div class="mb-2 flex flex-wrap items-center gap-2">
      <span class="text-xs font-medium uppercase tracking-wider text-base-content/50">Ubicación en el mapa</span>
      <span class="ms-auto flex gap-2">
        <button type="button" class="btn btn-outline btn-xs" (click)="search()" [disabled]="!b().address || busy()">Buscar dirección</button>
        <button type="button" class="btn btn-outline btn-xs" (click)="locateMe()" [disabled]="busy()">Usar mi ubicación</button>
      </span>
    </div>
    <div #map class="relative z-0 h-64 w-full overflow-hidden rounded-box border border-base-300 bg-base-200"></div>
    <p class="mt-1 text-xs" [class.text-error]="error()" [class.text-base-content/50]="!error()">
      {{ error() || (b().location ? 'Arrastra el pin o toca el mapa para ajustar.' : 'Toca el mapa donde está tu local.') }}
    </p>
  </div>
  `,
})
export class LocationPicker implements OnDestroy {
  readonly b = input.required<Business>({ alias: 'business' });
  readonly change = output<Partial<Business>>();
  readonly limits = LIMITS;

  private readonly el = viewChild.required<ElementRef<HTMLElement>>('map');
  private L?: typeof Leaflet;
  private map?: Leaflet.Map;
  private pin?: Leaflet.Marker;
  readonly busy = signal(false);
  readonly error = signal('');

  constructor() {
    // Leaflet toca el DOM: se carga solo en el navegador y cuando hace falta.
    afterNextRender(async () => {
      // leaflet es CommonJS: según el bundler, la API viene en `default` o suelta.
      const mod = await import('leaflet') as typeof Leaflet & { default?: typeof Leaflet };
      const L = this.L = mod.default ?? mod;
      const at = this.b().location ?? LA_PAZ;
      this.map = L.map(this.el().nativeElement, { scrollWheelZoom: false })
        .setView([at.lat, at.lng], this.b().location ? 16 : 13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; OpenStreetMap',
      }).addTo(this.map);
      this.map.on('click', e => this.set(e.latlng.lat, e.latlng.lng));
      this.syncPin();
    });
    // el punto puede cambiar desde afuera (descartar cambios): el pin lo sigue.
    effect(() => { this.b().location; this.syncPin(); });
  }

  ngOnDestroy() { this.map?.remove(); }

  private set(lat: number, lng: number) {
    this.error.set('');
    this.change.emit({ location: { lat: +lat.toFixed(6), lng: +lng.toFixed(6) } });
  }

  private syncPin() {
    const L = this.L, map = this.map, at = this.b().location;
    if (!L || !map) return;
    if (!at) { this.pin?.remove(); this.pin = undefined; return; }
    if (!this.pin) {
      // pin propio (divIcon): los íconos por defecto de Leaflet se rompen al empaquetar.
      this.pin = L.marker([at.lat, at.lng], {
        draggable: true,
        icon: L.divIcon({ className: 'map-pin', html: '<span></span>', iconSize: [28, 36], iconAnchor: [14, 36] }),
      }).addTo(map);
      this.pin.on('dragend', () => { const p = this.pin!.getLatLng(); this.set(p.lat, p.lng); });
    } else {
      this.pin.setLatLng([at.lat, at.lng]);
    }
  }

  private goTo(lat: number, lng: number) {
    this.set(lat, lng);
    this.map?.setView([lat, lng], 17);
  }

  /** Busca la dirección escrita en Nominatim (el buscador libre de OpenStreetMap). */
  async search() {
    const q = this.b().address?.trim();
    if (!q) return;
    this.busy.set(true); this.error.set('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=bo&q=${encodeURIComponent(q)}`);
      const [hit] = await res.json() as { lat: string; lon: string }[];
      if (hit) this.goTo(+hit.lat, +hit.lon);
      else this.error.set('No encontramos esa dirección. Toca el mapa donde está tu local.');
    } catch {
      this.error.set('No pudimos buscar la dirección. Toca el mapa donde está tu local.');
    } finally {
      this.busy.set(false);
    }
  }

  locateMe() {
    if (!navigator.geolocation) { this.error.set('Tu navegador no comparte la ubicación. Toca el mapa.'); return; }
    this.busy.set(true); this.error.set('');
    navigator.geolocation.getCurrentPosition(
      p => { this.busy.set(false); this.goTo(p.coords.latitude, p.coords.longitude); },
      () => { this.busy.set(false); this.error.set('No pudimos obtener tu ubicación. Toca el mapa donde está tu local.'); },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }
}
