import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { errorResponse, HttpError } from '@/lib/http';
import { csvCell } from '@/lib/csv';
export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const staff = await staffUser();
    if (!staff || staff.role !== 'admin') throw new HttpError(403, 'No autorizado.');
    const db = serviceDatabase();
    const { data, error } = await db.from('orders').select('order_number,status,created_at,subtotal,discount,shipping_cost,total,customer_email,shipping_address,order_items(product_name,variant_name,quantity),shipments(carrier,tracking_number)').order('created_at', { ascending: false }).limit(5000);
    if (error) throw new HttpError(503, 'No fue posible exportar.');
    await db.from('admin_audit_logs').insert({ admin_user_id: staff.id, action: 'export_orders', entity_type: 'orders', payload: { rows: data.length } });
    const header = ['pedido', 'estado', 'fecha', 'subtotal', 'descuento', 'envio', 'total', 'correo', 'ciudad', 'estado_envio', 'productos', 'paqueteria', 'guia'];
    const lines = (data as unknown as { order_number: number; status: string; created_at: string; subtotal: number; discount: number; shipping_cost: number; total: number; customer_email: string; shipping_address: { city?: string; state?: string }; order_items: { product_name: string; variant_name: string | null; quantity: number }[]; shipments: { carrier: string | null; tracking_number: string | null } | { carrier: string | null; tracking_number: string | null }[] | null }[]).map(order => {
      const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
      return [order.order_number, order.status, order.created_at, order.subtotal, order.discount, order.shipping_cost, order.total, order.customer_email, order.shipping_address?.city, order.shipping_address?.state, order.order_items.map(item => `${item.quantity}x ${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}`).join('; '), shipment?.carrier, shipment?.tracking_number].map(csvCell).join(',');
    });
    return new Response('﻿' + [header.map(csvCell).join(','), ...lines].join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="pedidos.csv"', 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
