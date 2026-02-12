import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, Bot,
  Users, Loader2, Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type DominoTileValue = [number, number];

type DominoRuleType = "clasico" | "bloqueo" | "cinco";

type DominoGameState = {
  hands: Record<string, DominoTileValue[]>;
  board: DominoTileValue[];
  currentPlayer: number;
  playerCount: number;
  pool: DominoTileValue[];
  passes: number;
  scores: Record<string, number>;
  ruleType: DominoRuleType;
  targetScore: number;
  roundOver: boolean;
  matchOver: boolean;
  vsAI: boolean;
};

const RULE_NAMES: Record<DominoRuleType, string> = {
  clasico: "Clasico (Robar)",
  bloqueo: "Bloqueo",
  cinco: "All Fives",
};

const RULE_DESCRIPTIONS: Record<DominoRuleType, string> = {
  clasico: "Roba del pozo si no puedes jugar. Gana quien se queda sin fichas o tiene menos puntos.",
  bloqueo: "No se roba. Si no puedes jugar, pasas. Gana quien se queda sin fichas o tiene menos puntos.",
  cinco: "Puntos por multiplos de 5 en los extremos. Roba si no puedes. Primer jugador a 100 puntos gana.",
};

const DOT_POSITIONS: Record<number, [number, number][]> = {
  0: [],
  1: [[0.5, 0.5]],
  2: [[0.2, 0.2], [0.8, 0.8]],
  3: [[0.2, 0.2], [0.5, 0.5], [0.8, 0.8]],
  4: [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]],
  5: [[0.2, 0.2], [0.8, 0.2], [0.5, 0.5], [0.2, 0.8], [0.8, 0.8]],
  6: [[0.2, 0.2], [0.8, 0.2], [0.2, 0.5], [0.8, 0.5], [0.2, 0.8], [0.8, 0.8]],
};

let tileIdCounter = 0;

function DominoTileSVG({
  tile,
  selected,
  faceDown,
  onClick,
  horizontal,
  small,
  className,
  testId,
}: {
  tile: DominoTileValue;
  selected?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  horizontal?: boolean;
  small?: boolean;
  className?: string;
  testId?: string;
}) {
  const w = small ? 28 : 40;
  const h = small ? 56 : 80;
  const halfH = h / 2;
  const dotR = small ? 3 : 4;
  const padding = small ? 3 : 5;
  const cellSize = (w - padding * 2);

  const gradId = useRef(`tileGrad_${tileIdCounter++}`);
  const backGradId = useRef(`backGrad_${tileIdCounter++}`);

  const renderDots = (val: number, offsetY: number) => {
    const positions = DOT_POSITIONS[val] || [];
    return positions.map(([px, py], i) => (
      <circle
        key={`${offsetY}-${i}`}
        cx={padding + px * cellSize}
        cy={offsetY + padding + py * (halfH - padding * 2)}
        r={dotR}
        fill="#1a1a1a"
      />
    ));
  };

  if (faceDown) {
    const bw = horizontal ? h : w;
    const bh = horizontal ? w : h;
    return (
      <svg
        width={bw}
        height={bh}
        viewBox={`0 0 ${bw} ${bh}`}
        className={`shrink-0 ${className || ""}`}
        data-testid={testId}
      >
        <defs>
          <linearGradient id={backGradId.current} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1a6b4a" />
            <stop offset="100%" stopColor="#0f4a32" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width={bw - 2} height={bh - 2} rx="4" ry="4"
          fill={`url(#${backGradId.current})`} stroke="#0d3a28" strokeWidth="1.5" />
        <rect x="4" y="4" width={bw - 8} height={bh - 8} rx="2" ry="2"
          fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <line x1="4" y1="4" x2={bw - 4} y2={bh - 4}
          stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <line x1={bw - 4} y1="4" x2="4" y2={bh - 4}
          stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <line x1={bw / 2} y1="4" x2={bw / 2} y2={bh - 4}
          stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        <line x1="4" y1={bh / 2} x2={bw - 4} y2={bh / 2}
          stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      </svg>
    );
  }

  const tileContent = (
    <svg
      width={horizontal ? h : w}
      height={horizontal ? w : h}
      viewBox={`0 0 ${w} ${h}`}
      className={`shrink-0 cursor-pointer transition-transform ${selected ? "scale-110" : ""} ${className || ""}`}
      onClick={onClick}
      style={horizontal ? { transform: `rotate(90deg)` } : undefined}
      data-testid={testId}
    >
      <defs>
        <linearGradient id={gradId.current} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f0e8" />
          <stop offset="100%" stopColor="#e8e0d0" />
        </linearGradient>
        {selected && (
          <filter id={`glow_${gradId.current}`}>
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#f0c040" floodOpacity="0.7" />
          </filter>
        )}
      </defs>
      <rect x="1" y="1" width={w - 2} height={h - 2} rx="4" ry="4"
        fill={`url(#${gradId.current})`}
        stroke={selected ? "#d4a020" : "#8b7355"}
        strokeWidth={selected ? "2.5" : "1.5"}
        filter={selected ? `url(#glow_${gradId.current})` : undefined}
      />
      <rect x="2.5" y="2.5" width={w - 5} height={h - 5} rx="3" ry="3"
        fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
      <line x1="3" y1={halfH} x2={w - 3} y2={halfH}
        stroke="#c0b090" strokeWidth="1.5" />
      <g>
        {renderDots(tile[0], 0)}
      </g>
      <g>
        {renderDots(tile[1], halfH)}
      </g>
    </svg>
  );

  return tileContent;
}

function createAllTiles(): DominoTileValue[] {
  const tiles: DominoTileValue[] = [];
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

function boardEndValues(board: DominoTileValue[]): [number, number] | null {
  if (board.length === 0) return null;
  return [board[0][0], board[board.length - 1][1]];
}

function canPlayTile(tile: DominoTileValue, ends: [number, number] | null): ("left" | "right")[] {
  if (!ends) return ["left"];
  const sides: ("left" | "right")[] = [];
  if (tile[0] === ends[0] || tile[1] === ends[0]) sides.push("left");
  if (tile[0] === ends[1] || tile[1] === ends[1]) sides.push("right");
  return sides;
}

function placeTile(board: DominoTileValue[], tile: DominoTileValue, side: "left" | "right"): DominoTileValue[] {
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

function calcOpenEndsSum(board: DominoTileValue[]): number {
  if (board.length === 0) return 0;
  if (board.length === 1) {
    return board[0][0] + board[0][1];
  }
  const leftEnd = board[0][0];
  const rightEnd = board[board.length - 1][1];
  return leftEnd + rightEnd;
}

function pipCount(hand: DominoTileValue[]): number {
  return hand.reduce((s, t) => s + t[0] + t[1], 0);
}

function createDominoGameState(ruleType: DominoRuleType, vsAI: boolean, playerCount: number): DominoGameState {
  const tiles = shuffleArray(createAllTiles());
  const hands: Record<string, DominoTileValue[]> = {};
  const scores: Record<string, number> = {};
  for (let p = 1; p <= playerCount; p++) {
    hands[String(p)] = tiles.slice((p - 1) * 7, p * 7);
    scores[String(p)] = 0;
  }
  return {
    hands,
    board: [],
    currentPlayer: 1,
    playerCount,
    pool: tiles.slice(playerCount * 7),
    passes: 0,
    scores,
    ruleType,
    targetScore: ruleType === "cinco" ? 100 : 0,
    roundOver: false,
    matchOver: false,
    vsAI,
  };
}

function startNewRound(prev: DominoGameState): DominoGameState {
  const tiles = shuffleArray(createAllTiles());
  const hands: Record<string, DominoTileValue[]> = {};
  for (let p = 1; p <= prev.playerCount; p++) {
    hands[String(p)] = tiles.slice((p - 1) * 7, p * 7);
  }
  return {
    ...prev,
    hands,
    board: [],
    currentPlayer: 1,
    pool: tiles.slice(prev.playerCount * 7),
    passes: 0,
    roundOver: false,
    matchOver: false,
  };
}

function getRoundWinner(state: DominoGameState): { winner: number; pipsByPlayer: Record<string, number> } {
  const pipsByPlayer: Record<string, number> = {};
  for (let p = 1; p <= state.playerCount; p++) {
    const h = state.hands[String(p)] || [];
    if (h.length === 0) {
      for (let q = 1; q <= state.playerCount; q++) {
        pipsByPlayer[String(q)] = pipCount(state.hands[String(q)] || []);
      }
      return { winner: p, pipsByPlayer };
    }
  }
  for (let p = 1; p <= state.playerCount; p++) {
    pipsByPlayer[String(p)] = pipCount(state.hands[String(p)] || []);
  }
  let minPips = Infinity;
  let winner = 0;
  let tie = false;
  for (let p = 1; p <= state.playerCount; p++) {
    const pp = pipsByPlayer[String(p)];
    if (pp < minPips) {
      minPips = pp;
      winner = p;
      tie = false;
    } else if (pp === minPips) {
      tie = true;
    }
  }
  return { winner: tie ? 0 : winner, pipsByPlayer };
}

function isRoundOver(state: DominoGameState): boolean {
  for (let p = 1; p <= state.playerCount; p++) {
    const h = state.hands[String(p)] || [];
    if (h.length === 0) return true;
  }
  return state.passes >= state.playerCount;
}

function aiSelectMove(state: DominoGameState, playerKey: string): { type: "play"; tileIdx: number; side: "left" | "right" } | { type: "draw" } | { type: "pass" } {
  const hand = state.hands[playerKey] || [];
  const ends = boardEndValues(state.board);

  const playable: { idx: number; sides: ("left" | "right")[]; tile: DominoTileValue }[] = [];
  hand.forEach((tile, idx) => {
    const sides = canPlayTile(tile, ends);
    if (sides.length > 0) playable.push({ idx, sides, tile });
  });

  if (playable.length > 0) {
    if (state.ruleType === "cinco") {
      let bestScore = -1;
      let bestMove: { idx: number; side: "left" | "right" } | null = null;
      for (const p of playable) {
        for (const side of p.sides) {
          const newBoard = placeTile(state.board, p.tile, side);
          const endSum = calcOpenEndsSum(newBoard);
          if (endSum % 5 === 0 && endSum > bestScore) {
            bestScore = endSum;
            bestMove = { idx: p.idx, side };
          }
        }
      }
      if (bestMove) return { type: "play", tileIdx: bestMove.idx, side: bestMove.side };
    }

    const sorted = [...playable].sort((a, b) => {
      const pipA = a.tile[0] + a.tile[1];
      const pipB = b.tile[0] + b.tile[1];
      return pipB - pipA;
    });
    const best = sorted[0];
    return { type: "play", tileIdx: best.idx, side: best.sides[0] };
  }

  if (state.ruleType !== "bloqueo" && state.pool.length > 0) {
    return { type: "draw" };
  }

  return { type: "pass" };
}

function executeAIMove(state: DominoGameState, playerKey: string): DominoGameState {
  const move = aiSelectMove(state, playerKey);
  const hand = [...(state.hands[playerKey] || [])];
  const ends = boardEndValues(state.board);
  const nextPlayer = (state.currentPlayer % state.playerCount) + 1;

  if (move.type === "play") {
    const tile = hand[move.tileIdx];
    const newBoard = placeTile(state.board, tile, move.side);
    const newHand = hand.filter((_, i) => i !== move.tileIdx);
    let newScores = { ...state.scores };
    if (state.ruleType === "cinco") {
      const endSum = calcOpenEndsSum(newBoard);
      if (endSum % 5 === 0) {
        newScores[playerKey] = (newScores[playerKey] || 0) + endSum;
      }
    }
    const newState: DominoGameState = {
      ...state,
      hands: { ...state.hands, [playerKey]: newHand },
      board: newBoard,
      currentPlayer: nextPlayer,
      passes: 0,
      scores: newScores,
    };
    if (isRoundOver(newState)) {
      return handleRoundEnd(newState);
    }
    return newState;
  }

  if (move.type === "draw") {
    let newPool = [...state.pool];
    let newHand = [...hand];
    let drawn = false;
    while (newPool.length > 0) {
      const drawnTile = newPool[0];
      newPool = newPool.slice(1);
      newHand = [...newHand, drawnTile];
      if (canPlayTile(drawnTile, ends).length > 0) {
        drawn = true;
        const updatedState: DominoGameState = {
          ...state,
          hands: { ...state.hands, [playerKey]: newHand },
          pool: newPool,
        };
        return executeAIMove(updatedState, playerKey);
      }
    }
    if (!drawn) {
      const newState: DominoGameState = {
        ...state,
        hands: { ...state.hands, [playerKey]: newHand },
        pool: newPool,
        currentPlayer: nextPlayer,
        passes: state.passes + 1,
      };
      if (isRoundOver(newState)) {
        return handleRoundEnd(newState);
      }
      return newState;
    }
  }

  const newState: DominoGameState = {
    ...state,
    currentPlayer: nextPlayer,
    passes: state.passes + 1,
  };
  if (isRoundOver(newState)) {
    return handleRoundEnd(newState);
  }
  return newState;
}

function handleRoundEnd(state: DominoGameState): DominoGameState {
  const { winner, pipsByPlayer } = getRoundWinner(state);
  let newScores = { ...state.scores };

  if (state.ruleType === "cinco") {
    if (winner > 0) {
      let loserPipsTotal = 0;
      for (let p = 1; p <= state.playerCount; p++) {
        if (p !== winner) {
          loserPipsTotal += pipsByPlayer[String(p)] || 0;
        }
      }
      const rounded = Math.round(loserPipsTotal / 5) * 5;
      newScores[String(winner)] = (newScores[String(winner)] || 0) + rounded;
    }
    let matchOver = false;
    for (let p = 1; p <= state.playerCount; p++) {
      if ((newScores[String(p)] || 0) >= state.targetScore) {
        matchOver = true;
        break;
      }
    }
    return { ...state, roundOver: true, matchOver, scores: newScores };
  }

  if (winner > 0) {
    newScores[String(winner)] = (newScores[String(winner)] || 0) + 1;
  }
  return { ...state, roundOver: true, matchOver: true, scores: newScores };
}

function OpponentHandDisplay({ label, tileCount }: { label: string; tileCount: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-xs font-medium mr-1" style={{ color: "rgba(255,255,255,0.7)" }}>{label}: {tileCount}</span>
      {Array.from({ length: tileCount }).map((_, i) => (
        <DominoTileSVG key={i} tile={[0, 0]} faceDown small className="opacity-80" />
      ))}
    </div>
  );
}

export function DominoFullGame({ onBack }: { onBack: () => void }) {
  const [setupPhase, setSetupPhase] = useState(true);
  const [ruleType, setRuleType] = useState<DominoRuleType>("clasico");
  const [vsAI, setVsAI] = useState(true);
  const [playerCount, setPlayerCount] = useState(2);
  const [state, setState] = useState<DominoGameState | null>(null);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [lastFiveScore, setLastFiveScore] = useState<number | null>(null);
  const [turnTransition, setTurnTransition] = useState(false);
  const { toast } = useToast();
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setState(createDominoGameState(ruleType, vsAI, playerCount));
    setSetupPhase(false);
    setSelectedTile(null);
    setLastFiveScore(null);
    setTurnTransition(false);
  };

  const handleNewRound = () => {
    if (!state) return;
    setState(startNewRound(state));
    setSelectedTile(null);
    setLastFiveScore(null);
    setTurnTransition(false);
  };

  const handleRestart = () => {
    setSetupPhase(true);
    setState(null);
    setSelectedTile(null);
    setLastFiveScore(null);
    setTurnTransition(false);
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
  };

  const isAITurn = useCallback((s: DominoGameState) => {
    return s.vsAI && s.currentPlayer !== 1;
  }, []);

  useEffect(() => {
    if (!state || state.roundOver) return;
    if (!isAITurn(state)) return;
    setAiThinking(true);
    aiTimeoutRef.current = setTimeout(() => {
      setState(prev => {
        if (!prev || prev.roundOver || !isAITurn(prev)) return prev;
        const playerKey = String(prev.currentPlayer);
        return executeAIMove(prev, playerKey);
      });
      setAiThinking(false);
    }, 800 + Math.random() * 600);
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [state?.currentPlayer, state?.roundOver, state?.vsAI, isAITurn]);

  if (setupPhase || !state) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-domino-back">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>
          <span className="font-semibold text-lg">Domino</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modo de Juego</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={vsAI ? "default" : "outline"}
                onClick={() => setVsAI(true)}
                data-testid="button-vs-ai"
                className="toggle-elevate"
              >
                <Bot className="w-4 h-4 mr-1" /> vs Maquina
              </Button>
              <Button
                variant={!vsAI ? "default" : "outline"}
                onClick={() => setVsAI(false)}
                data-testid="button-vs-local"
                className="toggle-elevate"
              >
                <Users className="w-4 h-4 mr-1" /> Local
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Numero de Jugadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[2, 3, 4].map(count => (
                <Button
                  key={count}
                  variant={playerCount === count ? "default" : "outline"}
                  onClick={() => setPlayerCount(count)}
                  data-testid={`button-player-count-${count}`}
                  className="toggle-elevate"
                >
                  {count} Jugadores
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estilo de Reglas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(RULE_NAMES) as DominoRuleType[]).map(rt => (
              <button
                key={rt}
                className={`w-full text-left p-3 rounded-md border transition-colors
                  ${ruleType === rt
                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                    : "border-border hover-elevate"}`}
                onClick={() => setRuleType(rt)}
                data-testid={`button-rule-${rt}`}
              >
                <div className="font-semibold text-sm">{RULE_NAMES[rt]}</div>
                <div className="text-xs text-muted-foreground mt-1">{RULE_DESCRIPTIONS[rt]}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Button onClick={startGame} data-testid="button-start-domino" className="w-full">
          <Sparkles className="w-4 h-4 mr-1" /> Comenzar Partida
        </Button>
      </div>
    );
  }

  const cp = state.currentPlayer;
  const cpKey = String(cp);
  const activeHand = state.hands[cpKey] || [];
  const ends = boardEndValues(state.board);
  const canPlay = activeHand.some(t => canPlayTile(t, ends).length > 0);
  const selectedSides = selectedTile !== null ? canPlayTile(activeHand[selectedTile], ends) : [];

  const playerLabel = (p: number) => {
    if (state.vsAI) {
      if (p === 1) return "Tu";
      if (state.playerCount === 2) return "IA";
      return `IA ${p - 1}`;
    }
    return `Jugador ${p}`;
  };

  const otherPlayers = Array.from({ length: state.playerCount }, (_, i) => i + 1).filter(p => p !== cp);

  const handleSelectTile = (idx: number) => {
    if (state.roundOver || aiThinking || turnTransition) return;
    setSelectedTile(selectedTile === idx ? null : idx);
  };

  const switchTurnLocal = (newState: DominoGameState) => {
    if (newState.vsAI || newState.roundOver) {
      setState(newState);
      return;
    }
    setState(newState);
    setTurnTransition(true);
    setSelectedTile(null);
  };

  const handleRevealHand = () => {
    setTurnTransition(false);
  };

  const handlePlace = (side: "left" | "right") => {
    if (selectedTile === null || state.roundOver) return;
    const tile = activeHand[selectedTile];
    const newBoard = placeTile(state.board, tile, side);
    const newHand = activeHand.filter((_, i) => i !== selectedTile);
    const nextPlayer = (cp % state.playerCount) + 1;
    let newScores = { ...state.scores };
    if (state.ruleType === "cinco") {
      const endSum = calcOpenEndsSum(newBoard);
      if (endSum % 5 === 0 && endSum > 0) {
        newScores[cpKey] = (newScores[cpKey] || 0) + endSum;
        setLastFiveScore(endSum);
        toast({ title: `+${endSum} puntos!`, description: `Multiplo de 5 en los extremos (${playerLabel(cp)})` });
      } else {
        setLastFiveScore(null);
      }
    }
    const newState: DominoGameState = {
      ...state,
      hands: { ...state.hands, [cpKey]: newHand },
      board: newBoard,
      currentPlayer: nextPlayer,
      passes: 0,
      scores: newScores,
    };
    if (isRoundOver(newState)) {
      setState(handleRoundEnd(newState));
    } else {
      switchTurnLocal(newState);
    }
    setSelectedTile(null);
  };

  const handleDraw = () => {
    if (state.roundOver || state.pool.length === 0) return;
    const drawn = state.pool[0];
    const newPool = state.pool.slice(1);
    const newHands = { ...state.hands, [cpKey]: [...activeHand, drawn] };
    setState({ ...state, hands: newHands, pool: newPool });
  };

  const handlePass = () => {
    if (state.roundOver) return;
    const nextPlayer = (cp % state.playerCount) + 1;
    const newState: DominoGameState = {
      ...state,
      currentPlayer: nextPlayer,
      passes: state.passes + 1,
    };
    if (isRoundOver(newState)) {
      setState(handleRoundEnd(newState));
    } else {
      switchTurnLocal(newState);
    }
  };

  const roundResult = state.roundOver ? getRoundWinner(state) : null;

  const modeLabel = state.vsAI
    ? (state.playerCount === 2 ? "vs IA" : `vs ${state.playerCount - 1} IAs`)
    : `${state.playerCount} Jugadores`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleRestart} data-testid="button-domino-setup">
          <ArrowLeft className="w-4 h-4 mr-1" /> Menu
        </Button>
        <span className="font-semibold">Domino - {RULE_NAMES[state.ruleType]}</span>
        {state.vsAI && <Badge variant="outline"><Bot className="w-3 h-3 mr-1" /> {modeLabel}</Badge>}
        {!state.vsAI && <Badge variant="outline"><Users className="w-3 h-3 mr-1" /> {modeLabel}</Badge>}
      </div>

      {state.ruleType === "cinco" && (
        <div className="flex flex-wrap items-center gap-3">
          {Array.from({ length: state.playerCount }, (_, i) => i + 1).map(p => (
            <Badge key={p} variant="secondary" data-testid={`text-score-p${p}`}>
              {playerLabel(p)}: {state.scores[String(p)] || 0} pts
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground">Meta: {state.targetScore}</span>
        </div>
      )}

      {turnTransition && !state.roundOver && (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <Users className="w-12 h-12 mx-auto text-primary" />
            <p className="font-semibold text-lg">Turno del {playerLabel(cp)}</p>
            <p className="text-sm text-muted-foreground">Pasa el dispositivo al {playerLabel(cp)}</p>
            <Button onClick={handleRevealHand} data-testid="button-reveal-hand">
              Mostrar mis fichas
            </Button>
          </CardContent>
        </Card>
      )}

      {!turnTransition && (
        <>
          <div className="relative rounded-lg overflow-hidden" style={{
            background: "linear-gradient(135deg, #1a5c2e 0%, #1e6b35 50%, #1a5c2e 100%)",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.3)",
            border: "3px solid #2d1810",
          }}>
            <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
              border: "6px solid transparent",
              borderImage: "linear-gradient(135deg, #5c3a1e, #8b6914, #5c3a1e) 1",
            }} />
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "8px 8px",
            }} />

            <div className="relative p-4 space-y-3">
              <div className="space-y-2">
                {otherPlayers.map(p => (
                  <OpponentHandDisplay
                    key={p}
                    label={playerLabel(p)}
                    tileCount={(state.hands[String(p)] || []).length}
                  />
                ))}
              </div>

              <div className="py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <ScrollArea className="w-full">
                  <div className="flex items-center gap-1.5 min-h-[120px] px-1">
                    {state.board.length === 0 && (
                      <span className="text-sm mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>Mesa vacia - coloca la primera ficha</span>
                    )}
                    {state.board.map((tile, i) => (
                      <DominoTileSVG key={i} tile={tile} horizontal small />
                    ))}
                  </div>
                </ScrollArea>
                {state.ruleType === "cinco" && state.board.length > 0 && (
                  <div className="text-center mt-1">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Extremos: {boardEndValues(state.board)?.[0]} + {boardEndValues(state.board)?.[1]} = {calcOpenEndsSum(state.board)}
                      {calcOpenEndsSum(state.board) % 5 === 0 && calcOpenEndsSum(state.board) > 0 && (
                        <span className="font-bold ml-1" style={{ color: "#ffd700" }}>(x5!)</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Fichas de {playerLabel(cp)} ({activeHand.length}):</span>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {activeHand.map((tile, i) => (
                    <DominoTileSVG
                      key={i}
                      tile={tile}
                      selected={selectedTile === i}
                      onClick={() => handleSelectTile(i)}
                      testId={`tile-player-${i}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {!state.roundOver && (
            <div className="flex flex-col items-center gap-2">
              {aiThinking && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>La maquina esta pensando...</span>
                </div>
              )}

              {!aiThinking && (
                <>
                  <Badge variant="outline" data-testid="text-turn-indicator">Turno: {playerLabel(cp)}</Badge>
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
                    {!canPlay && state.ruleType !== "bloqueo" && state.pool.length > 0 && (
                      <Button size="sm" variant="secondary" onClick={handleDraw} data-testid="button-draw">
                        Robar ({state.pool.length})
                      </Button>
                    )}
                    {!canPlay && (state.ruleType === "bloqueo" || state.pool.length === 0) && (
                      <Button size="sm" variant="secondary" onClick={handlePass} data-testid="button-pass">
                        Pasar
                      </Button>
                    )}
                  </div>
                </>
              )}

              <span className="text-xs text-muted-foreground">Pozo: {state.pool.length} fichas</span>
            </div>
          )}
        </>
      )}

      {state.roundOver && roundResult && (
        <Card>
          <CardContent className="py-4 text-center space-y-3">
            {roundResult.winner > 0 ? (
              <Badge className="bg-green-600 text-white text-lg" data-testid="text-round-winner">
                {playerLabel(roundResult.winner)} gano la ronda!
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-lg" data-testid="text-round-draw">Empate</Badge>
            )}

            <div className="text-sm text-muted-foreground space-y-1">
              {Array.from({ length: state.playerCount }, (_, i) => i + 1).map(p => (
                <p key={p}>{playerLabel(p)} puntos restantes: {roundResult.pipsByPlayer[String(p)] || 0}</p>
              ))}
            </div>

            {state.ruleType === "cinco" && (
              <div className="text-sm">
                <p className="font-semibold">
                  Marcador: {Array.from({ length: state.playerCount }, (_, i) => i + 1)
                    .map(p => `${playerLabel(p)} ${state.scores[String(p)] || 0}`)
                    .join(" - ")}
                </p>
                {state.matchOver && (() => {
                  const matchWinner = Array.from({ length: state.playerCount }, (_, i) => i + 1)
                    .find(p => (state.scores[String(p)] || 0) >= state.targetScore);
                  return (
                    <Badge className="mt-2 bg-yellow-500 text-black text-base" data-testid="text-match-winner">
                      {matchWinner ? `${playerLabel(matchWinner)} gano la partida!` : ""}
                    </Badge>
                  );
                })()}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              {state.ruleType === "cinco" && !state.matchOver && (
                <Button onClick={handleNewRound} data-testid="button-next-round">
                  Siguiente Ronda
                </Button>
              )}
              <Button variant={state.matchOver ? "default" : "secondary"} onClick={handleRestart} data-testid="button-new-game">
                <RotateCcw className="w-4 h-4 mr-1" /> Nueva Partida
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
