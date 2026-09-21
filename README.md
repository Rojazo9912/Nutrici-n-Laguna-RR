# Nutrición Laguna RR

Tienda con Next.js 15, React, TypeScript, Tailwind y Supabase. El catálogo viene de PostgreSQL; el carrito guarda únicamente identificadores de variantes y cantidades en el navegador. Los precios, descuentos y existencias se validan en el servidor.

## Desarrollo

```sh
npm ci
npm run dev
```

Usa Node.js 22 o posterior (la versión instalada de Supabase requiere Node 22). Copia `.env.local.example` a `.env.local` **solo si aún no existe**, y completa los valores. Nunca publiques `SUPABASE_SERVICE_ROLE_KEY`, el token de Mercado Pago ni el secreto del webhook.

```sh
npm run typecheck
npm test
npm run build
npm start
npm run check:setup
```

Con la aplicación ejecutándose en `http://127.0.0.1:3100`, `npm run test:http` comprueba las rutas públicas y los bloqueos de seguridad sin crear compras. Requiere que Supabase esté disponible para verificar el catálogo y el detalle. Consulta `docs/verification.md` para el resultado y los pendientes de esta entrega.

Las pruebas ejecutan PostgreSQL en memoria con PGlite: no acceden ni escriben en Supabase. Cubren permisos, precios, reservas, lotes vencidos, cupones, idempotencia, pagos repetidos y firmas falsas.

## Aplicar la base de datos

En una base nueva, ejecuta `00_schema.sql`, `01_rls_policies.sql` y `03_secure_commerce.sql`, en ese orden, desde el editor SQL de Supabase. `02_seed_data.sql` contiene datos de demostración y es opcional; no lo ejecutes nuevamente sobre una tienda con datos reales.

Si la base ya tiene las tablas iniciales, aplica **únicamente** `supabase/migrations/03_secure_commerce.sql`, una vez. La migración es transaccional y conserva productos y pedidos existentes. Reemplaza las políticas inseguras del prototipo. La clave `service_role` permite operar datos por REST, pero **no permite ejecutar migraciones SQL**: necesitas el editor SQL o una conexión PostgreSQL administrativa.

Alternativamente, agrega la conexión administrativa de ese proyecto como `DATABASE_URL` en `.env.local` y ejecuta `npm run db:migrate`. El comando verifica el proyecto de destino, valida el certificado TLS, aplica los cambios en una transacción y guarda su checksum. No imprime la cadena de conexión. Admite conexión directa de Supabase o su pooler con usuario `postgres.<project-ref>`; usa preferentemente el pooler de sesión si tu red no admite IPv6.

Después aplica **una vez** `supabase/migrations/04_admin_products.sql` (editor SQL): crea la función `create_product` y el bucket público `products` para imágenes. Los productos nuevos siempre nacen como borrador con revisión regulatoria pendiente, y solo el rol `admin` puede crearlos.

Aplica también **una vez** `supabase/migrations/05_order_fulfillment.sql`: habilita en `/admin/pedidos` el flujo `pagado → preparando → enviado → entregado` (solo `admin`). Para marcar un pedido como enviado se exige paquetería y guía, que el cliente ve en su pedido. Cada cambio queda en la auditoría. Los pedidos con pago pendiente de conciliación no pueden avanzar; cancelaciones y reembolsos siguen siendo manuales.

Aplica **una vez** `supabase/migrations/06_privacy_and_limits.sql`. Agrega tres cosas:

- **Limitación de tasa** (`rate_limits`, `hit_rate_limit`): cotización (60 por 10 min por IP), creación de pedidos (20 por hora por IP, además del límite de 10 por hora por navegador que ya tiene la base), solicitudes ARCO (5 por hora) y cambios de consentimiento (20 por hora por usuario). Las claves se guardan como hash. Si el contador no está disponible (por ejemplo, antes de aplicar la migración), **se permite la solicitud y se registra el fallo**, para no bloquear la tienda. Detrás de un proxy se usa `x-real-ip` o la última entrada de `x-forwarded-for`; verifica que tu hosting la establezca. **El inicio de sesión no pasa por este límite**: lo gestiona Supabase Auth directamente desde el navegador. Configura sus límites en Authentication → Rate Limits (el PRD propone 5 intentos por 15 minutos).
- **Derechos ARCO**: formulario público en `/derechos-arco/solicitud` y bandeja `/admin/arco` (solo `admin`) con estados recibida, en proceso, resuelta y rechazada, notas obligatorias al cerrar y auditoría. No envía acuse por correo ni calcula plazos legales: el seguimiento del plazo corresponde al responsable.
- **Consentimientos**: en `/cuenta` el cliente puede otorgar o revocar las comunicaciones comerciales. Cada cambio agrega una fila con versión del aviso y fecha; el estado vigente es la más reciente. Todavía no existe envío de newsletter que consulte este consentimiento.

Aplica también **una vez** `supabase/migrations/07_admin_operations.sql` (requiere la 06): inventario y lotes, variantes, marcas, categorías, cupones, contenido del sitio, tablero de indicadores y favoritos. Habilita el panel `/admin` completo: tablero, catálogo, marcas y categorías, inventario, pedidos, cupones, contenido (avisos legales, FAQ, envíos, devoluciones y contacto), ARCO, clientes, exportación de pedidos a CSV y bitácora de auditoría. Solo el rol `admin` puede modificar; `compliance_officer` solo revisa productos y consulta.

`npm run db:migrate` aplica ahora de la 03 a la 07, en orden, cada una en su transacción y con checksum. Si aplicaste alguna a mano desde el editor SQL, el comando no la reaplica pero se detiene y pide revisión: registra esa migración en `commerce_migrations` o aplica el resto manualmente. Consulta `docs/DATABASE.md`, `docs/SECURITY.md` y `docs/PROJECT_STATUS.md`.

La interfaz puede mostrar catálogo y carrito antes de aplicar la migración. Los pagos y las modificaciones administrativas permanecen deshabilitados hasta que esté aplicada. Los pedidos antiguos no se convierten automáticamente en pedidos pagables: carecen de reservas y deben conciliarse por separado.

### Permisos

- Los clientes no pueden modificar roles, estados de pedidos, precios ni inventario.
- El catálogo público no incluye `cost_internal`, productos ocultos ni imágenes de productos no publicados.
- Los carritos en base de datos solo son accesibles por su propietario autenticado. El carrito de invitados permanece en su navegador.
- La administración comprueba la sesión con Supabase y el rol de `profiles` en el servidor. No confía en datos editables de `user_metadata`.
- Crear una cuenta genera un perfil `client`. Para habilitar un administrador, cambia su rol desde una sesión administrativa confiable en Supabase, identificando el UUID exacto de ese usuario. La aplicación no ofrece autoasignación de privilegios.
- Configura en Supabase Auth la URL de la tienda y la URL de redirección `https://TU-DOMINIO/auth/callback` (y localhost durante desarrollo).

### Documentos de la tienda

Publica el texto real aprobado por el responsable del negocio en `site_content`, con claves `privacidad`, `terminos`, `derechos-arco` y `regulacion-cofepris`. El formato de `content` es:

```json
{"version":"2026-09-19","body":"Texto completo aprobado por la tienda"}
```

No se incluyen textos legales ficticios. El checkout requiere un aviso de privacidad publicado y guarda la versión aceptada y la fecha en el pedido. Cada actualización del texto debe tener una versión nueva. Las páginas muestran texto plano, sin ejecutar HTML del contenido.

## Mercado Pago

Configura `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `APP_URL` (origen HTTPS público) y `MERCADOPAGO_MODE=test`. Reinicia la aplicación al cambiar variables. Las variables antiguas `MERCADO_PAGO_*` no se usan.

1. Configura las notificaciones de **pagos** de Checkout Pro en Mercado Pago con la URL `https://TU-DOMINIO/api/webhooks/pago` y copia su secreto a la variable indicada.
2. Realiza una compra con cuentas y tarjetas de prueba. La aplicación crea un pedido y muestra su total definitivo antes de redirigir al checkout alojado.
3. Comprueba que el pedido cambia a `pagado` al llegar el webhook, con una sola salida de inventario. Una redirección de navegador nunca confirma pagos.
4. Solo después de probar, usa las credenciales de producción y `MERCADOPAGO_MODE=live`.

Esta primera integración admite pagos inmediatos; excluye efectivo, transferencias y cajeros, porque los pedidos reservan inventario durante un plazo corto. No almacena números de tarjetas. Stripe no está habilitado.

La firma HMAC se verifica sobre `data.id` del query, `x-request-id` y `ts`, con comparación constante y tolerancia de cinco minutos. Después se consulta el pago por la API del proveedor y se validan cuenta receptora, modo de prueba/producción, importe, moneda y referencia del pedido. Mantén sincronizado el reloj del servidor.

Documentación de referencia: [webhooks de Mercado Pago](https://www.mercadopago.com.mx/developers/en/docs/checkout-pro-preferences/additional-content/notifications/webhooks) y [creación de preferencias](https://www.mercadopago.com.mx/developers/es/reference/online-payments/checkout-pro-preferences/create-preference/post).

## Correos transaccionales

Configura `RESEND_API_KEY` y `EMAIL_FROM` (remitente con dominio verificado en Resend). Sin ellas, no se envían correos y todo lo demás funciona igual. Se envía un correo al confirmarse el pago (solo con la primera notificación verificada, no en reintentos), al marcar el pedido como enviado (con paquetería y guía) y al marcarlo como entregado. Todo el contenido se escapa como texto y la clave de idempotencia evita duplicados.

El envío es de mejor esfuerzo: un fallo de Resend se registra sin datos personales y nunca hace fallar el webhook ni la acción del administrador. No hay reintento automático; si un correo falla, avisa al cliente manualmente. Falta la plantilla editable, y los correos de cancelación y reembolso, que no están automatizados.

## Inventario y reintentos

- Creación y cobro usan funciones PostgreSQL transaccionales accesibles solo con `service_role`. Una exclusión mutua de corta duración serializa operaciones de inventario; no incluye llamadas HTTP externas.
- La clave de idempotencia evita duplicar un pedido al reintentar; cambiar su contenido con la misma clave se rechaza.
- Las reservas se asignan por caducidad más próxima, exclusivamente a lotes activos no vencidos. La fecha de vencimiento se trata como no vendible desde ese día.
- El enlace de pago vence a los 30 minutos; la reserva se libera después de 45 minutos para admitir notificaciones demoradas.
- Los eventos repetidos no descuentan dos veces. Pagos tardíos sobre pedidos cancelados, cobros duplicados, reembolsos y contracargos se muestran en el panel como pendientes de conciliación. No se envían productos ni se restaura inventario automáticamente en esos casos.
- Si falla la creación del enlace, reintenta desde **el mismo pedido**. Puede haber una espera de un minuto antes de volver a solicitar la preferencia.
- Reembolsos, conciliación y cambios de envío requieren operación del responsable; no están automatizados en esta entrega.

Programa `SELECT public.expire_orders();` cada cinco minutos en Supabase Cron. Alternativamente configura tu plataforma para enviar `POST /api/cron/expire-orders` con `Authorization: Bearer <CRON_SECRET>`. El secreto debe ser aleatorio y privado. La creación de nuevos pedidos también libera reservas vencidas.

Los pedidos de invitados se consultan con una cookie HttpOnly del navegador durante 30 días. Inicia sesión antes de comprar si quieres consultar pedidos desde otros dispositivos. Cambiar de navegador o borrar cookies elimina el acceso de invitado.

## Antes de habilitar ventas

`npm run check:setup` informa los pendientes sin imprimir secretos. Deben quedar resueltos: migración 03, documentos reales, administrador, credenciales y webhook, liberación programada de reservas y una compra completa en sandbox. También verifica el inventario real, las imágenes y el contenido comercial antes de publicar: los registros iniciales son de demostración.

Next.js se actualizó desde 14 para corregir, entre otras, la [vulnerabilidad de servidores Windows](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36). El bloqueo del checkout cuando falta configuración es intencional: nunca sustituye el proveedor por pagos simulados.

La dependencia PostCSS de Next.js se fija mediante `overrides` a una versión corregida de la misma versión mayor. Conserva `package-lock.json` y usa `npm ci` para reproducir la instalación verificada.
