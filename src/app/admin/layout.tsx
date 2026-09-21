import { AdminNav } from '@/components/AdminUi';
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <><AdminNav />{children}</>;
}
