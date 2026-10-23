# GiftKBol — Guía de estilos

Lo que fuimos decidiendo y por qué. Cada regla está acá porque algo falló antes sin ella.

---

## 1. Marca

**GiftKBol.** Sin logo ni símbolo: la marca es la palabra, `Gift` en negro y `KBol` en
naranja (`<app-wordmark>`). Un solo componente, sin archivos de imagen.

---

## 2. Color

Tema **claro**, en la línea de shadcn: escala de grises zinc, superficies blancas,
bordes de 1px, radio 0.5rem y sombras apenas perceptibles.

| Token | Valor | Para qué |
|---|---|---|
| `base-100` | `#ffffff` | tarjetas, inputs, barras |
| `base-200` | `#fafafa` | fondo de página (zinc-50) |
| `base-300` | `#e4e4e7` | bordes y separadores (zinc-200) |
| `base-content` | `#09090b` | texto |
| `primary` | `#ea580c` | acciones y acentos (orange-600) |
| `secondary` | `#f4f4f5` | el botón secundario de shadcn |
| `accent` | `#fff7ed` | fondos teñidos de naranja (orange-50) |

Todo vive en **un bloque** al principio de `src/styles.css`. Los componentes usan solo
tokens de daisyUI, así que cambiar la paleta no toca ninguna plantilla.

### La regla del naranja

**Un solo bloque naranja sólido por pantalla.** El resto del naranja va en detalles:
el subrayado del titular, las cifras, los verificados.

Probamos una franja naranja completa detrás de las cifras y falló: el naranja ya es el
color del botón, y dos bloques grandes del mismo color compiten hasta que gana el más
grande — que era la franja, no el botón. Si el naranja está en todos lados, el ojo no
sabe dónde hay que tocar.

### Sin gradientes

La primera marca tenía un degradado naranja → magenta → violeta. Se fue entero.
Colores planos: se leen mejor en pantallas malas y no envejecen.

**Excepción: la página del comercio (`storefront.ts`).** Ahí se pidió explícitamente algo
"bien llamativo, con más colores". Es del comercio, no nuestra, y compite por atención en
WhatsApp/Instagram. Vale ahí, en la página del regalo y en la gift card misma. El panel
sigue plano; la landing usa aurora tenue de fondo y muestra tarjetas con la paleta del
producto, pero sus botones y bloques naranjas siguen planos.

### Sin modo oscuro

Se pidió claro. Agregarlo es mantener dos paletas para una que nadie miró todavía.

### La página del comercio no lleva nuestro color

El scope `.storefront` le pone un `primary` neutro. Lo único que tiñe ahí es **el color
del comercio**: si le metiéramos el naranja, Spa Aurora y Barbería Nor se verían iguales
y se cae la premisa del producto. El naranja es nuestro y se queda del lado de adentro.

---

## 3. Contraste

**Medir antes de dar por bueno.** Todo texto llega a **4,5:1** (AA para texto normal).

Lo medido hasta ahora:

| Texto | Sobre | Ratio | |
|---|---|---|---|
| orange-600 `#ea580c` | blanco | 3,56 | ✗ |
| orange-600 | orange-50 | 3,35 | ✗ |
| orange-700 `#c2410c` | blanco | 5,18 | ✓ |
| orange-700 | orange-50 | 4,88 | ✓ |
| orange-800 al 75% | orange-50 | 4,06 | ✗ |
| orange-800 pleno | orange-50 | 6,88 | ✓ |
| `base-content` al 60% | blanco | 5,32 | ✓ |

> **El naranja de marca no sirve para texto.** `primary` es para fondos de botón, donde
> el texto va blanco encima. Para texto naranja sobre fondo claro se usa **orange-700**.
> A simple vista es el mismo naranja; la diferencia la nota alguien leyendo el celular
> al sol, que es exactamente donde un dueño de barbería va a abrir este link.

---

## 4. Tipografía

- **Titulares:** `font-extrabold`, tracking cerrado (`-0.045em` en el h1, `-0.03em` en
  cifras) y altura de línea corta (`0.98`–`1.04`). El tracking cerrado es lo que más
  separa un titular diseñado de uno por defecto, y es lo que nadie nota conscientemente.
- **`text-balance`** en todo titular: reparte las líneas y evita ragos feos.
- **Jerarquía por tamaño y color, no por cajas.** Probamos meter las cifras en tarjetas
  (blancas y naranjas) y en los dos casos encerraban de más y competían con el mockup,
  que ya es una caja grande al lado. Quedó: cifra grande en naranja, descripción chica
  en gris, una línea vertical que separa sin encerrar.
- **Subrayado a mano** bajo la frase clave del titular: un SVG irregular que se traza
  con `stroke-dashoffset`. Marca mejor que pintar una línea entera de naranja, porque
  deja el resto del titular en negro, que es donde está la fuerza.

---

## 5. Movimiento

- `[reveal]` anima la entrada cuando el elemento aparece en pantalla. El atributo acepta
  `1`–`4` para escalonar un grupo.
- **Todo se apaga con `prefers-reduced-motion`.** Nada del movimiento es información.
- **Red de seguridad obligatoria:** en una pestaña de fondo el `IntersectionObserver` no
  dispara. Sin el timeout de respaldo, quien abre el link en otra pestaña se encuentra
  una página en blanco. Ya pasó una vez.

---

## 6. Idioma

Español latinoamericano neutro, **tuteo**. Sin voseo rioplatense: *sabes*, no *sabés*;
*crea tu comercio*, no *creá*; *elige el monto*, no *elegí*. Los clientes son bolivianos.

---

## 7. La landing

Estructura (rediseño de sep. 2026): **hero → marquesina de rubros → cómo funciona →
bento oscuro de beneficios + cifras → cierre**.

- **Hero claro con aurora tenue** (manchas naranja/ámbar/rosa a baja opacidad sobre la
  trama de puntos). El titular y el subrayado de *gift cards* se mantienen.
- **El producto es un abanico de 3 gift cards** de comercios de ejemplo, cada una con su
  color y la misma paleta derivada que las tarjetas reales (`.storefront` + `--c1`), así
  la landing muestra exactamente lo que el comercio va a vender. Flotan desfasadas
  (`.fan`), con una notificación de "Nueva venta" en bucle y el chip de canje.
  Los desplazamientos del abanico se escalan con `--k` según el ancho: en móvil no se sale.
- **Marquesina de rubros, no de nombres** (💈 Barberías ✦ 💆 Spas…): no presenta comercios
  inventados como clientes.
- **Bento oscuro (`bg-neutral`)** con mini demos animadas: tarjeta que cambia de color,
  escaneo de QR, gráfico que se dibuja, burbuja de WhatsApp. El naranja ahí va en cifras
  y acentos; los botones siguen siendo el único naranja sólido.

### En móvil

En un teléfono entran unos **640px útiles** antes del primer scroll: titular, texto y el
abanico entran ahí. Medido en cada cambio.

- **El hero no lleva botones.** El CTA vive en la barra, que es fija: acompaña todo el
  scroll en vez de quedarse atrás en la primera pantalla.
- **Todo el bloque de texto va centrado**; en escritorio vuelve a la izquierda.

### Sin precio

**La landing no menciona la comisión.** Hablar de precio antes de que el negocio entienda
qué gana espanta a quien recién llega. Esa conversación va después.

### Nada falso

- Los nombres de la tira de comercios son **inventados**. Poner marcas reales como
  clientes es un aval falso, y eso es un problema legal, no de diseño.
- Se reemplazan por comercios de verdad cuando los haya.

---

## 7b. El panel del comercio

- **Barra lateral en escritorio** (`shell.ts`): wordmark, selector de comercio (avatar con
  el logo o la inicial sobre el color del comercio + estado publicada/borrador), menú con
  íconos (`.nav-item`, activo en `primary/10` con texto orange-700), "Ver mi página" y
  abajo el usuario con "Salir". Arriba, barra con el título de la sección y "Compartir
  link". En móvil: selector arriba y barra inferior.
- **Dashboard** (`resumen.ts`): saludo + acciones rápidas (Canjear, Nueva gift card →
  `gift-cards?nueva=1` abre el formulario), 4 KPIs (la deuda es la **única tarjeta
  oscura**: es la cifra estrella), ventas vs canjes en dos líneas con tooltip por mes,
  dona por estado, próximos vencimientos (rojo ≤7 días, ámbar ≤30) y últimos canjes.
  Los cálculos (`daysUntil`, `pctChange`, `stampKey`) viven en `card.ts` con tests.
- **Editar página guarda con botón, no al tipear.** Un color tocado por accidente se
  publicaba solo. Ahora hay un borrador (`draft`): los campos y la vista previa muestran
  lo guardado + lo pendiente, y una barra flotante ofrece Descartar / Guardar cambios.
  Salir con cambios pendientes pregunta (`canDeactivate` + `beforeunload`). Publicar /
  despublicar sigue siendo inmediato: es un botón explícito.
- Radio de tarjeta: `--radius-box` 1rem (antes 0.75): se ve más actual sin perder sobriedad.

## 7c. Pagos y superadmin

- **Pago por QR = solo visual por ahora.** 4.º paso del storefront: QR (payload de demo),
  visor con el color del comercio, 10 min de vigencia, titular/banco del comercio y "Ya
  pagué" que simula la confirmación y emite la carta. Lleva la nota "Pago de
  demostración". Con banco: el QR lo arma la pasarela y emite su webhook, no el botón.
- **Un cobro = una gift card vendida.** El superadmin calcula todo desde las cards
  (`collectionGroup('cards')`), no desde `soldThisMonth` del tenant (dato de ejemplo).
  Cada carta nueva guarda `soldAt` y `channel` (`qr`/`panel`); en las viejas la fecha se
  deduce exacta de `vence − vigencia` y se marca con `~`. Lógica en `admin/ledger.ts`.
- **Comisión variable por comercio** (`tenant.commissionRate`, 5% por defecto). La
  escribe solo el superadmin (0–50%); las reglas impiden que el comercio la fije al
  crearse o la cambie después.
- **Panel del superadmin** con el estilo del panel: Resumen (ingresos nuestros, GMV,
  salud, top, alertas), Comercios (búsqueda/filtros/orden + ficha lateral con la
  comisión editable) y Ventas (antes Cobros + Liquidaciones): un mes o "desde siempre",
  tres números (vendimos / nuestra comisión / les debemos), una fila por comercio con su
  cuenta y, al tocarla, sus ventas; planilla CSV por comercio. CSV con BOM, `;` y coma decimal: abre bien en Excel en español.
- **Columna flex con scroll: `shrink-0` en los hijos**, o flex los encoge y un
  `overflow-hidden` se come el contenido (pasó con la cabecera de la ficha).

---

## 8. Imágenes

- `public/img/spa-cover.jpg` — foto real de Unsplash (licencia Unsplash: uso comercial
  libre, sin atribución obligatoria). **Servida desde nuestro hosting, no enlazada en
  caliente**: no dependemos de que un tercero siga arriba.
- `public/img/spa-aurora-logo.svg` — logo **inventado** para el comercio de ejemplo:
  un amanecer, por "Aurora". SVG, menos de 1 KB, nítido en cualquier tamaño.

---

## 9. Trampas que ya nos costaron

- **`[class.a b]` con espacio revienta en runtime** y aborta el render sin dar error de
  compilación. Una vez dejó el wizard sin pasos ni colores. Cada clase, su binding.
- **Un handler de evento que devuelve `false` hace que Angular llame `preventDefault()`.**
  `(window:beforeunload)="dirty() && $event.preventDefault()"` pedía confirmar al salir
  justo cuando NO había cambios. Handlers con efectos: métodos sin retorno.
- **`index.html` no se cachea** (`firebase.json` → `no-cache`; `.js/.css` con hash →
  `immutable`). Con el `max-age=3600` por defecto, tras un deploy el navegador seguía
  hasta una hora con la versión vieja.
- **`resource.value()` lanza** si el resource está en error. Hay que preguntar
  `hasValue()` primero o se cae la detección de cambios antes de poder mostrar el error.
- **Firestore no acepta arrays anidados.** `[[a, b]]` va como `[{a, b}]`.
- **`get()` dentro de una regla de `list`** rompe la consulta entera: en una query las
  reglas se evalúan por documento y `resource` ya trae todo.
- **Items de grid con `min-width: auto`** desbordan a lo ancho en móvil. `min-w-0`.
- **`npx vitest` directo no compila Angular** (`needs JIT compiler`). El runner real es
  `ng test` (builder `@angular/build:unit-test`): compila AOT y luego corre vitest. Por
  eso la lógica pura testeable vive en módulos sin `@angular/fire` (`card.ts`, `wizard`).
- **El estado de una gift card no se guarda: se deriva** (`card.ts` → `cardState`) del
  saldo y la fecha. Saldo 0 → canjeada; fecha pasada → vencida; si no, activa. `expires`
  es ISO `yyyy-mm-dd` (ordena y compara como texto; se muestra con el pipe `fecha`).
- **No hay modelo `Product`: solo gift cards.** Lo que la página ofrece son
  `business.suggestedAmounts` (números), botones en el storefront y **lo único que el
  cliente puede comprar** (también lo exige la regla de `cards`). Sin montos, la página no
  vende. El panel sí acepta otro monto, para la venta en mostrador. Código autogenerado
  (`newCode`) y saldo derivado del valor: el form no los pide.
  El dueño los edita en "Editar página → Montos sugeridos" (shared `amounts-editor.ts`; el tab se ve con manageBranding o manageProducts); el onboarding son 4 pasos (Marca,
  Montos, Datos bancarios, Publicar) y arranca con 100/200/500.
- **El alta muestra las mismas opciones que la edición.** Color + diseño de la gift card es un
  solo componente (`merchant/brand-design.ts`) que usan el wizard y "Editar página": una
  opción nueva se agrega ahí y aparece en los dos. Topes de los campos en `LIMITS` (data.ts),
  como `maxlength` y un texto bajo el campo ("Hasta 60 caracteres."); el placeholder es
  solo un ejemplo ("Ej: Spa Aurora").
  **Todo input donde se escribe un dato lleva su tope y el aviso** (montos: "Entre Bs 1 y
  Bs 10.000."); los buscadores no. Destinatario y "de parte de": 40 (`LIMITS.person`, igual
  que la regla de compra pública).
- **Catálogo en la landing** (`#negocios`): todas las páginas publicadas con montos, cada
  una mostrada como SU gift card (`cardSurface` de `card-style.ts`, sin cargar el QR), con
  "desde Bs X", descripción, zona y "Regalar aquí" → `/{slug}`. Buscador solo con más de 6.
- **Caracteres permitidos (anti-XSS):** Angular escapa todo lo que muestra y no usamos
  `innerHTML`. Además, `cleanText` (data.ts) quita `<`, `>` y caracteres de control antes de
  guardar, y las reglas lo exigen (`okText`, `okBusiness`, `okBank`, `okEmail`): color solo
  `#rrggbb`, logo solo `data:image/...;base64`, slug `[a-z0-9-]`. Acentos, ñ, emojis y
  comillas sí se permiten (son nombres reales).
- **Texto largo:** `body` tiene `overflow-wrap: break-word`; en filas flex y celdas, `min-w-0`
  + `truncate` o `wrap-anywhere`.
- **Listas con texto del usuario: se corta (`truncate` + `title`) y hay un botón "ver"**
  con el detalle completo en un modal; nunca scroll horizontal por un nombre largo.
- **Máximo 3 comercios propios por persona** (`MAX_OWNED`). Al llegar, el wizard muestra un
  aviso con `SUPPORT_EMAIL` en vez del formulario; con 2, avisa que es el último. Lo exigen
  las reglas: `owners/{uid}` = { count, max? } sube/baja en el mismo batch que crea/borra el
  tenant. Recontar: `npm run cupo`; dar más: `npm run cupo -- correo 5`.
- **Dirección y mapa del local** (`business.address` + `business.location {lat,lng}`):
  obligatorios en el alta, editables en "Editar página → Dónde canjear". Para marcar el punto
  se usa Leaflet + teselas de OpenStreetMap (gratis, sin API key, carga diferida solo en el
  panel), con búsqueda en Nominatim y "Usar mi ubicación". Para mostrarlo, la gift card usa
  un iframe de OSM sin librería y un botón "Cómo llegar" a Google Maps (abre la app en el
  celular). Ver `location.ts`.
- **Foco de inputs:** un solo borde del color primario (sin el anillo extra de daisyUI).
- **La página pública (`storefront.ts`) es una landing del comercio**, no una tarjetita:
  - **Paleta derivada del color del dueño.** El componente pone `--c1` (su color) y
    `styles.css` deriva con color relativo `oklch(from …)`: `--c2`/`--c3` (tono ±40°),
    versiones claras `--c*-soft` para texto sobre oscuro, y `--hero` (fondo casi negro
    teñido). Sin soporte de color relativo todo cae al color base. Cualquier color que
    elija el dueño funciona; no hay colores fijos salvo el verde del stepper.
  - **Hero oscuro teñido** con aurora (3 manchas borrosas de la paleta que derivan),
    nombre del comercio con gradiente animado (`.text-aurora`) y subrayado a mano.
  - **Tarjeta en vivo**: inclinada, flotando, con brillo que la recorre (`.shine`). Se
    arma mientras el cliente elige monto y escribe el nombre; el monto rebota al cambiar
    (`@for` de un elemento que se recrea). Es el gancho visual.
  - **Panel de compra**: hoja blanca que sube en móvil (esquinas redondeadas sobre el
    hero), tarjeta flotante en desktop. Stepper **verde** (`success`, 5:1 sobre blanco)
    con pulso en el paso actual; cada paso entra deslizando.
  - Final: confeti con la paleta (encima de todo, `z-20`) + la gift card con el mismo
    gradiente + brillo (`GiftcardArt` también usa la paleta, así se ve igual en todos lados).
  - Todo el movimiento se apaga con `prefers-reduced-motion`.
  - La preview del panel/onboarding renderiza el mismo componente angosto → muestra el móvil.
- **La vista previa del storefront usa container queries, no breakpoints de viewport.**
  El storefront va envuelto en `@container` y usa `@2xl:` (≈`sm`) y `@5xl:` (≈`lg`). Con
  `sm:`/`lg:` la vista previa de 300px en una pantalla de escritorio agarraba el layout de
  escritorio: titular de 4rem, una palabra por línea. La vista previa (`.phone-preview`)
  renderiza el componente a 390px lógicos con `zoom` a 320px y scroll propio.
- **La página del regalo (`/{slug}/g/{code}`) es una experiencia**, no un comprobante:
  fondo con la paleta del comercio y aurora, titular personal ("Ana, te regalaron Bs 80"),
  la tarjeta flotando, "Cómo usarla" en 3 pasos (con copiar código) y confeti si está
  activa. Canjeada/vencida: tarjeta en gris y el aviso arriba.
- **Imágenes subidas = `logoDataUrl()`** (data.ts), nunca el archivo crudo ni un `blob:`:
  recorte cuadrado, ≤256px, WebP con tope de 40 KB (baja calidad y después tamaño), lee
  SVG y fotos rotadas, y lanza un Error con mensaje para mostrar. El logo se guarda al
  subirlo, sin esperar a "Guardar cambios". Cualquier imagen nueva que se suba pasa por ahí.
- **Gift card de dos caras** (`app-giftcard-art`): el frente es solo marca y monto (se
  puede mostrar sin cuidado); el revés tiene para/de, código, QR, saldo y vencimiento, con
  un ojito que los difumina. Se gira tocando la tarjeta o con el botón de abajo (CSS 3D:
  `.flip*` en styles.css, caras apiladas en la misma celda de grid). Diseño a elección del
  comercio en Editar página, `business.cardStyle`: degradado (default), logo, cubierta
  (el logo de fondo en toda la tarjeta, con velo oscuro para leer), claro, oscuro; salen de
  su color y su logo (`cardSurface`). Tinta con `bg-current/10`, no
  `bg-white/20`, para que sirva sobre fondo claro y oscuro.
- **Compartir la gift card = link, no imagen adjunta.** Cada carta tiene su página
  pública `/{slug}/g/{code}` (`giftcard.ts`) con diseño de marca (logo, color, QR que
  apunta a esa misma URL). WhatsApp (`wa.me`) y correo (`mailto:`) mandan ese link.
  `from` es opcional en `GiftCard` (regalo anónimo). QR con `qrcode` (CommonJS, allowlisted
  en angular.json). Adjuntar la imagen de verdad y el pago quedan para un backend/función.
- **Reglas de `cards`:** miembros leen/escriben todo; además `get` público (nunca `list`)
  si el comercio está publicado — para abrir el regalo por código — y `create` público
  validado para el checkout (código == id, saldo == valor, valor > 0). Sin pago aún:
  cualquiera puede crear; en producción va detrás de una Cloud Function/pasarela.
- **Canje (`redeem.ts`):** botón "Canjear" en Gift cards → escanear QR con la cámara
  (`BarcodeDetector` nativo, solo Chromium; Safari cae al código a mano) o teclear el
  código. Del QR (URL `.../g/CODE`) o del input se saca el código, se busca en `cards()`
  y `Store.redeem` descuenta el saldo + agrega el canje en una transacción (dos cajas no
  pisan el mismo saldo). Va autenticado, las reglas ya lo permiten.
- **Enviar = un modal**, no un dropdown: un menú CSS dentro del contenedor con scroll
  de la tabla queda recortado. El modal (overlay fijo) muestra el diseño + WhatsApp/Correo/link.
- **RBAC:** cada tab del shell tiene un `perm`; `Store.can(perm)` decide (el owner puede
  todo, `isOwner` por `ownerUid == uid` **o** su doc de staff con `role: 'owner'`, así un
  uid que cambia no le quita el rol; el resto por `currentMember().perms[perm]`, buscado
  por email en `staff()`). El shell muestra solo los tabs permitidos y redirige si caés en
  uno que no podés. En Equipo el dueño agrega/quita miembros y reparte permisos por tab.
- **Membresía por correo, no por uid.** `Tenant.memberEmails` (incluye al dueño);
  "mis comercios" se consulta por `where('memberEmails','array-contains', miEmail)`. Agregar
  un empleado por email lo mete en `memberEmails` (arrayUnion) → puede loguearse con esa
  cuenta Google y entrar, sin sincronizar uids. Reglas: `isMember` por correo, `hasPerm`
  lee el doc de `staff` por correo; tocar `memberEmails` o escribir `staff` exige
  `manageStaff` (o ser owner, que cubre el arranque). Con `manageStaff` sin ser owner no se
  toca el doc del dueño, no se crea otro `role: 'owner'` ni se cambia `memberEmails[0]`
  (= el dueño). La UI oculta; las Rules mandan.
- **A qué comercio entra `/app`:** `Store.homeTenant()`: el último usado (localStorage
  `gkb.tenant`), si no uno propio, si no el primero. Nunca `list[0]` a secas: con un
  comercio propio y otro ajeno, la persona caía en el ajeno y parecía haber perdido el
  rol. El selector marca cada comercio como "dueño" o "equipo".

## Ambientes

- **prod** = Firebase `giftcards-bo` → https://giftcards-bo.web.app, rama `main`.
- **dev** = Firebase `giftcards-bo-dev` → https://giftcards-bo-dev.web.app, rama `dev`.
  Otra base y otros usuarios: lo que se prueba en dev no toca datos reales.
- El Action `Deploy` elige proyecto y build por rama (`main` → `production`, `dev` → `dev`).
- `ng serve` usa **dev** (fileReplacements de `development`): trabajar en local nunca
  escribe en prod. En dev se ve una etiqueta "DEV" abajo a la izquierda.
- Config de cada uno: `src/environments/firebase.ts` (prod) y `firebase.dev.ts` (dev).
- Scripts contra dev: `npm run seed:dev`, `npm run superadmin:dev -- correo`.
- Alta de CI para dev (una vez): `scripts/setup-dev-ci.sh`.

## Seguridad

- No hay backend: **las Firestore Rules son toda la seguridad**. La UI oculta, las reglas mandan.
- **Público y privado en docs separados** (las reglas no ocultan campos sueltos):
  `pages/{id}` = `{ business }`, lo único legible desde afuera; `tenants/{id}` =
  `memberEmails`, `ownerUid`, `bank`, `commissionRate`, solo equipo y superadmin. El
  `Store` los une en `Tenant`. Dato privado nuevo → a `tenants`, nunca a `business`.
- Ventas del dashboard: se calculan de cards y redemptions (`Store.monthly`), no hay
  contadores guardados.
- Cada permiso de tab también vale en las reglas: emitir/editar cartas = `viewCards`;
  canjear = `redeem` y solo baja `balance`; página = `manageBranding`/`manageProducts`;
  **cuenta bancaria = solo el dueño**.
- Solo correos verificados (`email_verified`) cuentan como sesión.
- Compra pública: solo campos conocidos, `to`/`from` ≤ 80, monto en `suggestedAmounts`.
- Códigos `XXXX-XXXX` con `crypto.getRandomValues` (31^8): el código abre la página del
  regalo, así que no puede ser corto ni predecible.
- `scripts/rules.test.mjs` prueba esos casos en el emulador (`npm run test:rules`, Java 21);
  corre en CI antes de cada deploy. Regla nueva → caso nuevo ahí.
- Hosting: nosniff, sin iframes ajenos (clickjacking), referrer acotado, cámara solo propia.

