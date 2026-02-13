import { useEffect, useState, useRef } from "react";
import { DominoTileSVG } from "./domino-game";
import Domino3DScene from "./domino-3d";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Client, Room } from "colyseus.js";

type RemotePlayer = { id: string; name: string; tileCount: number };

export default function DominoMultiplayer({ username }: { username?: string }) {
  const [client] = useState(() => new Client((window as any).location.origin.replace(/^http/, "ws")));
  const roomRef = useRef<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const [board, setBoard] = useState<[number, number][]>([]);
  const [hand, setHand] = useState<[number, number][]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [status, setStatus] = useState<string>("waiting");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const room = await client.joinOrCreate("domino", { name: username || "Invitado" });
        roomRef.current = room;
        setConnected(true);

        room.onStateChange((state: any) => {
          if (!mounted) return;
          const ps: RemotePlayer[] = Object.values(state.players || {}).map((p: any) => ({ id: p.id, name: p.name, tileCount: (p.hand || []).length }));
          setPlayers(ps);

          const b: [number, number][] = [];
          for (let i = 0; i < (state.board || []).length; i += 2) {
            b.push([state.board[i], state.board[i + 1]]);
          }
          setBoard(b);

          const me = state.players ? state.players[room.sessionId] : null;
          const myHand: [number, number][] = (me && me.hand ? me.hand.map((h: any) => [h[0], h[1]]) : []);
          setHand(myHand);
          setTurnIndex(state.turnIndex || 0);
          setStatus(state.status || "waiting");
        });

        room.onMessage("players", (msg: any) => {
          setPlayers(msg.players || []);
        });

        room.onMessage("started", () => {
          // started - server will push state change
        });

        room.onMessage("roundOver", (m: any) => {
          alert(`Ronda terminada. Ganador: ${m.winner}`);
        });

      } catch (err) {
        console.error("Colyseus join error:", err);
      }
    })();

    return () => { mounted = false; roomRef.current?.leave(); };
  }, [client, username]);

  const playSelected = (side: "left" | "right") => {
    if (selectedIdx === null) return;
    const tile = hand[selectedIdx];
    roomRef.current?.send("play", { tile, side });
    setSelectedIdx(null);
  };

  const requestDraw = () => {
    roomRef.current?.send("draw", {});
  };

  const startMatch = () => {
    roomRef.current?.send("start", {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Domino — Premium (Multijugador)</Badge>
          <div className="text-sm text-muted-foreground">Estado: <strong>{status}</strong></div>
        </div>
        <div>
          {!connected ? <Button disabled>Conectando...</Button> : (
            <>
              <Button size="sm" onClick={startMatch} className="mr-2">Iniciar partida</Button>
              <Button size="sm" variant="outline" onClick={() => { roomRef.current?.leave(); setConnected(false); }}>Salir</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <div className="mb-2 font-medium">Jugadores</div>
          <div className="space-y-2">
            {players.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between p-2 rounded border ${i === turnIndex ? 'border-emerald-400 bg-emerald-50/5' : 'border-zinc-800'}`}>
                <div>{p.name}</div>
                <div className="text-xs opacity-80">{p.tileCount} fichas</div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <div className="mb-2 font-medium">Tablero</div>
          <div className="w-full">
            {/* 3D board + hand */}
            <div className="rounded bg-card/10 p-2">
              <Domino3DScene board={board} hand={hand} selectedIndex={selectedIdx} onSelect={(i) => setSelectedIdx(i)} />
            </div>
          </div>

          <div className="mt-4">
            <div className="mt-3 flex gap-2">
              <Button disabled={selectedIdx === null} onClick={() => playSelected("left")}>Jugar izquierda</Button>
              <Button disabled={selectedIdx === null} onClick={() => playSelected("right")}>Jugar derecha</Button>
              <Button variant="outline" onClick={requestDraw}>Robar</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
