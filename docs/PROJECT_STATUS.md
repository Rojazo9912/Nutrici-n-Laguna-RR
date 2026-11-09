# Estado del proyecto

## Actualización — 9 de noviembre de 2026

**Incidente regulatorio.** Una consulta del 30 de octubre mostró productos aprobados y activos que no pueden venderse como suplementos: testosterona, fluoximesterona, tamoxifeno, clomifeno, anastrozol, procaína y otros inyectables y productos de mesoterapia. Se aprobaron con un script de aprobación masiva (`approve-all-pending.mjs`) que escribía directo en la tabla, sin revisión, y registraba una auditoría a nombre del primer administrador. La restricción de la base solo revisaba nombres de categoría.

Corrección en el repositorio:
- Migración `08_restricted_products.sql`: retira los productos coincidentes y bloquea su aprobación o activación por cualquier vía. **Debe aplicarse en Supabase**; hasta entonces el problema sigue en producción.
- Se eliminaron los scripts de aprobación masiva, los de extracción de imágenes de otras tiendas y los scripts de prueba de un solo uso, junto con sus salidas (`outputs/`, CSV y JSON con datos del catálogo). Siguen en el historial de git.
- Pruebas nuevas del bloqueo (35 en total).

Pendiente del responsable: aplicar la 08, revisar la lista retirada, revisar a mano los productos aprobados por el script (la detección por texto no es exhaustiva), y reemplazar las imágenes tomadas de otras tiendas por material propio o autorizado.

## Estado al 21 de septiembre de 2026

Verificado localmente: `npm run typecheck`, `npm test` (33 pruebas sobre PostgreSQL en memoria) y `npm run build`. **Nada de esto se ha ejecutado contra el Supabase remoto ni contra Mercado Pago**: el proyecto configurado no resuelve DNS desde este entorno (ver `docs/verification.md`).

## Implementado frente al PRD

| Área | Estado |
|---|---|
| Catálogo público, búsqueda y filtros (categoría/marca), ficha, carrito persistente, checkout invitado/registrado | Hecho |
| Precios, descuentos, envío y stock validados en servidor; reservas por lote/caducidad; idempotencia | Hecho, con pruebas |
| Pago con Mercado Pago Checkout Pro y webhook con firma verificada | Hecho, **sin compra sandbox real** |
| Cuenta: registro, login, recuperación de contraseña, direcciones, favoritos, pedidos, consentimientos | Hecho |
| Derechos ARCO: formulario público y bandeja administrativa | Hecho (sin acuse por correo ni cálculo de plazos) |
| Correos de pago, envío y entrega (Resend) | Hecho, de mejor esfuerzo y sin reintentos |
| Admin: tablero, productos (alta con imagen), revisión regulatoria, variantes, inventario y lotes, marcas y categorías, cupones, contenido, pedidos y envíos, clientes, CSV, auditoría | Hecho |
| Control regulatorio (producto `activo` solo si `aprobado`; categorías prohibidas) | Hecho en base y servidor |
| Limitación de tasa | Hecho salvo el login (Supabase Auth) |
| SEO: metadatos y JSON-LD por producto, `sitemap.xml`, `robots.txt` | Hecho |
| Páginas FAQ, envíos, devoluciones y contacto | Hechas; **el texto lo publica el negocio** en `/admin/contenido` |
| CI (typecheck, pruebas, build, auditoría npm) | Hecho (`.github/workflows/ci.yml`) |
| Documentación (`DATABASE.md`, `SECURITY.md`, este archivo) | Hecha |

## No implementado (y por qué)

- **Blog/contenido SEO, newsletter, reseñas moderadas, carrito abandonado, programa de puntos, promociones por producto/categoría, banners programables:** funciones de fases posteriores o que requieren decisiones de contenido/marketing; no se inventó un diseño. La tabla `reviews` existe sin interfaz.
- **WhatsApp Business API y plantillas de mensajes editables:** requiere una cuenta y aprobación de Meta. Solo hay un enlace de atención opcional (`NEXT_PUBLIC_WHATSAPP`).
- **GA4 y Sentry:** requieren cuentas y consentimiento de cookies definido con el responsable; no se añadió rastreo sin ese aviso.
- **Reembolsos y cancelaciones automáticas, conciliación de pagos, múltiples sucursales/almacenes, tarifas de envío por peso o zona:** el envío es tarifa fija ($150, gratis desde $1,500). Los reembolsos y contracargos se muestran para conciliación manual.
- **Usuarios y permisos administrativos desde la interfaz:** el rol se asigna en Supabase, por decisión de seguridad (sin autoasignación).
- **Cifrado de datos personales en reposo a nivel de columna:** se apoya en el cifrado de disco de Supabase.
- **WCAG 2.1 AA verificado:** se cuidaron etiquetas, roles y mensajes, pero no hay auditoría con lector de pantalla ni pruebas automatizadas de accesibilidad.
- **Imágenes optimizadas y paginación del catálogo:** el catálogo se carga completo en el cliente; conviene paginar cuando crezca.

## Antes de vender (acciones del responsable)

1. Confirmar Supabase accesible, aplicar migraciones (`npm run db:migrate` o editor SQL) y ejecutar `npm run check:setup`.
2. Asignar el rol `admin` a la cuenta del responsable (UUID exacto) y publicar en `/admin/contenido` el aviso de privacidad, términos, ARCO, política sanitaria, envíos, devoluciones y contacto **aprobados legalmente**.
3. Revisión regulatoria de cada producto real (COFEPRIS) y carga de lotes y caducidades; retirar los datos de demostración.
4. Configurar Mercado Pago (webhook, secreto, HTTPS), Resend (dominio verificado), `CRON_SECRET` y la liberación programada de reservas.
5. Configurar límites de Supabase Auth y confirmar el plan de respaldos (ver `docs/DATABASE.md`).
6. Compra de prueba completa en sandbox: pago, webhook, correo, envío y entrega.
7. Revisión externa de código y prueba de acceso no autorizado por rol.
