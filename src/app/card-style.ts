import { CardStyle } from './data';
import { onBrand } from './ui';

/** Diseños de gift card y su fondo. Aparte de giftcard.ts para que la landing los
 *  use sin cargar el QR. */
export const CARD_STYLES: { id: CardStyle; label: string }[] = [
  { id: 'degradado', label: 'Degradado' },
  { id: 'logo', label: 'Tu logo' },
  { id: 'cubierta', label: 'Logo completo' },
  { id: 'claro', label: 'Claro' },
  { id: 'oscuro', label: 'Oscuro' },
];

/** Fondo y tinta de cada diseño, a partir del color del comercio. Va dentro de
 *  un `.storefront` con `--c1`, que deriva `--c2` (el segundo tono del degradado). */
export function cardSurface(style: CardStyle | undefined, color: string, logo?: string | null): { bg: string; ink: string } {
  switch (style) {
    // el logo cubre toda la tarjeta; un velo oscuro arriba y abajo deja leer el texto.
    // Sin logo, el color de marca.
    case 'cubierta': return {
      bg: `linear-gradient(rgba(0,0,0,.4), rgba(0,0,0,.05) 40%, rgba(0,0,0,.6))${logo ? `, url("${logo}") center / cover` : ''}, var(--c1)`,
      ink: logo ? '#ffffff' : onBrand(color),
    };
    case 'logo': return { bg: 'var(--c1)', ink: onBrand(color) };
    case 'claro': return { bg: '#faf8f3', ink: '#1c1b18' };
    case 'oscuro': return {
      bg: 'radial-gradient(120% 90% at 100% 0%, color-mix(in oklab, var(--c1) 60%, transparent), transparent 65%), #141414',
      ink: '#ffffff',
    };
    default: return { bg: 'linear-gradient(135deg, var(--c1), var(--c2))', ink: onBrand(color) };
  }
}
