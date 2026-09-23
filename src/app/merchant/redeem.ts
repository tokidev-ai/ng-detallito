import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GiftCard, Store, cardState } from '../data';
import { BsPipe } from '../ui';

/** BarcodeDetector es nativo de Chromium (Android Chrome, escritorio). En Safari
 *  no existe: ahí se cae al ingreso manual del código, que anda en todos lados. */
const BD: any = (globalThis as any).BarcodeDetector;

/** Canjear una gift card: escaneando su QR con la cámara o tecleando el código.
 *  El QR lleva la URL `.../g/CODE`; de ahí (o del input) sacamos el código, lo
 *  buscamos entre las cartas del comercio y descontamos el monto. */
@Component({
  selector: 'app-redeem',
  imports: [FormsModule, BsPipe],
  template: `
  <button type="button" class="btn btn-outline btn-sm" (click)="open()">Canjear</button>

  @if (isOpen()) {
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" (click)="close()">
      <div class="w-full max-w-sm rounded-box bg-base-100 p-5 shadow-xl" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium">Canjear gift card</h3>
          <button type="button" class="btn btn-ghost btn-sm btn-square" (click)="close()">✕</button>
        </div>

        @if (!found()) {
          @if (scanning()) {
            <video #video class="mt-4 aspect-square w-full rounded-box bg-black object-cover" playsinline muted></video>
            <p class="mt-2 text-center text-sm text-base-content/60">Apunta al QR de la gift card</p>
            <button type="button" class="btn btn-ghost btn-sm mt-1 w-full" (click)="stopScan()">Cancelar cámara</button>
          } @else {
            @if (canScan) {
              <button type="button" class="btn btn-primary mt-4 w-full" (click)="startScan()">📷 Escanear QR</button>
              <div class="divider my-3 text-xs text-base-content/40">o ingresa el código</div>
            } @else {
              <p class="mt-4 text-sm text-base-content/60">Ingresa el código de la gift card:</p>
            }
            <div class="join mt-1 w-full">
              <input class="input input-bordered join-item w-full font-mono uppercase" [(ngModel)]="code"
                     name="code" placeholder="1234-AB5" (keyup.enter)="lookup()">
              <button type="button" class="btn btn-neutral join-item" (click)="lookup()">Buscar</button>
            </div>
          }
          @if (error()) { <p class="mt-2 text-sm text-error">{{ error() }}</p> }

        } @else {
          <div class="mt-4 rounded-box border border-base-300 p-3">
            <p class="font-mono">{{ found()!.code }}</p>
            <p class="text-sm text-base-content/60">{{ found()!.to }} · saldo {{ found()!.balance | bs }}</p>
          </div>

          @if (state(found()!) !== 'activa') {
            <p class="mt-3 text-sm text-error">Esta gift card está {{ state(found()!) }}: no se puede canjear.</p>
            <button type="button" class="btn btn-ghost btn-sm mt-3 w-full" (click)="back()">Buscar otra</button>
          } @else {
            <label class="form-control mt-3">
              <span class="mb-1 block text-sm text-base-content/60">Monto a canjear</span>
              <input type="number" class="input input-bordered w-full" [(ngModel)]="amount" name="amount"
                     min="1" [max]="found()!.balance">
            </label>
            <button type="button" class="btn btn-outline btn-xs mt-2" (click)="amount = found()!.balance">
              usar todo ({{ found()!.balance | bs }})
            </button>
            @if (error()) { <p class="mt-2 text-sm text-error">{{ error() }}</p> }
            <div class="mt-4 flex gap-2">
              <button type="button" class="btn btn-ghost flex-1" (click)="back()" [disabled]="busy()">Atrás</button>
              <button type="button" class="btn btn-primary flex-1" (click)="confirm()" [disabled]="busy() || !amount">
                {{ busy() ? 'Canjeando…' : 'Canjear' }}
              </button>
            </div>
          }
        }
      </div>
    </div>
  }
  `,
})
export class RedeemDialog {
  private readonly s = inject(Store);
  readonly canScan = !!BD;
  readonly state = (c: GiftCard) => cardState(c);

  readonly isOpen = signal(false);
  readonly scanning = signal(false);
  readonly found = signal<GiftCard | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  code = '';
  amount: number | null = null;

  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private stream: MediaStream | null = null;
  private raf = 0;
  private loopOn = false;

  constructor() {
    // el <video> recién existe cuando scanning() es true y Angular lo renderiza;
    // este effect arranca la detección en cuanto el elemento está en el DOM.
    effect(() => {
      const v = this.video()?.nativeElement;
      if (this.scanning() && v && this.stream && !this.loopOn) this.runLoop(v);
    });
  }

  open() { this.reset(); this.isOpen.set(true); }
  close() { this.stopScan(); this.isOpen.set(false); }
  back() { this.stopScan(); this.found.set(null); this.error.set(''); }

  reset() {
    this.stopScan(); this.found.set(null); this.error.set(''); this.code = ''; this.amount = null;
  }

  /** Del texto del QR (una URL `.../g/CODE`) o del input, saca el código. */
  private parse(text: string): string {
    const t = (text ?? '').trim();
    const m = t.match(/\/g\/([^/?#]+)/i);
    return (m ? m[1] : t).toUpperCase();
  }

  lookup(text = this.code) {
    const code = this.parse(text);
    if (!code) return;
    const card = this.s.cards().find(c => c.code.toUpperCase() === code);
    if (!card) { this.error.set(`No encontramos la gift card ${code}.`); return; }
    this.error.set('');
    this.amount = card.balance;
    this.found.set(card);
  }

  async startScan() {
    this.error.set('');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.scanning.set(true);  // el effect toma el <video> cuando aparece
    } catch {
      this.error.set('No pudimos abrir la cámara. Ingresa el código a mano.');
    }
  }

  private runLoop(v: HTMLVideoElement) {
    this.loopOn = true;
    v.srcObject = this.stream;
    v.play().catch(() => { /* autoplay bloqueado, igual detecta */ });
    const det = new BD({ formats: ['qr_code'] });
    const tick = async () => {
      if (!this.scanning()) { this.loopOn = false; return; }
      try {
        const codes = await det.detect(v);
        if (codes.length) { const raw = codes[0].rawValue as string; this.stopScan(); this.lookup(raw); return; }
      } catch { /* frame sin lectura */ }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stopScan() {
    cancelAnimationFrame(this.raf);
    this.loopOn = false;
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.scanning.set(false);
  }

  async confirm() {
    const card = this.found();
    if (!card || !this.amount || this.busy()) return;
    this.busy.set(true); this.error.set('');
    try {
      await this.s.redeem(card.code, this.amount);
      this.close();
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo canjear.');
    } finally {
      this.busy.set(false);
    }
  }
}
