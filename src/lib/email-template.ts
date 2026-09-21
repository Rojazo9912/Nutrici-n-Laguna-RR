import { money } from '@/lib/commerce';

export type OrderEmailKind = 'paid' | 'shipped' | 'delivered';
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export type OrderRow = {
  order_number: number; customer_email: string; subtotal: number; discount: number; shipping_cost: number; total: number;
  order_items: { product_name: string; variant_name: string | null; quantity: number; price_at_purchase: number }[];
  shipments: { carrier: string | null; tracking_number: string | null } | { carrier: string | null; tracking_number: string | null }[] | null;
};

export function renderOrderEmail(kind: OrderEmailKind, order: OrderRow) {
  const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
  const number = order.order_number;
  const copy = {
    paid: { subject: `Recibimos tu pago — pedido #${number}`, title: 'Pago confirmado', text: 'Confirmamos tu pago y estamos preparando tu pedido.' },
    shipped: { subject: `Tu pedido #${number} va en camino`, title: 'Pedido enviado', text: shipment?.tracking_number ? `Enviamos tu pedido con ${shipment.carrier}. Número de guía: ${shipment.tracking_number}.` : 'Enviamos tu pedido.' },
    delivered: { subject: `Pedido #${number} entregado`, title: 'Pedido entregado', text: 'Marcamos tu pedido como entregado. Gracias por tu compra.' },
  }[kind];
  const lines = order.order_items.map(item => ({ label: `${item.quantity} × ${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}`, price: money(item.price_at_purchase * item.quantity) }));
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h1>${escape(copy.title)}</h1><p>${escape(copy.text)}</p><p><strong>Pedido #${number}</strong></p><ul>${lines.map(line => `<li>${escape(line.label)} — ${escape(line.price)}</li>`).join('')}</ul><p>Envío: ${escape(money(order.shipping_cost))}<br><strong>Total: ${escape(money(order.total))} MXN</strong></p><p style="color:#666;font-size:12px">Nutrición Laguna RR. Si no reconoces esta compra, responde a este correo.</p></div>`;
  const text = [copy.title, copy.text, `Pedido #${number}`, ...lines.map(line => `${line.label} — ${line.price}`), `Envío: ${money(order.shipping_cost)}`, `Total: ${money(order.total)} MXN`].join('\n');
  return { subject: copy.subject, html, text };
}
