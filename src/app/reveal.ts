import { AfterViewInit, Directive, ElementRef, OnDestroy, inject, input } from '@angular/core';

/** Anima la entrada cuando el elemento aparece en pantalla.
 *  ponytail: IntersectionObserver a mano, sin signals ni effect — la clase se
 *  aplica en el callback y no depende de la detección de cambios. Si el
 *  navegador no soporta IO, o el usuario pidió menos movimiento, todo queda
 *  visible: la opacidad solo se toca cuando vamos a animar de verdad. */
@Directive({ selector: '[reveal]' })
export class Reveal implements AfterViewInit, OnDestroy {
  /** 1 a 4: escalona la entrada de un grupo. */
  readonly reveal = input<number | string>('');

  private readonly el = inject(ElementRef).nativeElement as HTMLElement;
  private io?: IntersectionObserver;
  private fallback?: ReturnType<typeof setTimeout>;

  ngAfterViewInit() {
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto || typeof IntersectionObserver === 'undefined') return;

    this.el.style.opacity = '0';
    this.io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) this.show();
    }, { rootMargin: '0px 0px -8% 0px' });

    this.io.observe(this.el);

    // Red de seguridad: en una pestaña de fondo el observer no dispara, y nadie
    // puede quedarse con la página en blanco por una animación.
    this.fallback = setTimeout(() => this.show(), 1200);
  }

  private show() {
    if (!this.io) return;
    this.io.disconnect();
    this.io = undefined;
    clearTimeout(this.fallback);
    this.el.style.opacity = '';
    const step = Number(this.reveal());
    if (step >= 1) this.el.classList.add(`reveal-${Math.min(4, step)}`);
    this.el.classList.add('reveal');
  }

  ngOnDestroy() {
    this.io?.disconnect();
    clearTimeout(this.fallback);
  }
}
