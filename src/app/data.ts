import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Firestore, addDoc, collection, collectionData, deleteDoc, doc, getDocs,
  query, setDoc, updateDoc, where,
} from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { AuthService } from './auth';

export type CardStatus = 'activa' | 'parcial' | 'canjeada' | 'vencida' | 'pagada';
export type ProductKind = 'fixed' | 'open' | 'service';
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
  bank: { bank: string; account: string; holder: string; nit: string };
}

export interface Product { id: string; kind: ProductKind; name: string; amount?: number; min?: number; max?: number }
export interface GiftCard { code: string; to: string; value: number; balance: number; status: CardStatus; expires: string }
export interface Redemption { by: string; code: string; amount: number; at: string }
export interface StaffMember { email: string; role: 'owner' | 'staff'; lastSeen: string; perms: Record<Perm, boolean> }

/** `tenants/{id}` en Firestore. Las listas son subcolecciones. */
export interface Tenant {
  id: string;
  business: Business;
  ownerUid: string;
  memberUids: string[];
  soldThisMonth: number;
  /** Firestore no permite arrays de arrays: cada mes es un objeto. */
  monthly: MonthPoint[];
}

export interface MonthPoint { sold: number; redeemed: number }

export const EMPTY_BUSINESS: Business = {
  name: '', slug: '', description: '', logoUrl: null, color: '#1c1b18',
  published: false, validityMonths: 12, terms: '',
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

  // ── los comercios de esta persona ──────────────────────────────────────────
  private readonly myTenants$: Observable<Tenant[]> = toObservable$(() => this.auth.uid()).pipe(
    switchMap(uid => uid
      ? collectionData(
          query(collection(this.db, 'tenants'), where('memberUids', 'array-contains', uid)),
          { idField: 'id' }) as Observable<Tenant[]>
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

  readonly products = this.sub<Product>('products', 'id');
  readonly cards = this.sub<GiftCard>('cards');
  readonly redemptions = this.sub<Redemption>('redemptions');
  readonly staff = this.sub<StaffMember>('staff');

  readonly business = computed(() => this.current()?.business ?? EMPTY_BUSINESS);
  readonly monthly = computed(() => this.current()?.monthly ?? []);
  readonly soldThisMonth = computed(() => this.current()?.soldThisMonth ?? 0);
  readonly netToCollect = computed(() => Math.round(this.soldThisMonth() * (1 - this.commissionRate)));

  /** Plata cobrada que el cliente todavía no consumió: deuda, no ingreso. */
  readonly debt = computed(() => liveOf(this.cards()).reduce((sum, c) => sum + c.balance, 0));
  readonly liveCards = computed(() => liveOf(this.cards()).length);
  readonly nextExpiry = computed(() => {
    const live = liveOf(this.cards());
    const key = (d: string) => d.split('/').reverse().join('');  // dd/mm/yy -> yymmdd
    return live.length ? live.map(c => c.expires).sort((a, b) => (key(a) < key(b) ? -1 : 1))[0] : '—';
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
        const prods = await getDocs(collection(this.db, 'tenants', tenant.id, 'products'));
        return { tenant, products: prods.docs.map(d => ({ id: d.id, ...d.data() }) as Product) };
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

  async addProduct(p: Omit<Product, 'id'>) {
    const id = this.currentId();
    if (id) await addDoc(collection(this.db, 'tenants', id, 'products'), p);
  }

  async removeProduct(productId: string) {
    const id = this.currentId();
    if (id) await deleteDoc(doc(this.db, 'tenants', id, 'products', productId));
  }

  async togglePerm(email: string, perm: Perm) {
    const id = this.currentId();
    const member = this.staff().find(m => m.email === email);
    if (id && member) {
      await updateDoc(doc(this.db, 'tenants', id, 'staff', email), { [`perms.${perm}`]: !member.perms[perm] });
    }
  }

  /** Alta de comercio: lo que produce el wizard. Devuelve el id del tenant. */
  async createTenant(business: Business, products: Omit<Product, 'id'>[]): Promise<string> {
    const user = this.auth.user();
    if (!user) throw new Error('sin sesión');

    const id = business.slug;
    await setDoc(doc(this.db, 'tenants', id), {
      business,
      ownerUid: user.uid,
      memberUids: [user.uid],
      soldThisMonth: 0,
      monthly: Array.from({ length: 6 }, () => ({ sold: 0, redeemed: 0 })),
    });
    await setDoc(doc(this.db, 'tenants', id, 'staff', user.email ?? user.uid), {
      email: user.email ?? user.uid, role: 'owner', lastSeen: 'hoy', perms: ALL_PERMS,
    });
    for (const p of products) {
      await addDoc(collection(this.db, 'tenants', id, 'products'), p);
    }
    return id;
  }

}

const liveOf = (cards: GiftCard[]) =>
  cards.filter(c => c.status !== 'vencida' && c.status !== 'canjeada');

// helper local: signal -> observable sin arrastrar toObservable a cada archivo
import { toObservable } from '@angular/core/rxjs-interop';
import { computed as ngComputed } from '@angular/core';
function toObservable$<T>(fn: () => T): Observable<T> {
  return toObservable(ngComputed(fn));
}
