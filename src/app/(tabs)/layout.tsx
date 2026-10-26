import { BottomNav } from "@/components/ui/BottomNav";
import { conversations } from "@/lib/mock-data";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const unread = conversations.reduce((n, c) => n + c.unread, 0);
  return (
    <>
      {children}
      <BottomNav unread={unread} />
    </>
  );
}
