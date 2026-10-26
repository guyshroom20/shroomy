import { BottomNav } from "@/components/ui/BottomNav";
import { getAccount } from "@/lib/auth";
import { getUnreadCount } from "@/lib/data/conversations";
import { conversations } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const unread = !isSupabaseConfigured
    ? conversations.reduce((n, c) => n + c.unread, 0)
    : (await getAccount())
      ? await getUnreadCount()
      : 0;
  return (
    <>
      {children}
      <BottomNav unread={unread} />
    </>
  );
}
