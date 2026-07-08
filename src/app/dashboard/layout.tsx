import { redirect } from "next/navigation";
import Sidebar, { type SidebarUser } from "@/components/Sidebar";
import BrandonChat from "@/components/BrandonChat";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url, role")
    .eq("id", user.id)
    .single();

  const sidebarUser: SidebarUser = {
    name: profile?.full_name ?? user.email?.split("@")[0] ?? "Usuario",
    email: profile?.email ?? user.email ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    role: profile?.role ?? "cliente",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ivory text-navy">
      <Sidebar user={sidebarUser} />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BrandonChat userId={user.id} />
    </div>
  );
}
