import { describe, expect, it } from 'vitest';
import { BsPipe, FechaPipe, onBrand } from './ui';
import { cardState, daysUntil, expiryFrom, giftMessage, giftPath, newCode, pctChange, stampKey, waLink } from './card';
import { slugify } from './onboarding/wizard';
import { lastMonths, soldDate, toCobro, toCsv, totals } from './admin/ledger';

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

describe('compartir', () => {
  it('giftPath arma la ruta pública', () => {
    expect(giftPath('barberia-nor', '6120-AA3')).toBe('/barberia-nor/g/6120-AA3');
  });
  it('el mensaje omite para/de cuando faltan (regalo anónimo)', () => {
    expect(giftMessage('Barbería Nor', 'http://x/g/1', {})).not.toContain('parte de');
    expect(giftMessage('Barbería Nor', 'http://x/g/1', { to: 'Ana', from: 'Luis' }))
      .toContain('para Ana, de parte de Luis');
  });
  it('waLink escapa el texto', () => {
    expect(waLink('a b')).toBe('https://wa.me/?text=a%20b');
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

describe('números del dashboard', () => {
  it('daysUntil cuenta días enteros, negativo si ya pasó', () => {
    expect(daysUntil('2026-09-30', '2026-09-23')).toBe(7);
    expect(daysUntil('2026-09-23', '2026-09-23')).toBe(0);
    expect(daysUntil('2026-09-20', '2026-09-23')).toBe(-3);
  });

  it('pctChange compara contra el mes anterior y no divide por cero', () => {
    expect(pctChange(120, 100)).toBe(20);
    expect(pctChange(50, 100)).toBe(-50);
    expect(pctChange(80, 0)).toBeNull();
  });

  it('stampKey ordena los canjes por mes, día y hora', () => {
    const at = ['05/09 10:00', '28/08 18:30', '05/09 09:15'];
    expect([...at].sort((a, b) => stampKey(b).localeCompare(stampKey(a))))
      .toEqual(['05/09 10:00', '05/09 09:15', '28/08 18:30']);
  });
});

describe('libro de cobros (superadmin)', () => {
  const t = { id: 'nor', business: { name: 'Nor', slug: 'nor', color: '#000', published: true, validityMonths: 6 } };

  it('soldDate usa soldAt, o lo deduce restando la vigencia al vencimiento', () => {
    expect(soldDate({ soldAt: '2026-09-23T14:00:00.000Z', expires: '2027-03-23' }, 6)).toBe('2026-09-23');
    expect(soldDate({ expires: '2027-03-23' }, 6)).toBe('2026-09-23');
    // es la inversa exacta de expiryFrom
    expect(soldDate({ expires: expiryFrom(12, new Date('2026-01-31')) }, 12)).toBe('2026-01-31');
  });

  it('toCobro aplica la comisión del comercio, o la de defecto', () => {
    const c = { code: 'A', to: 'Ana', value: 250, balance: 250, expires: '2099-01-01' };
    expect(toCobro(t, c).fee).toBe(12.5);          // 5% por defecto
    expect(toCobro(t, c).net).toBe(237.5);
    const neg = toCobro({ ...t, commissionRate: 0.035 }, c);
    expect([neg.rate, neg.fee, neg.net]).toEqual([0.035, 8.75, 241.25]);
  });

  it('totals suma bruto, comisión y neto', () => {
    const c = { code: 'A', to: 'Ana', value: 100, balance: 100, expires: '2099-01-01' };
    expect(totals([toCobro(t, c), toCobro(t, { ...c, value: 50 })])).toEqual({ count: 2, gross: 150, fee: 7.5, net: 142.5 });
  });

  it('lastMonths cruza el cambio de año', () => {
    expect(lastMonths(3, '2026-02-10')).toEqual(['2025-12', '2026-01', '2026-02']);
  });

  it('toCsv escapa y usa coma decimal para Excel en español', () => {
    expect(toCsv([['a;b', 'x"y', 12.5]])).toBe('﻿"a;b";"x""y";12,5');
  });
});
