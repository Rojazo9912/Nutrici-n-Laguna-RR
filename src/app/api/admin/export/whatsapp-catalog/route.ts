import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { errorResponse, HttpError } from '@/lib/http';
import { csvCell } from '@/lib/csv';
import { getCatalog } from '@/lib/catalog';
import { buildWhatsappCatalog, FEED_COLUMNS } from '@/lib/whatsapp-catalog';
export const dynamic = 'force-dynamic';

const csv = (header: readonly string[], rows: Record<string, string>[], filename: string) =>
  new Response('﻿' + [header.map(csvCell).join(','), ...rows.map(row => header.map(key => csvCell(row[key])).join(','))].join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' },
  });

// Archivo para Meta Commerce Manager → Catálogo → Orígenes de datos → Subir archivo.
// ?excluidos=1 descarga la lista de lo que NO se incluyó y por qué.
export async function GET(request: Request) {
  try {
    const staff = await staffUser();
    if (!staff || staff.role !== 'admin') throw new HttpError(403, 'No autorizado.');
    const appUrl = process.env.APP_URL;
    if (!appUrl?.startsWith('https://')) throw new HttpError(503, 'Configura APP_URL con el dominio HTTPS público de la tienda.');
    const db = serviceDatabase();
    // Sin la migración 08, un producto controlado podría seguir activo: no se exporta nada.
    const guard = await db.rpc('restricted_product_term', { p_text: 'testosterona' });
    if (guard.error || !guard.data) throw new HttpError(503, 'Aplica la migración 08 antes de exportar el catálogo a WhatsApp.');

    const { products } = await getCatalog();
    const { rows, excluded } = buildWhatsappCatalog(products, { baseUrl: appUrl, storageHost: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname });
    const showExcluded = new URL(request.url).searchParams.get('excluidos') === '1';
    await db.from('admin_audit_logs').insert({ admin_user_id: staff.id, action: 'export_whatsapp_catalog', entity_type: 'products', payload: { rows: rows.length, excluded: excluded.length, list: showExcluded ? 'excluidos' : 'catalogo' } });
    return showExcluded
      ? csv(['producto', 'slug', 'motivo'], excluded, 'whatsapp-excluidos.csv')
      : csv(FEED_COLUMNS, rows, 'whatsapp-catalogo.csv');
  } catch (error) { return errorResponse(error); }
}
