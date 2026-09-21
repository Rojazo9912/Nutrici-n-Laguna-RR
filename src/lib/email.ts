import 'server-only';
import { serviceDatabase } from '@/lib/supabase/server';
import { renderOrderEmail, type OrderRow, type OrderEmailKind } from '@/lib/email-template';

/** Best-effort: never throws, so a mail outage cannot fail a webhook or an admin action. */
export async function sendOrderEmail(orderId: string, kind: OrderEmailKind): Promise<boolean> {
  const key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  try {
    const { data, error } = await serviceDatabase().from('orders').select('order_number,customer_email,subtotal,discount,shipping_cost,total,order_items(product_name,variant_name,quantity,price_at_purchase),shipments(carrier,tracking_number)').eq('id', orderId).single();
    if (error || !data) return false;
    const order = data as unknown as OrderRow;
    const message = renderOrderEmail(kind, order);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `order-${orderId}-${kind}` },
      body: JSON.stringify({ from, to: [order.customer_email], subject: message.subject, html: message.html, text: message.text }),
    });
    if (!response.ok) console.error('Correo de pedido no enviado', { kind, status: response.status });
    return response.ok;
  } catch {
    console.error('Correo de pedido no enviado', { kind });
    return false;
  }
}
