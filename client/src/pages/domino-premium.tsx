import { useAuth } from "@/hooks/use-auth";
import DominoMultiplayer from "@/components/domino-multiplayer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function DominoPremiumPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div>Cargando...</div>;

  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-lg font-semibold">Domino Premium — Multijugador</div>
        <div>Debes iniciar sesión para jugar partidas multijugador con miembros.</div>
        <div className="flex gap-2">
          <Button onClick={() => setLocation('/login')}>Ir a iniciar sesión</Button>
          <Button variant="outline" onClick={() => setLocation('/registro')}>Crear cuenta</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DominoMultiplayer username={user.username} />
    </div>
  );
}
