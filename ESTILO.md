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

### En móvil

En un teléfono entran unos **640px útiles** antes del primer scroll. Si el botón no
entra ahí, la landing no vende. Medido en cada cambio.

Orden de lectura en móvil: **titular → producto → texto → cifras**. El hero es una
columna de flex donde el orden lo da el DOM, y desde `lg` pasa a grilla de dos columnas
con posiciones explícitas (`col-start` / `row-start`). Así no hay markup duplicado ni
peleas con `order`.

Decisiones que solo aplican en móvil:

- **El hero no lleva botones.** El CTA vive en la barra, que es fija: acompaña todo el
  scroll en vez de quedarse atrás en la primera pantalla.
- **El cierre no se muestra.** Su mensaje cierra el párrafo del hero, en negrita, color
  de marca y subrayado.
- **La insignia de canje no flota**, o taparía el botón del mockup.
- **Todo el bloque de texto va centrado**; en escritorio vuelve a la izquierda.
- **El mockup se corta abajo a propósito**: es lo que invita a bajar. Si entra completo,
  no hay motivo para seguir.

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
- **Compartir la gift card = link, no imagen adjunta.** Cada carta tiene su página
  pública `/{slug}/g/{code}` (`giftcard.ts`) con diseño de marca (logo, color, QR que
  apunta a esa misma URL). WhatsApp (`wa.me`) y correo (`mailto:`) mandan ese link.
  `from` es opcional en `GiftCard` (regalo anónimo). QR con `qrcode` (CommonJS, allowlisted
  en angular.json). Adjuntar la imagen de verdad y el pago quedan para un backend/función.
- **Reglas de `cards`:** miembros leen/escriben todo; además `get` público (nunca `list`)
  si el comercio está publicado — para abrir el regalo por código — y `create` público
  validado para el checkout (código == id, saldo == valor, valor > 0). Sin pago aún:
  cualquiera puede crear; en producción va detrás de una Cloud Function/pasarela.
