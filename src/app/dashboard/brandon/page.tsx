import { redirect } from "next/navigation";
import BrandonChat from "@/components/BrandonChat";
import { createClient } from "@/lib/supabase/server";

export default async function BrandonChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return <BrandonChat userId={user.id} />;
}
