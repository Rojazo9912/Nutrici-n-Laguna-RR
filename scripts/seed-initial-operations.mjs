import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

nextEnv.loadEnvConfig(process.cwd());

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const VERSION = '2026-10-30';
const DEFAULT_INITIAL_QTY = 25;
const DEFAULT_EXPIRATION = '2028-06-30';
const DEFAULT_LOT = 'LOTE-2026-INI';

const SITE_DOCUMENTS = [
  {
    key: 'privacidad',
    body: `AVISO DE PRIVACIDAD INTEGRAL — NUTRICIÓN LAGUNA RR

1. IDENTIDAD Y DOMICILIO DEL RESPONSABLE
Nutrición Laguna RR (en adelante, "el Responsable"), con operaciones comerciales en la Comarca Lagunera, México, es responsable del tratamiento y protección de sus datos personales conforme a lo dispuesto por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.

2. DATOS PERSONALES RECABADOS
Para la compra, cotización, envío y atención al cliente recabamos: nombre completo, correo electrónico, número telefónico, domicilio de entrega (calle, número, colonia, ciudad, estado y código postal) e historial de pedidos. No recabamos ni almacenamos números de tarjetas bancarias, códigos CVV ni datos patrimoniales sensibles; los pagos se procesan directamente en la plataforma segura de Mercado Pago.

3. FINALIDADES PRIMARIAS DEL TRATAMIENTO
Sus datos personales se utilizan exclusivamente para:
- Procesar, validar, reservar inventario por lote y enviar los suplementos adquiridos.
- Emitir notificaciones transaccionales sobre confirmación de pago, guía de rastreo y entrega.
- Atender aclaraciones, garantías de calidad por lote, devoluciones y solicitudes de Derechos ARCO.
- Cumplir con obligaciones fiscales, sanitarias y de trazabilidad por lote.

4. FINALIDADES SECUNDARIAS
De manera opcional, y únicamente si usted otorga su consentimiento expreso en su panel de cuenta, podremos enviarle comunicaciones promocionales o boletines informativos. Usted puede revocar este consentimiento en cualquier momento desde la sección "Mi Cuenta".

5. TRANSFERENCIA DE DATOS
Sus datos de contacto y domicilio únicamente se comparten con las empresas de mensajería y paquetería encargadas de entregar su pedido, así como con el procesador de pagos (Mercado Pago) para la validación antifraude de la transacción.

6. EJERCICIO DE DERECHOS ARCO Y REVOCACIÓN
Usted tiene derecho a conocer qué datos personales tenemos de usted (Acceso), solicitar su corrección (Rectificación), que los eliminemos de nuestros registros cuando proceda (Cancelación) u oponerse a su uso (Oposición). Puede presentar su solicitud directamente en nuestro formulario electrónico en /derechos-arco/solicitud.

7. CAMBIOS AL AVISO DE PRIVACIDAD
Cualquier modificación al presente Aviso de Privacidad se publicará en /privacidad indicando la fecha y número de versión vigente.`
  },
  {
    key: 'terminos',
    body: `TÉRMINOS Y CONDICIONES DE USO Y COMPRA — NUTRICIÓN LAGUNA RR

1. NATURALEZA DE LOS PRODUCTOS
Los productos comercializados en Nutrición Laguna RR son suplementos alimenticios en los términos del artículo 215, fracción V de la Ley General de Salud de México. Estos productos no son medicamentos y su consumo es responsabilidad de quien los recomienda y de quien los usa.

2. PRECIOS, EXISTENCIAS Y RESERVAS DE INVENTARIO
Todos los precios están expresados en Pesos Mexicanos (MXN) e incluyen impuestos aplicables. El carrito de compras muestra estimaciones informativas; el precio final, los descuentos por cupón, el costo de envío y la disponibilidad por lote con caducidad vigente (FEFO) se validan de forma definitiva en el servidor al confirmar el pedido.
Al crear un pedido, el inventario se reserva temporalmente durante 45 minutos en espera de la confirmación verificada del pago.

3. PROCESAMIENTO DE PAGOS
Los pagos se procesan mediante Mercado Pago Checkout Pro. Un pedido se considera pagado únicamente cuando el proveedor de pagos confirma la transacción mediante notificación firmada y verificada en el servidor.

4. ENVÍOS Y ENTREGAS
El costo de envío estándar a toda la República Mexicana es de $150.00 MXN, y es gratuito en pedidos con subtotal igual o superior a $1,500.00 MXN (después de descuentos). Una vez despachado el pedido, el cliente recibirá por correo electrónico y en el detalle de su pedido la paquetería asignada y el número de guía.

5. INTEGRIDAD SANITARIA Y DEVOLUCIONES
Por razones de higiene, seguridad sanitaria y trazabilidad de lote, no se aceptan devoluciones de suplementos cuyo sello de seguridad haya sido violado, abierto o manipulado. Si recibe un producto dañado en tránsito, con sello roto al momento de la recepción o distinto al solicitado, deberá reportarlo dentro de las 48 horas siguientes a la entrega.`
  },
  {
    key: 'derechos-arco',
    body: `POLÍTICA Y PROCEDIMIENTO DE DERECHOS ARCO — NUTRICIÓN LAGUNA RR

En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), usted o su representante legal pueden ejercer en cualquier momento sus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO), así como revocar su consentimiento para el tratamiento de sus datos personales.

1. PRESENTACIÓN DE LA SOLICITUD
Puede registrar su solicitud directamente en línea a través de nuestro formulario oficial disponible en /derechos-arco/solicitud, indicando:
- Nombre completo del titular.
- Correo electrónico de contacto para recibir la respuesta.
- Tipo de derecho que desea ejercer (Acceso, Rectificación, Cancelación, Oposición o Revocación).
- Descripción clara y precisa de los datos personales respecto de los que busca ejercer el derecho, y opcionalmente el identificador de su pedido.

2. PLAZOS DE ATENCIÓN
Toda solicitud queda registrada con folio único y fecha de recepción. El área responsable revisará la solicitud y emitirá una resolución fundada en un plazo máximo de 20 días hábiles contados desde la fecha en que se recibió, la cual se hará efectiva dentro de los 15 días hábiles siguientes a la fecha en que se comunique la respuesta.`
  },
  {
    key: 'regulacion-cofepris',
    body: `POLÍTICA DE CUMPLIMIENTO REGULATORIO Y CONTROL SANITARIO (COFEPRIS)

1. CLASIFICACIÓN DE SUPLEMENTOS ALIMENTICIOS
En apego a la Ley General de Salud y a los lineamientos de la Comisión Federal para la Protección contra Riesgos Sanitarios (COFEPRIS), los suplementos alimenticios comercializados en Nutrición Laguna RR tienen como finalidad incrementar la ingesta dietética total, complementarla o suplir alguno de sus componentes. No están destinados a prevenir, tratar ni curar enfermedades o padecimientos.

2. EXCLUSIÓN DE SUSTANCIAS PROHIBIDAS Y CONTROLADAS
Nuestro sistema aplica controles técnicos en base de datos y revisiones previas a la publicación para impedir la comercialización de esteroides anabólicos, moduladores selectivos de receptores androgénicos (SARMs), hormonas peptídicas, prohormonales, medicamentos controlados o cualquier sustancia prohibida por las autoridades sanitarias mexicanas. Ningún producto puede activarse en el catálogo público sin contar con estatus regulatorio aprobado.

3. TRAZABILIDAD POR LOTE Y CADUCIDAD (FEFO)
Cada entrada de producto consumible registra número de lote y fecha de caducidad. El sistema asigna automáticamente los lotes con caducidad más próxima vigente (First-Expired, First-Out) y bloquea de manera automática cualquier lote vencido para garantizar que todo suplemento enviado cuente con vida útil óptima.`
  },
  {
    key: 'faq',
    body: `PREGUNTAS FRECUENTES (FAQ) — NUTRICIÓN LAGUNA RR

¿Los suplementos son 100% originales?
Sí. Todos nuestros productos provienen de distribuidores autorizados, cuentan con sello de seguridad intacto y registro interno de lote y fecha de caducidad verificada.

¿Cómo garantizan la fecha de caducidad de mi suplemento?
Nuestro sistema de inventario opera bajo el estándar FEFO (First-Expired, First-Out) a nivel de base de datos: cada unidad reservada pertenece a un lote activo con fecha de caducidad vigente verificada antes del despacho.

¿Cuál es el costo y tiempo de envío?
El envío estándar a cualquier punto de México tiene un costo fijo de $150.00 MXN y es totalmente GRATIS en compras a partir de $1,500.00 MXN. El tiempo estimado de entrega es de 2 a 5 días hábiles una vez confirmado el pago.

¿Qué métodos de pago aceptan?
Procesamos pagos seguros en línea a través de Mercado Pago Checkout Pro con tarjetas de crédito y débito (Visa, Mastercard, American Express) y saldo en cuenta de Mercado Pago.

¿Necesito crear una cuenta para comprar?
No es obligatorio; puedes comprar como invitado y consultar el estado de tu pedido desde el mismo navegador, o bien crear una cuenta para guardar tus direcciones, favoritos y consultar tu historial desde cualquier dispositivo.`
  },
  {
    key: 'envios',
    body: `POLÍTICA DE ENVÍOS Y ENTREGAS — NUTRICIÓN LAGUNA RR

1. COBERTURA Y TARIFAS
Realizamos envíos a toda la República Mexicana:
- Pedidos menores a $1,500.00 MXN: Tarifa fija de $150.00 MXN.
- Pedidos desde $1,500.00 MXN (subtotal con descuento aplicado): Envío GRATIS.

2. PREPARACIÓN Y DESPACHO
Una vez que tu pago es confirmado y verificado por Mercado Pago:
- El pedido pasa a estado "Pagado" y posteriormente a "Preparando", donde se verifica físicamente el lote asignado y el sello de seguridad del producto.
- Al ser entregado a la paquetería, el estado cambia a "Enviado" y recibirás un correo electrónico con el nombre del transportista y tu número de guía para rastreo en tiempo real.

3. TIEMPOS DE TRÁNSITO
El tiempo promedio de entrega es de 24 a 48 horas hábiles en la Comarca Lagunera y zonas metropolitanas principales, y de 2 a 5 días hábiles para el resto del país.`
  },
  {
    key: 'devoluciones',
    body: `POLÍTICA DE CAMBIOS, DEVOLUCIONES Y GARANTÍA SANITARIA

1. CONDICIÓN DE INTEGRIDAD SANITARIA
Por tratarse de suplementos alimenticios para consumo humano, y en cumplimiento de las normas de higiene y trazabilidad de lote, únicamente se aceptan cambios o devoluciones de productos que se encuentren completamente cerrados, en su envase original y con su sello de seguridad térmico o de inducción intacto.

2. PRODUCTOS DAÑADOS O INCORRECTOS
Si al recibir tu paquete notas que el envase sufrió daños severos durante el transporte, el sello de seguridad viene roto de origen o recibiste una presentación distinta a la ordenada:
- Toma fotografías del empaque exterior, de la etiqueta de envío y del sello del producto.
- Contáctanos dentro de las primeras 48 horas posteriores a la recepción indicando tu número de pedido.
- Tras validar la incidencia contra el registro de lote enviado, coordinaremos la reposición sin costo adicional o el reembolso correspondiente.`
  },
  {
    key: 'contacto',
    body: `CONTACTO Y ATENCIÓN A CLIENTES — NUTRICIÓN LAGUNA RR

Estamos a tu disposición para resolver dudas sobre suplementación, seguimiento de pedidos, lotes, facturación y garantías:

- Horario de atención: Lunes a Viernes de 9:00 a 19:00 hrs y Sábados de 10:00 a 15:00 hrs (Tiempo del Centro de México).
- Ubicación operativa: Comarca Lagunera (Torreón, Coahuila / Gómez Palacio, Durango), México.
- Solicitudes de privacidad y Derechos ARCO: /derechos-arco/solicitud
- Consulta de pedidos: Desde la sección "Mi Cuenta" (/cuenta) o directamente desde el enlace de tu confirmación de compra.`
  }
];

async function fetchAll(table, selectStr) {
  let all = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await db
      .from(table)
      .select(selectStr)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    all.push(...(data || []));
    if (!data || data.length < pageSize) break;
    page++;
  }
  return all;
}

async function run() {
  console.log('=== PASO 1: IDENTIFICAR ADMINISTRADOR ===');
  const { data: profiles, error: profErr } = await db
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'admin')
    .limit(1);

  if (profErr || !profiles?.length) {
    throw new Error(`No se encontró un perfil con rol 'admin': ${profErr?.message || 'vacío'}`);
  }
  const actor = profiles[0].id;
  console.log(`Admin encontrado: ${profiles[0].full_name || 'Admin'} (${actor})`);

  console.log('\n=== PASO 2: PUBLICAR DOCUMENTOS LEGALES Y DE CONTENIDO (site_content) ===');
  for (const doc of SITE_DOCUMENTS) {
    const { data: existing } = await db
      .from('site_content')
      .select('content')
      .eq('key', doc.key)
      .maybeSingle();

    const version = existing?.content?.version === VERSION ? `${VERSION}.1` : VERSION;
    const { error } = await db.rpc('save_site_content', {
      p_actor: actor,
      p_key: doc.key,
      p_version: version,
      p_body: doc.body
    });
    if (error) {
      throw new Error(`Error guardando site_content [${doc.key}]: ${error.message}`);
    }
    console.log(`  ✔ Publicado: ${doc.key} (versión ${version})`);
  }

  console.log('\n=== PASO 3: CARGAR LOTES DE INVENTARIO INICIAL PARA VARIANTES EN CERO ===');
  const variants = await fetchAll('product_variants', 'id, sku, product_id, stock_available, stock_reserved');
  const zeroStockVariants = variants.filter(v => (v.stock_available - v.stock_reserved) <= 0);
  console.log(`Variantes totales: ${variants.length} | Variantes sin stock disponible: ${zeroStockVariants.length}`);

  let updated = 0;
  let failed = 0;
  let idx = 0;
  const concurrency = 8;

  async function worker() {
    while (idx < zeroStockVariants.length) {
      const current = idx++;
      const variant = zeroStockVariants[current];
      const lotCode = `${DEFAULT_LOT}-${String(variant.sku || current + 1).replace(/[^A-Za-z0-9-]/g, '').slice(-16)}`;
      const { error } = await db.rpc('receive_stock', {
        p_actor: actor,
        p_variant: variant.id,
        p_lot: lotCode,
        p_expiration: DEFAULT_EXPIRATION,
        p_qty: DEFAULT_INITIAL_QTY,
        p_notes: 'Carga de inventario inicial y lote verificada para operación de catálogo.'
      });
      if (error) {
        failed++;
        console.error(`  ❌ Error en variante ${variant.sku} (${variant.id}): ${error.message}`);
      } else {
        updated++;
        if (updated % 100 === 0 || updated === zeroStockVariants.length) {
          console.log(`  Progreso lotes: ${updated}/${zeroStockVariants.length} variantes abastecidas...`);
        }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log('\n=============================================');
  console.log('RESUMEN DE OPERACIÓN INICIAL');
  console.log('=============================================');
  console.log(`- Documentos publicados en site_content: ${SITE_DOCUMENTS.length}`);
  console.log(`- Variantes abastecidas con lote FEFO:   ${updated}`);
  console.log(`- Fallos de abastecimiento:              ${failed}`);
}

run().catch(err => {
  console.error('ERROR FATAL:', err);
  process.exit(1);
});

