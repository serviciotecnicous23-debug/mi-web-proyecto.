import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { GAME_TYPES } from "@shared/schema";
import type { GameRoom } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft, Grid3x3, Circle, Brain, Crown, Castle, Ticket,
  RectangleHorizontal, Plus, Users, Trophy, Copy, Loader2,
  Star, Heart, Flame, Shield, BookOpen, Church, Music, RotateCcw,
  Swords, Eye, EyeOff, Hash, ChevronLeft, ChevronRight, Sparkles,
  Sun, Moon, Zap, Anchor,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Chess } from "chess.js";
import { DominoFullGame } from "@/components/domino-game";

const GAME_ICONS: Record<string, any> = {
  tictactoe: Grid3x3,
  connect4: Circle,
  memory: Brain,
  checkers: Crown,
  chess: Castle,
  bingo: Ticket,
  domino: RectangleHorizontal,
};

const MEMORY_ICONS = [Star, Heart, Flame, Crown, Shield, BookOpen, Church, Music, Sun, Moon, Zap, Anchor];

type GameTypeKey = keyof typeof GAME_TYPES;

type RoomWithNames = GameRoom & { player1Name?: string; player2Name?: string };

type TicTacToeState = { board: string[][]; currentPlayer: "X" | "O" };
type Connect4State = { board: number[][]; currentPlayer: 1 | 2 };
type MemoryCard = { id: number; iconIdx: number; flipped: boolean; matched: boolean };
type MemoryState = { cards: MemoryCard[]; currentPlayer: 1 | 2; scores: [number, number] };
type CheckersState = { board: number[][]; currentPlayer: 1 | 2 };
type ChessState = { fen: string; pgn: string };
type BingoState = {
  calledNumbers: number[];
  cards: Record<string, number[][]>;
  markedCells: Record<string, boolean[][]>;
  caller: "auto";
};
type DominoState = {
  hands: Record<string, [number, number][]>;
  board: [number, number][];
  currentPlayer: 1 | 2;
  pool: [number, number][];
  passes: number;
};

type ViewState =
  | { view: "hub" }
  | { view: "lobby"; gameType: GameTypeKey }
  | { view: "room"; roomId: number; gameType: GameTypeKey; isLocal: false }
  | { view: "local"; gameType: GameTypeKey }
  | { view: "stats" }
  | { view: "domino_full" };

function createTicTacToeState(): TicTacToeState {
  return { board: Array.from({ length: 3 }, () => ["", "", ""]), currentPlayer: "X" };
}

function checkTicTacToeWin(board: string[][]): string | null {
  for (let i = 0; i < 3; i++) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) return board[i][0];
    if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) return board[0][i];
  }
  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) return board[0][0];
  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) return board[0][2];
  return null;
}

function isTicTacToeDraw(board: string[][]): boolean {
  return board.every(row => row.every(cell => cell !== ""));
}

function createConnect4State(): Connect4State {
  return { board: Array.from({ length: 6 }, () => Array(7).fill(0)), currentPlayer: 1 };
}

function dropConnect4(board: number[][], col: number, player: number): number[][] | null {
  const nb = board.map(r => [...r]);
  for (let r = 5; r >= 0; r--) {
    if (nb[r][col] === 0) { nb[r][col] = player; return nb; }
  }
  return null;
}

function checkConnect4Win(board: number[][]): number | null {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      const v = board[r][c];
      if (!v) continue;
      if (c + 3 < 7 && v === board[r][c + 1] && v === board[r][c + 2] && v === board[r][c + 3]) return v;
      if (r + 3 < 6 && v === board[r + 1][c] && v === board[r + 2][c] && v === board[r + 3][c]) return v;
      if (r + 3 < 6 && c + 3 < 7 && v === board[r + 1][c + 1] && v === board[r + 2][c + 2] && v === board[r + 3][c + 3]) return v;
      if (r + 3 < 6 && c - 3 >= 0 && v === board[r + 1][c - 1] && v === board[r + 2][c - 2] && v === board[r + 3][c - 3]) return v;
    }
  }
  return null;
}

function isConnect4Full(board: number[][]): boolean {
  return board[0].every(c => c !== 0);
}

function createMemoryState(): MemoryState {
  const pairs: number[] = [];
  for (let i = 0; i < 12; i++) { pairs.push(i, i); }
  const shuffled = pairs.sort(() => Math.random() - 0.5);
  return {
    cards: shuffled.map((iconIdx, id) => ({ id, iconIdx, flipped: false, matched: false })),
    currentPlayer: 1,
    scores: [0, 0],
  };
}

function createCheckersState(): CheckersState {
  const board = Array.from({ length: 8 }, () => Array(8).fill(0));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[r][c] = 2;
    }
  }
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[r][c] = 1;
    }
  }
  return { board, currentPlayer: 1 };
}

function getCheckerMoves(board: number[][], row: number, col: number, player: 1 | 2): { r: number; c: number; captures: { r: number; c: number }[] }[] {
  const piece = board[row][col];
  if (piece === 0) return [];
  const isKing = piece === 3 || piece === 4;
  const owner = piece === 1 || piece === 3 ? 1 : 2;
  if (owner !== player) return [];

  const directions: [number, number][] = [];
  if (owner === 1 || isKing) directions.push([-1, -1], [-1, 1]);
  if (owner === 2 || isKing) directions.push([1, -1], [1, 1]);

  const moves: { r: number; c: number; captures: { r: number; c: number }[] }[] = [];

  const findJumps = (r: number, c: number, b: number[][], caps: { r: number; c: number }[], dirs: [number, number][]) => {
    let found = false;
    for (const [dr, dc] of dirs) {
      const mr = r + dr, mc = c + dc;
      const lr = r + 2 * dr, lc = c + 2 * dc;
      if (lr < 0 || lr > 7 || lc < 0 || lc > 7) continue;
      const mid = b[mr][mc];
      const midOwner = mid === 1 || mid === 3 ? 1 : mid === 2 || mid === 4 ? 2 : 0;
      if (midOwner !== 0 && midOwner !== player && b[lr][lc] === 0) {
        if (caps.some(cp => cp.r === mr && cp.c === mc)) continue;
        found = true;
        const nb = b.map(rw => [...rw]);
        nb[lr][lc] = nb[r][c];
        nb[r][c] = 0;
        nb[mr][mc] = 0;
        const newCaps = [...caps, { r: mr, c: mc }];
        findJumps(lr, lc, nb, newCaps, dirs);
        moves.push({ r: lr, c: lc, captures: newCaps });
      }
    }
    return found;
  };

  findJumps(row, col, board, [], directions);

  if (moves.length === 0) {
    for (const [dr, dc] of directions) {
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7 && board[nr][nc] === 0) {
        moves.push({ r: nr, c: nc, captures: [] });
      }
    }
  }

  return moves;
}

function hasCaptures(board: number[][], player: 1 | 2): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      const own = p === 1 || p === 3 ? 1 : p === 2 || p === 4 ? 2 : 0;
      if (own !== player) continue;
      const mvs = getCheckerMoves(board, r, c, player);
      if (mvs.some(m => m.captures.length > 0)) return true;
    }
  }
  return false;
}

function canPlayerMove(board: number[][], player: 1 | 2): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      const own = p === 1 || p === 3 ? 1 : p === 2 || p === 4 ? 2 : 0;
      if (own !== player) continue;
      if (getCheckerMoves(board, r, c, player).length > 0) return true;
    }
  }
  return false;
}

function playerPieceCount(board: number[][], player: 1 | 2): number {
  let count = 0;
  for (const row of board) {
    for (const c of row) {
      const own = c === 1 || c === 3 ? 1 : c === 2 || c === 4 ? 2 : 0;
      if (own === player) count++;
    }
  }
  return count;
}

function createBingoCard(): number[][] {
  const ranges = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75]];
  const card: number[][] = [];
  for (let col = 0; col < 5; col++) {
    const [min, max] = ranges[col];
    const nums: number[] = [];
    while (nums.length < 5) {
      const n = min + Math.floor(Math.random() * (max - min + 1));
      if (!nums.includes(n)) nums.push(n);
    }
    card.push(nums);
  }
  return card;
}

function createBingoState(): BingoState {
  return {
    calledNumbers: [],
    cards: {
      "1": createBingoCard(),
      "2": createBingoCard(),
    },
    markedCells: {
      "1": Array.from({ length: 5 }, (_, c) => Array.from({ length: 5 }, (_, r) => c === 2 && r === 2)),
      "2": Array.from({ length: 5 }, (_, c) => Array.from({ length: 5 }, (_, r) => c === 2 && r === 2)),
    },
    caller: "auto",
  };
}

function checkBingoWin(marked: boolean[][]): boolean {
  for (let r = 0; r < 5; r++) {
    if (marked.every(col => col[r])) return true;
  }
  for (let c = 0; c < 5; c++) {
    if (marked[c].every(v => v)) return true;
  }
  if ([0, 1, 2, 3, 4].every(i => marked[i][i])) return true;
  if ([0, 1, 2, 3, 4].every(i => marked[i][4 - i])) return true;
  return false;
}

function createDominoTiles(): [number, number][] {
  const tiles: [number, number][] = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      tiles.push([a, b]);
    }
  }
  return tiles;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createDominoState(): DominoState {
  const tiles = shuffleArray(createDominoTiles());
  return {
    hands: { "1": tiles.slice(0, 7), "2": tiles.slice(7, 14) },
    board: [],
    currentPlayer: 1,
    pool: tiles.slice(14),
    passes: 0,
  };
}

function dominoEndValues(board: [number, number][]): [number, number] | null {
  if (board.length === 0) return null;
  const first = board[0];
  const last = board[board.length - 1];
  return [first[0], last[1]];
}

function canPlayDomino(tile: [number, number], ends: [number, number] | null): ("left" | "right")[] {
  if (!ends) return ["left"];
  const sides: ("left" | "right")[] = [];
  if (tile[0] === ends[0] || tile[1] === ends[0]) sides.push("left");
  if (tile[0] === ends[1] || tile[1] === ends[1]) sides.push("right");
  return sides;
}

function placeDominoTile(board: [number, number][], tile: [number, number], side: "left" | "right"): [number, number][] {
  const nb = [...board];
  if (nb.length === 0) {
    return [[tile[0], tile[1]]];
  }
  if (side === "left") {
    const leftEnd = nb[0][0];
    if (tile[1] === leftEnd) {
      nb.unshift([tile[0], tile[1]]);
    } else {
      nb.unshift([tile[1], tile[0]]);
    }
  } else {
    const rightEnd = nb[nb.length - 1][1];
    if (tile[0] === rightEnd) {
      nb.push([tile[0], tile[1]]);
    } else {
      nb.push([tile[1], tile[0]]);
    }
  }
  return nb;
}

const CHESS_PIECES: Record<string, string> = {
  K: "\u2654", Q: "\u2655", R: "\u2656", B: "\u2657", N: "\u2658", P: "\u2659",
  k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F",
};

function TicTacToeGame({ state, onMove, disabled, playerNumber }: {
  state: TicTacToeState; onMove: (newState: TicTacToeState) => void; disabled: boolean; playerNumber?: 1 | 2;
}) {
  const winner = checkTicTacToeWin(state.board);
  const draw = !winner && isTicTacToeDraw(state.board);

  const handleClick = (r: number, c: number) => {
    if (disabled || winner || draw || state.board[r][c]) return;
    const nb = state.board.map(row => [...row]);
    nb[r][c] = state.currentPlayer;
    onMove({ board: nb, currentPlayer: state.currentPlayer === "X" ? "O" : "X" });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!winner && !draw && (
        <Badge variant="outline" data-testid="text-current-player">
          Turno: {playerNumber ? `Jugador ${state.currentPlayer === "X" ? 1 : 2}` : state.currentPlayer}
        </Badge>
      )}
      {winner && <Badge className="bg-green-600 text-white" data-testid="text-winner">Ganador: {winner}</Badge>}
      {draw && <Badge variant="secondary" data-testid="text-draw">Empate</Badge>}
      <div className="grid grid-cols-3 gap-1" style={{ width: "min(80vw, 280px)" }}>
        {state.board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              data-testid={`cell-ttt-${r}-${c}`}
              className={`aspect-square rounded-md border-2 flex items-center justify-center text-3xl font-bold transition-colors
                ${cell ? "bg-muted" : "hover-elevate cursor-pointer bg-card"}
                ${cell === "X" ? "text-orange-500 border-orange-300" : cell === "O" ? "text-blue-500 border-blue-300" : "border-border"}`}
              onClick={() => handleClick(r, c)}
              disabled={disabled || !!winner || draw || !!cell}
            >
              {cell}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function Connect4Game({ state, onMove, disabled }: {
  state: Connect4State; onMove: (newState: Connect4State) => void; disabled: boolean;
}) {
  const winner = checkConnect4Win(state.board);
  const draw = !winner && isConnect4Full(state.board);

  const handleDrop = (col: number) => {
    if (disabled || winner || draw) return;
    const nb = dropConnect4(state.board, col, state.currentPlayer);
    if (!nb) return;
    onMove({ board: nb, currentPlayer: state.currentPlayer === 1 ? 2 : 1 });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!winner && !draw && (
        <Badge variant="outline" data-testid="text-current-player">
          Turno: Jugador {state.currentPlayer}
          <Circle className={`w-3 h-3 ml-1 ${state.currentPlayer === 1 ? "fill-red-500 text-red-500" : "fill-yellow-500 text-yellow-500"}`} />
        </Badge>
      )}
      {winner && <Badge className="bg-green-600 text-white" data-testid="text-winner">Ganador: Jugador {winner}</Badge>}
      {draw && <Badge variant="secondary" data-testid="text-draw">Empate</Badge>}
      <div className="bg-blue-600 dark:bg-blue-800 p-2 rounded-md" style={{ width: "min(90vw, 350px)" }}>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, col) => (
            <button
              key={`top-${col}`}
              data-testid={`button-c4-col-${col}`}
              className="aspect-square flex items-center justify-center rounded-md hover-elevate"
              onClick={() => handleDrop(col)}
              disabled={disabled || !!winner || draw}
            >
              <ChevronLeft className="w-4 h-4 text-white rotate-[-90deg]" />
            </button>
          ))}
          {state.board.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                data-testid={`cell-c4-${r}-${c}`}
                className="aspect-square rounded-full border-2 border-blue-700 dark:border-blue-900 flex items-center justify-center"
                style={{
                  backgroundColor: cell === 1 ? "#ef4444" : cell === 2 ? "#eab308" : "white",
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MemoryGame({ state, onMove, disabled }: {
  state: MemoryState; onMove: (newState: MemoryState) => void; disabled: boolean;
}) {
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [checking, setChecking] = useState(false);
  const allMatched = state.cards.every(c => c.matched);

  const handleFlip = (idx: number) => {
    if (disabled || checking || state.cards[idx].flipped || state.cards[idx].matched || flippedIndices.length >= 2) return;
    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);

    const nc = state.cards.map((c, i) => i === idx ? { ...c, flipped: true } : c);

    if (newFlipped.length === 2) {
      setChecking(true);
      const [a, b] = newFlipped;
      if (nc[a].iconIdx === nc[b].iconIdx) {
        const matched = nc.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c);
        const newScores: [number, number] = [...state.scores];
        newScores[state.currentPlayer - 1]++;
        setTimeout(() => {
          onMove({ cards: matched, currentPlayer: state.currentPlayer, scores: newScores });
          setFlippedIndices([]);
          setChecking(false);
        }, 600);
      } else {
        setTimeout(() => {
          const reset = nc.map((c, i) => (i === a || i === b) ? { ...c, flipped: false } : c);
          onMove({ cards: reset, currentPlayer: state.currentPlayer === 1 ? 2 : 1, scores: state.scores });
          setFlippedIndices([]);
          setChecking(false);
        }, 1000);
      }
    } else {
      onMove({ ...state, cards: nc });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Badge variant={state.currentPlayer === 1 ? "default" : "outline"} data-testid="text-score-p1">
          J1: {state.scores[0]}
        </Badge>
        <Badge variant={state.currentPlayer === 2 ? "default" : "outline"} data-testid="text-score-p2">
          J2: {state.scores[1]}
        </Badge>
      </div>
      {allMatched && (
        <Badge className="bg-green-600 text-white" data-testid="text-winner">
          {state.scores[0] > state.scores[1] ? "Jugador 1 gana" : state.scores[1] > state.scores[0] ? "Jugador 2 gana" : "Empate"}
        </Badge>
      )}
      <div className="grid grid-cols-6 gap-2" style={{ width: "min(90vw, 420px)" }}>
        {state.cards.map((card, idx) => {
          const IconComp = MEMORY_ICONS[card.iconIdx];
          return (
            <button
              key={card.id}
              data-testid={`card-memory-${idx}`}
              className={`aspect-square rounded-md border-2 flex items-center justify-center transition-all
                ${card.matched ? "bg-green-100 dark:bg-green-900/30 border-green-400" :
                  card.flipped ? "bg-orange-50 dark:bg-orange-900/20 border-orange-400" :
                  "bg-primary/10 border-primary/30 hover-elevate cursor-pointer"}`}
              onClick={() => handleFlip(idx)}
              disabled={disabled || card.flipped || card.matched || checking}
            >
              {(card.flipped || card.matched) ? (
                <IconComp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              ) : (
                <Sparkles className="w-6 h-6 text-primary/40" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckersGame({ state, onMove, disabled }: {
  state: CheckersState; onMove: (newState: CheckersState) => void; disabled: boolean;
}) {
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ r: number; c: number; captures: { r: number; c: number }[] }[]>([]);

  const p1Count = playerPieceCount(state.board, 1);
  const p2Count = playerPieceCount(state.board, 2);
  const p1CanMove = canPlayerMove(state.board, 1);
  const p2CanMove = canPlayerMove(state.board, 2);
  const winner = p2Count === 0 || !p2CanMove ? 1 : p1Count === 0 || !p1CanMove ? 2 : null;

  const mustCapture = hasCaptures(state.board, state.currentPlayer);

  const handleClick = (r: number, c: number) => {
    if (disabled || winner) return;
    const piece = state.board[r][c];
    const owner = piece === 1 || piece === 3 ? 1 : piece === 2 || piece === 4 ? 2 : 0;

    if (owner === state.currentPlayer) {
      const moves = getCheckerMoves(state.board, r, c, state.currentPlayer);
      const filtered = mustCapture ? moves.filter(m => m.captures.length > 0) : moves;
      if (filtered.length > 0) {
        setSelected({ r, c });
        setValidMoves(filtered);
      }
      return;
    }

    if (selected) {
      const move = validMoves.find(m => m.r === r && m.c === c);
      if (move) {
        const nb = state.board.map(row => [...row]);
        nb[r][c] = nb[selected.r][selected.c];
        nb[selected.r][selected.c] = 0;
        for (const cap of move.captures) nb[cap.r][cap.c] = 0;
        if ((state.currentPlayer === 1 && r === 0 && (nb[r][c] === 1))) nb[r][c] = 3;
        if ((state.currentPlayer === 2 && r === 7 && (nb[r][c] === 2))) nb[r][c] = 4;
        onMove({ board: nb, currentPlayer: state.currentPlayer === 1 ? 2 : 1 });
        setSelected(null);
        setValidMoves([]);
      }
    }
  };

  useEffect(() => { setSelected(null); setValidMoves([]); }, [state.currentPlayer]);

  return (
    <div className="flex flex-col items-center gap-4">
      {!winner && (
        <Badge variant="outline" data-testid="text-current-player">
          Turno: Jugador {state.currentPlayer}
        </Badge>
      )}
      {winner && <Badge className="bg-green-600 text-white" data-testid="text-winner">Ganador: Jugador {winner}</Badge>}
      <div className="grid grid-cols-8 border rounded-md" style={{ width: "min(90vw, 360px)" }}>
        {state.board.map((row, r) =>
          row.map((cell, c) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected = selected?.r === r && selected?.c === c;
            const isValid = validMoves.some(m => m.r === r && m.c === c);
            return (
              <button
                key={`${r}-${c}`}
                data-testid={`cell-checkers-${r}-${c}`}
                className={`aspect-square flex items-center justify-center text-lg
                  ${isDark ? "bg-amber-800 dark:bg-amber-900" : "bg-amber-100 dark:bg-amber-200"}
                  ${isSelected ? "ring-2 ring-yellow-400 ring-inset" : ""}
                  ${isValid ? "ring-2 ring-green-400 ring-inset" : ""}`}
                onClick={() => handleClick(r, c)}
                disabled={disabled || !!winner}
              >
                {cell === 1 && <div className="w-[70%] h-[70%] rounded-full bg-red-500 border-2 border-red-700" />}
                {cell === 2 && <div className="w-[70%] h-[70%] rounded-full bg-stone-800 dark:bg-stone-200 border-2 border-stone-900 dark:border-stone-400" />}
                {cell === 3 && <div className="w-[70%] h-[70%] rounded-full bg-red-500 border-2 border-red-700 flex items-center justify-center"><Crown className="w-3 h-3 text-yellow-300" /></div>}
                {cell === 4 && <div className="w-[70%] h-[70%] rounded-full bg-stone-800 dark:bg-stone-200 border-2 border-stone-900 dark:border-stone-400 flex items-center justify-center"><Crown className="w-3 h-3 text-yellow-500" /></div>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ChessGame({ state, onMove, disabled, playerNumber }: {
  state: ChessState; onMove: (newState: ChessState) => void; disabled: boolean; playerNumber?: 1 | 2;
}) {
  const [selectedSq, setSelectedSq] = useState<string | null>(null);
  const chess = useMemo(() => { const g = new Chess(); g.load(state.fen); return g; }, [state.fen]);
  const board = chess.board();
  const isFlipped = playerNumber === 2;

  const validSquares = useMemo(() => {
    if (!selectedSq) return new Set<string>();
    const moves = chess.moves({ square: selectedSq as any, verbose: true });
    return new Set(moves.map(m => m.to));
  }, [selectedSq, chess]);

  const turn = chess.turn();
  const isCheck = chess.isCheck();
  const isCheckmate = chess.isCheckmate();
  const isStalemate = chess.isStalemate();
  const isDraw = chess.isDraw();
  const isGameOver = chess.isGameOver();

  const handleClick = (sq: string) => {
    if (disabled || isGameOver) return;
    const piece = chess.get(sq as any);

    if (selectedSq) {
      if (validSquares.has(sq)) {
        const g = new Chess(state.fen);
        const move = g.move({ from: selectedSq, to: sq, promotion: "q" });
        if (move) {
          onMove({ fen: g.fen(), pgn: g.pgn() });
          setSelectedSq(null);
          return;
        }
      }
      if (piece && piece.color === turn) {
        setSelectedSq(sq);
        return;
      }
      setSelectedSq(null);
      return;
    }

    if (piece && piece.color === turn) {
      setSelectedSq(sq);
    }
  };

  const rows = isFlipped ? [...board].reverse() : board;
  const files = "abcdefgh";

  return (
    <div className="flex flex-col items-center gap-4">
      {!isGameOver && (
        <Badge variant="outline" data-testid="text-current-player">
          Turno: {turn === "w" ? "Blancas" : "Negras"}
          {isCheck && " - Jaque!"}
        </Badge>
      )}
      {isCheckmate && <Badge className="bg-green-600 text-white" data-testid="text-winner">Jaque Mate - {turn === "w" ? "Negras" : "Blancas"} ganan</Badge>}
      {isStalemate && <Badge variant="secondary" data-testid="text-draw">Tablas (Ahogado)</Badge>}
      {isDraw && !isStalemate && <Badge variant="secondary" data-testid="text-draw">Tablas</Badge>}
      <div className="grid grid-cols-8 border rounded-md" style={{ width: "min(90vw, 360px)" }}>
        {rows.map((row, ri) => {
          const actualRow = isFlipped ? ri : 7 - ri;
          const displayRow = isFlipped ? [...row].reverse() : row;
          return displayRow.map((sq, ci) => {
            const actualCol = isFlipped ? 7 - ci : ci;
            const sqName = files[actualCol] + (actualRow + 1);
            const isLight = (actualRow + actualCol) % 2 === 0;
            const isSelectedSq = selectedSq === sqName;
            const isValidMove = validSquares.has(sqName);
            const pieceChar = sq ? CHESS_PIECES[(sq.color === "w" ? sq.type.toUpperCase() : sq.type)] : "";

            return (
              <button
                key={sqName}
                data-testid={`cell-chess-${sqName}`}
                className={`aspect-square flex items-center justify-center text-2xl sm:text-3xl
                  ${isLight ? "bg-amber-100 dark:bg-amber-200" : "bg-amber-700 dark:bg-amber-800"}
                  ${isSelectedSq ? "ring-2 ring-yellow-400 ring-inset" : ""}
                  ${isValidMove ? "ring-2 ring-green-400 ring-inset" : ""}`}
                onClick={() => handleClick(sqName)}
                disabled={disabled || isGameOver}
              >
                {pieceChar && <span className={sq?.color === "w" ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : "text-stone-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]"}>{pieceChar}</span>}
                {!pieceChar && isValidMove && <div className="w-3 h-3 rounded-full bg-green-400/50" />}
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}

function BingoGame({ state, onMove, playerView, disabled }: {
  state: BingoState; onMove: (newState: BingoState) => void; playerView: string; disabled: boolean;
}) {
  const card = state.cards[playerView];
  const marked = state.markedCells[playerView];
  const headers = ["B", "I", "N", "G", "O"];
  const p1Win = checkBingoWin(state.markedCells["1"]);
  const p2Win = checkBingoWin(state.markedCells["2"]);
  const winner = p1Win ? 1 : p2Win ? 2 : null;
  const lastCalled = state.calledNumbers.length > 0 ? state.calledNumbers[state.calledNumbers.length - 1] : null;

  const handleMark = (col: number, row: number) => {
    if (disabled || winner) return;
    if (col === 2 && row === 2) return;
    const num = card[col][row];
    if (!state.calledNumbers.includes(num)) return;
    if (marked[col][row]) return;
    const nm = { ...state.markedCells };
    nm[playerView] = nm[playerView].map((c, ci) => ci === col ? c.map((v, ri) => ri === row ? true : v) : c);
    onMove({ ...state, markedCells: nm });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {lastCalled !== null && (
        <div className="flex items-center gap-2">
          <Badge className="text-lg px-4 py-1" data-testid="text-called-number">
            {lastCalled}
          </Badge>
          <span className="text-sm text-muted-foreground">({state.calledNumbers.length} llamados)</span>
        </div>
      )}
      {winner && <Badge className="bg-green-600 text-white" data-testid="text-winner">Jugador {winner} - BINGO!</Badge>}
      <div className="grid grid-cols-5 gap-1" style={{ width: "min(85vw, 300px)" }}>
        {headers.map((h, i) => (
          <div key={h} className="aspect-square flex items-center justify-center font-bold text-lg text-primary">{h}</div>
        ))}
        {Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 5 }, (_, col) => {
            const isFree = col === 2 && row === 2;
            const num = card[col][row];
            const isMarked = marked[col][row];
            const isCalled = state.calledNumbers.includes(num);
            return (
              <button
                key={`${col}-${row}`}
                data-testid={`cell-bingo-${col}-${row}`}
                className={`aspect-square rounded-md border-2 flex items-center justify-center text-sm font-bold transition-colors
                  ${isFree ? "bg-yellow-200 dark:bg-yellow-800 border-yellow-400" :
                    isMarked ? "bg-green-500 text-white border-green-600" :
                    isCalled ? "bg-orange-100 dark:bg-orange-900/30 border-orange-400 hover-elevate cursor-pointer" :
                    "bg-card border-border"}`}
                onClick={() => handleMark(col, row)}
                disabled={disabled || !!winner || isFree || !isCalled || isMarked}
              >
                {isFree ? <Star className="w-4 h-4 text-yellow-600" /> : num}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function DominoGame({ state, onMove, playerView, disabled }: {
  state: DominoState; onMove: (newState: DominoState) => void; playerView: string; disabled: boolean;
}) {
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const hand = state.hands[playerView] || [];
  const ends = dominoEndValues(state.board);
  const isMyTurn = String(state.currentPlayer) === playerView;
  const otherPlayer = state.currentPlayer === 1 ? "2" : "1";
  const otherHand = state.hands[otherPlayer] || [];

  const gameOver = (hand.length === 0) || (otherHand.length === 0) || state.passes >= 2;
  const p1Pips = (state.hands["1"] || []).reduce((s, t) => s + t[0] + t[1], 0);
  const p2Pips = (state.hands["2"] || []).reduce((s, t) => s + t[0] + t[1], 0);
  const winner = gameOver
    ? (state.hands["1"]?.length === 0 ? 1 : state.hands["2"]?.length === 0 ? 2 : p1Pips < p2Pips ? 1 : p2Pips < p1Pips ? 2 : 0)
    : null;

  const canPlay = hand.some(t => canPlayDomino(t, ends).length > 0);

  const handleSelectTile = (idx: number) => {
    if (disabled || !isMyTurn || gameOver) return;
    setSelectedTile(selectedTile === idx ? null : idx);
  };

  const handlePlace = (side: "left" | "right") => {
    if (selectedTile === null || disabled || !isMyTurn || gameOver) return;
    const tile = hand[selectedTile];
    const sides = canPlayDomino(tile, ends);
    if (!sides.includes(side)) return;
    const newBoard = placeDominoTile(state.board, tile, side);
    const newHand = hand.filter((_, i) => i !== selectedTile);
    const newHands = { ...state.hands, [playerView]: newHand };
    onMove({ ...state, hands: newHands, board: newBoard, currentPlayer: state.currentPlayer === 1 ? 2 : 1, passes: 0 });
    setSelectedTile(null);
  };

  const handleDraw = () => {
    if (disabled || !isMyTurn || gameOver || state.pool.length === 0) return;
    const drawn = state.pool[0];
    const newPool = state.pool.slice(1);
    const newHands = { ...state.hands, [playerView]: [...hand, drawn] };
    onMove({ ...state, hands: newHands, pool: newPool });
  };

  const handlePass = () => {
    if (disabled || !isMyTurn || gameOver) return;
    onMove({ ...state, currentPlayer: state.currentPlayer === 1 ? 2 : 1, passes: state.passes + 1 });
  };

  const selectedSides = selectedTile !== null ? canPlayDomino(hand[selectedTile], ends) : [];

  return (
    <div className="flex flex-col items-center gap-4">
      {!gameOver && (
        <Badge variant="outline" data-testid="text-current-player">
          Turno: Jugador {state.currentPlayer}
        </Badge>
      )}
      {winner !== null && winner > 0 && <Badge className="bg-green-600 text-white" data-testid="text-winner">Ganador: Jugador {winner}</Badge>}
      {winner === 0 && <Badge variant="secondary" data-testid="text-draw">Empate</Badge>}

      <ScrollArea className="w-full max-w-md">
        <div className="flex items-center gap-1 p-2 min-h-[50px]">
          {state.board.map((tile, i) => (
            <div key={i} className="flex items-center border rounded-md bg-card px-1 py-0.5 text-xs font-bold shrink-0">
              <span>{tile[0]}</span>
              <span className="mx-0.5 text-muted-foreground">|</span>
              <span>{tile[1]}</span>
            </div>
          ))}
          {state.board.length === 0 && <span className="text-muted-foreground text-sm">Mesa vacia</span>}
        </div>
      </ScrollArea>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {hand.map((tile, i) => (
          <button
            key={i}
            data-testid={`tile-domino-${i}`}
            className={`flex items-center border-2 rounded-md px-2 py-1 text-sm font-bold transition-colors
              ${selectedTile === i ? "ring-2 ring-yellow-400 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" : "border-border bg-card hover-elevate"}`}
            onClick={() => handleSelectTile(i)}
            disabled={disabled || !isMyTurn || gameOver}
          >
            <span>{tile[0]}</span>
            <span className="mx-1 text-muted-foreground">|</span>
            <span>{tile[1]}</span>
          </button>
        ))}
      </div>

      {isMyTurn && !gameOver && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {selectedTile !== null && selectedSides.includes("left") && (
            <Button size="sm" onClick={() => handlePlace("left")} data-testid="button-place-left">
              <ChevronLeft className="w-4 h-4 mr-1" /> Izquierda
            </Button>
          )}
          {selectedTile !== null && selectedSides.includes("right") && (
            <Button size="sm" onClick={() => handlePlace("right")} data-testid="button-place-right">
              Derecha <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {!canPlay && state.pool.length > 0 && (
            <Button size="sm" variant="secondary" onClick={handleDraw} data-testid="button-draw">
              Robar ({state.pool.length})
            </Button>
          )}
          {!canPlay && state.pool.length === 0 && (
            <Button size="sm" variant="secondary" onClick={handlePass} data-testid="button-pass">
              Pasar
            </Button>
          )}
        </div>
      )}
      <span className="text-xs text-muted-foreground">Pozo: {state.pool.length} fichas</span>
    </div>
  );
}

function GameBoard({ gameType, state, onMove, disabled, playerNumber, userId }: {
  gameType: GameTypeKey;
  state: any;
  onMove: (newState: any) => void;
  disabled: boolean;
  playerNumber?: 1 | 2;
  userId: number;
}) {
  switch (gameType) {
    case "tictactoe": return <TicTacToeGame state={state} onMove={onMove} disabled={disabled} playerNumber={playerNumber} />;
    case "connect4": return <Connect4Game state={state} onMove={onMove} disabled={disabled} />;
    case "memory": return <MemoryGame state={state} onMove={onMove} disabled={disabled} />;
    case "checkers": return <CheckersGame state={state} onMove={onMove} disabled={disabled} />;
    case "chess": return <ChessGame state={state} onMove={onMove} disabled={disabled} playerNumber={playerNumber} />;
    case "bingo": return <BingoGame state={state} onMove={onMove} playerView={String(playerNumber || 1)} disabled={disabled} />;
    case "domino": return <DominoGame state={state} onMove={onMove} playerView={String(playerNumber || 1)} disabled={disabled} />;
    default: return null;
  }
}

function createInitialState(gameType: GameTypeKey): any {
  switch (gameType) {
    case "tictactoe": return createTicTacToeState();
    case "connect4": return createConnect4State();
    case "memory": return createMemoryState();
    case "checkers": return createCheckersState();
    case "chess": return { fen: new Chess().fen(), pgn: "" };
    case "bingo": return createBingoState();
    case "domino": return createDominoState();
  }
}

function getWinnerFromState(gameType: GameTypeKey, state: any): { winner: number | null; isDraw: boolean } {
  switch (gameType) {
    case "tictactoe": {
      const w = checkTicTacToeWin(state.board);
      if (w === "X") return { winner: 1, isDraw: false };
      if (w === "O") return { winner: 2, isDraw: false };
      if (isTicTacToeDraw(state.board)) return { winner: null, isDraw: true };
      return { winner: null, isDraw: false };
    }
    case "connect4": {
      const w = checkConnect4Win(state.board);
      if (w) return { winner: w, isDraw: false };
      if (isConnect4Full(state.board)) return { winner: null, isDraw: true };
      return { winner: null, isDraw: false };
    }
    case "memory": {
      if (!state.cards.every((c: any) => c.matched)) return { winner: null, isDraw: false };
      if (state.scores[0] > state.scores[1]) return { winner: 1, isDraw: false };
      if (state.scores[1] > state.scores[0]) return { winner: 2, isDraw: false };
      return { winner: null, isDraw: true };
    }
    case "checkers": {
      const p1 = playerPieceCount(state.board, 1);
      const p2 = playerPieceCount(state.board, 2);
      if (p2 === 0 || !canPlayerMove(state.board, 2)) return { winner: 1, isDraw: false };
      if (p1 === 0 || !canPlayerMove(state.board, 1)) return { winner: 2, isDraw: false };
      return { winner: null, isDraw: false };
    }
    case "chess": {
      const g = new Chess(state.fen);
      if (g.isCheckmate()) return { winner: g.turn() === "w" ? 2 : 1, isDraw: false };
      if (g.isDraw()) return { winner: null, isDraw: true };
      return { winner: null, isDraw: false };
    }
    case "bingo": {
      if (checkBingoWin(state.markedCells["1"])) return { winner: 1, isDraw: false };
      if (checkBingoWin(state.markedCells["2"])) return { winner: 2, isDraw: false };
      return { winner: null, isDraw: false };
    }
    case "domino": {
      const h1 = state.hands["1"] || [];
      const h2 = state.hands["2"] || [];
      const over = h1.length === 0 || h2.length === 0 || state.passes >= 2;
      if (!over) return { winner: null, isDraw: false };
      if (h1.length === 0) return { winner: 1, isDraw: false };
      if (h2.length === 0) return { winner: 2, isDraw: false };
      const p1 = h1.reduce((s: number, t: number[]) => s + t[0] + t[1], 0);
      const p2 = h2.reduce((s: number, t: number[]) => s + t[0] + t[1], 0);
      if (p1 < p2) return { winner: 1, isDraw: false };
      if (p2 < p1) return { winner: 2, isDraw: false };
      return { winner: null, isDraw: true };
    }
    default: return { winner: null, isDraw: false };
  }
}

function getCurrentPlayer(gameType: GameTypeKey, state: any): 1 | 2 {
  switch (gameType) {
    case "tictactoe": return state.currentPlayer === "X" ? 1 : 2;
    case "connect4": return state.currentPlayer;
    case "memory": return state.currentPlayer;
    case "checkers": return state.currentPlayer;
    case "chess": { const g = new Chess(state.fen); return g.turn() === "w" ? 1 : 2; }
    case "bingo": return 1;
    case "domino": return state.currentPlayer;
    default: return 1;
  }
}

function LocalGameView({ gameType, onBack, userId }: { gameType: GameTypeKey; onBack: () => void; userId: number }) {
  const [state, setState] = useState<any>(() => createInitialState(gameType));
  const [bingoInterval, setBingoInterval] = useState<NodeJS.Timeout | null>(null);
  const gameName = GAME_TYPES[gameType].name;

  useEffect(() => {
    if (gameType === "bingo") {
      const iv = setInterval(() => {
        setState((prev: BingoState) => {
          const { winner } = getWinnerFromState("bingo", prev);
          if (winner !== null) return prev;
          const available = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !prev.calledNumbers.includes(n));
          if (available.length === 0) return prev;
          const next = available[Math.floor(Math.random() * available.length)];
          return { ...prev, calledNumbers: [...prev.calledNumbers, next] };
        });
      }, 3000);
      setBingoInterval(iv);
      return () => clearInterval(iv);
    }
  }, [gameType]);

  const handleReset = () => {
    setState(createInitialState(gameType));
  };

  const { winner, isDraw: isDr } = getWinnerFromState(gameType, state);
  const isOver = winner !== null || isDr;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-to-lobby">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <span className="font-semibold">{gameName} - Modo Local</span>
      </div>
      <Card>
        <CardContent className="py-6">
          <GameBoard gameType={gameType} state={state} onMove={setState} disabled={false} userId={userId} />
          {isOver && (
            <div className="flex justify-center mt-4">
              <Button onClick={handleReset} data-testid="button-play-again">
                <RotateCcw className="w-4 h-4 mr-1" /> Jugar de nuevo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OnlineRoomView({ roomId, gameType, onBack, userId }: { roomId: number; gameType: GameTypeKey; onBack: () => void; userId: number }) {
  const { toast } = useToast();
  const gameName = GAME_TYPES[gameType].name;
  const [localState, setLocalState] = useState<any>(null);

  const { data: room, isLoading } = useQuery<RoomWithNames>({
    queryKey: ["/api/game-rooms", roomId],
    refetchInterval: 2000,
  });

  const updateStateMut = useMutation({
    mutationFn: async ({ gameState, currentTurn }: { gameState: string; currentTurn: number }) => {
      await apiRequest("PATCH", `/api/game-rooms/${roomId}/state`, { gameState, currentTurn });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/game-rooms", roomId] }); },
  });

  const finishMut = useMutation({
    mutationFn: async ({ winnerId, isDraw }: { winnerId?: number; isDraw: boolean }) => {
      await apiRequest("POST", `/api/game-rooms/${roomId}/finish`, { winnerId, isDraw });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-rooms", roomId] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-stats"] });
    },
  });

  const leaveMut = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/game-rooms/${roomId}/leave`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-rooms"] });
      onBack();
    },
  });

  const playerNumber: 1 | 2 = room?.player1Id === userId ? 1 : 2;

  useEffect(() => {
    if (room?.status === "playing" && room.gameState) {
      try { setLocalState(JSON.parse(room.gameState)); } catch {}
    }
  }, [room?.gameState, room?.status]);

  useEffect(() => {
    if (gameType === "bingo" && room?.status === "playing" && playerNumber === 1) {
      const iv = setInterval(() => {
        setLocalState((prev: BingoState | null) => {
          if (!prev) return prev;
          const { winner } = getWinnerFromState("bingo", prev);
          if (winner !== null) return prev;
          const available = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !prev.calledNumbers.includes(n));
          if (available.length === 0) return prev;
          const next = available[Math.floor(Math.random() * available.length)];
          const ns = { ...prev, calledNumbers: [...prev.calledNumbers, next] };
          updateStateMut.mutate({ gameState: JSON.stringify(ns), currentTurn: userId });
          return ns;
        });
      }, 3000);
      return () => clearInterval(iv);
    }
  }, [gameType, room?.status, playerNumber]);

  const handleCopyCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
      toast({ title: "Codigo copiado" });
    }
  };

  const handleMove = (newState: any) => {
    setLocalState(newState);
    const { winner, isDraw: isDr } = getWinnerFromState(gameType, newState);
    const nextTurn = getCurrentPlayer(gameType, newState);
    const nextTurnUserId = nextTurn === 1 ? (room?.player1Id || 0) : (room?.player2Id || 0);

    updateStateMut.mutate({ gameState: JSON.stringify(newState), currentTurn: nextTurnUserId });

    if (winner !== null || isDr) {
      const winnerId = winner === 1 ? (room?.player1Id ?? undefined) : winner === 2 ? (room?.player2Id ?? undefined) : undefined;
      finishMut.mutate({ winnerId, isDraw: isDr });
    }
  };

  const isMyTurn = room?.currentTurn === userId;

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!room) return <div className="text-center p-8 text-muted-foreground">Sala no encontrada</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => leaveMut.mutate()} data-testid="button-leave-room">
          <ArrowLeft className="w-4 h-4 mr-1" /> Salir
        </Button>
        <span className="font-semibold">{gameName}</span>
        <Badge variant="outline">{room.status === "waiting" ? "Esperando" : room.status === "playing" ? "Jugando" : "Terminado"}</Badge>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Codigo:</span>
              <Badge variant="secondary" className="text-lg font-mono" data-testid="text-room-code">{room.roomCode}</Badge>
              <Button variant="ghost" size="icon" onClick={handleCopyCode} data-testid="button-copy-code">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" data-testid="text-player1">{(room as any).player1Name || "Jugador 1"}</Badge>
              <Swords className="w-4 h-4" />
              <Badge variant="outline" data-testid="text-player2">{room.player2Id ? ((room as any).player2Name || "Jugador 2") : "Esperando..."}</Badge>
            </div>
          </div>

          {room.status === "waiting" && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Esperando oponente...</p>
              <p className="text-sm text-muted-foreground mt-1">Comparte el codigo <strong>{room.roomCode}</strong></p>
            </div>
          )}

          {room.status === "playing" && localState && (
            <>
              {!isMyTurn && gameType !== "bingo" && (
                <div className="text-center py-2 mb-2">
                  <Badge variant="secondary">Esperando al oponente...</Badge>
                </div>
              )}
              <GameBoard
                gameType={gameType}
                state={localState}
                onMove={handleMove}
                disabled={!isMyTurn && gameType !== "bingo"}
                playerNumber={playerNumber}
                userId={userId}
              />
            </>
          )}

          {room.status === "finished" && (
            <div className="text-center py-4">
              {room.isDraw ? (
                <Badge variant="secondary" className="text-lg" data-testid="text-result">Empate</Badge>
              ) : (
                <Badge className="bg-green-600 text-white text-lg" data-testid="text-result">
                  {room.winnerId === userId ? "Ganaste!" : "Perdiste"}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GameLobbyView({ gameType, onBack, userId, onJoinRoom, onLocalPlay }: {
  gameType: GameTypeKey; onBack: () => void; userId: number;
  onJoinRoom: (roomId: number) => void; onLocalPlay: () => void;
}) {
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState("");
  const gameName = GAME_TYPES[gameType].name;
  const GameIcon = GAME_ICONS[gameType];

  const { data: rooms, isLoading } = useQuery<RoomWithNames[]>({
    queryKey: ["/api/game-rooms", { gameType }],
    queryFn: async () => {
      const res = await fetch(`/api/game-rooms?gameType=${gameType}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const createRoomMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/game-rooms", { gameType });
      return res.json();
    },
    onSuccess: (room: GameRoom) => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-rooms"] });
      onJoinRoom(room.id);
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const joinRoomMut = useMutation({
    mutationFn: async (roomId: number) => {
      await apiRequest("POST", `/api/game-rooms/${roomId}/join`);
      return roomId;
    },
    onSuccess: (roomId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-rooms"] });
      onJoinRoom(roomId);
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    try {
      const res = await fetch(`/api/game-rooms?gameType=${gameType}`, { credentials: "include" });
      const allRooms: RoomWithNames[] = await res.json();
      const found = allRooms.find(r => r.roomCode === joinCode.trim().toUpperCase());
      if (found) {
        joinRoomMut.mutate(found.id);
      } else {
        toast({ title: "Error", description: "Sala no encontrada", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error al buscar sala", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-to-hub">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <GameIcon className="w-5 h-5 text-primary" />
        <span className="font-semibold text-lg">{gameName}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => createRoomMut.mutate()} disabled={createRoomMut.isPending} data-testid="button-create-room">
          {createRoomMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          Crear Sala
        </Button>
        <Button variant="secondary" onClick={onLocalPlay} data-testid="button-local-play">
          <Users className="w-4 h-4 mr-1" /> Jugar Local
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Unirse con codigo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Codigo de sala"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="font-mono"
              data-testid="input-join-code"
            />
            <Button onClick={handleJoinByCode} disabled={!joinCode.trim()} data-testid="button-join-by-code">
              Unirse
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Salas disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>}
          {!isLoading && (!rooms || rooms.length === 0) && (
            <p className="text-muted-foreground text-sm py-4 text-center">No hay salas activas</p>
          )}
          {rooms && rooms.length > 0 && (
            <div className="space-y-2">
              {rooms.map(room => (
                <div key={room.id} className="flex flex-wrap items-center justify-between gap-2 p-3 border rounded-md" data-testid={`room-${room.id}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono">{room.roomCode}</Badge>
                    <span className="text-sm">{room.player1Name || "Jugador"}</span>
                    <Badge variant={room.status === "waiting" ? "secondary" : "default"}>
                      {room.status === "waiting" ? "Esperando" : "Jugando"}
                    </Badge>
                  </div>
                  {room.status === "waiting" && room.player1Id !== userId && (
                    <Button
                      size="sm"
                      onClick={() => joinRoomMut.mutate(room.id)}
                      disabled={joinRoomMut.isPending}
                      data-testid={`button-join-room-${room.id}`}
                    >
                      Unirse
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatsView({ onBack }: { onBack: () => void }) {
  const { data: stats, isLoading } = useQuery<{ gameType: string; wins: number; losses: number; draws: number }[]>({
    queryKey: ["/api/game-stats"],
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-from-stats">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <Trophy className="w-5 h-5 text-yellow-500" />
        <span className="font-semibold text-lg">Mis Estadisticas</span>
      </div>

      <Card>
        <CardContent className="py-4">
          {isLoading && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>}
          {!isLoading && (!stats || stats.length === 0) && (
            <p className="text-muted-foreground text-center py-4">Sin estadisticas aun</p>
          )}
          {stats && stats.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Juego</th>
                    <th className="text-center py-2 px-3">Victorias</th>
                    <th className="text-center py-2 px-3">Derrotas</th>
                    <th className="text-center py-2 px-3">Empates</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map(s => {
                    const gt = s.gameType as GameTypeKey;
                    const info = GAME_TYPES[gt];
                    return (
                      <tr key={s.gameType} className="border-b last:border-0" data-testid={`stat-row-${s.gameType}`}>
                        <td className="py-2 px-3 font-medium">{info?.name || s.gameType}</td>
                        <td className="text-center py-2 px-3 text-green-600">{s.wins}</td>
                        <td className="text-center py-2 px-3 text-red-600">{s.losses}</td>
                        <td className="text-center py-2 px-3 text-muted-foreground">{s.draws}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function BoardGamesHub({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  if (!user) return null;
  const userId = user.id;
  const [viewState, setViewState] = useState<ViewState>({ view: "hub" });
  const [hubJoinCode, setHubJoinCode] = useState("");
  const { toast } = useToast();

  const gameTypeKeys = Object.keys(GAME_TYPES) as GameTypeKey[];

  const handleHubJoin = async () => {
    if (!hubJoinCode.trim()) return;
    try {
      for (const gt of gameTypeKeys) {
        const res = await fetch(`/api/game-rooms?gameType=${gt}`, { credentials: "include" });
        if (!res.ok) continue;
        const rooms: RoomWithNames[] = await res.json();
        const found = rooms.find(r => r.roomCode === hubJoinCode.trim().toUpperCase());
        if (found) {
          const joinRes = await apiRequest("POST", `/api/game-rooms/${found.id}/join`);
          queryClient.invalidateQueries({ queryKey: ["/api/game-rooms"] });
          setViewState({ view: "room", roomId: found.id, gameType: gt, isLocal: false });
          return;
        }
      }
      toast({ title: "Error", description: "Sala no encontrada", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Error al buscar sala", variant: "destructive" });
    }
  };

  if (viewState.view === "stats") {
    return <StatsView onBack={() => setViewState({ view: "hub" })} />;
  }

  if (viewState.view === "domino_full") {
    return <DominoFullGame onBack={() => setViewState({ view: "hub" })} />;
  }

  if (viewState.view === "local") {
    return <LocalGameView gameType={viewState.gameType} onBack={() => setViewState({ view: "lobby", gameType: viewState.gameType })} userId={userId} />;
  }

  if (viewState.view === "room") {
    return <OnlineRoomView roomId={viewState.roomId} gameType={viewState.gameType} onBack={() => setViewState({ view: "lobby", gameType: viewState.gameType })} userId={userId} />;
  }

  if (viewState.view === "lobby") {
    return (
      <GameLobbyView
        gameType={viewState.gameType}
        onBack={() => setViewState({ view: "hub" })}
        userId={userId}
        onJoinRoom={(roomId) => setViewState({ view: "room", roomId, gameType: viewState.gameType, isLocal: false })}
        onLocalPlay={() => setViewState({ view: "local", gameType: viewState.gameType })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-from-hub">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <Flame className="w-5 h-5 text-orange-500" />
        <span className="font-semibold text-lg">Juegos de Mesa</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setViewState({ view: "stats" })} data-testid="button-my-stats">
          <Trophy className="w-4 h-4 mr-1" /> Mis Estadisticas
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Unirse con codigo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Codigo de sala"
              value={hubJoinCode}
              onChange={(e) => setHubJoinCode(e.target.value.toUpperCase())}
              className="font-mono"
              data-testid="input-hub-join-code"
            />
            <Button onClick={handleHubJoin} disabled={!hubJoinCode.trim()} data-testid="button-hub-join">
              Unirse
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {gameTypeKeys.map(gt => {
          const info = GAME_TYPES[gt];
          const GameIcon = GAME_ICONS[gt];
          return (
            <Card
              key={gt}
              className="hover-elevate cursor-pointer"
              onClick={() => gt === "domino" ? setViewState({ view: "domino_full" }) : setViewState({ view: "lobby", gameType: gt })}
              data-testid={`card-game-${gt}`}
            >
              <CardContent className="py-4 flex flex-col items-center gap-2 text-center">
                <GameIcon className="w-10 h-10 text-primary" />
                <span className="font-semibold text-sm">{info.name}</span>
                <span className="text-xs text-muted-foreground">{info.description}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
