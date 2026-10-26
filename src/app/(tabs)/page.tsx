import { CardStack } from "@/components/profile/CardStack";
import { DiscoverTopBar } from "@/components/ui/TopBar";
import { profiles } from "@/lib/mock-data";

export default function ForYouPage() {
  return (
    <main className="flex h-dvh flex-col pb-28">
      <DiscoverTopBar />
      <CardStack profiles={profiles} />
    </main>
  );
}
