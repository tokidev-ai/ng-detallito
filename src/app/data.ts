import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Firestore, arrayRemove, arrayUnion, collection, collectionData, deleteDoc, doc, getDoc, getDocs,
  query, runTransaction, setDoc, updateDoc, where,
} from '@angular/fire/firestore';
import { Observable, of, switchMap, tap } from 'rxjs';
import { AuthService } from './auth';
import { cardState } from './card';

export { cardState } from './card';
export type { CardState } from './card';
export type Perm = 'redeem' | 'viewCards' | 'viewSales' | 'manageProducts' | 'manageBranding' | 'manageStaff';

export interface Business {
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  color: string;
  published: boolean;
  validityMonths: number;
  terms: string;
  /** Montos que la página ofrece como botones. El cliente igual puede escribir
   *  uno libre, así que la lista puede estar vacía y la página sigue vendiendo. */
  suggestedAmounts: number[];
  bank: { bank: string; account: string; holder: string; nit: string };
}

/** `expires` es ISO `yyyy-mm-dd` (comparable y ordenable como texto). El estado
 *  no se guarda: se deriva con `cardState`. `code` es la clave del documento.
 *  `from` es opcional: el regalo puede ser anónimo. */
export interface GiftCard { code: string; to: string; from?: string; value: number; balance: number; expires: string }
export interface Redemption { by: string; code: string; amount: number; at: string }
export interface StaffMember { email: string; role: 'owner' | 'staff'; lastSeen: string; perms: Record<Perm, boolean> }

/** `tenants/{id}` en Firestore. Las listas son subcolecciones. */
export interface Tenant {
  id: string;
  business: Business;
  ownerUid: string;
  /** Membresía por correo: agregar un empleado por email basta para que entre,
   *  sin sincronizar uids. El dueño va incluido. */
  memberEmails: string[];
  soldThisMonth: number;
  /** Firestore no permite arrays de arrays: cada mes es un objeto. */
  monthly: MonthPoint[];
}

export interface MonthPoint { sold: number; redeemed: number }

export const EMPTY_BUSINESS: Business = {
  name: '', slug: '', description: '', logoUrl: null, color: '#1c1b18',
  published: false, validityMonths: 12, terms: '', suggestedAmounts: [],
  bank: { bank: '', account: '', holder: '', nit: '' },
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

  /** false hasta que Firestore contesta la lista de comercios de esta persona.
   *  Sirve para no confundir "todavía cargando" con "no tiene ninguno". */
  readonly tenantsLoaded = signal(false);

  // ── los comercios de esta persona (por su correo) ───────────────────────────
  private readonly myTenants$: Observable<Tenant[]> = toObservable$(() => this.auth.user()?.email ?? null).pipe(
    switchMap(email => email
      ? (collectionData(
          query(collection(this.db, 'tenants'), where('memberEmails', 'array-contains', email)),
          { idField: 'id' }) as Observable<Tenant[]>).pipe(tap(() => this.tenantsLoaded.set(true)))
      : of([])),
  );
  readonly tenants = toSignal(this.myTenants$, { initialValue: [] as Tenant[] });

  readonly current = computed(() => this.tenants().find(t => t.id === this.currentId()) ?? null);
  setCurrent(id: string | null) { this.currentId.set(id); }

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
  readonly monthly = computed(() => this.current()?.monthly ?? []);

  // ── RBAC: quién soy en el comercio activo y qué puedo ────────────────────────
  readonly isOwner = computed(() => {
    const uid = this.auth.uid();
    return !!uid && this.current()?.ownerUid === uid;
  });
  readonly currentMember = computed(() => {
    const email = this.auth.user()?.email ?? null;
    return email ? this.staff().find(m => m.email === email) ?? null : null;
  });
  /** El owner puede todo; el resto, según su permiso. La UI oculta con esto;
   *  las Firestore Rules son las que mandan de verdad. */
  can(p: Perm): boolean {
    return this.isOwner() || (this.currentMember()?.perms[p] ?? false);
  }

  readonly soldThisMonth = computed(() => this.current()?.soldThisMonth ?? 0);
  readonly netToCollect = computed(() => Math.round(this.soldThisMonth() * (1 - this.commissionRate)));

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
          collection(this.db, 'tenants'),
          where('business.slug', '==', params),
          where('business.published', '==', true)));
        if (snap.empty) return null;
        const tenant = { id: snap.docs[0].id, ...snap.docs[0].data() } as Tenant;
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
          collection(this.db, 'tenants'),
          where('business.slug', '==', slug),
          where('business.published', '==', true)));
        if (snap.empty) return null;
        const business = (snap.docs[0].data() as Tenant).business;
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
          collection(this.db, 'tenants'),
          where('business.published', '==', true)));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Tenant);
      },
    });
  }

  /** ¿Está libre ese link público? Consulta global, no solo mis comercios. */
  async slugTaken(slug: string, exceptId?: string) {
    if (!slug) return false;
    const snap = await getDocs(query(collection(this.db, 'tenants'), where('business.slug', '==', slug)));
    return snap.docs.some(d => d.id !== exceptId);
  }

  // ── escrituras ─────────────────────────────────────────────────────────────
  private tenantRef(id = this.currentId()!) { return doc(this.db, 'tenants', id); }

  async saveBusiness(patch: Partial<Business>) {
    const id = this.currentId();
    if (!id) return;
    const flat = Object.fromEntries(Object.entries(patch).map(([k, v]) => [`business.${k}`, v]));
    await updateDoc(this.tenantRef(id), flat);
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
    await setDoc(doc(this.db, 'tenants', tenantId, 'cards', card.code), card);
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
    if (id) await deleteDoc(doc(this.db, 'tenants', id));
  }

  /** Alta de comercio: lo que produce el wizard. Devuelve el id del tenant. */
  async createTenant(business: Business): Promise<string> {
    const user = this.auth.user();
    if (!user) throw new Error('sin sesión');

    const id = business.slug;
    const ownerEmail = user.email ?? user.uid;
    await setDoc(doc(this.db, 'tenants', id), {
      business,
      ownerUid: user.uid,
      memberEmails: [ownerEmail],
      soldThisMonth: 0,
      monthly: Array.from({ length: 6 }, () => ({ sold: 0, redeemed: 0 })),
    });
    await setDoc(doc(this.db, 'tenants', id, 'staff', ownerEmail), {
      email: ownerEmail, role: 'owner', lastSeen: 'hoy', perms: ALL_PERMS,
    });
    return id;
  }

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
