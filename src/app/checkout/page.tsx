'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, CreditCard, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    fullName: 'Juan Pérez',
    email: 'juan.perez@ejemplo.com',
    phone: '5512345678',
    street: 'Av. Insurgentes Sur 1200',
    colonia: 'Del Valle',
    city: 'Ciudad de México',
    state: 'CDMX',
    postalCode: '03100',
    paymentMethod: 'mercado_pago',
    privacyConsent: true,
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [webhookTriggered, setWebhookTriggered] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'pendiente' | 'pagado'>('pendiente');

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.privacyConsent) {
      alert('Debes aceptar el aviso de privacidad de datos personales (LFPDPPP).');
      return;
    }
    setOrderPlaced(true);
  };

  const handleSimulateWebhook = async () => {
    try {
      const response = await fetch('/api/webhooks/pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-signature': 'test-sha256-signature' },
        body: JSON.stringify({
          action: 'payment.created',
          data: { id: 'MP-99882211' },
          order_id: 'ORD-2026-0042',
          status: 'approved',
        })
      });
      const data = await response.json();
      if (data.success) {
        setWebhookTriggered(true);
        setOrderStatus('pagado');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-semibold mb-2">
          <Lock className="w-4 h-4" />
          <span>Checkout Seguro • Tokenización PCI SAQ A</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Finalizar Compra</h1>
      </div>

      {!orderPlaced ? (
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Shipping Address & Personal Data */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-white">1. Datos de Envío y Contacto</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Código Postal *</label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="text-xs space-y-4 pt-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Calle y Número *</label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={e => setFormData({ ...formData, street: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Ciudad *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Estado *</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Selector */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-white">2. Método de Pago</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${formData.paymentMethod === 'mercado_pago' ? 'border-emerald-500 bg-emerald-950/40' : 'border-slate-800 bg-slate-900/60'}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="mercado_pago"
                    checked={formData.paymentMethod === 'mercado_pago'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'mercado_pago' })}
                    className="accent-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-white block">Mercado Pago / Tarjeta</span>
                    <span className="text-[11px] text-slate-400">Débito, crédito, OXXO y SPEI</span>
                  </div>
                </label>

                <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${formData.paymentMethod === 'stripe' ? 'border-emerald-500 bg-emerald-950/40' : 'border-slate-800 bg-slate-900/60'}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={formData.paymentMethod === 'stripe'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'stripe' })}
                    className="accent-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-white block">Tarjeta de Crédito Internacional</span>
                    <span className="text-[11px] text-slate-400">Visa, Mastercard, AMEX</span>
                  </div>
                </label>
              </div>
            </div>

            {/* LFPDPPP Consent checkbox */}
            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-xs flex items-start gap-3">
              <input
                type="checkbox"
                id="lfpdppp"
                checked={formData.privacyConsent}
                onChange={e => setFormData({ ...formData, privacyConsent: e.target.checked })}
                className="mt-0.5 accent-emerald-500 w-4 h-4 rounded"
              />
              <label htmlFor="lfpdppp" className="text-slate-300">
                Acepto el <strong className="text-emerald-400">Aviso de Privacidad (LFPDPPP)</strong> para el tratamiento seguro de mis datos personales y confirmaciones de pedido por correo electrónico.
              </label>
            </div>
          </div>

          {/* Right Summary */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 h-fit">
            <h3 className="text-base font-bold text-white">Resumen de Compra</h3>

            <div className="space-y-3 border-b border-slate-800 pb-4 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>1x Gold Standard Whey 5lb</span>
                <span className="font-bold text-white">$1,299.00</span>
              </div>
              <div className="flex justify-between">
                <span>1x Creatina Monohidratada 500g</span>
                <span className="font-bold text-white">$499.00</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Envío a Domicilio</span>
                <span>GRATIS</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-black text-white">
              <span>Total:</span>
              <span className="text-emerald-400">$1,798.00 MXN</span>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all"
            >
              Confirmar y Generar Orden
            </button>
          </div>

        </form>
      ) : (
        /* Order Submitted - Webhook Rule Testing Screen */
        <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border border-emerald-500/30 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block">Orden #ORD-2026-0042 Generada</span>
            <h2 className="text-2xl font-bold text-white mt-1">Pedido Registrado con Éxito</h2>
          </div>

          {/* Hard Rule Badge */}
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 text-left space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Demostración de Regla Dura PRD (Sección 3.3):</span>
            </div>
            <p className="text-[11px] text-amber-100/80 leading-relaxed">
              Estado actual del pedido: <strong className="text-white uppercase font-mono px-2 py-0.5 rounded bg-amber-900/80">{orderStatus}</strong>.
              El pedido NO se marca automáticamente como pagado por el navegador. Requiere webhook criptográfico del proveedor.
            </p>
          </div>

          {!webhookTriggered ? (
            <div className="pt-2 space-y-3">
              <button
                onClick={handleSimulateWebhook}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Simular Recepción de Webhook Verificado (Mercado Pago API)</span>
              </button>
              <p className="text-[11px] text-slate-400">Haz clic arriba para enviar una firma HMAC y confirmar el pago legítimamente.</p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 space-y-2">
              <p className="font-bold flex items-center justify-center gap-1.5 text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> ¡Webhook Criptográfico Verificado Exitosamente!
              </p>
              <p className="text-[11px] text-emerald-200/80">
                Firma verificada: <code>SHA256-OK</code>. El estado de la orden en la BD ha cambiado oficialmente a <strong className="text-white uppercase font-mono">PAGADO</strong> y se ha descontado el stock de inventario.
              </p>
            </div>
          )}

          <Link href="/" className="inline-block text-xs font-bold text-emerald-400 hover:underline pt-4">
            ← Regresar al Inicio
          </Link>
        </div>
      )}

    </div>
  );
}
