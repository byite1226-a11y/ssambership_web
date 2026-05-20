import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { createClient } from "@/lib/supabase/server";
import { loadAdminDashboardExtended } from "@/lib/admin/adminDashboardExtended";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const data = await loadAdminDashboardExtended(supabase);
  return <AdminDashboardView data={data} />;
}
