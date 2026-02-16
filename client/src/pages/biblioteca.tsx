import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Highlighter, StickyNote, BookMarked, Users, FileText,
  Plus, Trash2, Heart, Search, ChevronLeft, ChevronRight, MessageCircle,
  Upload, Download, Check, Send, Library, Loader2,
} from "lucide-react";
import {
  useBibleHighlights, useCreateBibleHighlight, useDeleteBibleHighlight,
  useBibleNotes, useCreateBibleNote, useDeleteBibleNote,
  useReadingPlans, useReadingPlan, useCreateReadingPlan, useDeleteReadingPlan,
  useAddReadingPlanItem, useToggleReadingPlanItem,
  useReadingClubPosts, useCreateReadingClubPost, useDeleteReadingClubPost,
  useReadingClubComments, useCreateReadingClubComment,
  useReadingClubLikedPosts, useToggleReadingClubPostLike,
  useLibraryResources, useCreateLibraryResource, useDeleteLibraryResource, useToggleLibraryResourceLike,
  useWhatsappLink,
} from "@/hooks/use-users";
import { SiWhatsapp } from "react-icons/si";
import { HIGHLIGHT_COLORS, RESOURCE_CATEGORIES, BIBLE_BOOKS } from "@shared/schema";

const BIBLE_BOOK_SLUG_MAP: Record<string, string> = {
  "Genesis": "gn", "Exodo": "ex", "Levitico": "lv", "Numeros": "nm", "Deuteronomio": "dt",
  "Josue": "js", "Jueces": "jue", "Rut": "rt", "1 Samuel": "1s", "2 Samuel": "2s",
  "1 Reyes": "1r", "2 Reyes": "2r", "1 Cronicas": "1cr", "2 Cronicas": "2cr",
  "Esdras": "esd", "Nehemias": "ne", "Ester": "est", "Job": "job", "Salmos": "sal",
  "Proverbios": "pr", "Eclesiastes": "ec", "Cantares": "cnt", "Isaias": "is", "Jeremias": "jr",
  "Lamentaciones": "lm", "Ezequiel": "ez", "Daniel": "dn", "Oseas": "os", "Joel": "jl",
  "Amos": "am", "Abdias": "abd", "Jonas": "jon", "Miqueas": "mi", "Nahum": "nah",
  "Habacuc": "hab", "Sofonias": "sof", "Hageo": "hag", "Zacarias": "zac", "Malaquias": "mal",
  "Mateo": "mt", "Marcos": "mr", "Lucas": "lc", "Juan": "jn", "Hechos": "hch",
  "Romanos": "ro", "1 Corintios": "1co", "2 Corintios": "2co", "Galatas": "ga", "Efesios": "ef",
  "Filipenses": "fil", "Colosenses": "col", "1 Tesalonicenses": "1ts", "2 Tesalonicenses": "2ts",
  "1 Timoteo": "1ti", "2 Timoteo": "2ti", "Tito": "tit", "Filemon": "flm", "Hebreos": "he",
  "Santiago": "stg", "1 Pedro": "1p", "2 Pedro": "2p", "1 Juan": "1jn", "2 Juan": "2jn",
  "3 Juan": "3jn", "Judas": "jud", "Apocalipsis": "ap",
};

const BOOK_CHAPTERS: Record<string, number> = {
  "Genesis": 50, "Exodo": 40, "Levitico": 27, "Numeros": 36, "Deuteronomio": 34,
  "Josue": 24, "Jueces": 21, "Rut": 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Reyes": 22, "2 Reyes": 25, "1 Cronicas": 29, "2 Cronicas": 36,
  "Esdras": 10, "Nehemias": 13, "Ester": 10, "Job": 42, "Salmos": 150,
  "Proverbios": 31, "Eclesiastes": 12, "Cantares": 8, "Isaias": 66, "Jeremias": 52,
  "Lamentaciones": 5, "Ezequiel": 48, "Daniel": 12, "Oseas": 14, "Joel": 3,
  "Amos": 9, "Abdias": 1, "Jonas": 4, "Miqueas": 7, "Nahum": 3,
  "Habacuc": 3, "Sofonias": 3, "Hageo": 2, "Zacarias": 14, "Malaquias": 4,
  "Mateo": 28, "Marcos": 16, "Lucas": 24, "Juan": 21, "Hechos": 28,
  "Romanos": 16, "1 Corintios": 16, "2 Corintios": 13, "Galatas": 6, "Efesios": 6,
  "Filipenses": 4, "Colosenses": 4, "1 Tesalonicenses": 5, "2 Tesalonicenses": 3,
  "1 Timoteo": 6, "2 Timoteo": 4, "Tito": 3, "Filemon": 1, "Hebreos": 13,
  "Santiago": 5, "1 Pedro": 5, "2 Pedro": 3, "1 Juan": 5, "2 Juan": 1,
  "3 Juan": 1, "Judas": 1, "Apocalipsis": 22,
};

interface BibleVerse {
  verse: number;
  text: string;
}

const DAILY_VERSES = [
  { ref: "Josue 1:9", text: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehova tu Dios estara contigo en dondequiera que vayas." },
  { ref: "Salmos 23:1", text: "Jehova es mi pastor; nada me faltara." },
  { ref: "Proverbios 3:5-6", text: "Fiate de Jehova de todo tu corazon, y no te apoyes en tu propia prudencia. Reconocelo en todos tus caminos, y el enderezara tus veredas." },
  { ref: "Isaias 41:10", text: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudare, siempre te sustentare con la diestra de mi justicia." },
  { ref: "Jeremias 29:11", text: "Porque yo se los pensamientos que tengo acerca de vosotros, dice Jehova, pensamientos de paz, y no de mal, para daros el fin que esperais." },
  { ref: "Filipenses 4:13", text: "Todo lo puedo en Cristo que me fortalece." },
  { ref: "Romanos 8:28", text: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su proposito son llamados." },
  { ref: "Salmos 119:105", text: "Lampara es a mis pies tu palabra, y lumbrera a mi camino." },
  { ref: "Mateo 11:28", text: "Venid a mi todos los que estais trabajados y cargados, y yo os hare descansar." },
  { ref: "2 Timoteo 1:7", text: "Porque no nos ha dado Dios espiritu de cobardía, sino de poder, de amor y de dominio propio." },
  { ref: "Salmos 46:1", text: "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones." },
  { ref: "Hebreos 11:1", text: "Es, pues, la fe la certeza de lo que se espera, la conviccion de lo que no se ve." },
  { ref: "Juan 3:16", text: "Porque de tal manera amo Dios al mundo, que ha dado a su Hijo unigenito, para que todo aquel que en el cree, no se pierda, mas tenga vida eterna." },
  { ref: "Salmos 37:4", text: "Deléitate asimismo en Jehova, y el te concedera las peticiones de tu corazon." },
  { ref: "Isaias 40:31", text: "Pero los que esperan a Jehova tendran nuevas fuerzas; levantaran alas como las aguilas; correran, y no se cansaran; caminaran, y no se fatigaran." },
  { ref: "Romanos 12:2", text: "No os conformeis a este siglo, sino transformaos por medio de la renovacion de vuestro entendimiento." },
  { ref: "Salmos 91:1-2", text: "El que habita al abrigo del Altisimo morara bajo la sombra del Omnipotente. Dire yo a Jehova: Esperanza mia, y castillo mio; mi Dios, en quien confiare." },
  { ref: "Galatas 5:22-23", text: "Mas el fruto del Espiritu es amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza." },
  { ref: "1 Corintios 13:4-5", text: "El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece." },
  { ref: "Efesios 2:8-9", text: "Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se glorie." },
  { ref: "Salmos 34:8", text: "Gustad, y ved que es bueno Jehova; dichoso el hombre que confia en el." },
  { ref: "Miqueas 6:8", text: "Oh hombre, el te ha declarado lo que es bueno, y que pide Jehova de ti: solamente hacer justicia, y amar misericordia, y humillarte ante tu Dios." },
  { ref: "Santiago 1:5", text: "Y si alguno de vosotros tiene falta de sabiduria, pidala a Dios, el cual da a todos abundantemente y sin reproche, y le sera dada." },
  { ref: "Deuteronomio 31:6", text: "Esforzaos y cobrad animo; no temais, ni tengais miedo de ellos, porque Jehova tu Dios es el que va contigo; no te dejara, ni te desamparara." },
  { ref: "Salmos 27:1", text: "Jehova es mi luz y mi salvacion; de quien temere? Jehova es la fortaleza de mi vida; de quien he de atemorizarme?" },
  { ref: "1 Pedro 5:7", text: "Echando toda vuestra ansiedad sobre el, porque el tiene cuidado de vosotros." },
  { ref: "Apocalipsis 21:4", text: "Enjugara Dios toda lagrima de los ojos de ellos; y ya no habra muerte, ni habra mas llanto, ni clamor, ni dolor." },
  { ref: "Salmos 139:14", text: "Te alabare; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien." },
  { ref: "Proverbios 16:3", text: "Encomienda a Jehova tus obras, y tus pensamientos seran afirmados." },
  { ref: "Habacuc 3:19", text: "Jehova el Senor es mi fortaleza, el cual hace mis pies como de ciervas, y en mis alturas me hace andar." },
  { ref: "Salmos 121:1-2", text: "Alzare mis ojos a los montes; de donde vendra mi socorro? Mi socorro viene de Jehova, que hizo los cielos y la tierra." },
];

function VerseOfTheDay() {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">Versiculo del Dia</p>
            <p className="text-sm italic leading-relaxed">&ldquo;{verse.text}&rdquo;</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{verse.ref}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BibleTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState("Genesis");
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [highlightColor, setHighlightColor] = useState("#FFA500");
  const [noteText, setNoteText] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showBookSelector, setShowBookSelector] = useState(false);

  const maxChapters = BOOK_CHAPTERS[selectedBook] || 1;
  const { data: highlights = [] } = useBibleHighlights(selectedBook, chapter);
  const { data: notes = [] } = useBibleNotes(selectedBook, chapter);
  const createHighlight = useCreateBibleHighlight();
  const deleteHighlight = useDeleteBibleHighlight();
  const createNote = useCreateBibleNote();
  const deleteNote = useDeleteBibleNote();

  useEffect(() => {
    const fetchVerses = async () => {
      setLoading(true);
      setError(null);
      try {
        const slug = BIBLE_BOOK_SLUG_MAP[selectedBook] || selectedBook.toLowerCase();
        const res = await fetch(`https://bible-api.deno.dev/api/read/rv1960/${slug}/${chapter}`);
        if (!res.ok) throw new Error("Error al cargar texto biblico");
        const data = await res.json();
        if (data.vers && Array.isArray(data.vers)) {
          setVerses(data.vers.map((v: any) => ({
            verse: v.number || v.verse,
            text: v.verse || v.text || "",
          })));
        } else if (Array.isArray(data)) {
          setVerses(data.map((v: any) => ({
            verse: v.number || v.verse || 0,
            text: v.text || v.verse || "",
          })));
        } else {
          setVerses([]);
        }
      } catch (err: any) {
        setError("No se pudo cargar el texto. Intente de nuevo.");
        setVerses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVerses();
  }, [selectedBook, chapter]);

  const getVerseHighlight = (verse: number) => {
    return highlights.find((h: any) => verse >= h.verseStart && verse <= h.verseEnd);
  };

  const getVerseNotes = (verse: number) => {
    return notes.filter((n: any) => n.verse === verse);
  };

  const handleHighlight = (verse: number) => {
    if (!user?.isActive) return;
    const existing = getVerseHighlight(verse);
    if (existing) {
      deleteHighlight.mutate(existing.id);
    } else {
      createHighlight.mutate({
        book: selectedBook, chapter, verseStart: verse, verseEnd: verse, color: highlightColor,
      });
    }
  };

  const handleAddNote = () => {
    if (!selectedVerse || !noteText.trim() || !user?.isActive) return;
    createNote.mutate({
      book: selectedBook, chapter, verse: selectedVerse, content: noteText.trim(),
    });
    setNoteText("");
    setShowNoteForm(false);
    setSelectedVerse(null);
  };

  const goToPrevChapter = () => {
    if (chapter > 1) { setChapter(chapter - 1); setSelectedVerse(null); }
  };
  const goToNextChapter = () => {
    if (chapter < maxChapters) { setChapter(chapter + 1); setSelectedVerse(null); }
  };

  return (
    <div className="space-y-4">
      <VerseOfTheDay />
      <div className="flex items-center gap-2 flex-wrap">
        <Dialog open={showBookSelector} onOpenChange={setShowBookSelector}>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-select-book">
              <BookOpen className="w-4 h-4 mr-2" />
              {selectedBook}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Seleccionar Libro</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-1">
              {BIBLE_BOOKS.map((book) => (
                <Button
                  key={book}
                  variant={selectedBook === book ? "default" : "ghost"}
                  size="sm"
                  className="justify-start"
                  onClick={() => { setSelectedBook(book); setChapter(1); setShowBookSelector(false); setSelectedVerse(null); }}
                  data-testid={`button-book-${book}`}
                >
                  {book}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPrevChapter} disabled={chapter <= 1} data-testid="button-prev-chapter">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Select value={String(chapter)} onValueChange={(v) => { setChapter(parseInt(v)); setSelectedVerse(null); }}>
            <SelectTrigger className="w-20" data-testid="select-chapter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {Array.from({ length: maxChapters }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={goToNextChapter} disabled={chapter >= maxChapters} data-testid="button-next-chapter">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {user?.isActive && (
          <div className="flex items-center gap-1 ml-auto">
            {Object.entries(HIGHLIGHT_COLORS).map(([color, name]) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${highlightColor === color ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ backgroundColor: color }}
                onClick={() => setHighlightColor(color)}
                title={name}
                data-testid={`button-color-${name.toLowerCase()}`}
              />
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <h2 className="text-xl font-bold mb-4" data-testid="text-bible-heading">
            {selectedBook} {chapter}
          </h2>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : error ? (
            <p className="text-muted-foreground text-center py-8">{error}</p>
          ) : verses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No se encontro texto para este capitulo. Intente seleccionar otro libro o capitulo.
            </p>
          ) : (
            <div className="space-y-1 leading-relaxed text-base">
              {verses.map((v) => {
                const hl = getVerseHighlight(v.verse);
                const vNotes = getVerseNotes(v.verse);
                const isSelected = selectedVerse === v.verse;
                return (
                  <span
                    key={v.verse}
                    className={`inline cursor-pointer transition-colors rounded-sm px-0.5 ${isSelected ? "ring-2 ring-primary" : ""}`}
                    style={hl ? { backgroundColor: hl.color + "40" } : undefined}
                    onClick={() => {
                      setSelectedVerse(isSelected ? null : v.verse);
                      setShowNoteForm(false);
                    }}
                    data-testid={`verse-${v.verse}`}
                  >
                    <sup className="text-xs font-bold text-muted-foreground mr-0.5">{v.verse}</sup>
                    {v.text}{" "}
                    {vNotes.length > 0 && (
                      <StickyNote className="inline w-3 h-3 text-primary" />
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVerse !== null && user?.isActive && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-medium text-sm">
                {selectedBook} {chapter}:{selectedVerse}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleHighlight(selectedVerse)}
                  data-testid="button-toggle-highlight"
                >
                  <Highlighter className="w-4 h-4 mr-1" />
                  {getVerseHighlight(selectedVerse) ? "Quitar resaltado" : "Resaltar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNoteForm(!showNoteForm)}
                  data-testid="button-add-note"
                >
                  <StickyNote className="w-4 h-4 mr-1" />
                  Nota
                </Button>
              </div>
            </div>

            {showNoteForm && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Escribe tu nota..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  data-testid="input-note-text"
                />
                <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()} data-testid="button-save-note">
                  Guardar Nota
                </Button>
              </div>
            )}

            {getVerseNotes(selectedVerse).map((note: any) => (
              <div key={note.id} className="flex items-start justify-between gap-2 p-2 rounded-md bg-muted/50">
                <p className="text-sm">{note.content}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteNote.mutate(note.id)}
                  data-testid={`button-delete-note-${note.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReadingPlansTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewPublic, setViewPublic] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const [addBook, setAddBook] = useState("Genesis");
  const [addChapterStart, setAddChapterStart] = useState("1");
  const [addChapterEnd, setAddChapterEnd] = useState("1");
  type PlanItem = { id: number; book: string; chapter: number; isCompleted: boolean; sortOrder: number; completedAt: string | null };

  const { data: plans = [], isLoading } = useReadingPlans(viewPublic);
  const { data: selectedPlan } = useReadingPlan(selectedPlanId || 0);
  const createPlan = useCreateReadingPlan();
  const deletePlan = useDeleteReadingPlan();
  const addItem = useAddReadingPlanItem();
  const toggleItem = useToggleReadingPlanItem();

  const handleCreatePlan = () => {
    if (!newTitle.trim()) return;
    createPlan.mutate({ title: newTitle.trim(), description: newDesc.trim() || null, isPublic }, {
      onSuccess: (data: any) => {
        setNewTitle("");
        setNewDesc("");
        setIsPublic(false);
        setShowCreate(false);
        setSelectedPlanId(data.id);
      },
    });
  };

  const handleAddItem = () => {
    if (!selectedPlanId) return;
    const start = parseInt(addChapterStart) || 1;
    const end = parseInt(addChapterEnd) || start;
    for (let ch = start; ch <= end; ch++) {
      addItem.mutate({
        planId: selectedPlanId,
        data: {
          book: addBook,
          chapter: ch,
          sortOrder: (selectedPlan?.items?.length || 0) + ch - start,
        },
      });
    }
    toast({ title: "Lecturas agregadas" });
  };

  const completedCount = selectedPlan?.items?.filter((i: any) => i.isCompleted).length || 0;
  const totalItems = selectedPlan?.items?.length || 0;
  const progressPct = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  if (selectedPlanId && selectedPlan) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedPlanId(null)} data-testid="button-back-plans">
          <ChevronLeft className="w-4 h-4 mr-1" /> Volver a Planes
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{selectedPlan.title}</CardTitle>
            {selectedPlan.description && <CardDescription>{selectedPlan.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Progreso: {completedCount}/{totalItems}</span>
                <span className="text-sm font-medium">{progressPct}%</span>
              </div>
              <Progress value={progressPct} data-testid="progress-reading-plan" />
            </div>

            {selectedPlan.userId === user?.id && (
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={addBook} onValueChange={setAddBook}>
                  <SelectTrigger className="w-40" data-testid="select-plan-book">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {BIBLE_BOOKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input className="w-20" placeholder="Del" value={addChapterStart} onChange={(e) => setAddChapterStart(e.target.value)} data-testid="input-chapter-start" />
                <Input className="w-20" placeholder="Al" value={addChapterEnd} onChange={(e) => setAddChapterEnd(e.target.value)} data-testid="input-chapter-end" />
                <Button size="sm" onClick={handleAddItem} data-testid="button-add-reading">
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>
            )}

            <div className="space-y-1">
              {(selectedPlan.items || []).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-md hover-elevate"
                  data-testid={`reading-item-${item.id}`}
                >
                  {selectedPlan.userId === user?.id && (
                    <Checkbox
                      checked={item.isCompleted}
                      onCheckedChange={() => toggleItem.mutate({ id: item.id, planId: selectedPlanId! })}
                      data-testid={`checkbox-item-${item.id}`}
                    />
                  )}
                  <span className={`text-sm flex-1 ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                    {item.book} {item.chapter}
                  </span>
                  {item.isCompleted && <Check className="w-4 h-4 text-green-500" />}
                </div>
              ))}
              {totalItems === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Agrega capitulos a tu plan de lectura usando el formulario de arriba.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={!viewPublic ? "default" : "outline"}
            size="sm"
            onClick={() => setViewPublic(false)}
            data-testid="button-my-plans"
          >
            Mis Planes
          </Button>
          <Button
            variant={viewPublic ? "default" : "outline"}
            size="sm"
            onClick={() => setViewPublic(true)}
            data-testid="button-public-plans"
          >
            Planes Compartidos
          </Button>
        </div>
        {user?.isActive && (
          <Button size="sm" onClick={() => setShowCreate(true)} data-testid="button-create-plan">
            <Plus className="w-4 h-4 mr-1" /> Nuevo Plan
          </Button>
        )}
      </div>

      {showCreate && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Titulo del plan"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              data-testid="input-plan-title"
            />
            <Textarea
              placeholder="Descripcion (opcional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              data-testid="input-plan-description"
            />
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isPublic}
                onCheckedChange={(v) => setIsPublic(!!v)}
                data-testid="checkbox-plan-public"
              />
              <Label className="text-sm">Compartir con la comunidad</Label>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleCreatePlan} disabled={!newTitle.trim()} data-testid="button-save-plan">
                Crear Plan
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)} data-testid="button-cancel-plan">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookMarked className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {viewPublic ? "No hay planes compartidos aun." : "No tienes planes de lectura. Crea uno para comenzar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {plans.map((plan: any) => (
            <Card key={plan.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedPlanId(plan.id)} data-testid={`card-plan-${plan.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{plan.title}</h3>
                    {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                    {plan.user && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Por {plan.user.displayName || plan.user.username}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.isPublic && <Badge variant="secondary">Compartido</Badge>}
                    {plan.userId === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); deletePlan.mutate(plan.id); }}
                        data-testid={`button-delete-plan-${plan.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ReadingClubTab() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [refBook, setRefBook] = useState("");
  const [refChapter, setRefChapter] = useState("");
  const [refVerse, setRefVerse] = useState("");
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

  const { data: posts = [], isLoading } = useReadingClubPosts();
  const createPost = useCreateReadingClubPost();
  const { data: likedPosts = [] } = useReadingClubLikedPosts();
  const toggleLike = useToggleReadingClubPostLike();
  const { data: whatsappData } = useWhatsappLink();

  const handlePost = () => {
    if (!content.trim()) return;
    createPost.mutate({
      content: content.trim(),
      book: (refBook && refBook !== "none") ? refBook : "",
      chapter: refChapter ? parseInt(refChapter) : 0,
      verseStart: refVerse ? parseInt(refVerse) : null,
      verseEnd: null,
    }, {
      onSuccess: () => {
        setContent("");
        setRefBook("");
        setRefChapter("");
        setRefVerse("");
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* WhatsApp Group Link Banner */}
      {whatsappData?.link && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <SiWhatsapp className="h-6 w-6 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Grupo de WhatsApp del Club de Lectura</p>
                <p className="text-xs text-muted-foreground">Unete a nuestro grupo para compartir reflexiones y estar al dia con las lecturas.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-green-300 dark:border-green-700"
                onClick={() => window.open(whatsappData.link, "_blank")}
                data-testid="button-join-whatsapp"
              >
                <SiWhatsapp className="w-4 h-4 mr-1 text-green-500" /> Unirse al Grupo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.isActive && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Textarea
              placeholder="Comparte una reflexion biblica con la comunidad..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              data-testid="input-club-post"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={refBook} onValueChange={setRefBook}>
                <SelectTrigger className="w-40" data-testid="select-ref-book">
                  <SelectValue placeholder="Libro (opc.)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Sin referencia</SelectItem>
                  {BIBLE_BOOKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              {refBook && refBook !== "none" && (
                <>
                  <Input className="w-20" placeholder="Cap." value={refChapter} onChange={(e) => setRefChapter(e.target.value)} data-testid="input-ref-chapter" />
                  <Input className="w-20" placeholder="Vers." value={refVerse} onChange={(e) => setRefVerse(e.target.value)} data-testid="input-ref-verse" />
                </>
              )}
              <Button
                size="sm"
                className="ml-auto"
                onClick={handlePost}
                disabled={!content.trim() || createPost.isPending}
                data-testid="button-post-reflection"
              >
                <Send className="w-4 h-4 mr-1" /> Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No hay reflexiones aun. Se el primero en compartir.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post: any) => (
            <Card key={post.id} data-testid={`card-club-post-${post.id}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    {post.user.avatarUrl && <AvatarImage src={post.user.avatarUrl} />}
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(post.user.displayName || post.user.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{post.user.displayName || post.user.username}</span>
                      {post.user.cargo && <Badge variant="outline" className="text-[10px] py-0">{post.user.cargo}</Badge>}
                      {post.user.country && <span className="text-[10px] text-muted-foreground">{post.user.country}</span>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString("es")}
                      </span>
                    </div>
                    {post.book && (
                      <Badge variant="secondary" className="mt-1">
                        {post.book} {post.chapter ? `${post.chapter}` : ""}{post.verseStart ? `:${post.verseStart}` : ""}
                      </Badge>
                    )}
                    <p className="mt-2 text-sm whitespace-pre-wrap">{post.content}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike.mutate(post.id)}
                    disabled={toggleLike.isPending}
                    data-testid={`button-like-${post.id}`}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${likedPosts.includes(post.id) ? "fill-red-500 text-red-500" : ""}`} />
                    {post.likeCount || 0}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                    data-testid={`button-comments-${post.id}`}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.commentCount} comentario{post.commentCount !== 1 ? "s" : ""}
                  </Button>
                </div>

                {expandedPostId === post.id && <CommentsSection postId={post.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentsSection({ postId }: { postId: number }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const { data: comments = [], isLoading } = useReadingClubComments(postId);
  const createComment = useCreateReadingClubComment();

  const handleComment = () => {
    if (!text.trim()) return;
    createComment.mutate({ postId, content: text.trim() }, {
      onSuccess: () => setText(""),
    });
  };

  return (
    <div className="space-y-2 pl-4 border-l-2 border-muted">
      {isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : (
        comments.map((c: any) => (
          <div key={c.id} className="flex items-start gap-2" data-testid={`comment-${c.id}`}>
            <Avatar className="h-6 w-6">
              {c.user.avatarUrl && <AvatarImage src={c.user.avatarUrl} />}
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {(c.user.displayName || c.user.username).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium">{c.user.displayName || c.user.username}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("es")}</span>
              </div>
              <p className="text-sm">{c.content}</p>
            </div>
          </div>
        ))
      )}
      {user?.isActive && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Escribe un comentario..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            data-testid={`input-comment-${postId}`}
          />
          <Button size="icon" onClick={handleComment} disabled={!text.trim()} data-testid={`button-send-comment-${postId}`}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ResourcesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceCategory, setResourceCategory] = useState("general");
  const [fileUrl, setFileUrl] = useState("");
  const [uploadMode, setUploadMode] = useState<"enlace" | "archivo">("enlace");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: resources = [], isLoading } = useLibraryResources(category, searchTerm);
  const createResource = useCreateLibraryResource();
  const deleteResource = useDeleteLibraryResource();
  const toggleLike = useToggleLibraryResourceLike();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "El tamaño máximo es 20MB.", variant: "destructive" });
      return;
    }
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/library-file", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Error al subir archivo" }));
        throw new Error(err.message || "Error al subir archivo");
      }
      const data = await res.json();
      setFileUrl(data.url);
      setUploadedFileName(file.name);
      setUploadedFileSize(file.size);
      toast({ title: "Archivo subido", description: file.name });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleShare = () => {
    if (!title.trim() || !fileUrl.trim()) return;
    createResource.mutate({
      title: title.trim(),
      description: description.trim() || null,
      resourceType: uploadMode === "archivo" ? "documento" : "enlace",
      fileUrl: fileUrl.trim(),
      fileName: uploadMode === "archivo" ? uploadedFileName : null,
      fileSize: uploadMode === "archivo" ? uploadedFileSize : null,
      fileData: null,
      category: resourceCategory,
    }, {
      onSuccess: () => {
        setTitle("");
        setDescription("");
        setFileUrl("");
        setUploadedFileName("");
        setUploadedFileSize(null);
        setResourceCategory("general");
        setUploadMode("enlace");
        setShowUpload(false);
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-resources"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40" data-testid="select-resource-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(RESOURCE_CATEGORIES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {user?.isActive && (
          <Button size="sm" onClick={() => setShowUpload(!showUpload)} data-testid="button-share-resource">
            <Plus className="w-4 h-4 mr-1" /> Compartir Recurso
          </Button>
        )}
      </div>

      {showUpload && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Titulo del recurso"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-resource-title"
            />
            <Textarea
              placeholder="Descripcion (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-resource-description"
            />

            {/* Toggle between URL and file upload */}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={uploadMode === "enlace" ? "default" : "outline"}
                onClick={() => { setUploadMode("enlace"); setFileUrl(""); setUploadedFileName(""); setUploadedFileSize(null); }}
              >
                <FileText className="w-4 h-4 mr-1" /> Enlace / URL
              </Button>
              <Button
                type="button"
                size="sm"
                variant={uploadMode === "archivo" ? "default" : "outline"}
                onClick={() => { setUploadMode("archivo"); setFileUrl(""); }}
              >
                <Upload className="w-4 h-4 mr-1" /> Subir Archivo
              </Button>
            </div>

            {uploadMode === "enlace" ? (
              <Input
                placeholder="URL del recurso (enlace a PDF, video, etc.)"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                data-testid="input-resource-url"
              />
            ) : (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleFileUpload}
                />
                {uploadedFileName ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{uploadedFileName}</p>
                      {uploadedFileSize && <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFileSize)}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => { setFileUrl(""); setUploadedFileName(""); setUploadedFileSize(null); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-20 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Subiendo archivo...</>
                    ) : (
                      <><Upload className="w-5 h-5 mr-2" /> Seleccionar archivo (PDF, Word, Excel, PPT, max 20MB)</>
                    )}
                  </Button>
                )}
              </div>
            )}

            <Select value={resourceCategory} onValueChange={setResourceCategory}>
              <SelectTrigger data-testid="select-new-resource-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RESOURCE_CATEGORIES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleShare} disabled={!title.trim() || !fileUrl.trim() || createResource.isPending} data-testid="button-submit-resource">
                {createResource.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                Compartir
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowUpload(false)} data-testid="button-cancel-resource">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No se encontraron recursos. Se el primero en compartir material educativo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {resources.map((r: any) => (
            <Card key={r.id} data-testid={`card-resource-${r.id}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{r.title}</h3>
                    {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                  </div>
                  <Badge variant="secondary">
                    {RESOURCE_CATEGORIES[r.category as keyof typeof RESOURCE_CATEGORIES] || r.category}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    Por {r.user.displayName || r.user.username} - {new Date(r.createdAt).toLocaleDateString("es")}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike.mutate(r.id)}
                      data-testid={`button-like-${r.id}`}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${r.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                      {r.likeCount}
                    </Button>
                    {r.fileUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-resource-${r.id}`}>
                          <Download className="w-4 h-4 mr-1" /> {r.resourceType === "documento" ? "Descargar" : "Ver"}
                        </a>
                      </Button>
                    )}
                    {(user?.role === "admin" || r.userId === user?.id) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteResource.mutate(r.id)}
                        data-testid={`button-delete-resource-${r.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BibliotecaPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("biblia");

  if (!user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <Library className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Biblioteca</h1>
          <p className="text-muted-foreground mb-6">
            Inicia sesion para acceder a la Biblia de estudio, planes de lectura, club de lectura y recursos compartidos.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login">
              <Button variant="outline" data-testid="link-login-biblioteca">Iniciar Sesion</Button>
            </Link>
            <Link href="/registro">
              <Button data-testid="link-register-biblioteca">Unirse</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user.isActive) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <Library className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-2">Biblioteca</h1>
          <p className="text-muted-foreground">
            Tu cuenta esta pendiente de aprobacion. Una vez aprobada, podras acceder a todos los recursos de la biblioteca.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-biblioteca-title">
            <Library className="w-8 h-8 text-primary" />
            Biblioteca
          </h1>
          <p className="text-muted-foreground mt-1">
            Estudia la Biblia, crea planes de lectura, comparte reflexiones y recursos con la comunidad.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="biblia" data-testid="tab-biblia">
              <BookOpen className="w-4 h-4 mr-1 hidden sm:inline" /> Biblia
            </TabsTrigger>
            <TabsTrigger value="planes" data-testid="tab-planes">
              <BookMarked className="w-4 h-4 mr-1 hidden sm:inline" /> Planes
            </TabsTrigger>
            <TabsTrigger value="club" data-testid="tab-club">
              <Users className="w-4 h-4 mr-1 hidden sm:inline" /> Club
            </TabsTrigger>
            <TabsTrigger value="recursos" data-testid="tab-recursos">
              <FileText className="w-4 h-4 mr-1 hidden sm:inline" /> Recursos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="biblia" className="mt-4">
            <BibleTab />
          </TabsContent>
          <TabsContent value="planes" className="mt-4">
            <ReadingPlansTab />
          </TabsContent>
          <TabsContent value="club" className="mt-4">
            <ReadingClubTab />
          </TabsContent>
          <TabsContent value="recursos" className="mt-4">
            <ResourcesTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}