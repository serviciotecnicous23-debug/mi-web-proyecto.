import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CITY_BUILDINGS, CITY_LEVEL_XP } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, Coins, Wheat, TreePine, Mountain, Sparkles, Crown,
  Hammer, Clock, CheckCircle, Loader2, Plus, Minus, Users, HandHelping,
  ArrowLeftRight, Gift, Target, ChevronRight, MapPin, Star, Flame,
  Home, Church, Store, Droplets, Shield, Warehouse, BookOpen, Apple,
  Grape, Axe, Eye, TowerControl, BrickWall, X, Trash2, Timer, Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "./city-builder.css";

type CityProfile = {
  id: number; userId: number; cityName: string; level: number; xp: number;
  gold: number; food: number; wood: number; stone: number; faith: number;
  population: number; maxPopulation: number; lastCollectedAt: string;
};

type CityTile = {
  id: number; userId: number; x: number; y: number; buildingKey: string;
  level: number; state: string; plantedAt: string | null; readyAt: string | null;
  lastHarvestAt: string | null;
};

type CityMission = {
  id: number; title: string; description: string; bibleReference: string | null;
  missionType: string; targetKey: string | null; targetCount: number;
  rewardGold: number; rewardFood: number; rewardWood: number; rewardStone: number;
  rewardFaith: number; rewardXp: number; requiredLevel: number; sortOrder: number;
  progress: number; isCompleted: boolean; isClaimed: boolean;
};

type CityState = { profile: CityProfile; tiles: CityTile[]; missions: CityMission[] };

type Neighbor = { id: number; userId: number; cityName: string; level: number; xp: number;
  username: string; displayName: string | null; tileCount: number; gold: number; food: number;
  wood: number; stone: number; faith: number; population: number; maxPopulation: number;
};

type Trade = { id: number; fromUserId: number; toUserId: number | null; offerResource: string;
  offerAmount: number; requestResource: string; requestAmount: number; status: string; fromUsername: string;
};

const GRID_SIZE = 8;

const BUILDING_ICONS: Record<string, any> = {
  casa: Home, granja: Wheat, vinedo: Grape, olivar: TreePine,
  aserradero: Axe, cantera: Mountain, pozo: Droplets, mercado: Store,
  templo: Church, muralla: BrickWall, granero: Warehouse, torre_vigia: TowerControl,
  escuela: BookOpen, palacio: Crown, huerto: Apple,
};

const BUILDING_ICON_COLORS: Record<string, string> = {
  casa: "text-amber-600 dark:text-amber-400",
  granja: "text-green-600 dark:text-green-400",
  vinedo: "text-purple-600 dark:text-purple-400",
  olivar: "text-emerald-600 dark:text-emerald-400",
  aserradero: "text-orange-700 dark:text-orange-400",
  cantera: "text-stone-600 dark:text-stone-400",
  pozo: "text-sky-600 dark:text-sky-400",
  mercado: "text-yellow-700 dark:text-yellow-400",
  templo: "text-indigo-600 dark:text-indigo-400",
  muralla: "text-stone-700 dark:text-stone-400",
  granero: "text-amber-700 dark:text-amber-400",
  torre_vigia: "text-slate-700 dark:text-slate-400",
  escuela: "text-blue-600 dark:text-blue-400",
  palacio: "text-yellow-600 dark:text-yellow-400",
  huerto: "text-lime-700 dark:text-lime-400",
};

const RESOURCE_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  gold: { icon: Coins, color: "text-yellow-500", label: "Oro" },
  food: { icon: Wheat, color: "text-green-500", label: "Alimento" },
  wood: { icon: TreePine, color: "text-amber-600", label: "Madera" },
  stone: { icon: Mountain, color: "text-stone-500", label: "Piedra" },
  faith: { icon: Sparkles, color: "text-indigo-500", label: "Fe" },
};

function useCountdown(readyAt: string | null) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!readyAt) { setRemaining(0); return; }
    const calc = () => {
      const diff = new Date(readyAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(diff / 1000)));
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [readyAt]);
  return remaining;
}

function formatTime(seconds: number) {
  if (seconds <= 0) return "Listo";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ResourceBar({ profile }: { profile: CityProfile }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.entries(RESOURCE_ICONS).map(([key, { icon: Icon, color, label }]) => (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <div className="resource-pill" data-testid={`resource-${key}`}>
              <Icon className={`w-4 h-4 ${color}`} />
              <span>{(profile as any)[key]}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="resource-pill">
            <Users className="w-4 h-4 text-blue-500" />
            <span>{profile.population}/{profile.maxPopulation}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>Poblacion</TooltipContent>
      </Tooltip>
    </div>
  );
}

function CityLevelBadge({ profile }: { profile: CityProfile }) {
  const nextXp = CITY_LEVEL_XP[profile.level] || CITY_LEVEL_XP[CITY_LEVEL_XP.length - 1];
  const prevXp = CITY_LEVEL_XP[profile.level - 1] || 0;
  const progress = nextXp > prevXp ? ((profile.xp - prevXp) / (nextXp - prevXp)) * 100 : 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Crown className="w-5 h-5 text-yellow-500" />
        <span className="font-bold text-sm">Nv. {profile.level}</span>
      </div>
      <div className="w-20">
        <Progress value={Math.min(progress, 100)} className="h-2" />
      </div>
      <span className="text-xs text-muted-foreground">{profile.xp}/{nextXp} XP</span>
    </div>
  );
}

function BuildingArt({ buildingKey }: { buildingKey: string }) {
  switch (buildingKey) {
    case "casa":
      return (
        <div className="building-body">
          <div className="bldg-window w1" />
          <div className="bldg-window w2" />
          <div className="smoke-particle" />
          <div className="smoke-particle" />
          <div className="smoke-particle" />
        </div>
      );
    case "granja":
      return (
        <div className="building-body">
          <div className="crop-row" />
          <div className="crop-row" />
          <div className="crop-row" />
          <div className="crop-row" />
          <div className="crop-row" />
          <div className="crop-row" />
        </div>
      );
    case "vinedo":
      return (
        <div className="building-body">
          <div className="grape-cluster" />
          <div className="grape-cluster" />
          <div className="grape-cluster" />
          <div className="vine-line" />
          <div className="vine-line" />
        </div>
      );
    case "templo":
      return (
        <div className="building-body">
          <div className="temple-glow" />
          <div className="temple-column" />
          <div className="temple-column" />
          <div className="temple-column" />
          <div className="temple-column" />
          <div className="sparkle-effect" />
          <div className="sparkle-effect" />
          <div className="sparkle-effect" />
        </div>
      );
    case "mercado":
      return (
        <div className="building-body">
          <div className="market-item" />
          <div className="market-item" />
          <div className="market-item" />
        </div>
      );
    case "palacio":
      return (
        <div className="building-body">
          <div className="palace-crown">
            <Crown className="w-full h-full" />
          </div>
          <div className="palace-pillar" />
          <div className="palace-pillar" />
          <div className="sparkle-effect" />
          <div className="sparkle-effect" />
          <div className="sparkle-effect" />
        </div>
      );
    case "pozo":
      return (
        <div className="building-body">
          <div className="water-ripple" />
          <div className="water-ripple" />
          <div className="water-ripple" />
        </div>
      );
    case "aserradero":
      return (
        <div className="building-body">
          <div className="saw-blade" />
          <div className="log-stack" />
          <div className="smoke-particle" />
          <div className="smoke-particle" />
        </div>
      );
    case "cantera":
      return (
        <div className="building-body">
          <div className="stone-block" />
          <div className="stone-block" />
          <div className="stone-block" />
        </div>
      );
    case "olivar":
      return (
        <div className="building-body">
          <div className="olive-tree" />
          <div className="olive-tree" />
          <div className="olive-tree" />
        </div>
      );
    case "huerto":
      return (
        <div className="building-body">
          <div className="fruit-tree" />
          <div className="fruit-tree" />
          <div className="fruit-tree" />
          <div className="fruit-dot" />
          <div className="fruit-dot" />
          <div className="fruit-dot" />
        </div>
      );
    case "muralla":
      return (
        <div className="building-body">
          <div className="wall-brick" />
          <div className="wall-brick" />
          <div className="wall-brick" />
          <div className="wall-brick" />
          <div className="wall-merlon" />
          <div className="wall-merlon" />
          <div className="wall-merlon" />
          <div className="wall-merlon" />
        </div>
      );
    case "granero":
      return (
        <div className="building-body">
          <div className="barn-door" />
        </div>
      );
    case "torre_vigia":
      return (
        <div className="building-body">
          <div className="tower-top" />
          <div className="tower-body" />
          <div className="tower-light" />
        </div>
      );
    case "escuela":
      return (
        <div className="building-body">
          <div className="school-window" />
          <div className="school-window" />
          <div className="school-window" />
        </div>
      );
    default:
      return <div className="building-body" />;
  }
}

function BuildingTile({ tile, onClick, isVisiting }: { tile: CityTile; onClick: () => void; isVisiting?: boolean }) {
  const building = CITY_BUILDINGS[tile.buildingKey as keyof typeof CITY_BUILDINGS];
  if (!building) return null;
  const remaining = useCountdown(tile.readyAt);
  const isBuilding = tile.state === "building" && remaining > 0;
  const isProducing = tile.state === "producing" && remaining > 0;
  const isReady = (tile.state === "ready") || (tile.state === "producing" && remaining <= 0) || (tile.state === "building" && remaining <= 0);
  const hasProduction = !!(building as any).produceResource;

  const stateClass = isBuilding
    ? "building-constructing"
    : (isReady && hasProduction && !isVisiting)
      ? "building-ready-glow"
      : isProducing
        ? "building-producing"
        : "";

  return (
    <button
      onClick={onClick}
      disabled={isVisiting}
      className={`building-tile bldg-${tile.buildingKey} ${stateClass}`}
      data-testid={`tile-${tile.x}-${tile.y}`}
    >
      <BuildingArt buildingKey={tile.buildingKey} />
      <div className="building-highlight" />
      <div className="building-shadow" />
      <span className="building-name">{building.name}</span>
      {isReady && hasProduction && (
        <div className="ready-indicator">
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      {isProducing && <div className="production-indicator" />}
      {(isBuilding || isProducing) && tile.readyAt && (
        <TileTimerOverlay readyAt={tile.readyAt} />
      )}
      {tile.level > 1 && (
        <div className="tile-level-badge">{tile.level}</div>
      )}
    </button>
  );
}

function TileTimerOverlay({ readyAt }: { readyAt: string }) {
  const remaining = useCountdown(readyAt);
  if (remaining <= 0) return null;
  return (
    <div className="tile-timer">
      <Timer className="w-2.5 h-2.5 inline mr-0.5" />{formatTime(remaining)}
    </div>
  );
}

function EmptyTile({ x, y, onClick, isVisiting }: { x: number; y: number; onClick: () => void; isVisiting?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={isVisiting}
      className="empty-tile"
      data-testid={`empty-tile-${x}-${y}`}
    >
      {!isVisiting && <Plus className="w-4 h-4 text-muted-foreground/30" />}
    </button>
  );
}

function BuildMenu({ onSelect, profile, onClose }: { onSelect: (key: string) => void; profile: CityProfile; onClose: () => void }) {
  const categories = useMemo(() => {
    const cats: Record<string, { key: string; building: any }[]> = {};
    Object.entries(CITY_BUILDINGS).forEach(([key, b]) => {
      const cat = b.category;
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push({ key, building: b });
    });
    return cats;
  }, []);

  const categoryLabels: Record<string, string> = {
    vivienda: "Vivienda", produccion: "Produccion", servicio: "Servicios",
    comercio: "Comercio", fe: "Fe y Culto", defensa: "Defensa",
    almacen: "Almacenamiento", especial: "Especial",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Hammer className="w-4 h-4 text-primary" /> Construir Edificio
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="h-[400px] pr-2">
        {Object.entries(categories).map(([cat, items]) => (
          <div key={cat} className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{categoryLabels[cat] || cat}</p>
            <div className="space-y-2">
              {items.map(({ key, building }) => {
                const Icon = BUILDING_ICONS[key] || Home;
                const iconColor = BUILDING_ICON_COLORS[key] || "";
                const canAfford = profile.gold >= building.costGold && profile.food >= building.costFood &&
                  profile.wood >= building.costWood && profile.stone >= building.costStone && profile.faith >= building.costFaith;
                const meetsLevel = profile.level >= building.requiredLevel;
                const disabled = !canAfford || !meetsLevel;

                return (
                  <button
                    key={key}
                    onClick={() => !disabled && onSelect(key)}
                    className={`w-full text-left p-2 rounded-md border transition-all ${disabled ? "opacity-50 cursor-not-allowed" : "hover-elevate cursor-pointer"}`}
                    disabled={disabled}
                    data-testid={`build-${key}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`shrink-0 w-10 h-10 rounded-md bldg-${key} building-tile overflow-hidden`} style={{ aspectRatio: 'auto' }}>
                        <BuildingArt buildingKey={key} />
                        <div className="building-highlight" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-medium text-xs">{building.name}</span>
                          {!meetsLevel && <Badge variant="outline" className="text-[9px] py-0 px-1">Nv.{building.requiredLevel}</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">{building.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {building.costGold > 0 && <span className="text-[9px] flex items-center gap-0.5"><Coins className="w-2.5 h-2.5 text-yellow-500" />{building.costGold}</span>}
                          {building.costFood > 0 && <span className="text-[9px] flex items-center gap-0.5"><Wheat className="w-2.5 h-2.5 text-green-500" />{building.costFood}</span>}
                          {building.costWood > 0 && <span className="text-[9px] flex items-center gap-0.5"><TreePine className="w-2.5 h-2.5 text-amber-600" />{building.costWood}</span>}
                          {building.costStone > 0 && <span className="text-[9px] flex items-center gap-0.5"><Mountain className="w-2.5 h-2.5 text-stone-500" />{building.costStone}</span>}
                          {building.costFaith > 0 && <span className="text-[9px] flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5 text-indigo-500" />{building.costFaith}</span>}
                          <span className="text-[9px] flex items-center gap-0.5 text-muted-foreground"><Clock className="w-2.5 h-2.5" />{Math.ceil(building.buildTimeSec / 60)}m</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}

function TileDetail({ tile, onHarvest, onDemolish, onMove, onSwap, isHarvesting, isDemolishing }: {
  tile: CityTile; onHarvest: () => void; onDemolish: () => void; onMove: () => void; onSwap: () => void; isHarvesting: boolean; isDemolishing: boolean;
}) {
  const building = CITY_BUILDINGS[tile.buildingKey as keyof typeof CITY_BUILDINGS];
  if (!building) return null;
  const remaining = useCountdown(tile.readyAt);
  const hasProduction = !!(building as any).produceResource;
  const isReady = (tile.state === "ready" && hasProduction) || ((tile.state === "producing" || tile.state === "building") && remaining <= 0);
  const prodInfo = hasProduction ? RESOURCE_ICONS[(building as any).produceResource] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={`w-14 h-14 rounded-md bldg-${tile.buildingKey} building-tile overflow-hidden relative`} style={{ aspectRatio: 'auto' }}>
          <BuildingArt buildingKey={tile.buildingKey} />
          <div className="building-highlight" />
        </div>
        <div>
          <h3 className="font-bold text-sm">{building.name}</h3>
          <p className="text-xs text-muted-foreground">{building.description}</p>
        </div>
      </div>
      {hasProduction && prodInfo && (
        <div className="rounded-md bg-muted/50 p-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Produce:</span>
            <prodInfo.icon className={`w-3.5 h-3.5 ${prodInfo.color}`} />
            <span className="font-medium">+{(building as any).produceAmount} {prodInfo.label}</span>
            <span className="text-muted-foreground ml-1">cada {Math.ceil((building as any).produceTimeSec / 60)} min</span>
          </div>
          {remaining > 0 && tile.state !== "ready" && (
            <div className="mt-1 flex items-center gap-1 text-muted-foreground">
              <Timer className="w-3 h-3" /> {formatTime(remaining)}
            </div>
          )}
        </div>
      )}
      {(building as any).populationAdd && (
        <div className="text-xs flex items-center gap-1 text-muted-foreground">
          <Users className="w-3.5 h-3.5 text-blue-500" /> +{(building as any).populationAdd} poblacion
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {isReady && hasProduction && (
          <Button onClick={onHarvest} disabled={isHarvesting} className="flex-1" data-testid="button-harvest-tile">
            {isHarvesting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
            Cosechar
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onMove} data-testid="button-move-tile">
              <MapPin className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mover edificio</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onSwap} data-testid="button-swap-tile">
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Intercambiar con otro</TooltipContent>
        </Tooltip>
        <Button variant="outline" size="icon" onClick={onDemolish} disabled={isDemolishing} data-testid="button-demolish-tile">
          {isDemolishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

function MissionsList({ missions, onClaim, isClaiming }: {
  missions: CityMission[]; onClaim: (id: number) => void; isClaiming: boolean;
}) {
  const available = missions.filter(m => !m.isClaimed);
  return (
    <div className="space-y-2">
      {available.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Todas las misiones completadas</p>}
      {available.map((m) => {
        const pct = Math.min((m.progress / m.targetCount) * 100, 100);
        return (
          <div key={m.id} className={`p-3 rounded-md border ${m.isCompleted ? "border-green-500/30 bg-green-500/5" : ""}`} data-testid={`mission-${m.id}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.description}</p>
                {m.bibleReference && <p className="text-[10px] text-muted-foreground italic mt-0.5">{m.bibleReference}</p>}
              </div>
              {m.isCompleted && !m.isClaimed && (
                <Button size="sm" onClick={() => onClaim(m.id)} disabled={isClaiming} data-testid={`claim-mission-${m.id}`}>
                  <Gift className="w-3.5 h-3.5 mr-1" /> Reclamar
                </Button>
              )}
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>{m.progress}/{m.targetCount}</span>
                <span>{Math.round(pct)}%</span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {m.rewardGold > 0 && <span className="text-[9px] flex items-center gap-0.5"><Coins className="w-2.5 h-2.5 text-yellow-500" />{m.rewardGold}</span>}
              {m.rewardFood > 0 && <span className="text-[9px] flex items-center gap-0.5"><Wheat className="w-2.5 h-2.5 text-green-500" />{m.rewardFood}</span>}
              {m.rewardWood > 0 && <span className="text-[9px] flex items-center gap-0.5"><TreePine className="w-2.5 h-2.5 text-amber-600" />{m.rewardWood}</span>}
              {m.rewardStone > 0 && <span className="text-[9px] flex items-center gap-0.5"><Mountain className="w-2.5 h-2.5 text-stone-500" />{m.rewardStone}</span>}
              {m.rewardFaith > 0 && <span className="text-[9px] flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5 text-indigo-500" />{m.rewardFaith}</span>}
              {m.rewardXp > 0 && <span className="text-[9px] flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-primary" />{m.rewardXp} XP</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NeighborsList({ onVisit }: { onVisit: (userId: number) => void }) {
  const { data: neighbors = [], isLoading } = useQuery<Neighbor[]>({ queryKey: ["/api/city/neighbors"] });
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (neighbors.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No hay vecinos aun</p>;

  return (
    <div className="space-y-2">
      {neighbors.map((n) => (
        <div key={n.userId} className="flex items-center gap-3 p-2 rounded-md border hover-elevate cursor-pointer" onClick={() => onVisit(n.userId)} data-testid={`neighbor-${n.userId}`}>
          <Avatar className="w-9 h-9">
            <AvatarFallback className="text-xs bg-primary/10">{(n.displayName || n.username || "?")[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{n.displayName || n.username}</p>
            <p className="text-[10px] text-muted-foreground">{n.cityName} - Nv.{n.level}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />{n.tileCount} edificios
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      ))}
    </div>
  );
}

function TradePanel({ profile }: { profile: CityProfile }) {
  const { toast } = useToast();
  const { data: trades = [], isLoading } = useQuery<Trade[]>({ queryKey: ["/api/city/trades"] });
  const [showCreate, setShowCreate] = useState(false);
  const [offerRes, setOfferRes] = useState("gold");
  const [offerAmt, setOfferAmt] = useState("10");
  const [reqRes, setReqRes] = useState("food");
  const [reqAmt, setReqAmt] = useState("10");

  const createTrade = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/city/trades", {
        fromUserId: profile.userId, offerResource: offerRes, offerAmount: parseInt(offerAmt),
        requestResource: reqRes, requestAmount: parseInt(reqAmt),
      });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/city/trades"] }); queryClient.invalidateQueries({ queryKey: ["/api/city"] }); setShowCreate(false); toast({ title: "Oferta creada" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const acceptTrade = useMutation({
    mutationFn: async (tradeId: number) => { const res = await apiRequest("POST", `/api/city/trades/${tradeId}/accept`); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/city/trades"] }); queryClient.invalidateQueries({ queryKey: ["/api/city"] }); toast({ title: "Intercambio completado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelTrade = useMutation({
    mutationFn: async (tradeId: number) => { const res = await apiRequest("POST", `/api/city/trades/${tradeId}/cancel`); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/city/trades"] }); queryClient.invalidateQueries({ queryKey: ["/api/city"] }); toast({ title: "Oferta cancelada" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-1"><ArrowLeftRight className="w-4 h-4" /> Mercado de Intercambio</h3>
        <Button size="sm" variant="outline" onClick={() => setShowCreate(!showCreate)} data-testid="button-create-trade">
          <Plus className="w-3.5 h-3.5 mr-1" /> Crear Oferta
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Yo ofrezco:</p>
            <div className="flex gap-2">
              <Select value={offerRes} onValueChange={setOfferRes}>
                <SelectTrigger className="flex-1" data-testid="select-offer-resource"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RESOURCE_ICONS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" value={offerAmt} onChange={(e) => setOfferAmt(e.target.value)} className="w-20" min="1" data-testid="input-offer-amount" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">A cambio de:</p>
            <div className="flex gap-2">
              <Select value={reqRes} onValueChange={setReqRes}>
                <SelectTrigger className="flex-1" data-testid="select-request-resource"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RESOURCE_ICONS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" value={reqAmt} onChange={(e) => setReqAmt(e.target.value)} className="w-20" min="1" data-testid="input-request-amount" />
            </div>
            <Button onClick={() => createTrade.mutate()} disabled={createTrade.isPending} className="w-full" data-testid="button-submit-trade">
              {createTrade.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Publicar Oferta
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /> : trades.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No hay ofertas de intercambio</p>
      ) : (
        <div className="space-y-2">
          {trades.map((t) => {
            const offerInfo = RESOURCE_ICONS[t.offerResource];
            const reqInfo = RESOURCE_ICONS[t.requestResource];
            const isOwn = t.fromUserId === profile.userId;
            return (
              <div key={t.id} className="p-2 rounded-md border flex items-center gap-2 flex-wrap" data-testid={`trade-${t.id}`}>
                <span className="text-xs text-muted-foreground">{t.fromUsername}</span>
                <div className="flex items-center gap-1 text-xs">
                  {offerInfo && <offerInfo.icon className={`w-3.5 h-3.5 ${offerInfo.color}`} />}
                  <span className="font-medium">{t.offerAmount}</span>
                </div>
                <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />
                <div className="flex items-center gap-1 text-xs">
                  {reqInfo && <reqInfo.icon className={`w-3.5 h-3.5 ${reqInfo.color}`} />}
                  <span className="font-medium">{t.requestAmount}</span>
                </div>
                <div className="ml-auto flex gap-1">
                  {isOwn ? (
                    <Button size="sm" variant="outline" onClick={() => cancelTrade.mutate(t.id)} disabled={cancelTrade.isPending} data-testid={`cancel-trade-${t.id}`}>Cancelar</Button>
                  ) : (
                    <Button size="sm" onClick={() => acceptTrade.mutate(t.id)} disabled={acceptTrade.isPending} data-testid={`accept-trade-${t.id}`}>Aceptar</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VisitView({ userId, onBack }: { userId: number; onBack: () => void }) {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<CityState>({ queryKey: ["/api/city/neighbor", userId] });

  const helpMutation = useMutation({
    mutationFn: async (tileId: number) => {
      const res = await apiRequest("POST", `/api/city/help/${tileId}`, {});
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/city/neighbor", userId] }); toast({ title: "Ayuda enviada", description: "Aceleraste la produccion de tu vecino" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !data) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const { profile, tiles } = data;
  const tileMap = new Map(tiles.map(t => [`${t.x},${t.y}`, t]));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" /> Visitando: {profile.cityName}
          </h2>
          <p className="text-xs text-muted-foreground">Nivel {profile.level} - Toca un edificio en produccion para ayudar</p>
        </div>
      </div>

      <div
        className="city-terrain city-isometric grid gap-1 p-3 rounded-lg border relative"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      >
        <div className="ambient-cloud" />
        <div className="ambient-cloud" />
        <div className="ambient-cloud" />
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const tile = tileMap.get(`${x},${y}`);
          if (tile) {
            const remaining = tile.readyAt ? Math.max(0, Math.floor((new Date(tile.readyAt).getTime() - Date.now()) / 1000)) : 0;
            const isProducing = (tile.state === "producing" || tile.state === "building") && remaining > 0;
            return (
              <div key={i} className="relative">
                <BuildingTile tile={tile} onClick={() => { if (isProducing) helpMutation.mutate(tile.id); }} isVisiting />
                {isProducing && (
                  <button
                    onClick={() => helpMutation.mutate(tile.id)}
                    className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center z-10 hover-elevate"
                    data-testid={`help-tile-${tile.id}`}
                  >
                    <HandHelping className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            );
          }
          return <EmptyTile key={i} x={x} y={y} onClick={() => {}} isVisiting />;
        })}
      </div>
    </div>
  );
}

export function CityBuilder({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const [selectedCoord, setSelectedCoord] = useState<{ x: number; y: number } | null>(null);
  const [selectedTile, setSelectedTile] = useState<CityTile | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [visitingUserId, setVisitingUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("ciudad");
  const [moveMode, setMoveMode] = useState<"none" | "move" | "swap">("none");
  const [movingTile, setMovingTile] = useState<CityTile | null>(null);

  const { data, isLoading, refetch } = useQuery<CityState>({ queryKey: ["/api/city"] });

  useEffect(() => {
    const interval = setInterval(() => { refetch(); }, 15000);
    return () => clearInterval(interval);
  }, [refetch]);

  const placeMutation = useMutation({
    mutationFn: async ({ x, y, buildingKey }: { x: number; y: number; buildingKey: string }) => {
      const res = await apiRequest("POST", "/api/city/place", { x, y, buildingKey });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/city"] });
      setShowBuildMenu(false); setSelectedCoord(null);
      toast({ title: "Edificio en construccion", description: "Tu nuevo edificio se esta levantando" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const harvestMutation = useMutation({
    mutationFn: async (tileId: number) => {
      const res = await apiRequest("POST", `/api/city/harvest/${tileId}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/city"] });
      setSelectedTile(null);
      const resInfo = RESOURCE_ICONS[data.resourceGained];
      toast({ title: "Cosecha recogida", description: `+${data.amountGained} ${resInfo?.label || data.resourceGained}` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const harvestAllMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("POST", "/api/city/harvest-all"); return res.json(); },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/city"] });
      if (data.collected === 0) { toast({ title: "Nada listo", description: "No hay cosechas disponibles aun" }); return; }
      const parts = Object.entries(data.resources).filter(([_, v]) => (v as number) > 0).map(([k, v]) => {
        const ri = RESOURCE_ICONS[k];
        return `+${v} ${ri?.label || k}`;
      });
      toast({ title: `${data.collected} cosechas recogidas`, description: parts.join(", ") });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const demolishMutation = useMutation({
    mutationFn: async (tileId: number) => { await apiRequest("POST", `/api/city/demolish/${tileId}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/city"] }); setSelectedTile(null); toast({ title: "Edificio demolido", description: "Recursos parcialmente devueltos" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const moveMutation = useMutation({
    mutationFn: async ({ tileId, toX, toY }: { tileId: number; toX: number; toY: number }) => {
      await apiRequest("POST", "/api/city/move", { tileId, toX, toY });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/city"] });
      setMovingTile(null); setMoveMode("none"); setSelectedTile(null);
      toast({ title: "Edificio movido", description: "El edificio fue reubicado" });
    },
    onError: (e: any) => {
      setMovingTile(null); setMoveMode("none");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const swapMutation = useMutation({
    mutationFn: async ({ tileId1, tileId2 }: { tileId1: number; tileId2: number }) => {
      await apiRequest("POST", "/api/city/swap", { tileId1, tileId2 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/city"] });
      setMovingTile(null); setMoveMode("none"); setSelectedTile(null);
      toast({ title: "Edificios intercambiados", description: "Las posiciones fueron intercambiadas" });
    },
    onError: (e: any) => {
      setMovingTile(null); setMoveMode("none");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const claimMission = useMutation({
    mutationFn: async (missionId: number) => { const res = await apiRequest("POST", `/api/city/missions/${missionId}/claim`); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/city"] }); toast({ title: "Recompensa reclamada" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <Church className="w-16 h-16 text-primary animate-pulse" />
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 animate-bounce" />
        </div>
        <p className="text-muted-foreground">Preparando tu ciudad biblica...</p>
      </div>
    );
  }

  if (visitingUserId) {
    return <VisitView userId={visitingUserId} onBack={() => setVisitingUserId(null)} />;
  }

  const { profile, tiles, missions } = data;
  const tileMap = new Map(tiles.map(t => [`${t.x},${t.y}`, t]));
  const readyCount = tiles.filter(t => {
    const building = CITY_BUILDINGS[t.buildingKey as keyof typeof CITY_BUILDINGS];
    if (!(building as any)?.produceResource) return false;
    if (t.state === "ready") return true;
    if (!t.readyAt) return false;
    return new Date(t.readyAt).getTime() <= Date.now();
  }).length;

  const handleTileClick = (x: number, y: number) => {
    const tile = tileMap.get(`${x},${y}`);

    if (moveMode === "move" && movingTile) {
      if (!tile) {
        moveMutation.mutate({ tileId: movingTile.id, toX: x, toY: y });
      } else if (tile.id !== movingTile.id) {
        toast({ title: "Posicion ocupada", description: "Selecciona una casilla vacia para mover", variant: "destructive" });
      }
      return;
    }

    if (moveMode === "swap" && movingTile) {
      if (tile && tile.id !== movingTile.id) {
        swapMutation.mutate({ tileId1: movingTile.id, tileId2: tile.id });
      } else if (!tile) {
        toast({ title: "Selecciona un edificio", description: "Para intercambiar necesitas seleccionar otro edificio", variant: "destructive" });
      }
      return;
    }

    if (tile) {
      setSelectedTile(tile);
      setShowBuildMenu(false);
      setSelectedCoord(null);
    } else {
      setSelectedCoord({ x, y });
      setShowBuildMenu(true);
      setSelectedTile(null);
    }
  };

  const handleBuild = (buildingKey: string) => {
    if (!selectedCoord) return;
    placeMutation.mutate({ x: selectedCoord.x, y: selectedCoord.y, buildingKey });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-city">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg flex items-center gap-2 truncate" data-testid="text-city-title">
            <MapPin className="w-5 h-5 text-primary shrink-0" /> {profile.cityName}
          </h2>
        </div>
        <CityLevelBadge profile={profile} />
      </div>

      <ResourceBar profile={profile} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="ciudad" data-testid="tab-ciudad"><MapPin className="w-3.5 h-3.5 mr-1" /> Ciudad</TabsTrigger>
          <TabsTrigger value="misiones" data-testid="tab-misiones"><Target className="w-3.5 h-3.5 mr-1" /> Misiones</TabsTrigger>
          <TabsTrigger value="vecinos" data-testid="tab-vecinos"><Users className="w-3.5 h-3.5 mr-1" /> Vecinos</TabsTrigger>
          <TabsTrigger value="comercio" data-testid="tab-comercio"><ArrowLeftRight className="w-3.5 h-3.5 mr-1" /> Comercio</TabsTrigger>
        </TabsList>

        <TabsContent value="ciudad" className="mt-4">
          {readyCount > 0 && (
            <Button variant="outline" className="w-full mb-3" onClick={() => harvestAllMutation.mutate()} disabled={harvestAllMutation.isPending} data-testid="button-harvest-all">
              {harvestAllMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1 text-green-500" />}
              Cosechar Todo ({readyCount} listos)
            </Button>
          )}

          {moveMode !== "none" && movingTile && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-orange-500/10 border border-orange-500/30 mb-2">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="text-sm flex-1">
                {moveMode === "move"
                  ? "Selecciona una casilla vacía para mover el edificio"
                  : "Selecciona otro edificio para intercambiar posiciones"}
              </span>
              <Button variant="outline" size="sm" onClick={() => { setMoveMode("none"); setMovingTile(null); }} data-testid="button-cancel-move">
                Cancelar
              </Button>
            </div>
          )}

          <div className="flex gap-4 flex-col lg:flex-row">
            <div className="flex-1">
              <div
                className="city-terrain city-isometric grid gap-1 p-3 rounded-lg border relative"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
                data-testid="city-grid"
              >
                <div className="ambient-cloud" />
                <div className="ambient-cloud" />
                <div className="ambient-cloud" />
                {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  const tile = tileMap.get(`${x},${y}`);
                  const isSelected = selectedCoord?.x === x && selectedCoord?.y === y;
                  const isMovingSource = movingTile?.id === tile?.id;
                  const isMoveTarget = moveMode === "move" && !tile && movingTile;
                  const isSwapTarget = moveMode === "swap" && tile && !isMovingSource && movingTile;
                  if (tile) {
                    return (
                      <div key={i} className={`${selectedTile?.id === tile.id ? "tile-selected" : ""} ${isMovingSource ? "ring-2 ring-orange-500 rounded-md" : ""} ${isSwapTarget ? "ring-2 ring-blue-500 rounded-md cursor-pointer" : ""}`}>
                        <BuildingTile tile={tile} onClick={() => handleTileClick(x, y)} />
                      </div>
                    );
                  }
                  return (
                    <div key={i} className={`${isSelected ? "tile-selected" : ""} ${isMoveTarget ? "ring-2 ring-green-500 rounded-md cursor-pointer" : ""}`}>
                      <EmptyTile x={x} y={y} onClick={() => handleTileClick(x, y)} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full lg:w-72 shrink-0">
              {selectedTile && (
                <Card>
                  <CardContent className="pt-4">
                    <TileDetail
                      tile={selectedTile}
                      onHarvest={() => harvestMutation.mutate(selectedTile.id)}
                      onDemolish={() => demolishMutation.mutate(selectedTile.id)}
                      onMove={() => { setMovingTile(selectedTile); setMoveMode("move"); setSelectedTile(null); }}
                      onSwap={() => { setMovingTile(selectedTile); setMoveMode("swap"); setSelectedTile(null); }}
                      isHarvesting={harvestMutation.isPending}
                      isDemolishing={demolishMutation.isPending}
                    />
                  </CardContent>
                </Card>
              )}
              {showBuildMenu && selectedCoord && (
                <Card>
                  <CardContent className="pt-4">
                    <BuildMenu profile={profile} onSelect={handleBuild} onClose={() => { setShowBuildMenu(false); setSelectedCoord(null); }} />
                  </CardContent>
                </Card>
              )}
              {!selectedTile && !showBuildMenu && (
                <Card>
                  <CardContent className="pt-4 text-center text-sm text-muted-foreground space-y-2">
                    <Hammer className="w-8 h-8 mx-auto text-primary/50" />
                    <p>Toca una casilla vacia para construir o un edificio para gestionarlo</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="misiones" className="mt-4">
          <MissionsList missions={missions} onClaim={(id) => claimMission.mutate(id)} isClaiming={claimMission.isPending} />
        </TabsContent>

        <TabsContent value="vecinos" className="mt-4">
          <NeighborsList onVisit={(userId) => setVisitingUserId(userId)} />
        </TabsContent>

        <TabsContent value="comercio" className="mt-4">
          <TradePanel profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
