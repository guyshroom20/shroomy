import { NearbyMap } from "@/components/nearby/NearbyMap";
import { DiscoverTopBar } from "@/components/ui/TopBar";
import { getProfiles } from "@/lib/data/profiles";

export default async function NearbyPage() {
  const profiles = await getProfiles();
  return (
    <main className="relative h-dvh">
      <NearbyMap profiles={profiles.slice(0, 6)} />
      <DiscoverTopBar />
    </main>
  );
}
