import { FloatingHero } from "@/components/FloatingHero";
import { BoardStats, Footer, Header, HowItWorks, Pricing } from "@/components/Sections";
import { listBuildings } from "@/lib/store";
import { toPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const buildings = (await listBuildings()).map(toPublic);

  return (
    <main>
      <Header />
      <FloatingHero buildings={buildings} />
      <HowItWorks />
      <Pricing />
      <BoardStats buildings={buildings} />
      <Footer />
    </main>
  );
}
