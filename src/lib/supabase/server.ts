import 'server-only';
import { createClient as supabaseClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function publicDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase no configurado');
  return supabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function serviceDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase no configurado');
  return supabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function sessionDatabase() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values: { name: string; value: string; options: CookieOptions }[]) => {
        try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); }
        catch { /* Read-only Server Components; refresh is handled by middleware. */ }
      },
    },
  });
}

export async function currentUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const { data, error } = await (await sessionDatabase()).auth.getUser();
  return error ? null : data.user;
}

export async function staffUser() {
  const user = await currentUser();
  if (!user) return null;
  const { data, error } = await serviceDatabase().from('profiles').select('role').eq('id', user.id).single();
  if (error || !data || !['admin', 'compliance_officer'].includes(data.role)) return null;
  return { id: user.id, role: data.role as string };
}
