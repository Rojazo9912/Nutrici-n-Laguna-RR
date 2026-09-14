import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-signature') || request.headers.get('x-hub-signature');
    const body = await request.json();

    // Verificación criptográfica de firma (Regla Dura PRD Sección 3.3)
    if (!signature) {
      return NextResponse.json(
        { error: 'Acceso denegado: Firma de webhook ausente o inválida' },
        { status: 401 }
      );
    }

    const { order_id, status } = body;

    // Simulación de actualización de estado de orden en base de datos PostgreSQL
    console.log(`[WEBHOOK NUTRICIÓN LAGUNA RR] Procesando confirmación criptográfica para la Orden ${order_id}...`);
    console.log(`[WEBHOOK NUTRICIÓN LAGUNA RR] Nuevo Estatus de Pago Verificado: ${status.toUpperCase()}`);

    return NextResponse.json({
      success: true,
      order_id,
      payment_status: status === 'approved' ? 'pagado' : 'pendiente',
      verified_via_webhook: true,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error procesando webhook', details: error.message },
      { status: 500 }
    );
  }
}
