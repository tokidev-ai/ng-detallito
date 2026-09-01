# GiftCards Bolivia — Plan

> Actualizado: 2026-09-01

**La idea:** un SaaS donde un negocio chico se registra, configura su marca y obtiene una página
pública para vender sus propias gift cards digitales.

**El dinero:** el comprador nos paga a **nosotros**. El sistema registra a qué negocio pertenece
cada venta, y a fin de mes le depositamos lo suyo descontando nuestra comisión.

---

## 1. Números

**Cuánto deja cada comercio al mes** (comisión del 5%):

| Escenario | Cards/mes | Ticket | Vende | Nos deja |
|---|---|---|---|---|
| Pesimista | 4 | Bs 200 | Bs 800 | Bs 40 |
| **Base** | **8** | **Bs 250** | **Bs 2.000** | **Bs 100** |
| Optimista | 15 | Bs 300 | Bs 4.500 | Bs 225 |

### ⚠️ Cómo cobremos define la mitad del negocio

Como el dinero entra a nuestra cuenta, **la comisión de quien nos cobra sale de la nuestra**:

| Forma de cobrar | Nos cuesta | Nos queda | Comercios para Bs 10.000/mes |
|---|---|---|---|
| **QR Simple a nuestra cuenta** | 0% | **5%** | **100** |
| Pasarela tipo Libélula | 2,5% | 2,5% | 200 |

**Cobrar por pasarela nos obliga a conseguir el doble de comercios para ganar lo mismo.** El QR del
BCB no cobra comisión: es la vía a defender. Su problema es que no avisa solo que alguien pagó (§4).

### Cuántos comercios y a qué ritmo
Con 5% neto, 4% de bajas al mes y 1 de cada 4 negocios contactados que se registra:

| Meta mensual | Activos | Altas/mes | Contactar/mes |
|---|---|---|---|
| Bs 10.000 (~$1.430) | 100 | 4 | 16 |
| Bs 30.000 (~$4.300) | 300 | 12 | 48 |
| Bs 70.000 (~$10.000) | 700 | 28 | 112 |

### Costos y equilibrio
VPS Bs 150 + emails Bs 200 + dominio y herramientas Bs 150 + contabilidad y conciliación Bs 1.000
= **Bs 1.500/mes**. (La contabilidad sube porque manejamos dinero de terceros y hay que conciliar
cada mes.)

**Equilibrio: 15 comercios.** Margen ~90% — cada comercio extra cuesta unos bolivianos en emails.
Inversión inicial casi cero sin sueldos el primer año.

### Trayectoria a tres años
Sin vendedores, por autoservicio y boca a boca:

| | Año 1 | Año 2 | Año 3 |
|---|---|---|---|
| Comercios firmados | 50 | 155 | 320 |
| Negocios a contactar | 200 | 620 | 1.280 |
| Bajas | −9 | −43 | −120 |
| **Activos al cierre** | **40** | **150** | **350** |
| Ingreso mensual | Bs 4.000 | Bs 15.000 | Bs 35.000 |

Se firman **525 comercios en tres años para terminar con 350** — 175 se van por el camino.

> **El techo lo pone la cancelación: comercios máximos = altas por mes ÷ tasa de bajas.** Con 15
> altas y 4% de bajas el sistema se estanca en 375 por más años que pasen. Bajar las bajas de 4%
> a 2% **duplica el techo** sin conseguir un cliente más.

---

## 2. Competencia en Bolivia

**Hay competencia, pero no hay un SaaS de autoservicio. Hay marketplaces armados a mano.**

| Actor | Qué es |
|---|---|
| **Zum Giftcards** | El competidor real: "marketplace #1 de Bolivia", ~30 marcas (Totto, Bata, Multicenter, Casaideas, Sofia, Los Hierros, Equilibrium Spa) y app de canje. Pero su registro es *"envíanos tus datos y nos contactamos"*: reclutamiento manual, no software |
| **Tinkaso** | Regalos y gift cards en las tres ciudades. Más regalo físico que plataforma |
| **Giftealo Empresas** | Gift cards por email para empleados. Compite en corporativo |
| **Marcas por su cuenta** | Multicenter, TheWall, DiOptik, ecLIPse. **Justo el segmento que capturamos** |
| Hablax, Bitrefill, BoliviaCards | Reventa de gift cards internacionales. Otro negocio |

1. **Zum no puede bajar a los negocios chicos** sin romper su economía: reclutar a mano solo rinde con marcas grandes.
2. **La demanda ya está validada.** No hay que educar al mercado.
3. **Riesgo:** Zum ya tiene la red y la app de canje. Si ve la oportunidad, lanza un autoservicio encima de su marca. La ventana no es indefinida.

---

## 3. A qué negocios apuntamos

**El tamaño no es el criterio, el tipo de negocio sí.** Un spa entrega Bs 250 de servicio que le
cuesta Bs 60; una tienda entrega Bs 250 de mercadería que le costó Bs 150.

1. **Vende servicios** — margen alto, sin costo de inventario al canjear.
2. **Ticket Bs 100–800** — debajo nadie regala, encima se piensa demasiado.
3. **Tiene ocasión de regalo** — cumpleaños, Día de la Madre, Navidad.
4. **⭐ Ya lo hace a mano** — el del papelito o el voucher hecho en Word. El mejor filtro: ya tiene el problema, no hay que convencerlo.

**Prioridad:** spa, estética y barbería · gimnasios, yoga, crossfit · restaurantes y cafés
independientes · escuelas de idiomas y música · fotógrafos, veterinarias, floristerías.
**Descartar:** retail con inventario y margen delgado, ticket menor a Bs 50.

---

## 4. Los flujos

**Comercio:** se registra → carga su marca → **da los datos de su cuenta bancaria** → define qué
vende (montos fijos, monto abierto, o por servicio) → configura vigencia y términos → publica →
recibe su link y su QR para compartir.

**Comprador:** llega por link o QR → elige monto → escribe un mensaje → fecha de entrega → datos
del destinatario → **paga a nuestra cuenta** → se genera código único y PDF con QR, enviado al
destinatario por email, con copia al comprador.

**Canje:** el destinatario llega al local → el empleado abre una página web con su PIN (**no** una
app que haya que instalar) o escanea el QR → ve saldo e historial → marca cuánto se consumió →
queda registro con hora y usuario → si sobra saldo, la gift card sigue viva.

### Liquidación mensual — lo que nos distingue
A fin de mes el sistema suma lo vendido por cada comercio, resta nuestra comisión y genera la
transferencia con comprobante detallado.

**A resolver antes de programarlo:**
- **¿Depositamos al vender o al canjear?** Al vender el comercio tiene la plata pero también la obligación; al canjear el comprador queda más protegido y nosotros retenemos más tiempo, pero el comercio lo va a odiar. **Recomendación: al vender.**
- **¿Reembolso después de depositar?** Retener una reserva chica o descontar del mes siguiente.
- **¿Quién factura al comprador, el comercio o nosotros?** Para el contador.
- **¿Cómo hacemos 100 transferencias al mes?** Si el banco no tiene archivo de dispersión o API, se hacen a mano una por una. **Con 350 comercios es un trabajo de tiempo completo.**

**Casos borde a decidir:** canje parcial · sin internet en el local · dos cajas canjeando el mismo
código a la vez · código robado · reembolso tras canje parcial · gift card vencida · comercio que
cierra con saldo de clientes sin usar.

---

## 5. El dinero: cómo lo recibimos

**Verificado:** el QR Simple no permite dividir un pago (pero como cobramos nosotros, el QR es el
nuestro y deja de importar) · el QR **no cobra comisión** · **Stripe y PayPal no operan en Bolivia**.

### Cuenta ómnibus
Una sola cuenta bancaria nuestra recibe todo, y el sistema lleva el registro interno de a quién
pertenece cada boliviano. Así operan las fintechs.

**Ganamos:** la cobranza deja de existir — descontamos antes de depositar, nunca hay mora ni hay
que perseguir a nadie. Y el comercio se registra sin necesitar pasarela propia.

**Asumimos:** el dinero de la cuenta **no es nuestro**, es deuda con los comercios · contracargos,
fraude y devoluciones pasan a ser nuestros · si un comercio cierra con saldo vivo el cliente nos
reclama a nosotros · conciliar y depositar todos los meses es trabajo real.

### Investigación pendiente

**Antes de abrir la cuenta:**
- [ ] **Contador: ¿cómo se declara el dinero de terceros?** Con 100 comercios entran ~Bs 200.000/mes. Si Impuestos lo trata como ingreso propio, el IT del 3% son Bs 6.000/mes — más de la mitad de nuestra comisión. **Es lo primero: define si el modelo es rentable**
- [ ] **ASFI: ¿recibir y dispersar fondos de terceros nos mete en el perímetro supervisado?** ¿Bajo qué figura operamos?
- [ ] **El banco: ¿nos permite una cuenta con cientos de depósitos de desconocidos y cientos de transferencias al mes?** Un movimiento así puede hacer que la marquen

**Técnico:**
- [ ] **¿Cómo confirmamos automáticamente que alguien pagó por QR?** Es el hueco central. Candidato: **OpenBCB** (Banco Central, oct-2025). Va antes que la API de cualquier banco individual
- [ ] **¿El banco ofrece dispersión masiva o API de transferencias?** Sin eso, las liquidaciones son manuales
- [ ] Libélula (2,5%): plan B si el QR no se automatiza — cuesta la mitad de la comisión

**Del producto:**
- [ ] ¿Quién factura al comprador? ¿El IVA se cobra al vender o al canjear? ¿Vigencia legal mínima de una gift card en Bolivia?

---

## 6. Plan técnico

Es un CRUD con pagos y emails. La complejidad real está en tres puntos: **el canje** (dos personas
no pueden gastar el mismo saldo a la vez), **separar los datos de cada comercio**, y **confirmar
pagos sin duplicar**. Todo lo demás es formulario.

### Stack: un VPS y nada más
Un servidor virtual (~Bs 150/mes) alcanza para los primeros cientos de comercios.

- **App monolítica** — un proyecto, un despliegue, el framework que mejor domine el equipo.
- **Postgres en el mismo servidor.** Una sola base, con una columna que identifica al comercio en cada tabla.
- **Caddy** — resuelve solo los certificados HTTPS y los subdominios (`negocio.nuestrodominio.com`).
- **Despliegue:** `git pull` y reiniciar. Sin Kubernetes.
- **Respaldos:** `pg_dump` diario a un bucket externo. **No negociable** — hay dinero ajeno.
- **Emails:** servicio externo (Resend o Postmark). No montar correo propio.

### Tablas
`tenants` (comercio: marca, plan, datos bancarios) · `users` (dueño o empleado, PIN de canje) ·
`products` (monto fijo, abierto o servicio) · `gift_cards` (código, valor, saldo, comprador,
destinatario, entrega, vencimiento) · `redemptions` (cada canje: monto, quién, cuándo — solo se
agrega, nunca se edita) · `orders` (referencia de pago, comisión) · `settlements` (liquidación:
período, bruto, comisión, neto, comprobante) · `events` (auditoría de todo lo que toca dinero).

### Reglas no negociables
- **El saldo nunca se edita a mano.** Se calcula contra los canjes. El historial es la verdad.
- **Canje con bloqueo de fila** (`SELECT ... FOR UPDATE`) — dos cajas no pueden gastar el mismo saldo a la vez.
- **Si llega el mismo aviso de pago dos veces, se emite una sola gift card.**
- **Nunca emitir la gift card antes de confirmar el pago.**
- **Códigos aleatorios de verdad** (no `0001`, `0002`), con dígito verificador.
- **El código solo no basta:** canjear exige sesión de empleado con PIN.
- **En el panel, vender una gift card es deuda, no ingreso** — hasta que se canjea. Mostrarlo así o le causamos un problema con su contador.

**Fuera del primer producto:** puntos, app nativa, tarjetas plásticas, varios idiomas, marketplace,
reportes avanzados, integración con cajas, API pública, permisos detallados.

---

## 7. Roadmap

**Fase 0 — Validación (3 semanas, cero código).** Un solo spa o gimnasio conocido, con la página
armada **a mano**: formulario, PDF de Canva, nuestro QR, códigos enviados a mano por email. Dos preguntas
deciden todo: *¿se vendieron gift cards en dos semanas?* (si no, cambiar de vertical) y *¿el dueño
pagaría por no volver a hacerlo a mano?* (preguntarlo con el resultado en la mano).

**Fase 1 — Producto mínimo (6–8 semanas).** Registro, marca, página pública, cobro, email al
destinatario, canje con saldo parcial, panel básico y liquidación mensual. Una ciudad.
*Meta: los comercios de Fase 0 vendiendo de verdad.*

**Fase 2 — Producto vendible (2–3 meses).** Entrega programada, plantillas de diseño, dominio
propio, devoluciones, varios usuarios, exportar a Excel, "Powered by" y referidos.

**Fase 3 — Escala.** Paquetes de sesiones (§8), gift cards corporativas por volumen, expansión a
Perú, Paraguay o Ecuador.

---

## 8. Riesgos y veredicto

| Riesgo | Nivel | Qué hacemos |
|---|---|---|
| Que Impuestos trate el dinero de terceros como ingreso nuestro | Crítico | Consulta con contador **antes** de abrir la cuenta |
| Cobrar por pasarela y perder la mitad de la comisión | Crítico | Cobrar por QR Simple. Resolver la confirmación automática |
| Liquidaciones manuales | Alto | Verificar dispersión masiva del banco antes de los ~50 comercios |
| Estacionalidad (diciembre explota, marzo no vende) | Alto | Paquetes de sesiones |
| Caer en el perímetro ASFI | Alto | Consulta previa; definir figura legal |
| Contracargos y fraude ahora nuestros | Medio | Límites por gift card, revisión de compras grandes |
| Zum lanza un autoservicio | Medio | Velocidad |
| Construir meses y que nadie lo quiera | Medio | Fase 0 obligatoria |

**Veredicto: viable como negocio de dos socios financiado con lo propio, no como startup de
crecimiento acelerado.** A favor: mercado validado, sin competidor de autoservicio, QR masivo y
gratuito, equilibrio a 15 comercios, inversión inicial casi nula. En contra: techo aritmético
(~350 comercios en tres años en Bolivia sola), alta cancelación en negocios chicos, y el peso
operativo y fiscal de manejar dinero ajeno.

### 💡 La idea que sube el techo: prepagos, no gift cards
Una gift card y un **paquete de sesiones** ("10 clases de yoga", "pack de 8 cortes") son **la misma
cosa por dentro**: un saldo pagado por adelantado que se consume de a poco. El sistema que hagamos
para gift cards ya hace paquetes con casi cero código extra. Y arregla tres problemas de un golpe:

- Los paquetes se venden **todo el año** → muere la estacionalidad.
- El comercio usa el sistema **a diario**, no solo en diciembre → deja de cancelar → **sube el techo**.
- Deja de ser "software de gift cards" y pasa a ser **el sistema de prepagos del negocio** → se cobra más y es difícil de reemplazar.

La gift card sigue siendo la mejor puerta de entrada: un "sí" fácil que le hace ganar plata desde
el primer día, sin cambiarle ningún hábito.

> Gift cards solas son una función. Prepagos con canje son un producto.

---

## Fuentes

**Competencia:** [Zum Giftcards](https://zumgiftcards.com/) · [app Zum Comercios](https://play.google.com/store/apps/details?id=com.smart.zum) · [Tinkaso](https://tinkaso.com/giftcards) · [Giftealo Empresas BO](https://empresas.giftealo.com/bo/) · [Multicenter](https://zumgiftcards.com/giftcard/multicenter) · [TheWall](https://thewallbolivia.com/gift-card/) · [DiOptik](https://www.dioptik.com.bo/products/gift-card-tarjetas-de-regalo-dioptik) · [ecLIPse](https://eclipsebolivia.com/producto/gift-card/)

**Pagos:** [Pagos QR BCB](https://www.bcb.gob.bo/?q=pagos_qr_bcb_bolivia) · [ASFI — el uso del QR en Bolivia (2025)](https://www.asfi.gob.bo/sites/default/files/2025-07/El%20uso%20del%20QR%20ha%20dinamizado%20el%20sistema%20de%20pagos%20en%20Bolivia.pdf) · [OpenBCB (oct-2025)](https://mobiletime.la/noticias/20/10/2025/bolivia-lanza-openbcb/) · [Libélula / Todotix](https://libelula.bo/) · [Cobrar online en Bolivia: QR Simple, Tigo Money](https://www.shoperly.app/blog/cobrar-online-bolivia-qr-simple)

> Las cifras fiscales y legales son estimaciones para discusión. Verificar con abogado y contador
> bolivianos antes de operar.
