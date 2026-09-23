import { describe, expect, it } from 'vitest';
import { BsPipe, FechaPipe, onBrand } from './ui';
import { cardState, expiryFrom, newCode } from './card';
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

describe('cardState', () => {
  const hoy = '2026-09-23';
  it('saldo 0 es canjeada, aunque no haya vencido', () => {
    expect(cardState({ balance: 0, expires: '2027-01-01' }, hoy)).toBe('canjeada');
  });
  it('con saldo y fecha pasada es vencida', () => {
    expect(cardState({ balance: 100, expires: '2026-09-08' }, hoy)).toBe('vencida');
  });
  it('con saldo y fecha futura es activa', () => {
    expect(cardState({ balance: 60, expires: '2026-11-14' }, hoy)).toBe('activa');
  });
});

describe('newCode', () => {
  it('tiene forma 1234-AB5 y evita letras ambiguas', () => {
    for (let i = 0; i < 50; i++) {
      const c = newCode();
      expect(c).toMatch(/^\d{4}-[A-Z]{2}\d$/);
      expect(c).not.toMatch(/[IO]/);
    }
  });
});

describe('expiryFrom', () => {
  it('suma meses y devuelve ISO', () => {
    expect(expiryFrom(12, new Date('2026-09-23'))).toBe('2027-09-23');
    expect(expiryFrom(6, new Date('2026-09-23'))).toBe('2027-03-23');
  });
});

describe('FechaPipe', () => {
  const f = new FechaPipe();
  it('pasa ISO a dd/mm/yy y tolera vacío', () => {
    expect(f.transform('2026-11-14')).toBe('14/11/26');
    expect(f.transform('')).toBe('—');
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
