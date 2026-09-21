'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FavoriteButton({ productId }: { productId: string }) {
  const [state, setState] = useState<'loading' | 'anonymous' | boolean>('loading');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/api/account/wishlist', { cache: 'no-store' }).then(async response => {
      if (!active) return;
      if (response.status === 401) return setState('anonymous');
      if (!response.ok) return setState(false);
      const data = await response.json();
      setState((data.items as { id: string }[]).some(item => item.id === productId));
    }).catch(() => active && setState(false));
    return () => { active = false; };
  }, [productId]);
  if (state === 'anonymous') return <p className="text-sm text-slate-400"><Link href="/cuenta" className="underline">Inicia sesión</Link> para guardar este producto en favoritos.</p>;
  async function toggle() {
    const favorite = state !== true;
    setMessage('');
    const response = await fetch('/api/account/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, favorite }) });
    if (response.ok) setState(favorite);
    else setMessage((await response.json().catch(() => ({}))).error || 'No fue posible actualizar favoritos.');
  }
  return <div><button type="button" disabled={state === 'loading'} aria-pressed={state === true} onClick={() => void toggle()} className="text-sm underline text-slate-300 disabled:opacity-50">{state === true ? '♥ Quitar de favoritos' : '♡ Guardar en favoritos'}</button>{message && <p role="alert" className="text-red-300 text-sm">{message}</p>}</div>;
}
