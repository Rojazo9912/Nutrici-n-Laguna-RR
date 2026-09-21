# Seguridad

## Modelo

- **El navegador no es de confianza.** Precios, descuentos, existencias, envío y totales se calculan en funciones de PostgreSQL. El carrito guarda solo identificadores y cantidades.
- **Pagos:** un pedido pasa a `pagado` únicamente por el webhook de Mercado Pago con firma HMAC válida (comparación constante, tolerancia de 5 minutos), y después de consultar el pago a la API del proveedor y validar cuenta, modo, importe, moneda y referencia. Una redirección del navegador nunca confirma un pago. La plataforma no procesa ni almacena datos de tarjeta (SAQ A, a confirmar con el proveedor).
- **Roles:** `profiles.role`. Las rutas y acciones administrativas verifican la sesión con Supabase en el servidor y el rol en la base; los cambios se hacen mediante funciones `SECURITY DEFINER` que vuelven a verificar al actor.
- **Mutaciones:** todas las rutas que modifican datos validan `Origin`, limitan el tamaño del cuerpo y validan cada campo en el servidor. Las acciones de servidor de Next.js aplican su propia comprobación de origen.
- **RLS:** activa en todas las tablas; sin políticas de escritura para clientes. `cost_internal` no es legible por `anon` ni `authenticated`.
- **Secretos:** solo variables de entorno; `.env.local` está ignorado por git. `SUPABASE_SERVICE_ROLE_KEY`, el token y el secreto de Mercado Pago, `RESEND_API_KEY` y `CRON_SECRET` nunca llevan prefijo `NEXT_PUBLIC_`. Las páginas y módulos que los usan importan `server-only`.
- **Contenido:** los textos legales y de contenido se muestran como texto plano; los correos escapan todos los datos; el JSON-LD escapa `<`; el CSV neutraliza fórmulas.
- **Sustancias excluidas:** restricción `CHECK` en `categories` y validación en `upsert_category` (normaliza guiones). Un producto no puede estar `activo` sin aprobación regulatoria (restricción `CHECK`).

## Limitación de tasa

Contadores en PostgreSQL (`hit_rate_limit`) para cotización, creación de pedidos, solicitudes ARCO y consentimientos. Si el contador falla, la petición se permite y se registra (decisión de disponibilidad; cámbiala en `src/lib/rate-limit.ts` si prefieres bloquear). El **inicio de sesión** lo limita Supabase Auth: configura Authentication → Rate Limits y activa la protección contra contraseñas filtradas y CAPTCHA si tu plan lo permite. La IP se toma de `x-real-ip` o de la última entrada de `x-forwarded-for`: verifica que tu hosting las establezca.

## Registros

Los logs de error no incluyen contraseñas, tokens ni datos personales. La bitácora `admin_audit_logs` registra quién, qué y cuándo.

## Pruebas

`npm test` ejecuta contra PostgreSQL en memoria: permisos por rol, reservas, lotes vencidos, cupones, idempotencia, pagos repetidos y firmas falsas, cumplimiento de pedidos, ARCO, consentimientos, límites de tasa e inventario. `npm run test:http` prueba rutas públicas y bloqueos con la app en ejecución. **Antes de cada release**, repite las pruebas de acceso no autorizado por rol con dos usuarios reales (cliente y administrador) contra el proyecto Supabase de destino.

## Pendiente de terceros

Revisión externa de código antes de producción (el PRD la recomienda), revisión legal/sanitaria de catálogo y textos, y prueba de penetración si el volumen lo justifica.
