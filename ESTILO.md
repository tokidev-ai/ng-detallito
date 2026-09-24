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
  `business.suggestedAmounts` (números), botones en el storefront; el cliente además
  escribe un monto libre, así que la lista puede estar vacía y la página igual vende.
  El dueño los edita en "Editar página"; el onboarding son 3 pasos (Marca, Banco, Publicar).
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
  todo, `isOwner` por `ownerUid == uid`; el resto por `currentMember().perms[perm]`, buscado
  por email en `staff()`). El shell muestra solo los tabs permitidos y redirige si caés en
  uno que no podés. En Equipo el dueño agrega/quita miembros y reparte permisos por tab.
- **Membresía por correo, no por uid.** `Tenant.memberEmails` (incluye al dueño);
  "mis comercios" se consulta por `where('memberEmails','array-contains', miEmail)`. Agregar
  un empleado por email lo mete en `memberEmails` (arrayUnion) → puede loguearse con esa
  cuenta Google y entrar, sin sincronizar uids. Reglas: `isMember` por correo, `hasPerm`
  lee el doc de `staff` por correo; tocar `memberEmails` o escribir `staff` exige
  `manageStaff` (o ser owner, que cubre el arranque). La UI oculta; las Rules mandan.
