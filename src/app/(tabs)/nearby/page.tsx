import { NearbyMap } from "@/components/nearby/NearbyMap";
import { DiscoverTopBar } from "@/components/ui/TopBar";
import { profiles } from "@/lib/mock-data";

export default function NearbyPage() {
  return (
    <main className="relative h-dvh">
      <NearbyMap profiles={profiles.slice(0, 6)} />
      <DiscoverTopBar />
    </main>
  );
}
