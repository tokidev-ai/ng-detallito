import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Firestore, arrayRemove, arrayUnion, collection, collectionData, deleteDoc, doc, docData, getDoc, getDocs,
  query, runTransaction, setDoc, updateDoc, where, writeBatch,
} from '@angular/fire/firestore';
import { Observable, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { lastMonths, soldDate } from './admin/ledger';
import { AuthService } from './auth';
import { cardState } from './card';

export { cardState } from './card';
export type { CardState } from './card';
export type Perm = 'redeem' | 'viewCards' | 'viewSales' | 'manageProducts' | 'manageBranding' | 'manageStaff';

/** Optimiza el logo para guardarlo tal cual en el doc del comercio, que se baja
 *  entero en cada página: recorte cuadrado al centro (todos los lugares lo muestran
 *  en un cuadrado o círculo), 256px como máximo y WebP, bajando calidad y después
 *  tamaño hasta entrar en `budget` caracteres. Una foto de 10 MB queda en ~15-30 KB.
 *  Safari viejo no codifica WebP y devuelve PNG: ahí entra achicando. Lanza un Error
 *  con un mensaje para mostrar si el archivo no es una imagen que el navegador lea.
 *  ponytail: data URL en Firestore, no Storage; pasar a Storage si hacen falta imágenes grandes. */
export async function logoDataUrl(file: File, max = 256, budget = 40_000): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Ese archivo no es una imagen.');
  if (file.size > 30_000_000) throw new Error('La imagen pesa más de 30 MB. Prueba con una más liviana.');

  // <img> y no createImageBitmap: también lee SVG y respeta la rotación EXIF de las fotos
  const src = URL.createObjectURL(file);
  const img = new Image();
  img.src = src;
  try { await img.decode(); }
  catch { throw new Error('No pudimos leer esa imagen. Prueba con JPG, PNG o WebP.'); }
  finally { URL.revokeObjectURL(src); }

  const w = img.naturalWidth || 512, h = img.naturalHeight || 512;  // SVG sin tamaño propio
  const side = Math.min(w, h);
  let url = '';
  for (let size = Math.min(max, side); ; size = Math.round(size * 0.75)) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
    for (const q of [0.85, 0.7, 0.55]) {
      url = c.toDataURL('image/webp', q);
      if (url.length <= budget) return url;
    }
    if (size <= 96) return url;  // piso: más chico ya no se reconoce el logo
  }
}

/** Diseño de la gift card, a elección del comercio. Ver `cardSurface` en giftcard.ts. */
export type CardStyle = 'degradado' | 'logo' | 'cubierta' | 'claro' | 'oscuro';

export interface Business {
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  color: string;
  published: boolean;
  validityMonths: number;
  terms: string;
  /** Los únicos montos que el cliente puede comprar en la página. Un monto fuera
   *  de la lista solo lo carga el comercio desde su panel. */
  suggestedAmounts: number[];
  /** Sin valor = 'degradado' (el diseño de siempre). */
  cardStyle?: CardStyle;
  /** Dónde se canjean las gift cards: la dirección escrita y el punto en el mapa. */
  address?: string;
  location?: GeoPoint | null;
}

export interface GeoPoint { lat: number; lng: number }

/** Cuenta donde liquidamos al comercio. Privada: vive en `tenants/{id}`, nunca en la página. */
export interface Bank { bank: string; account: string; holder: string; nit: string }
/** Topes de los campos que escribe el comercio (se muestran en el placeholder). */
export const LIMITS = {
  name: 60, slug: 40, description: 160, address: 160, amountMax: 10_000,
  bank: 40, account: 30, holder: 80, nit: 20,
} as const;

/** Cuántos comercios puede crear una persona; para más, nos escribe (el
 *  superadmin le sube `owners/{uid}.max`). Las reglas usan el mismo 3. */
export const MAX_OWNED = 3;
export const SUPPORT_EMAIL = 'soporte@giftkbol.com';

export const EMPTY_BANK: Bank = { bank: '', account: '', holder: '', nit: '' };

/** `expires` es ISO `yyyy-mm-dd` (comparable y ordenable como texto). El estado
 *  no se guarda: se deriva con `cardState`. `code` es la clave del documento.
 *  `from` es opcional: el regalo puede ser anónimo. */
export interface GiftCard {
  code: string; to: string; from?: string; value: number; balance: number; expires: string;
  /** Cuándo se vendió (ISO). Las cartas viejas no lo tienen: el superadmin lo
   *  deduce del vencimiento (`admin/ledger.ts` → `soldDate`). */
  soldAt?: string;
  /** Por dónde entró la venta: la página pública (QR) o el panel del comercio. */
  channel?: 'qr' | 'panel';
}
export interface Redemption { by: string; code: string; amount: number; at: string }
export interface StaffMember { email: string; role: 'owner' | 'staff'; lastSeen: string; perms: Record<Perm, boolean> }

/** Un comercio, armado con dos documentos (las reglas no pueden ocultar campos
 *  sueltos, así que lo público y lo privado van separados):
 *  - `pages/{id}` = `{ business }`: la página, legible por cualquiera si está publicada.
 *  - `tenants/{id}` = el resto: solo el equipo del comercio y el superadmin.
 *  Las listas (cards, staff, redemptions) son subcolecciones de `tenants/{id}`. */
export interface Tenant {
  id: string;
  business: Business;
  ownerUid: string;
  /** Membresía por correo: agregar un empleado por email basta para que entre,
   *  sin sincronizar uids. El dueño va primero. */
  memberEmails: string[];
  bank?: Bank;
  /** Nuestra comisión con este comercio (0.05 = 5%), negociada uno a uno. Solo
   *  la escribe el superadmin; sin valor, rige `DEFAULT_RATE`. */
  commissionRate?: number;
}
/** Lo que ve cualquiera: la página, sin nada de `tenants/{id}`. */
export type PublicTenant = Pick<Tenant, 'id' | 'business'>;

export interface MonthPoint { sold: number; redeemed: number }

export const EMPTY_BUSINESS: Business = {
  name: '', slug: '', description: '', logoUrl: null, color: '#1c1b18',
  published: false, validityMonths: 12, terms: '', suggestedAmounts: [],
};

export const ALL_PERMS: Record<Perm, boolean> = {
  redeem: true, viewCards: true, viewSales: true,
  manageProducts: true, manageBranding: true, manageStaff: true,
};

@Injectable({ providedIn: 'root' })
export class Store {
  private readonly db = inject(Firestore);
  private readonly auth = inject(AuthService);

  readonly commissionRate = 0.05;
  readonly currentId = signal<string | null>(null);

  // ── los comercios de esta persona (por su correo) ───────────────────────────
  private readonly myTenants$ = toObservable$(() => this.auth.user()?.email ?? null).pipe(
    switchMap(email => email
      ? (collectionData(
          query(collection(this.db, 'tenants'), where('memberEmails', 'array-contains', email)),
          { idField: 'id' }) as Observable<Omit<Tenant, 'business'>[]>).pipe(
          // a cada tenant le sumamos su página (pages/{id}); sin página todavía, no se lista
          switchMap(ts => ts.length
            ? combineLatest(ts.map(t => (docData(doc(this.db, 'pages', t.id)) as Observable<{ business: Business } | undefined>)
                .pipe(map(p => (p ? cleanTenant({ ...t, business: p.business }) : null)))))
            : of([])),
          map(list => ({ list: list.filter((t): t is Tenant => !!t), loaded: true })),
          startWith({ list: [] as Tenant[], loaded: false }))  // "cargando", no "vacío"
      : of({ list: [] as Tenant[], loaded: true })),  // sin sesión: no hay comercios, punto
  );
  private readonly tenantsState = toSignal(this.myTenants$, { initialValue: { list: [] as Tenant[], loaded: false } });
  readonly tenants = computed(() => this.tenantsState().list);
  /** false hasta que Firestore contesta la lista. Distingue "cargando" de "sin
   *  comercios", así ni el shell ni la lista muestran un estado final antes de tiempo. */
  readonly tenantsLoaded = computed(() => this.auth.ready() && this.tenantsState().loaded);

  readonly current = computed(() => this.tenants().find(t => t.id === this.currentId()) ?? null);
  setCurrent(id: string | null) {
    this.currentId.set(id);
    try { if (id) localStorage.setItem(LAST_TENANT, id); } catch { /* sin storage: entra al suyo */ }
  }

  /** ¿Es mío este comercio? uid del creador o memberEmails[0] (el dueño va primero). */
  /** Cupo de comercios de esta persona (`owners/{uid}`): cuántos creó y cuántos puede. */
  readonly quota = toSignal(toObservable$(() => this.auth.uid()).pipe(
    switchMap(uid => uid ? docData(doc(this.db, 'owners', uid)) : of(undefined)),
    map(d => ({ count: (d?.['count'] as number) ?? 0, max: (d?.['max'] as number) ?? MAX_OWNED })),
  ), { initialValue: { count: 0, max: MAX_OWNED } });

  owns(t: Tenant) {
    const u = this.auth.user();
    return !!u && (t.ownerUid === u.uid || t.memberEmails?.[0] === u.email);
  }

  /** A qué comercio entrar desde /app: el último usado, si no uno propio, si no el
   *  primero. Antes era siempre el primero por slug, y quien era dueño de uno y
   *  empleado de otro podía caer en el ajeno y "perder" el rol de dueño. */
  readonly homeTenant = computed(() => {
    const list = this.tenants();
    let last: string | null = null;
    try { last = localStorage.getItem(LAST_TENANT); } catch { /* idem */ }
    return list.find(t => t.id === last) ?? list.find(t => this.owns(t)) ?? list[0] ?? null;
  });

  // ── subcolecciones del comercio activo ─────────────────────────────────────
  private sub<T>(name: string, idField?: string) {
    return toSignal(
      toObservable$(() => this.currentId()).pipe(
        switchMap(id => id
          ? collectionData(collection(this.db, 'tenants', id, name),
              idField ? { idField } : undefined) as Observable<T[]>
          : of([] as T[]))),
      { initialValue: [] as T[] });
  }

  readonly cards = this.sub<GiftCard>('cards');
  readonly redemptions = this.sub<Redemption>('redemptions');
  readonly staff = this.sub<StaffMember>('staff');

  readonly business = computed(() => this.current()?.business ?? EMPTY_BUSINESS);

  // ── RBAC: quién soy en el comercio activo y qué puedo ────────────────────────
  readonly currentMember = computed(() => {
    const email = this.auth.user()?.email ?? null;
    return email ? this.staff().find(m => m.email === email) ?? null : null;
  });
  /** Dueño = el uid que lo creó, o su doc de staff con role 'owner'. Lo segundo
   *  cubre que el uid cambie (cuenta borrada y vuelta a crear, seed con otro
   *  usuario): la membresía es por correo, así que el dueño también. */
  readonly isOwner = computed(() => {
    const uid = this.auth.uid();
    return (!!uid && this.current()?.ownerUid === uid) || this.currentMember()?.role === 'owner';
  });
  /** El owner puede todo; el resto, según su permiso. La UI oculta con esto;
   *  las Firestore Rules son las que mandan de verdad. */
  can(p: Perm): boolean {
    return this.isOwner() || (this.currentMember()?.perms[p] ?? false);
  }

  /** Ventas y canjes de los últimos 6 meses, sacados de las cartas y los canjes
   *  reales (antes eran contadores del tenant que nadie actualizaba). */
  readonly monthly = computed<MonthPoint[]>(() => {
    const vm = this.business().validityMonths;
    const sold = this.cards().map(c => ({ ym: soldDate(c, vm).slice(0, 7), v: c.value }));
    const used = this.redemptions().map(r => ({ ym: redemptionMonth(r.at), v: r.amount }));
    const sum = (rows: { ym: string; v: number }[], ym: string) => rows.filter(r => r.ym === ym).reduce((s, r) => s + r.v, 0);
    return lastMonths(6).map(ym => ({ sold: sum(sold, ym), redeemed: sum(used, ym) }));
  });
  readonly soldThisMonth = computed(() => this.monthly().at(-1)?.sold ?? 0);

  /** Plata cobrada que el cliente todavía no consumió: deuda, no ingreso. */
  readonly debt = computed(() => liveOf(this.cards()).reduce((sum, c) => sum + c.balance, 0));
  readonly liveCards = computed(() => liveOf(this.cards()).length);
  readonly nextExpiry = computed(() => {
    const live = liveOf(this.cards());
    return live.length ? live.map(c => c.expires).sort()[0] : '—';  // ISO ordena como texto
  });

  // ── la página pública, sin sesión ──────────────────────────────────────────
  /** Un comercio publicado buscado por slug. Devuelve un resource para poder
   *  distinguir "cargando" de "no existe" sin inventar un estado extra. */
  publicTenant(slug: () => string) {
    return resource({
      params: slug,
      loader: async ({ params }) => {
        if (!params) return null;
        const snap = await getDocs(query(
          collection(this.db, 'pages'),
          where('business.slug', '==', params),
          where('business.published', '==', true)));
        if (snap.empty) return null;
        const tenant = cleanTenant({ id: snap.docs[0].id, ...snap.docs[0].data() } as PublicTenant);
        return { tenant };
      },
    });
  }

  /** Una gift card puntual para su página pública con QR. `key` es `slug|code`.
   *  ponytail: lee la carta por código sin sesión; el código es el secreto. En
   *  producción, las reglas deben permitir get de una `cards` solo por id, no list. */
  publicCard(key: () => string) {
    return resource({
      params: key,
      loader: async ({ params }) => {
        const [slug, code] = (params ?? '').split('|');
        if (!slug || !code) return null;
        const snap = await getDocs(query(
          collection(this.db, 'pages'),
          where('business.slug', '==', slug),
          where('business.published', '==', true)));
        if (snap.empty) return null;
        const business = cleanTenant(snap.docs[0].data() as { business: Business }).business;
        const cardSnap = await getDoc(doc(this.db, 'tenants', snap.docs[0].id, 'cards', code));
        if (!cardSnap.exists()) return null;
        return { business, card: cardSnap.data() as GiftCard };
      },
    });
  }

  /** Comercios publicados, para mostrar en la landing. Sin sesión. */
  publishedTenants() {
    return resource({
      loader: async () => {
        const snap = await getDocs(query(
          collection(this.db, 'pages'),
          where('business.published', '==', true)));
        return snap.docs.map(d => cleanTenant({ id: d.id, ...d.data() } as PublicTenant));
      },
    });
  }

  /** ¿Está libre ese link público? El id del comercio es su slug, así que basta
   *  con mirar si existe `pages/{slug}`. Una página ajena sin publicar no se puede
   *  leer (permiso denegado): eso también cuenta como ocupado. */
  async slugTaken(slug: string) {
    if (!slug) return false;
    try { return (await getDoc(doc(this.db, 'pages', slug))).exists(); }
    catch { return true; }
  }

  // ── escrituras ─────────────────────────────────────────────────────────────
  private tenantRef(id = this.currentId()!) { return doc(this.db, 'tenants', id); }

  async saveBusiness(patch: Partial<Business>) {
    const id = this.currentId();
    if (!id) return;
    const flat = Object.fromEntries(Object.entries(patch).map(([k, v]) => [`business.${k}`, v]));
    await updateDoc(doc(this.db, 'pages', id), flat);
  }

  /** Alta y edición de gift card: `code` es la clave, así que setDoc sirve para
   *  ambas. Editar no cambia el código (es la identidad de la carta). */
  async saveCard(card: GiftCard) {
    const id = this.currentId();
    if (id) await setDoc(doc(this.db, 'tenants', id, 'cards', card.code), card);
  }

  async removeCard(code: string) {
    const id = this.currentId();
    if (id) await deleteDoc(doc(this.db, 'tenants', id, 'cards', code));
  }

  /** Canje: descuenta del saldo y agrega el canje, en una transacción para que
   *  dos cajas no descuenten sobre el mismo saldo. Los canjes son append-only. */
  async redeem(code: string, amount: number) {
    const id = this.currentId();
    if (!id) throw new Error('sin comercio');
    const by = (this.auth.user()?.email ?? '').split('@')[0] || 'staff';
    const cardRef = doc(this.db, 'tenants', id, 'cards', code);
    await runTransaction(this.db, async tx => {
      const snap = await tx.get(cardRef);
      if (!snap.exists()) throw new Error('Esa gift card no existe.');
      const card = snap.data() as GiftCard;
      if (amount <= 0 || amount > card.balance) throw new Error('Monto inválido para el saldo disponible.');
      tx.update(cardRef, { balance: card.balance - amount });
      tx.set(doc(collection(this.db, 'tenants', id, 'redemptions')), { by, code, amount, at: nowStamp() });
    });
  }

  /** Emisión desde la página pública: sin sesión, con el tenant explícito.
   *  ponytail: escribe la carta directo, sin pago ni verificación. Antes de
   *  producción, esto va detrás de la pasarela de pago y de reglas que solo
   *  dejen crear `cards` a una función/servidor, no a cualquier visitante. */
  async issueCard(tenantId: string, card: GiftCard) {
    await setDoc(doc(this.db, 'tenants', tenantId, 'cards', card.code),
      { ...card, soldAt: new Date().toISOString(), channel: 'qr' });
  }

  async togglePerm(email: string, perm: Perm) {
    const id = this.currentId();
    const member = this.staff().find(m => m.email === email);
    if (id && member) {
      await updateDoc(doc(this.db, 'tenants', id, 'staff', email), { [`perms.${perm}`]: !member.perms[perm] });
    }
  }

  async addStaff(email: string, perms: Record<Perm, boolean>) {
    const id = this.currentId();
    if (!id) return;
    await setDoc(doc(this.db, 'tenants', id, 'staff', email), { email, role: 'staff', lastSeen: '—', perms });
    await updateDoc(this.tenantRef(id), { memberEmails: arrayUnion(email) });  // así puede entrar
  }

  async removeStaff(email: string) {
    const id = this.currentId();
    if (!id) return;
    await deleteDoc(doc(this.db, 'tenants', id, 'staff', email));
    await updateDoc(this.tenantRef(id), { memberEmails: arrayRemove(email) });
  }

  /** Baja de comercio (solo el dueño). ponytail: borra el doc del tenant; sus
   *  subcolecciones quedan huérfanas pero inaccesibles (sin el doc no hay
   *  membresía ni publicación). Una Cloud Function las limpiaría en producción. */
  async deleteTenant(id = this.currentId()) {
    if (!id) return;
    await deleteDoc(doc(this.db, 'pages', id));    // primero la página: deja de verse
    // Quien lo creó recupera el cupo: el contador baja en la misma escritura.
    const uid = this.auth.uid();
    const tenant = await getDoc(doc(this.db, 'tenants', id));
    const counter = uid ? await getDoc(doc(this.db, 'owners', uid)) : null;
    const batch = writeBatch(this.db);
    batch.delete(tenant.ref);
    if (counter && tenant.get('ownerUid') === uid && (counter.get('count') ?? 0) > 0) {
      batch.update(counter.ref, { count: counter.get('count') - 1, deleted: id });
    }
    await batch.commit();
  }

  /** Alta de comercio: lo que produce el wizard. Devuelve el id del tenant.
   *  Primero el tenant (lo privado): las reglas de la página y del staff miran
   *  ahí quién es el dueño. */
  async createTenant(business: Business, bank: Bank): Promise<string> {
    const user = this.auth.user();
    if (!user) throw new Error('sin sesión');

    const id = business.slug;
    const ownerEmail = user.email ?? user.uid;
    // El tenant y el contador de comercios del dueño van juntos: las reglas lo exigen.
    const counter = await getDoc(doc(this.db, 'owners', user.uid));
    const first = writeBatch(this.db);
    first.set(doc(this.db, 'tenants', id), { ownerUid: user.uid, memberEmails: [ownerEmail], bank });
    first.set(counter.ref, { count: (counter.get('count') ?? 0) + 1, created: id }, { merge: true });
    await first.commit();
    const batch = writeBatch(this.db);
    batch.set(doc(this.db, 'tenants', id, 'staff', ownerEmail), {
      email: ownerEmail, role: 'owner', lastSeen: 'hoy', perms: ALL_PERMS,
    });
    batch.set(doc(this.db, 'pages', id), { business });
    await batch.commit();
    return id;
  }

}

const LAST_TENANT = 'gkb.tenant';

/** Antes el logo se guardaba como `blob:` URL, que solo vale en la pestaña que lo
 *  creó: leído después es una imagen rota. Lo tratamos como "sin logo" (se ve la
 *  inicial) hasta que el comercio lo vuelva a subir. */
function cleanTenant<T extends { business: Business }>(t: T): T {
  return t.business?.logoUrl?.startsWith('blob:') ? { ...t, business: { ...t.business, logoUrl: null } } : t;
}
/** Mes `yyyy-mm` de un canje sellado `dd/mm HH:mm` (sin año): si el mes es
 *  posterior al actual, fue el año pasado. Alcanza para la ventana de 6 meses. */
export function redemptionMonth(at: string, today = new Date()): string {
  const m = +at.slice(3, 5);
  const y = today.getFullYear() - (m > today.getMonth() + 1 ? 1 : 0);
  return `${y}-${String(m).padStart(2, '0')}`;
}

const liveOf = (cards: GiftCard[]) => cards.filter(c => cardState(c) === 'activa');

/** Sello `dd/mm HH:mm` para el registro de canje, en hora local. */
function nowStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// helper local: signal -> observable sin arrastrar toObservable a cada archivo
import { toObservable } from '@angular/core/rxjs-interop';
import { computed as ngComputed } from '@angular/core';
function toObservable$<T>(fn: () => T): Observable<T> {
  return toObservable(ngComputed(fn));
}
