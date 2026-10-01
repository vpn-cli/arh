import LandingPage from "@/components/landing/LandingPage";
import { GameStateProvider } from "@/lib/gameState";

export default function Home() {
  return (
    <GameStateProvider>
      <LandingPage />
    </GameStateProvider>
  );
}
