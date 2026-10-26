import { CardStack } from "@/components/profile/CardStack";
import { DiscoverTopBar } from "@/components/ui/TopBar";
import { getProfiles } from "@/lib/data/profiles";

export default async function ForYouPage() {
  const profiles = await getProfiles();
  return (
    <main className="flex h-dvh flex-col pb-28">
      <DiscoverTopBar />
      <CardStack profiles={profiles} />
    </main>
  );
}
