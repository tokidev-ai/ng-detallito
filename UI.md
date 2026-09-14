# UI — frames del prototipo y plan de implementación en Angular

> Fuente: canvas de baja fidelidad, ronda 1 (9 wireframes).
> Actualizado: 2026-09-14.

---

## 1. Los 9 frames

| # | Qué es | Contenido observado |
|---|---|---|
| **1a** | Checkout en **una sola página** (móvil, `giftcards.bo/spa-aurora`) | portada + logo + "Spa Aurora / Masajes y estética · La Paz". Montos Bs 150 / **Bs 250 ✓** / Bs 400 / "otro monto". Bloque PARA QUIÉN: nombre, email, mensaje opcional, email del comprador. Total Bs 250 → **Pagar con QR**. Pie: "Vence en 12 meses · términos del comercio" |
| **1b** | El **mismo checkout como wizard de 3 pasos** | paso 1 de 3 con barra de progreso. "¿Cuánto querés regalar?" → card del comercio, Gift card Bs 250 ✓, Bs 400, **Masaje relajante 60' Bs 180** (producto-servicio), **Monto abierto (Bs 100 – 1.000)** → Continuar |
| **1c** | Panel del comercio con **sidebar** | nav: Resumen · Gift cards · Canjes · Productos · Marca y página · Empleados · Datos bancarios. Header "Publicada · ver página". 3 tiles: VENDIDO DEL MES Bs 2.000 (8 gift cards) / CANJEADO Bs 1.150 (11 canjes) / **A DEPOSITARTE (30/09) Bs 1.900** (bruto 2.000 − comisión 5%). Banner **Bs 3.480 "Saldo pendiente de canje — es deuda, no ingreso"**. Tabla: código / destinatario / valor / saldo / estado (parcial, activa, canjeada, vencida, pagada). Nota: "los ítems se ocultan según permisos" |
| **1d** | El **mismo panel con tabs** arriba | tabs: Resumen · Gift cards · Canjes · Productos · Marca · Equipo · Cobros. Header con slug, "Compartir link", "Ana (owner)". La **deuda pasa a ser la cifra principal**: Bs 3.480, "de 19 gift cards vivas · vence la más próxima el 14/11", barra activas/parciales/por vencer. Tiles secundarios VENDIDO SEP Bs 2.000 y NETO A COBRAR Bs 1.900. Gráfico VENTAS vs CANJES · 6 MESES. Panel ÚLTIMOS CANJES (append-only: el saldo se recalcula) |
| **1e** | **Onboarding del comercio**, wizard de 5 pasos | 1 Marca · 2 Productos · 3 Vigencia y términos · 4 Datos bancarios · 5 Publicar. Paso 1: logo, nombre, link público `giftcards.bo/spa-aurora`, descripción corta, color de marca (3 swatches + `+`). **Vista previa móvil en vivo** al costado. "sin plantillas de diseño en el MVP: logo + 1 color + descripción" |
| **1f** | **Canje en el local** (móvil, empleado logueado) — 3 pantallas | (1) "Canjear una gift card": escanear QR (cámara del navegador) o escribir código `4821 KQ7` → Buscar. (2) detalle: **Bs 180** saldo disponible, valor original Bs 250, chips `activa` `vence 14/11/26`, HISTORIAL (02/09 Luis −Bs 70, 18/08 emisión +Bs 250), "¿CUÁNTO SE CONSUMIÓ?" Bs 120 + atajos `todo (180)` `mitad`, "Queda Bs 60 para la próxima visita" → Confirmar canje. (3) éxito: ✓ "Canje registrado −Bs 120", saldo restante Bs 60, timestamp + empleado, "Canjear otra". Estados de bloqueo: vencida · sin saldo · comercio suspendido. Sin PIN |
| **1g** | **Superadmin · bandeja de pagos** (el puente manual) | filtros pendientes / confirmados / devueltos / fecha. Tabla referencia · monto · comercio · hora + botón `confirmar` por fila. Incluye una fila **"sin glosa"** sin comercio. Detalle lateral: orden `ord_8f21`, comercio, comprador, monto, estado `pending`, comprobante del banco (imagen), **Marcar como pagada** / **Sin referencia reconocible**. "idempotente: dos clics = una sola gift card" |
| **1h** | **Superadmin · corte mensual** | "Liquidación · agosto 2026 · cerrado el 01/09", botones Recalcular corte / **Exportar planilla de transferencias**. Tiles: EN LA CUENTA ÓMNIBUS Bs 214.300 / **DEUDA CON COMERCIOS Bs 198.450** / NUESTRA COMISIÓN (5%) Bs 10.440 / A TRANSFERIR HOY Bs 37.820 (86 comercios). Tabla comercio · bruto · comisión · neto · cuenta · estado (pendiente/pagada/revisar) + "Marcar seleccionadas como pagadas". "al marcar pagada: comprobante + ID de transferencia" |
| **1i** | **Equipo y permisos** | lista de empleados (`luis@spaaurora.bo`, staff, último acceso), 6 checkboxes: redeem, viewCards, viewSales, manageProducts, manageBranding, manageStaff — cada uno con su descripción. "Datos bancarios y liquidaciones no se delegan nunca." Campo AGREGAR: email del empleado, "cuando entre con ese email queda habilitado". "la UI oculta; Firestore Rules es lo que manda" |

### Decisiones abiertas que plantea el propio prototipo
- **1a vs 1b** — checkout de una página vs wizard de 3 pasos.
- **1c vs 1d** — sidebar vs tabs, y si la deuda es banner secundario o cifra principal.
- Faltan los **estados de error del canje** dibujados (solo están listados).

### Pantallas que el MVP necesita y **no están en el prototipo**
QR de pago + referencia para la glosa · "estamos confirmando tu pago" con polling ·
email y PDF de entrega · página pública `/gc/{código}` ·
login · lista de comercios del superadmin .

---

## 2. Plan Angular

Angular standalone + signals, `@angular/fire`, rutas lazy por área. Sin NgRx: el estado que importa
vive en Firestore y llega por `collectionData()`; lo demás son signals locales.

### Rutas (implementadas)

```
/app                          lista de comercios · punto de entrada multitenant
/onboarding                   wizard de 5 pasos + vista previa en vivo  (1e)
/app/:tenant/resumen          dashboard · tabs en desktop, bottom nav en móvil  (1d)
/app/:tenant/gift-cards       tabla en desktop, tarjetas en móvil
/app/:tenant/canjes           append-only
/app/:tenant/productos
/app/:tenant/marca
/app/:tenant/equipo           los 6 permisos  (1i)
/app/:tenant/cobros
/:slug                        página pública del comercio (404 si no está publicada)
```

### Rutas pendientes

```
/:slug/pagar/:orderId     QR + referencia + polling   ← falta dibujar
/gc/:code                 saldo e historial           ← falta dibujar
/login
/app/:tenant/canjear      canje en el local  (1f)
/admin/pagos              bandeja del superadmin  (1g)
/admin/liquidaciones      corte mensual  (1h)
/admin/comercios
```

### Orden de construcción

| Fase | Qué | Frames | Por qué antes |
|---|---|---|
| 0 | proyecto, Firebase, `authState`, claims, `permGuard`, layout base | — | todo lo demás lo necesita |
| 1 | onboarding + marca + productos | 1e | sin comercio configurado no hay nada que mostrar |
| 2 | página pública + checkout + orden `pending` + QR | 1a/1b | es la mitad del producto |
| 3 | bandeja de pagos + emisión (Function idempotente) | 1g | cierra el circuito del dinero |
| 4 | canje | 1f | lo que el comercio usa todos los días |
| 5 | dashboard + listados | 1c/1d | se puede leer de datos que ya existen |
| 6 | liquidación mensual + planilla | 1h | recién sirve con un mes de datos |
| 7 | equipo y permisos | 1i | el owner solo funciona hasta que hay empleados |

### Componentes compartidos (los únicos que se repiten de verdad)

`<gc-stat>` (tile de cifra: 1c, 1d, 1h) · `<gc-money>` (pipe de Bs) · `<gc-status>` (chip de estado:
1c, 1g, 1h, 1f) · `<gc-wizard>` (barra de pasos: 1b y 1e) · `<gc-table>` **no** — las 4 tablas tienen
columnas y acciones distintas, un componente genérico costaría más que las 4 plantillas.

> `ponytail:` sin librería de UI ni design system propio. El prototipo es de baja fidelidad y el
> onboarding ofrece "logo + 1 color + descripción": CSS custom properties por tenant alcanzan.
> Si hacen falta 20 componentes accesibles, entra Angular CDK — no una suite entera.

---

## 3. Firebase

Proyecto **`giftcards-bo`** ("GiftCards Bolivia") · console.firebase.google.com/project/giftcards-bo

### Forma en Firestore

```
tenants/{tenantId}                 business{}, ownerUid, memberUids[], soldThisMonth, monthly[]
  products/{autoId}                kind, name, amount | min+max
  cards/{code}                     to, value, balance, status, expires
  redemptions/{autoId}             by, code, amount, at      ← append-only
  staff/{email}                    role, lastSeen, perms{}
```

`tenantId` es el slug: el link público y la clave del tenant son la misma cosa, así que
`giftcards.bo/spa-aurora` es un `getDoc` directo y no hace falta un índice de slugs aparte.

### Aislamiento

La membresía vive en `memberUids` del doc del tenant, **no en custom claims**. Eso evita una
Cloud Function y un deploy de claims por cada alta de empleado. Las reglas están en
`firestore.rules` y ya desplegadas.

Lo que es público sin sesión: el doc del tenant **solo si `business.published == true`**, y su
subcolección `products` (la página de compra la necesita). Saldos, canjes y empleados nunca
salen del comercio. `redemptions` es append-only a nivel de regla: no hay update ni delete.

> `ponytail:` membresía por array en vez de claims. Si un comercio llega a cientos de empleados,
> el array deja de escalar y esto pasa a custom claims + Cloud Function.
