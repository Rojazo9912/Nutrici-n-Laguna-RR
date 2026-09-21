# Verificación de la implementación — 21 de septiembre de 2026

| Comprobación | Resultado |
|---|---|
| `npm test` | 21 pruebas aprobadas, PostgreSQL local en memoria |
| `npm run build` | Compilación de producción aprobada, Next.js 15.5.25 |
| Instalación limpia y auditoría npm | 0 vulnerabilidades reportadas |
| `git diff --check` | Sin errores de espacios |
| `npm run test:http` | 6 aprobadas; 2 fallan porque Supabase no está accesible |
| Navegación del panel sin sesión | Redirige a `/cuenta` |
| Checkout sin configuración de pago | Muestra indisponibilidad y deshabilita confirmación |

Las dos pruebas HTTP pendientes son la lectura del catálogo y el 404 de un producto inexistente. El dominio del proyecto configurado devuelve `ENOTFOUND` desde el resolvedor del sistema aun fuera del sandbox; `supabase.com` y `registry.npmjs.org` sí resuelven. No se cambió la configuración del proyecto para ocultar este fallo ni se añadieron datos simulados al flujo de producción.

La prueba HTTP de privacidad usa un identificador de pedido inexistente; el aislamiento entre propietarios se prueba con usuarios y pedidos diferentes en PostgreSQL local. No se realizaron cobros ni se crearon usuarios o pedidos en Supabase remoto.

## Pendiente de activación remota

1. Confirmar la disponibilidad del proyecto Supabase y sus URL/claves en `.env.local`.
2. Agregar `DATABASE_URL` administrativa del mismo proyecto y ejecutar `npm run db:migrate` (autorizado por el usuario, pendiente de la variable).
3. Verificar los permisos efectivos con la migración aplicada y repetir las pruebas HTTP y de carrito contra el catálogo remoto.
4. Publicar el aviso de privacidad versionado y el resto de documentos reales de la tienda.
5. Configurar Mercado Pago, la URL pública HTTPS y la liberación periódica de reservas; realizar una compra de prueba completa antes de habilitar ventas.

La integración de pagos y las funciones transaccionales están implementadas y probadas localmente, pero no se ha certificado un pago completo contra Mercado Pago ni aplicado la migración remota.
