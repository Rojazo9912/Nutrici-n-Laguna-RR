# Base de datos

PostgreSQL en Supabase. El esquema es SQL estándar, con `SECURITY DEFINER` solo en funciones acotadas; se puede restaurar en cualquier PostgreSQL 15+ con las extensiones `uuid-ossp` y un esquema `auth` compatible (las pruebas usan PGlite con un `auth` simulado).

## Migraciones (en orden)

| Archivo | Contenido |
|---|---|
| `00_schema.sql` | Tablas base, enums, restricción que bloquea categorías de sustancias excluidas, regla «activo requiere aprobado» |
| `01_rls_policies.sql` | RLS inicial del prototipo (reemplazada por la 03) |
| `02_seed_data.sql` | Datos de demostración (opcional, no usar con datos reales) |
| `03_secure_commerce.sql` | RLS estricta, reservas por lote, pedidos idempotentes, pagos verificados, `review_product` |
| `04_admin_products.sql` | `create_product` y bucket público `products` |
| `05_order_fulfillment.sql` | `advance_order` (pagado → preparando → enviado → entregado) |
| `06_privacy_and_limits.sql` | `rate_limits`, `arco_requests`, `set_consent` |
| `07_admin_operations.sql` | Inventario/lotes, variantes, marcas, categorías, cupones, contenido, tablero, favoritos |

`npm run db:migrate` aplica de la 03 a la 07, cada una en su transacción y con checksum en `commerce_migrations`. Si una migración ya se aplicó a mano sin ese registro, el comando se detiene y pide revisión (no la reaplica).

## Reglas que dependen de la base de datos

- Solo `service_role` ejecuta las funciones de comercio y administración; `anon` y `authenticated` tienen `EXECUTE` revocado.
- El rol se toma de `profiles.role`, nunca de datos editables por el usuario. Las operaciones administrativas exigen `admin` dentro de la función (`assert_admin`), además de la comprobación de la aplicación.
- Inventario: `product_variants.stock_available/stock_reserved` y `inventory_lots.quantity/reserved_quantity` se modifican solo desde funciones. Los consumibles se reservan únicamente de lotes activos no vencidos. Una exclusión mutua (`pg_advisory_xact_lock(7142026)`) serializa creación de pedidos, pagos y ajustes.
- Todo cambio administrativo escribe en `admin_audit_logs` en la misma transacción.

## Tablas de datos personales

`profiles`, `addresses`, `orders` (correo, teléfono, dirección), `privacy_consents`, `arco_requests`, `wishlists`, `carts`. Con RLS habilitada; el acceso de la aplicación es por `service_role` en el servidor, siempre filtrado por el usuario de la sesión.

## Respaldo y recuperación (RPO / RTO)

Objetivos propuestos por el PRD: **RPO 24 h, RTO 4 h**. Supabase realiza respaldos diarios en los planes de pago; el punto de restauración a un instante (PITR) es un complemento de pago. **Confirma en el panel del proyecto qué plan y qué retención tienes**: sin respaldos diarios activos, el RPO de 24 h no se cumple.

Procedimiento de recuperación:

1. Detener las ventas: quitar `MERCADOPAGO_ACCESS_TOKEN` o desplegar sin él (el checkout queda deshabilitado).
2. Restaurar el respaldo en un proyecto nuevo (o el mismo) desde Supabase → Database → Backups.
3. Verificar que `npm run check:setup` reporta migraciones y catálogo.
4. Conciliar pagos recibidos después del punto de restauración contra Mercado Pago (los pedidos pagados que falten se registran manualmente; no se descuenta inventario dos veces).
5. Reactivar las variables y hacer una compra de prueba en sandbox.

Además, exporta periódicamente un volcado lógico (`pg_dump` con la cadena administrativa) a un almacenamiento independiente del proveedor; esto también mitiga el bloqueo por proveedor. **Prueba una restauración real antes de vender** y anota la fecha y la duración medida.
