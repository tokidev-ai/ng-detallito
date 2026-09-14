import { describe, expect, it } from 'vitest';
import { BsPipe, onBrand } from './ui';
import { slugify } from './onboarding/wizard';

describe('slugify', () => {
  it('saca tildes, espacios y símbolos', () => {
    expect(slugify('Barbería Nor')).toBe('barberia-nor');
    expect(slugify('  Spa   Aurora!! ')).toBe('spa-aurora');
    expect(slugify('Café & Té')).toBe('cafe-te');
  });

  it('nunca deja guiones en los bordes', () => {
    expect(slugify('---hola---')).toBe('hola');
    expect(slugify('!!!')).toBe('');
  });
});

describe('onBrand', () => {
  it('pone texto claro sobre marca oscura y oscuro sobre marca clara', () => {
    expect(onBrand('#1c1b18')).toBe('#ffffff');
    expect(onBrand('#ffffff')).toBe('#1c1b18');
    expect(onBrand('#f5d90a')).toBe('#1c1b18'); // amarillo: legible en negro
    expect(onBrand('#a94434')).toBe('#ffffff');
  });

  it('no explota con un color inválido', () => {
    expect(onBrand('nope')).toBe('#ffffff');
  });
});

describe('BsPipe', () => {
  const bs = new BsPipe();
  it('formatea en es-BO y tolera vacíos', () => {
    expect(bs.transform(3480)).toBe('Bs 3.480');
    expect(bs.transform(0)).toBe('Bs 0');
    expect(bs.transform(null)).toBe('—');
  });
});
