import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import AdminArco, { type ArcoRequest } from '@/components/AdminArco';
export const dynamic = 'force-dynamic';
export default async function AdminArcoPage() {
  const staff = await staffUser();
  if (!staff || staff.role !== 'admin') redirect('/cuenta');
  const { data, error } = await serviceDatabase().from('arco_requests').select('id,requester_name,requester_email,request_type,details,status,resolution_notes,created_at').order('created_at', { ascending: false }).limit(200);
  // Table missing (migration 06 pending) is shown as an empty, disabled panel rather than a crash.
  return <AdminArco requests={(data ?? []) as ArcoRequest[]} ready={!error} />;
}
