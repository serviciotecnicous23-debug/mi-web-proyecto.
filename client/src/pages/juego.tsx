import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { GAME_DIFFICULTIES, STORY_ACTIVITY_TYPES } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Flame, Zap, Trophy, Target, Star, CheckCircle, XCircle, RotateCcw,
  Loader2, ChevronRight, ChevronLeft, Crown, Medal, Award, Lock, Gift, Sparkles,
  BookOpen, Swords, ArrowLeft, ArrowRight, GripVertical, Link2, MapPin, Church,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { BoardGamesHub } from "@/components/board-games";

type GameProfile = {
  id: number; userId: number; level: number; totalPoints: number;
  energy: number; maxEnergy: number; streak: number; bestStreak: number;
  questionsAnswered: number; correctAnswers: number; currentFlameLevel: number;
  lastEnergyRefill: string; lastPlayedAt: string | null;
};

type GameQuestion = {
  id: number; type: string; difficulty: string; category: string;
  question: string; options: string[] | null; points: number;
  bibleReference: string | null;
};

type AnswerResult = {
  correct: boolean; pointsEarned: number; explanation: string | null;
  profile: GameProfile;
};

type LeaderboardEntry = {
  userId: number; username: string; displayName: string | null;
  avatarUrl: string | null; totalPoints: number; level: number; correctAnswers: number;
};

type Mission = {
  id: number; title: string; description: string; missionType: string;
  targetAction: string; targetCount: number; rewardEnergy: number;
  rewardPoints: number; progress: number; isCompleted: boolean;
};

type StoryChapter = {
  id: number; chapterNumber: number; title: string; description: string | null;
  category: string; bibleBook: string | null; completedActivities: number;
};

type StoryActivity = {
  id: number; chapterId: number; activityOrder: number; activityType: string;
  title: string; instruction: string; content: string;
  correctAnswer: string | null; explanation: string | null;
  bibleReference: string | null; completed: boolean; userAnswer: string | null;
  isCorrect: boolean | null;
};

const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000, 10000];
const FLAME_STAGES = [
  { name: "Chispa", color: "text-orange-300", minLevel: 1 },
  { name: "Brasa", color: "text-orange-400", minLevel: 3 },
  { name: "Llama", color: "text-orange-500", minLevel: 5 },
  { name: "Antorcha", color: "text-orange-600", minLevel: 8 },
  { name: "Hoguera", color: "text-red-500", minLevel: 11 },
  { name: "Fuego Sagrado", color: "text-red-600", minLevel: 15 },
];

function getFlameStage(level: number) {
  let stage = FLAME_STAGES[0];
  for (const s of FLAME_STAGES) { if (level >= s.minLevel) stage = s; }
  return stage;
}

function getLevelProgress(totalPoints: number) {
  let currentLevel = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) currentLevel = i + 1; else break;
  }
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || currentThreshold + 1000;
  const progress = ((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return { currentLevel, progress: Math.min(progress, 100), nextThreshold, currentThreshold };
}

function getDifficultyColor(d: string) {
  switch (d) {
    case "facil": return "bg-green-500/10 text-green-600 border-green-500/20";
    case "medio": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "dificil": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    case "experto": return "bg-red-500/10 text-red-600 border-red-500/20";
    default: return "";
  }
}

function FlameAnimation({ level }: { level: number }) {
  const stage = getFlameStage(level);
  const flameSize = Math.min(40 + level * 3, 80);
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative">
        <Flame className={`${stage.color} drop-shadow-lg`} style={{ width: flameSize, height: flameSize, filter: `drop-shadow(0 0 ${8 + level}px currentColor)`, animation: "pulse 2s ease-in-out infinite" }} />
        <Sparkles className="absolute -top-2 -right-2 text-yellow-400 w-5 h-5" style={{ animation: "pulse 1.5s ease-in-out infinite alternate" }} />
      </div>
      <Badge variant="outline" className="mt-2">{stage.name}</Badge>
    </div>
  );
}

function EnergyBar({ energy, maxEnergy }: { energy: number; maxEnergy: number }) {
  const pct = Math.min((energy / maxEnergy) * 100, 100);
  const barColor = pct > 60 ? "bg-yellow-400" : pct > 25 ? "bg-orange-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <Zap className="w-5 h-5 text-yellow-500" />
      <div className="relative w-28 h-5 rounded-md bg-muted border border-muted-foreground/20 overflow-hidden">
        <div className={`absolute inset-y-0 left-0 ${barColor} transition-all duration-500 rounded-md`} style={{ width: `${pct}%` }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-foreground drop-shadow-sm">{energy}/{maxEnergy}</span>
        </div>
      </div>
    </div>
  );
}

function DecorativeFrame({ children, variant = "default" }: { children: any; variant?: "default" | "gold" | "fire" | "story" }) {
  const borderColors: Record<string, string> = {
    default: "border-primary/30",
    gold: "border-amber-400/50",
    fire: "border-orange-500/40",
    story: "border-indigo-400/40",
  };
  const glowColors: Record<string, string> = {
    default: "shadow-primary/10",
    gold: "shadow-amber-400/15",
    fire: "shadow-orange-500/15",
    story: "shadow-indigo-400/15",
  };
  const cornerColor: Record<string, string> = {
    default: "text-primary/40",
    gold: "text-amber-400/60",
    fire: "text-orange-500/50",
    story: "text-indigo-400/50",
  };
  return (
    <div className={`relative border-2 ${borderColors[variant]} rounded-lg shadow-lg ${glowColors[variant]} p-0.5`}>
      <div className={`absolute -top-1.5 -left-1.5 ${cornerColor[variant]}`}><Sparkles className="w-3 h-3" /></div>
      <div className={`absolute -top-1.5 -right-1.5 ${cornerColor[variant]}`}><Sparkles className="w-3 h-3" /></div>
      <div className={`absolute -bottom-1.5 -left-1.5 ${cornerColor[variant]}`}><Sparkles className="w-3 h-3" /></div>
      <div className={`absolute -bottom-1.5 -right-1.5 ${cornerColor[variant]}`}><Sparkles className="w-3 h-3" /></div>
      {children}
    </div>
  );
}

function QuestionCard({ question, onAnswer, isSubmitting }: { question: GameQuestion; onAnswer: (answer: string) => void; isSubmitting: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const handleSelect = (answer: string) => { if (isSubmitting) return; setSelected(answer); onAnswer(answer); };

  const frameVariant = question.difficulty === "experto" ? "gold" : question.difficulty === "dificil" ? "fire" : "default";
  return (
    <DecorativeFrame variant={frameVariant}>
    <Card className="max-w-2xl mx-auto border-0 shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>{GAME_DIFFICULTIES[question.difficulty as keyof typeof GAME_DIFFICULTIES] || question.difficulty}</Badge>
          <Badge variant="secondary">{question.category}</Badge>
          <Badge variant="outline" className="ml-auto"><Star className="w-3 h-3 mr-1" /> {question.points} pts</Badge>
        </div>
        <CardTitle className="text-lg leading-relaxed" data-testid="text-question">{question.question}</CardTitle>
        {question.bibleReference && <CardDescription className="italic">{question.bibleReference}</CardDescription>}
      </CardHeader>
      <CardContent>
        {question.type === "verdadero_falso" ? (
          <div className="grid grid-cols-2 gap-3">
            {["Verdadero", "Falso"].map((opt) => (
              <Button key={opt} variant={selected === opt ? "default" : "outline"} className="h-auto py-4 text-base" onClick={() => handleSelect(opt)} disabled={isSubmitting} data-testid={`button-answer-${opt.toLowerCase()}`}>{opt}</Button>
            ))}
          </div>
        ) : question.options ? (
          <div className="grid gap-2">
            {question.options.map((opt, i) => (
              <Button key={i} variant={selected === opt ? "default" : "outline"} className="h-auto py-3 text-left justify-start text-sm leading-normal whitespace-normal" onClick={() => handleSelect(opt)} disabled={isSubmitting} data-testid={`button-answer-${i}`}>
                <span className="font-bold mr-2 shrink-0">{String.fromCharCode(65 + i)}.</span>{opt}
              </Button>
            ))}
          </div>
        ) : <p className="text-muted-foreground">Tipo de pregunta no soportado</p>}
        {isSubmitting && <div className="flex justify-center mt-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      </CardContent>
    </Card>
    </DecorativeFrame>
  );
}

function ResultCard({ result, onNext }: { result: AnswerResult; onNext: () => void }) {
  return (
    <Card className={`max-w-2xl mx-auto border-2 ${result.correct ? "border-green-500/50" : "border-red-500/50"}`}>
      <CardHeader className="text-center">
        {result.correct ? (<><CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" /><CardTitle className="text-green-600" data-testid="text-result-correct">Correcto</CardTitle></>) : (<><XCircle className="w-16 h-16 text-red-500 mx-auto mb-2" /><CardTitle className="text-red-600" data-testid="text-result-incorrect">Incorrecto</CardTitle></>)}
        <CardDescription className="text-lg">{result.correct ? `+${result.pointsEarned} puntos` : "No te desanimes, sigue intentando"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.explanation && <div className="bg-muted/50 rounded-md p-4"><p className="text-sm font-medium mb-1">Explicacion:</p><p className="text-sm text-muted-foreground">{result.explanation}</p></div>}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Nivel {result.profile.level}</span><span>Racha: {result.profile.streak}</span><span>Puntos: {result.profile.totalPoints}</span>
          </div>
          <Button onClick={onNext} data-testid="button-next-question">Siguiente <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LevelMap({ currentLevel }: { currentLevel: number }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Mapa de Niveles</h3>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 15 }, (_, i) => i + 1).map((lvl) => {
          const stage = getFlameStage(lvl);
          const isUnlocked = lvl <= currentLevel;
          const isCurrent = lvl === currentLevel;
          return (
            <div key={lvl} className={`relative aspect-square rounded-md border-2 flex flex-col items-center justify-center text-xs transition-all ${isCurrent ? "border-primary bg-primary/10 ring-2 ring-primary/30" : isUnlocked ? "border-muted-foreground/20 bg-muted/50" : "border-muted bg-muted/20 opacity-50"}`} data-testid={`level-node-${lvl}`}>
              {isUnlocked ? <Flame className={`w-5 h-5 ${stage.color}`} /> : <Lock className="w-4 h-4 text-muted-foreground" />}
              <span className={`font-bold mt-0.5 ${isCurrent ? "text-primary" : ""}`}>{lvl}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardPanel() {
  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({ queryKey: ["/api/game/leaderboard"] });
  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />;
  const rankIcons = [Crown, Medal, Award];
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2"><Trophy className="w-4 h-4" /> Clasificacion</h3>
      {leaderboard.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Se el primero en jugar</p> : (
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => {
            const RankIcon = rankIcons[idx];
            return (
              <div key={entry.userId} className={`flex items-center gap-2 p-2 rounded-md ${idx < 3 ? "bg-primary/5" : ""}`} data-testid={`leaderboard-entry-${idx}`}>
                <span className="w-6 text-center font-bold text-sm text-muted-foreground">{RankIcon ? <RankIcon className={`w-4 h-4 mx-auto ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : "text-amber-600"}`} /> : idx + 1}</span>
                <Avatar className="h-7 w-7">{entry.avatarUrl && <AvatarImage src={entry.avatarUrl} />}<AvatarFallback className="text-[10px] bg-primary/10 text-primary">{(entry.displayName || entry.username).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{entry.displayName || entry.username}</p><p className="text-[10px] text-muted-foreground">Nivel {entry.level}</p></div>
                <span className="text-sm font-bold text-primary">{entry.totalPoints}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MissionsPanel() {
  const { data: missions = [], isLoading } = useQuery<Mission[]>({ queryKey: ["/api/game/missions"] });
  const { toast } = useToast();
  const claimMutation = useMutation({
    mutationFn: async (missionId: number) => { const res = await apiRequest("POST", `/api/game/missions/${missionId}/claim`); return res.json(); },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ["/api/game/missions"] }); queryClient.invalidateQueries({ queryKey: ["/api/game/profile"] }); toast({ title: "Recompensa reclamada", description: `+${data.energy} energia, +${data.points} puntos` }); },
  });
  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />;
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2"><Gift className="w-4 h-4" /> Misiones</h3>
      {missions.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No hay misiones disponibles</p> : (
        <div className="space-y-2">
          {missions.map((m) => (
            <div key={m.id} className={`p-3 rounded-md border ${m.isCompleted ? "bg-green-500/5 border-green-500/20" : "bg-muted/30"}`} data-testid={`mission-${m.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.title}</p><p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                  <div className="mt-2"><Progress value={(m.progress / m.targetCount) * 100} className="h-1.5" /><p className="text-[10px] text-muted-foreground mt-0.5">{m.progress}/{m.targetCount}</p></div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    {m.rewardEnergy > 0 && <span className="flex items-center"><Zap className="w-3 h-3 text-yellow-500" />+{m.rewardEnergy}</span>}
                    {m.rewardPoints > 0 && <span className="flex items-center"><Star className="w-3 h-3 text-primary" />+{m.rewardPoints}</span>}
                  </div>
                  {m.isCompleted && <Button size="sm" variant="outline" onClick={() => claimMutation.mutate(m.id)} disabled={claimMutation.isPending} data-testid={`button-claim-mission-${m.id}`}>Reclamar</Button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRenderer({ activity, onComplete }: { activity: StoryActivity; onComplete: (answer: string | null, isCorrect: boolean | null) => void }) {
  const [answered, setAnswered] = useState(activity.completed);
  const [feedback, setFeedback] = useState<{ correct: boolean | null; explanation: string | null; correctAnswer: string | null } | null>(
    activity.completed ? { correct: activity.isCorrect, explanation: activity.explanation ?? null, correctAnswer: activity.correctAnswer ?? null } : null
  );

  const completeMutation = useMutation({
    mutationFn: async ({ userAnswer, isCorrect }: { userAnswer: string | null; isCorrect: boolean | null }) => {
      const res = await apiRequest("POST", `/api/story/activities/${activity.id}/complete`, { userAnswer, isCorrect });
      return res.json();
    },
    onSuccess: (data) => {
      setAnswered(true);
      setFeedback({ correct: data.isCorrect, explanation: data.explanation, correctAnswer: data.correctAnswer });
      queryClient.invalidateQueries({ queryKey: ["/api/story/chapters"] });
      onComplete(data.userAnswer, data.isCorrect);
    },
  });

  let parsed: any = {};
  try { parsed = JSON.parse(activity.content); } catch { parsed = {}; }

  const actLabel = STORY_ACTIVITY_TYPES[activity.activityType as keyof typeof STORY_ACTIVITY_TYPES] || activity.activityType;

  if (activity.activityType === "reflexion") {
    return (
      <DecorativeFrame variant="story">
      <Card className="max-w-2xl mx-auto border-0 shadow-none">
        <CardHeader>
          <Badge variant="outline" className="w-fit mb-2 bg-blue-500/10 text-blue-600 border-blue-500/20">{actLabel}</Badge>
          <CardTitle className="text-lg">{activity.title}</CardTitle>
          <CardDescription>{activity.instruction}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-md p-4 border-l-4 border-primary/30">
            <p className="text-sm leading-relaxed italic">{parsed.text}</p>
          </div>
          {parsed.reflection && (
            <div className="bg-primary/5 rounded-md p-4">
              <p className="text-sm font-medium mb-2">Pregunta para reflexionar:</p>
              <p className="text-sm text-muted-foreground">{parsed.reflection}</p>
            </div>
          )}
          {activity.bibleReference && <p className="text-xs text-muted-foreground italic">{activity.bibleReference}</p>}
          {!answered ? (
            <Button onClick={() => completeMutation.mutate({ userAnswer: "reflexion_completada", isCorrect: null })} disabled={completeMutation.isPending} data-testid="button-complete-reflection">
              {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />} He reflexionado sobre esto
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-green-600"><CheckCircle className="w-5 h-5" /><span className="text-sm font-medium">Reflexion completada</span></div>
          )}
          {feedback?.explanation && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs font-medium mb-1">Nota del estudio:</p><p className="text-xs text-muted-foreground">{feedback.explanation}</p></div>}
        </CardContent>
      </Card>
      </DecorativeFrame>
    );
  }

  if (activity.activityType === "completar_versiculo") {
    return <CompletarVersiculoActivity activity={activity} parsed={parsed} answered={answered} setAnswered={setAnswered} feedback={feedback} completeMutation={completeMutation} actLabel={actLabel} />;
  }

  if (activity.activityType === "ordenar_eventos") {
    return <OrdenarEventosActivity activity={activity} parsed={parsed} answered={answered} setAnswered={setAnswered} feedback={feedback} completeMutation={completeMutation} actLabel={actLabel} />;
  }

  if (activity.activityType === "parear") {
    return <ParearActivity activity={activity} parsed={parsed} answered={answered} setAnswered={setAnswered} feedback={feedback} completeMutation={completeMutation} actLabel={actLabel} />;
  }

  if (activity.activityType === "comparar_pasajes") {
    return (
      <DecorativeFrame variant="story">
      <Card className="max-w-2xl mx-auto border-0 shadow-none">
        <CardHeader>
          <Badge variant="outline" className="w-fit mb-2 bg-indigo-500/10 text-indigo-600 border-indigo-500/20">{actLabel}</Badge>
          <CardTitle className="text-lg">{activity.title}</CardTitle>
          <CardDescription>{activity.instruction}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-md p-4 border-l-4 border-blue-400/50">
              <p className="text-xs font-bold text-blue-600 mb-2">{parsed.passage1?.reference}</p>
              <p className="text-sm leading-relaxed italic">{parsed.passage1?.text}</p>
            </div>
            <div className="bg-muted/50 rounded-md p-4 border-l-4 border-purple-400/50">
              <p className="text-xs font-bold text-purple-600 mb-2">{parsed.passage2?.reference}</p>
              <p className="text-sm leading-relaxed italic">{parsed.passage2?.text}</p>
            </div>
          </div>
          {parsed.question && <div className="bg-primary/5 rounded-md p-4"><p className="text-sm font-medium mb-1">Pregunta:</p><p className="text-sm text-muted-foreground">{parsed.question}</p></div>}
          {!answered ? (
            <Button onClick={() => completeMutation.mutate({ userAnswer: "comparacion_completada", isCorrect: null })} disabled={completeMutation.isPending} data-testid="button-complete-compare">
              {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />} He comparado los pasajes
            </Button>
          ) : <div className="flex items-center gap-2 text-green-600"><CheckCircle className="w-5 h-5" /><span className="text-sm font-medium">Comparacion completada</span></div>}
          {feedback?.explanation && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs font-medium mb-1">Ensenanza:</p><p className="text-xs text-muted-foreground">{feedback.explanation}</p></div>}
        </CardContent>
      </Card>
      </DecorativeFrame>
    );
  }

  if (activity.activityType === "opcion_multiple") {
    return <OpcionMultipleStoryActivity activity={activity} parsed={parsed} answered={answered} setAnswered={setAnswered} feedback={feedback} completeMutation={completeMutation} actLabel={actLabel} />;
  }

  if (activity.activityType === "verdadero_falso") {
    return <VerdaderoFalsoStoryActivity activity={activity} parsed={parsed} answered={answered} setAnswered={setAnswered} feedback={feedback} completeMutation={completeMutation} actLabel={actLabel} />;
  }

  return <Card className="max-w-2xl mx-auto"><CardContent className="py-8 text-center text-muted-foreground">Tipo de actividad no reconocido: {activity.activityType}</CardContent></Card>;
}

function CompletarVersiculoActivity({ activity, parsed, answered, setAnswered, feedback, completeMutation, actLabel }: any) {
  const [answers, setAnswers] = useState<string[]>(() => {
    if (activity.completed && activity.userAnswer) {
      try { return JSON.parse(activity.userAnswer); } catch { return Array(parsed.missingWords?.length || 0).fill(""); }
    }
    return Array(parsed.missingWords?.length || 0).fill("");
  });

  const handleSubmit = () => {
    const correct = parsed.missingWords?.every((w: string, i: number) => answers[i]?.toLowerCase().trim() === w.toLowerCase().trim());
    completeMutation.mutate({ userAnswer: JSON.stringify(answers), isCorrect: correct });
  };

  const parts = parsed.verse?.split("_____") || [];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <Badge variant="outline" className="w-fit mb-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{actLabel}</Badge>
        <CardTitle className="text-lg">{activity.title}</CardTitle>
        <CardDescription>{activity.instruction}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-md p-4 border-l-4 border-primary/30">
          <div className="text-sm leading-relaxed">
            {parts.map((part: string, i: number) => (
              <span key={i}>
                <span className="italic">{part}</span>
                {i < parts.length - 1 && (
                  answered ? (
                    <span className={`font-bold mx-1 ${feedback?.correct !== false ? "text-green-600" : "text-red-500"}`}>
                      [{answers[i] || parsed.missingWords?.[i]}]
                    </span>
                  ) : (
                    <Input
                      className="inline-block w-32 mx-1 text-center"
                      placeholder="..."
                      value={answers[i] || ""}
                      onChange={(e) => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }}
                      data-testid={`input-word-${i}`}
                    />
                  )
                )}
              </span>
            ))}
          </div>
        </div>
        {activity.bibleReference && <p className="text-xs text-muted-foreground italic">{activity.bibleReference}</p>}
        {!answered ? (
          <Button onClick={handleSubmit} disabled={completeMutation.isPending || answers.some(a => !a.trim())} data-testid="button-submit-complete">
            {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Verificar
          </Button>
        ) : (
          <div className="space-y-2">
            {feedback?.correct === false && parsed.fullVerse && <div className="bg-green-500/10 rounded-md p-3"><p className="text-xs font-medium text-green-600 mb-1">Versiculo completo:</p><p className="text-xs italic">{parsed.fullVerse}</p></div>}
            <div className={`flex items-center gap-2 ${feedback?.correct !== false ? "text-green-600" : "text-orange-500"}`}>
              {feedback?.correct !== false ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{feedback?.correct !== false ? "Correcto" : "Respuesta parcial - revisa el versiculo completo"}</span>
            </div>
            {feedback?.correct === false && (
              <Button variant="outline" onClick={() => { setAnswered(false); setAnswers(Array(parsed.missingWords?.length || 0).fill("")); }} data-testid="button-retry-activity"><RotateCcw className="w-4 h-4 mr-2" /> Reintentar</Button>
            )}
          </div>
        )}
        {feedback?.explanation && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs font-medium mb-1">Ensenanza:</p><p className="text-xs text-muted-foreground">{feedback.explanation}</p></div>}
      </CardContent>
    </Card>
  );
}

function OrdenarEventosActivity({ activity, parsed, answered, setAnswered, feedback, completeMutation, actLabel }: any) {
  const [order, setOrder] = useState<number[]>(parsed.items?.map((_: any, i: number) => i).sort(() => Math.random() - 0.5) || []);

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, moved);
    setOrder(newOrder);
  };

  const handleSubmit = () => {
    const correctOrder = parsed.items?.map((_: any, i: number) => i) || [];
    const isCorrect = JSON.stringify(order) === JSON.stringify(correctOrder);
    completeMutation.mutate({ userAnswer: JSON.stringify(order), isCorrect });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <Badge variant="outline" className="w-fit mb-2 bg-amber-500/10 text-amber-600 border-amber-500/20">{actLabel}</Badge>
        <CardTitle className="text-lg">{activity.title}</CardTitle>
        <CardDescription>{activity.instruction}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {order.map((itemIdx, pos) => (
            <div key={itemIdx} className={`flex items-center gap-2 p-3 rounded-md border ${answered ? (pos === itemIdx ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5") : "bg-muted/30"}`}>
              <span className="text-xs font-bold text-muted-foreground w-6">{pos + 1}.</span>
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1">{parsed.items?.[itemIdx]}</span>
              {!answered && (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => moveItem(pos, pos - 1)} disabled={pos === 0} data-testid={`button-move-up-${pos}`}><ChevronLeft className="w-4 h-4 rotate-90" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => moveItem(pos, pos + 1)} disabled={pos === order.length - 1} data-testid={`button-move-down-${pos}`}><ChevronRight className="w-4 h-4 rotate-90" /></Button>
                </div>
              )}
            </div>
          ))}
        </div>
        {activity.bibleReference && <p className="text-xs text-muted-foreground italic">{activity.bibleReference}</p>}
        {!answered ? (
          <Button onClick={handleSubmit} disabled={completeMutation.isPending} data-testid="button-submit-order">
            {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Verificar Orden
          </Button>
        ) : (
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${feedback?.correct ? "text-green-600" : "text-orange-500"}`}>
              {feedback?.correct ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{feedback?.correct ? "Orden correcto" : "Orden incorrecto - revisa la secuencia biblica"}</span>
            </div>
            {feedback?.correct === false && (
              <Button variant="outline" onClick={() => { setAnswered(false); setOrder(parsed.items?.map((_: any, i: number) => i).sort(() => Math.random() - 0.5) || []); }} data-testid="button-retry-activity"><RotateCcw className="w-4 h-4 mr-2" /> Reintentar</Button>
            )}
          </div>
        )}
        {feedback?.explanation && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs font-medium mb-1">Ensenanza:</p><p className="text-xs text-muted-foreground">{feedback.explanation}</p></div>}
      </CardContent>
    </Card>
  );
}

function ParearActivity({ activity, parsed, answered, setAnswered, feedback, completeMutation, actLabel }: any) {
  const pairs: [string, string][] = parsed.pairs || [];
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const shuffledRight = useState(() => pairs.map((_: any, i: number) => i).sort(() => Math.random() - 0.5))[0];

  const handleMatch = (rightIdx: number) => {
    if (selectedLeft === null || answered) return;
    const newMatches = { ...matches, [selectedLeft]: rightIdx };
    setMatches(newMatches);
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    const isCorrect = pairs.every((_: any, i: number) => matches[i] === i);
    completeMutation.mutate({ userAnswer: JSON.stringify(matches), isCorrect });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <Badge variant="outline" className="w-fit mb-2 bg-violet-500/10 text-violet-600 border-violet-500/20">{actLabel}</Badge>
        <CardTitle className="text-lg">{activity.title}</CardTitle>
        <CardDescription>{activity.instruction}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Concepto</p>
            {pairs.map((pair: [string, string], i: number) => (
              <Button
                key={i}
                variant={selectedLeft === i ? "default" : matches[i] !== undefined ? "secondary" : "outline"}
                className="w-full h-auto py-2 text-xs text-left justify-start whitespace-normal"
                onClick={() => !answered && setSelectedLeft(i)}
                disabled={answered || matches[i] !== undefined}
                data-testid={`button-left-${i}`}
              >
                {pair[0]}
                {matches[i] !== undefined && <Link2 className="w-3 h-3 ml-auto shrink-0" />}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Definicion</p>
            {shuffledRight.map((origIdx: number) => {
              const isMatched = Object.values(matches).includes(origIdx);
              return (
                <Button
                  key={origIdx}
                  variant={isMatched ? "secondary" : "outline"}
                  className="w-full h-auto py-2 text-xs text-left justify-start whitespace-normal"
                  onClick={() => handleMatch(origIdx)}
                  disabled={answered || isMatched || selectedLeft === null}
                  data-testid={`button-right-${origIdx}`}
                >
                  {pairs[origIdx][1]}
                </Button>
              );
            })}
          </div>
        </div>
        {activity.bibleReference && <p className="text-xs text-muted-foreground italic">{activity.bibleReference}</p>}
        {!answered ? (
          <Button onClick={handleSubmit} disabled={completeMutation.isPending || Object.keys(matches).length < pairs.length} data-testid="button-submit-pairs">
            {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Verificar Parejas
          </Button>
        ) : (
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${feedback?.correct ? "text-green-600" : "text-orange-500"}`}>
              {feedback?.correct ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{feedback?.correct ? "Todas las parejas correctas" : "Algunas parejas incorrectas - revisa las conexiones"}</span>
            </div>
            {feedback?.correct === false && (
              <Button variant="outline" onClick={() => { setAnswered(false); setMatches({}); setSelectedLeft(null); }} data-testid="button-retry-activity"><RotateCcw className="w-4 h-4 mr-2" /> Reintentar</Button>
            )}
          </div>
        )}
        {feedback?.explanation && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs font-medium mb-1">Ensenanza:</p><p className="text-xs text-muted-foreground">{feedback.explanation}</p></div>}
      </CardContent>
    </Card>
  );
}

function OpcionMultipleStoryActivity({ activity, parsed, answered, setAnswered, feedback, completeMutation, actLabel }: any) {
  const [selected, setSelected] = useState<string | null>(activity.completed ? activity.userAnswer : null);
  const [localFeedback, setLocalFeedback] = useState(feedback);
  const [localAnswered, setLocalAnswered] = useState(answered);

  const handleSelect = (opt: string) => {
    if (localAnswered) return;
    setSelected(opt);
    const isCorrect = opt === activity.correctAnswer;
    completeMutation.mutate({ userAnswer: opt, isCorrect }, {
      onSuccess: (data: any) => {
        setLocalAnswered(true);
        setLocalFeedback({ correct: data.isCorrect, explanation: data.explanation, correctAnswer: data.correctAnswer });
      }
    });
  };

  const handleRetry = () => {
    setSelected(null);
    setLocalAnswered(false);
    setLocalFeedback(null);
    setAnswered(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <Badge variant="outline" className="w-fit mb-2 bg-green-500/10 text-green-600 border-green-500/20">{actLabel}</Badge>
        <CardTitle className="text-lg">{activity.title}</CardTitle>
        <CardDescription>{activity.instruction}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium">{parsed.question}</p>
        <div className="grid gap-2">
          {parsed.options?.map((opt: string, i: number) => (
            <Button key={i} variant={selected === opt ? (localFeedback?.correct ? "default" : "destructive") : "outline"} className="h-auto py-3 text-left justify-start text-sm leading-normal whitespace-normal" onClick={() => handleSelect(opt)} disabled={localAnswered || completeMutation.isPending} data-testid={`button-story-answer-${i}`}>
              <span className="font-bold mr-2 shrink-0">{String.fromCharCode(65 + i)}.</span>{opt}
            </Button>
          ))}
        </div>
        {activity.bibleReference && <p className="text-xs text-muted-foreground italic">{activity.bibleReference}</p>}
        {localAnswered && localFeedback?.correct === false && (
          <div className="space-y-2">
            <div className="bg-orange-500/10 rounded-md p-3"><p className="text-xs font-medium text-orange-600">Respuesta incorrecta. La correcta es: {localFeedback.correctAnswer}</p></div>
            <Button variant="outline" onClick={handleRetry} data-testid="button-retry-activity"><RotateCcw className="w-4 h-4 mr-2" /> Reintentar</Button>
          </div>
        )}
        {localAnswered && localFeedback?.correct && <div className="flex items-center gap-2 text-green-600"><CheckCircle className="w-5 h-5" /><span className="text-sm font-medium">Correcto</span></div>}
        {localFeedback?.explanation && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs font-medium mb-1">Ensenanza:</p><p className="text-xs text-muted-foreground">{localFeedback.explanation}</p></div>}
      </CardContent>
    </Card>
  );
}

function VerdaderoFalsoStoryActivity({ activity, parsed, answered, setAnswered, feedback, completeMutation, actLabel }: any) {
  const [selected, setSelected] = useState<string | null>(activity.completed ? activity.userAnswer : null);
  const [localFeedback, setLocalFeedback] = useState(feedback);
  const [localAnswered, setLocalAnswered] = useState(answered);

  const handleSelect = (opt: string) => {
    if (localAnswered) return;
    setSelected(opt);
    const isCorrect = opt === activity.correctAnswer;
    completeMutation.mutate({ userAnswer: opt, isCorrect }, {
      onSuccess: (data: any) => {
        setLocalAnswered(true);
        setLocalFeedback({ correct: data.isCorrect, explanation: data.explanation, correctAnswer: data.correctAnswer });
      }
    });
  };

  const handleRetry = () => {
    setSelected(null);
    setLocalAnswered(false);
    setLocalFeedback(null);
    setAnswered(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <Badge variant="outline" className="w-fit mb-2 bg-cyan-500/10 text-cyan-600 border-cyan-500/20">{actLabel}</Badge>
        <CardTitle className="text-lg">{activity.title}</CardTitle>
        <CardDescription>{activity.instruction}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-md p-4"><p className="text-sm font-medium">{parsed.statement}</p></div>
        <div className="grid grid-cols-2 gap-3">
          {["Verdadero", "Falso"].map((opt) => (
            <Button key={opt} variant={selected === opt ? (localFeedback?.correct ? "default" : "destructive") : "outline"} className="h-auto py-4 text-base" onClick={() => handleSelect(opt)} disabled={localAnswered || completeMutation.isPending} data-testid={`button-story-${opt.toLowerCase()}`}>{opt}</Button>
          ))}
        </div>
        {activity.bibleReference && <p className="text-xs text-muted-foreground italic">{activity.bibleReference}</p>}
        {localAnswered && localFeedback?.correct === false && (
          <div className="space-y-2">
            <div className="bg-orange-500/10 rounded-md p-3"><p className="text-xs font-medium text-orange-600">Respuesta incorrecta. La correcta es: {localFeedback.correctAnswer}</p></div>
            <Button variant="outline" onClick={handleRetry} data-testid="button-retry-activity"><RotateCcw className="w-4 h-4 mr-2" /> Reintentar</Button>
          </div>
        )}
        {localAnswered && localFeedback?.correct && <div className="flex items-center gap-2 text-green-600"><CheckCircle className="w-5 h-5" /><span className="text-sm font-medium">Correcto</span></div>}
        {localFeedback?.explanation && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs font-medium mb-1">Ensenanza:</p><p className="text-xs text-muted-foreground">{localFeedback.explanation}</p></div>}
      </CardContent>
    </Card>
  );
}

function StoryMode({ onBack }: { onBack: () => void }) {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [currentActivityIdx, setCurrentActivityIdx] = useState(0);

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<StoryChapter[]>({ queryKey: ["/api/story/chapters"] });
  const { data: chapterData, isLoading: chapterLoading } = useQuery<{ chapter: StoryChapter; activities: StoryActivity[] }>({
    queryKey: ["/api/story/chapters", selectedChapter],
    enabled: selectedChapter !== null,
  });

  if (selectedChapter !== null && chapterData) {
    const activities = chapterData.activities;
    const current = activities[currentActivityIdx];
    const completedCount = activities.filter(a => a.completed).length;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => setSelectedChapter(null)} data-testid="button-back-chapters">
            <ArrowLeft className="w-4 h-4 mr-2" /> Capitulos
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{chapterData.chapter.category}</Badge>
            <Badge variant="secondary">{completedCount}/{activities.length} completadas</Badge>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-1">Cap. {chapterData.chapter.chapterNumber}: {chapterData.chapter.title}</h2>
          <p className="text-sm text-muted-foreground">{chapterData.chapter.description}</p>
          <Progress value={(completedCount / Math.max(activities.length, 1)) * 100} className="h-2 mt-3" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {activities.map((act, idx) => (
            <Button
              key={act.id}
              size="sm"
              variant={idx === currentActivityIdx ? "default" : act.completed ? "secondary" : "outline"}
              onClick={() => setCurrentActivityIdx(idx)}
              data-testid={`button-activity-nav-${idx}`}
            >
              {act.completed ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
              {idx + 1}
            </Button>
          ))}
        </div>

        {current && (
          <ActivityRenderer
            key={current.id}
            activity={current}
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/story/chapters", selectedChapter] });
            }}
          />
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" disabled={currentActivityIdx === 0} onClick={() => setCurrentActivityIdx(currentActivityIdx - 1)} data-testid="button-prev-activity">
            <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
          </Button>
          <Button variant="outline" disabled={currentActivityIdx >= activities.length - 1} onClick={() => setCurrentActivityIdx(currentActivityIdx + 1)} data-testid="button-next-activity">
            Siguiente <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack} data-testid="button-back-modes">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" /> Modo Historia
        </h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <BookOpen className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold">Viaje por la Biblia</h3>
            <p className="text-sm text-muted-foreground">Explora los capitulos de la historia biblica sin limites. Aprende a tu ritmo con actividades variadas.</p>
          </div>
        </CardContent>
      </Card>

      {chaptersLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chapters.map((ch) => {
            const totalActivities = 4;
            const progress = ch.completedActivities > 0 ? (ch.completedActivities / totalActivities) * 100 : 0;
            return (
              <Card
                key={ch.id}
                className="hover-elevate cursor-pointer transition-all"
                onClick={() => { setSelectedChapter(ch.id); setCurrentActivityIdx(0); }}
                data-testid={`card-chapter-${ch.chapterNumber}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline">{ch.category}</Badge>
                    {ch.bibleBook && <Badge variant="secondary">{ch.bibleBook}</Badge>}
                  </div>
                  <CardTitle className="text-base mt-2">
                    Cap. {ch.chapterNumber}: {ch.title}
                  </CardTitle>
                  <CardDescription className="text-xs">{ch.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground">{ch.completedActivities} hechas</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function JuegoPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameMode, setGameMode] = useState<"select" | "competitivo" | "historia" | "juegos_mesa">("select");
  const [gameState, setGameState] = useState<"menu" | "playing" | "result">("menu");
  const [currentDifficulty, setCurrentDifficulty] = useState("facil");
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [answeredIds, setAnsweredIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("jugar");

  const { data: profile, isLoading: profileLoading } = useQuery<GameProfile>({ queryKey: ["/api/game/profile"], enabled: !!user });

  const fetchQuestion = useMutation({
    mutationFn: async (difficulty: string) => { const exclude = answeredIds.slice(-20).join(","); const res = await apiRequest("GET", `/api/game/question?difficulty=${difficulty}&exclude=${exclude}`); return res.json() as Promise<GameQuestion>; },
    onSuccess: (q) => { setCurrentQuestion(q); setGameState("playing"); },
    onError: () => { toast({ title: "Sin preguntas", description: "No hay mas preguntas disponibles para esta dificultad.", variant: "destructive" }); },
  });

  const submitAnswer = useMutation({
    mutationFn: async ({ questionId, selectedAnswer }: { questionId: number; selectedAnswer: string }) => { const res = await apiRequest("POST", "/api/game/answer", { questionId, selectedAnswer }); return res.json() as Promise<AnswerResult>; },
    onSuccess: (result) => { setLastResult(result); setGameState("result"); if (currentQuestion) setAnsweredIds((prev) => [...prev, currentQuestion.id]); queryClient.invalidateQueries({ queryKey: ["/api/game/profile"] }); queryClient.invalidateQueries({ queryKey: ["/api/game/leaderboard"] }); queryClient.invalidateQueries({ queryKey: ["/api/game/missions"] }); },
    onError: (err: any) => { toast({ title: "Error", description: err?.message || "No se pudo enviar respuesta", variant: "destructive" }); },
  });

  const startGame = useCallback((difficulty: string) => { setCurrentDifficulty(difficulty); fetchQuestion.mutate(difficulty); }, []);
  const handleAnswer = useCallback((answer: string) => { if (!currentQuestion) return; submitAnswer.mutate({ questionId: currentQuestion.id, selectedAnswer: answer }); }, [currentQuestion]);
  const handleNext = useCallback(() => { fetchQuestion.mutate(currentDifficulty); }, [currentDifficulty]);

  if (!user) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Flame className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">El Guardian de la Llama</h1>
          <p className="text-muted-foreground mb-6">Inicia sesion para jugar y mantener la llama viva en el altar.</p>
          <Link href="/login"><Button data-testid="button-login-to-play">Iniciar Sesion</Button></Link>
        </div>
      </Layout>
    );
  }

  if (profileLoading) {
    return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  const p = profile!;
  const levelInfo = getLevelProgress(p.totalPoints);
  const flameStage = getFlameStage(p.level);

  if (gameMode === "select") {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <FlameAnimation level={p.level} />
            <h1 className="text-2xl font-bold mt-4 flex items-center justify-center gap-2" data-testid="text-game-title">
              <Flame className={`w-7 h-7 ${flameStage.color}`} /> El Guardian de la Llama
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Selecciona un modo de juego</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="hover-elevate cursor-pointer" onClick={() => setGameMode("competitivo")} data-testid="card-mode-competitivo">
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 w-16 h-16 rounded-md bg-red-500/10 flex items-center justify-center">
                  <Swords className="w-8 h-8 text-red-500" />
                </div>
                <CardTitle>Modo Competitivo</CardTitle>
                <CardDescription>Compite con otros miembros por el primer lugar en la clasificacion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Sistema de energia (15 max)</div>
                  <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Clasificacion global</div>
                  <div className="flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> Puntos y niveles</div>
                  <div className="flex items-center gap-2"><Gift className="w-4 h-4 text-green-500" /> Misiones con recompensas</div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Nivel {p.level}</span>
                  <span>{p.totalPoints} pts</span>
                  <EnergyBar energy={p.energy} maxEnergy={p.maxEnergy} />
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer" onClick={() => setGameMode("historia")} data-testid="card-mode-historia">
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 w-16 h-16 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-blue-500" />
                </div>
                <CardTitle>Modo Historia</CardTitle>
                <CardDescription>Recorre la Biblia a tu ritmo con actividades variadas y sin limites</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" /> Sin limites de energia</div>
                  <div className="flex items-center gap-2"><Target className="w-4 h-4 text-indigo-500" /> Capitulos tematicos</div>
                  <div className="flex items-center gap-2"><GripVertical className="w-4 h-4 text-purple-500" /> Ordenar, parear, completar</div>
                  <div className="flex items-center gap-2"><Link2 className="w-4 h-4 text-emerald-500" /> Comparar pasajes y reflexionar</div>
                </div>
                <div className="mt-4 text-center">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Estudio libre - sin puntos competitivos</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer" onClick={() => setGameMode("juegos_mesa")} data-testid="card-mode-juegos-mesa">
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 w-16 h-16 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle>Juegos de Mesa</CardTitle>
                <CardDescription>Juega online con otros miembros o en modo local</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Target className="w-4 h-4 text-emerald-500" /> Ajedrez, Damas, Domino y mas</div>
                  <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Registro de victorias y derrotas</div>
                  <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" /> Salas multijugador con codigo</div>
                  <div className="flex items-center gap-2"><Star className="w-4 h-4 text-purple-500" /> 7 juegos clasicos disponibles</div>
                </div>
                <div className="mt-4 text-center">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Multijugador - compite con miembros</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (gameMode === "historia") {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <StoryMode onBack={() => setGameMode("select")} />
        </div>
      </Layout>
    );
  }

  if (gameMode === "juegos_mesa") {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <BoardGamesHub onBack={() => setGameMode("select")} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { setGameMode("select"); setGameState("menu"); }} data-testid="button-back-mode-select">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-competitive-title">
                <Swords className="w-6 h-6 text-red-500" /> Modo Competitivo
              </h1>
              <p className="text-muted-foreground text-sm">Compite y gana puntos</p>
            </div>
          </div>
          <EnergyBar energy={p.energy} maxEnergy={p.maxEnergy} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-3 mb-4" data-testid="tabs-game">
                <TabsTrigger value="jugar">Jugar</TabsTrigger>
                <TabsTrigger value="clasificacion">Clasificacion</TabsTrigger>
                <TabsTrigger value="misiones">Misiones</TabsTrigger>
              </TabsList>

              <TabsContent value="jugar">
                {gameState === "menu" && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="text-center">
                        <FlameAnimation level={p.level} />
                        <CardTitle className="mt-4">Nivel {p.level}</CardTitle>
                        <CardDescription>
                          {p.totalPoints} puntos totales
                          {p.streak > 0 && ` | Racha: ${p.streak}`}
                          {p.bestStreak > 0 && ` | Mejor racha: ${p.bestStreak}`}
                        </CardDescription>
                        <div className="mt-3 max-w-xs mx-auto">
                          <Progress value={levelInfo.progress} className="h-2" />
                          <p className="text-[10px] text-muted-foreground mt-1">{p.totalPoints - levelInfo.currentThreshold} / {levelInfo.nextThreshold - levelInfo.currentThreshold} para nivel {levelInfo.currentLevel + 1}</p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-center">
                          <div className="bg-muted/50 rounded-md p-3"><p className="text-2xl font-bold">{p.questionsAnswered}</p><p className="text-xs text-muted-foreground">Respondidas</p></div>
                          <div className="bg-muted/50 rounded-md p-3"><p className="text-2xl font-bold">{p.questionsAnswered > 0 ? Math.round((p.correctAnswers / p.questionsAnswered) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Precision</p></div>
                        </div>
                      </CardContent>
                    </Card>
                    <div>
                      <h3 className="font-semibold mb-3">Selecciona la dificultad:</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(GAME_DIFFICULTIES).map(([key, label]) => {
                          const isLocked = (key === "medio" && p.level < 3) || (key === "dificil" && p.level < 5) || (key === "experto" && p.level < 8);
                          const points = key === "facil" ? 10 : key === "medio" ? 20 : key === "dificil" ? 35 : 50;
                          return (
                            <Button key={key} variant="outline" className={`h-auto py-4 flex flex-col gap-1 ${getDifficultyColor(key)}`} onClick={() => startGame(key)} disabled={isLocked || p.energy <= 0 || fetchQuestion.isPending} data-testid={`button-difficulty-${key}`}>
                              {isLocked ? <Lock className="w-5 h-5" /> : <Star className="w-5 h-5" />}
                              <span className="font-bold">{label}</span>
                              <span className="text-[10px]">{isLocked ? `Nivel ${key === "medio" ? 3 : key === "dificil" ? 5 : 8}` : `${points} pts`}</span>
                            </Button>
                          );
                        })}
                      </div>
                      {p.energy <= 0 && <p className="text-sm text-destructive mt-3 text-center">Sin energia. Completa misiones o espera a que se recargue (1 cada 10 min).</p>}
                    </div>
                  </div>
                )}
                {gameState === "playing" && currentQuestion && <QuestionCard question={currentQuestion} onAnswer={handleAnswer} isSubmitting={submitAnswer.isPending} />}
                {gameState === "result" && lastResult && <ResultCard result={lastResult} onNext={lastResult.profile.energy > 0 ? handleNext : () => setGameState("menu")} />}
                {fetchQuestion.isPending && gameState !== "playing" && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
              </TabsContent>
              <TabsContent value="clasificacion"><Card><CardContent className="pt-6"><LeaderboardPanel /></CardContent></Card></TabsContent>
              <TabsContent value="misiones"><Card><CardContent className="pt-6"><MissionsPanel /></CardContent></Card></TabsContent>
            </Tabs>
          </div>
          <div className="space-y-4">
            <Card><CardContent className="pt-6"><LevelMap currentLevel={p.level} /></CardContent></Card>
            <Card><CardContent className="pt-6"><LeaderboardPanel /></CardContent></Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
