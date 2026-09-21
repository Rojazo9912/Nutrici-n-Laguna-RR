'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="max-w-xl mx-auto p-10 space-y-4"><h1 className="text-2xl font-bold">No pudimos cargar esta página</h1><p>Intenta nuevamente en un momento.</p><button className="bg-red-600 rounded-xl p-3" onClick={reset}>Reintentar</button></div>;
}
