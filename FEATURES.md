# GiftCards Bolivia — Features MVP

> Stack: **Angular + Firebase**. Actualizado: 2026-09-06.
> Alcance: Fase 1 del [PLAN.md](PLAN.md). Todo lo que no está aquí es Fase 2+.

---

## Modelo de roles

Firebase Auth + **custom claims**:
`{ superadmin: true }` o `{ tenants: { [tenantId]: { role: 'owner' | 'staff', perms: string[] } } }`.
Un solo claim, leído por los Security Rules de Firestore y por un guard de Angular.

| Rol | Puede |
|---|---|
| **superadmin** (nosotros) | ver/editar todos los comercios, confirmar pagos, generar liquidaciones, suspender comercios |
| **owner** (dueño del comercio) | todo lo de su comercio + gestionar empleados y sus permisos. Siempre tiene todos los permisos |
| **staff** (empleado) | solo lo que el owner le habilite (ver abajo) |
| **público** (sin login) | página del comercio, comprar, ver su gift card |

### Permisos de empleado (los marca el owner con checkboxes)

| Permiso | Habilita |
|---|---|
| `redeem` | canjear gift cards (el default, todo empleado lo tiene) |
| `viewCards` | ver el listado de gift cards y sus saldos |
| `viewSales` | ver ventas y el dashboard con montos |
| `manageProducts` | crear y editar productos, montos y vigencia |
| `manageBranding` | editar marca, logo, colores y página pública |
| `manageStaff` | agregar y quitar empleados |

**Lo que nunca se delega:** datos bancarios y liquidaciones son solo del owner.

> `ponytail:` lista fija de 6 permisos, no roles creables por el comercio. Un negocio de 3 empleados
> no necesita un motor de RBAC. Si alguna vez piden roles propios, esto se convierte en presets sobre
> el mismo array de strings.

## 1. Auth y cuentas

Firebase Auth con **Google + email/password**. Sin PIN, sin emails de invitación propios
(el reset de password lo manda Firebase solo, cero código).

- [ ] 1. Login con Google o email/password (mismo botón para comercio y staff) — **3h**
- [ ] 2. Registro de comercio: primer login crea tenant + claim `owner` en una Cloud Function — **4h**
- [ ] 3. Agregar staff: el owner escribe el email y marca los permisos en el panel → queda en
      `tenants/{id}/staff/{email}`. Cuando esa persona entra, la Function le asigna el claim. Sin invitaciones — **5h**
- [ ] 4. Editar permisos de un empleado (checkboxes) o quitarlo → la Function actualiza/revoca el claim — **3h**
- [ ] 5. Guards de Angular por permiso + Security Rules que hacen cumplir lo mismo en Firestore — **8h**
- [ ] 6. Ocultar en la UI lo que el permiso no habilita (la regla de Firestore es la que manda, la UI solo acompaña) — **3h**

## 2. Panel del comercio (owner)

- [ ] 7. Configuración de marca: logo, color, nombre, descripción, slug público — **6h**
- [ ] 8. Datos bancarios para liquidación (banco, cuenta, titular, NIT) — **3h**
- [ ] 9. Productos: monto fijo / monto abierto (min-max) / servicio con precio — **8h**
- [ ] 10. Vigencia (meses) y términos por comercio — **2h**
- [ ] 11. Publicar / despublicar la página pública — **2h**
- [ ] 12. Dashboard: vendido del mes, **saldo pendiente de canje mostrado como deuda**, canjes del mes — **8h**
- [ ] 13. Listado de gift cards con estado (pagada, activa, parcial, canjeada, vencida) — **5h**
- [ ] 14. Listado de canjes (quién, cuándo, cuánto) — **3h**

## 3. Página pública + compra

- [ ] 15. Página del comercio en `/{slug}` con su marca y productos — **8h**
- [ ] 16. Checkout: monto, mensaje, datos del destinatario, email del comprador — **8h**
- [ ] 17. Crea `order` en estado `pending` y muestra **nuestro QR** con referencia de pago — **4h**
- [ ] 18. Página de "estamos confirmando tu pago" (polling al doc de la order) — **3h**

## 4. Pagos — ⏸️ EN ESPERA

**La integración bancaria está congelada hasta saber con qué banco trabajamos y qué expone su API.**
Mientras tanto se construye el **puente manual**: el flujo completo funciona, solo que la confirmación
del pago la hace el superadmin en vez del banco. Cuando llegue la API, reemplaza ese paso y no toca
nada más — la emisión, el email y el canje ya quedan hechos y probados.

### Puente manual (esto sí se construye ahora)

- [ ] 19. QR estático nuestro en el checkout + **referencia visible** que el comprador copia en la glosa — **4h**
- [ ] 20. El superadmin marca la orden como pagada → dispara la Function de emisión (idempotente,
      no emite dos veces aunque se toque dos veces el botón) — **6h**
- [ ] 21. **Colección `payments`**: monto, fecha, `orderId`, `tenantId`, estado, quién confirmó — **3h**
- [ ] 22. Expiración de órdenes no pagadas (la orden pasa a `expired`) — **3h**

### Congelado hasta definir el banco

Sin estimar todavía. El diseño previsto es **un QR por orden** generado vía la API del banco con
nuestro `orderId` como referencia externa, para que la atribución sea un lookup y no una conciliación
a ojo. Queda pendiente:

- ⏸️ Generar QR por orden vía API del banco (con `bankRef` y expiración)
- ⏸️ Recibir la confirmación del banco (webhook o cron que consulta)
- ⏸️ Deduplicación por `bankRef`
- ⏸️ Bandeja de pagos huérfanos (plata sin referencia reconocible)
- ⏸️ Detección de discrepancia de monto
- ⏸️ Cuadre diario: total del banco vs. total registrado

**Lo que hay que averiguar antes de descongelarla:** ¿el banco permite un QR por transacción con
referencia propia? ¿notifica por webhook o hay que consultar? ¿la consulta de movimientos devuelve
la referencia o solo monto y fecha? ¿hay dispersión masiva por API? ¿hay sandbox?

## 5. Gift card y entrega

- [ ] 23. Generación de código único aleatorio (no secuencial) con dígito verificador — **3h**
- [ ] 24. PDF con QR, generado en la Function y subido a Storage — **8h**
- [ ] 25. Email al destinatario + copia al comprador (Resend vía Function, o la extensión Trigger Email).
      Único email que mandamos nosotros: la entrega de la gift card — **5h**
- [ ] 26. Página pública `/gc/{código}` — saldo e historial, sin login — **4h**

## 6. Canje

- [ ] 27. Staff logueado → buscar por código o escanear QR — **6h**
- [ ] 28. Ver saldo e historial — **3h**
- [ ] 29. Descontar monto (parcial permitido) dentro de un **`runTransaction`** — reemplaza a `SELECT ... FOR UPDATE` — **6h**
- [ ] 30. `redemptions` append-only; **el saldo se recalcula, nunca se edita a mano** — **3h**
- [ ] 31. Bloqueos: vencida, sin saldo, comercio suspendido — **3h**

## 7. Panel superadmin

### Pagos y conciliación

- [ ] 32. **Bandeja de pagos**: todos los `payments` con filtro por fecha, comercio y estado
      (pendiente / confirmado / devuelto) — **8h**
- [ ] 33. Confirmar un pago pendiente desde la bandeja (el puente manual de la sección 4) — **4h**
- [ ] 34. Detalle de un pago: orden, comercio, gift card emitida — **3h**

### Liquidación mensual

- [ ] 35. **Corte mensual por comercio**: suma de `payments` confirmados del período − comisión = neto a depositar — **8h**
- [ ] 36. Vista de distribución del mes: tabla de todos los comercios con bruto, comisión, neto y datos bancarios — **5h**
- [ ] 37. **Exportar la planilla de transferencias** del mes para cargarla en la banca en línea
      (la dispersión por API queda para cuando se defina el banco) — **5h**
- [ ] 38. Marcar liquidación como pagada + guardar el comprobante y el ID de transferencia del banco — **4h**
- [ ] 39. **Saldo de la cuenta ómnibus**: cuánto hay, cuánto es deuda con comercios, cuánto es nuestro — **4h**

### Comercios

- [ ] 40. Lista de comercios: estado, ventas, saldo adeudado, suspender — **5h**
- [ ] 41. Log de eventos de todo lo que toca dinero (`events`, append-only) — **5h**

## 8. Infraestructura

- [ ] 42. Firestore con `tenantId` en cada doc + Security Rules por claim — **8h**
- [ ] 43. Cloud Functions: confirmación de pago, emisión, canje, liquidación, asignación de claims — **6h**
- [ ] 44. Storage: logos, PDFs, comprobantes — **3h**
- [ ] 45. Hosting + dominio — **3h**
- [ ] 46. **Backup diario de Firestore a GCS** — no negociable, hay dinero ajeno — **4h**

---

## Estimación de desarrollo

> **Aproximado, no un compromiso.** Horas de trabajo efectivo de un dev senior, con margen para las
> idas y vueltas normales. **No incluyen la integración bancaria, que está en espera** (§4).

Dos columnas: **solo** es el baseline escribiendo todo a mano; **con Claude Code** es el mismo alcance
con desarrollo asistido, incluyendo el tiempo humano de dirigir, revisar y corregir — que no es cero.

| Sección | Features | Solo | Con Claude Code | Factor |
|---|---|---|---|---|
| 1. Auth y cuentas | 6 | 26h | **12h** | 2,2× |
| 2. Panel del comercio (owner) | 8 | 37h | **14h** | 2,6× |
| 3. Página pública + compra | 4 | 23h | **10h** | 2,2× |
| 4. Pagos — ⏸️ EN ESPERA | 4 | 16h | **8h** | 2,0× |
| 5. Gift card y entrega | 4 | 20h | **9h** | 2,2× |
| 6. Canje | 5 | 21h | **12h** | 1,8× |
| 7. Panel superadmin | 10 | 51h | **20h** | 2,6× |
| 8. Infraestructura | 5 | 24h | **15h** | 1,6× |
| **Total** | **46** | **218h** | **100h** | **2,2×** |

---

## Fuera del MVP (deliberadamente)

Entrega programada · plantillas de diseño · subdominio propio por comercio · devoluciones automáticas ·
export a Excel · reportes avanzados · app nativa · paquetes de sesiones · multi-idioma ·
roles creables por el comercio · permisos a nivel de campo · marketplace · API pública · PIN de canje · invitaciones por email · SSO empresarial.
