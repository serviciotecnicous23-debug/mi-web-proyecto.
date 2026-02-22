import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Video, Mic, FileText, Plus, Search, Play, BookOpen, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const SERMON_CATEGORIES: Record<string, string> = {
  general: "General", evangelismo: "Evangelismo", adoracion: "Adoración", doctrina: "Doctrina",
  familia: "Familia", liderazgo: "Liderazgo", profetico: "Profético", avivamiento: "Avivamiento",
};

export default function SermonesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedSermon, setSelectedSermon] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const isTeacherOrAdmin = user?.role === "admin" || user?.role === "obrero";

  const { data: sermonsList = [] } = useQuery<any[]>({
    queryKey: ["/api/sermons", search, category],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      return fetch(`/api/sermons?${params}`, { credentials: "include" }).then(r => r.json());
    },
  });

  const { data: myNotes = [] } = useQuery<any[]>({
    queryKey: ["/api/sermons", selectedSermon?.id, "notes"],
    queryFn: () => fetch(`/api/sermons/${selectedSermon.id}/notes`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedSermon && !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/sermons", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sermons"] });
      toast({ title: "Sermón publicado" });
      setCreateOpen(false);
    },
  });

  const saveNoteMutation = useMutation({
    mutationFn: async ({ sermonId, content }: { sermonId: number; content: string }) => {
      const res = await fetch(`/api/sermons/${sermonId}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ sermonId, content }) });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sermons", selectedSermon?.id, "notes"] });
      setNoteText("");
      toast({ title: "Nota guardada" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/sermons/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sermons"] });
      toast({ title: "Sermón eliminado" });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      title: fd.get("title"),
      description: fd.get("description") || undefined,
      preacherName: fd.get("preacherName") || undefined,
      sermonDate: fd.get("sermonDate") || undefined,
      category: fd.get("category") || "general",
      seriesName: fd.get("seriesName") || undefined,
      videoUrl: fd.get("videoUrl") || undefined,
      audioUrl: fd.get("audioUrl") || undefined,
      content: fd.get("content") || undefined,
    });
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-orange-600 flex items-center gap-2"><BookOpen className="h-8 w-8" /> Archivo de Sermones</h1>
            <p className="text-muted-foreground">Catálogo de prédicas y enseñanzas</p>
          </div>
          {isTeacherOrAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo Sermón</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Publicar Sermón</DialogTitle></DialogHeader>
                <form onSubmit={handleCreate} className="space-y-3">
                  <div><Label>Título *</Label><Input name="title" required /></div>
                  <div><Label>Predicador</Label><Input name="preacherName" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha</Label><Input name="sermonDate" type="date" /></div>
                    <div><Label>Categoría</Label>
                      <Select name="category" defaultValue="general"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(SERMON_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                  <div><Label>Serie</Label><Input name="seriesName" placeholder="Nombre de la serie..." /></div>
                  <div><Label>URL de Video (YouTube, etc.)</Label><Input name="videoUrl" type="url" /></div>
                  <div><Label>URL de Audio</Label><Input name="audioUrl" type="url" /></div>
                  <div><Label>Descripción</Label><Textarea name="description" rows={2} /></div>
                  <div><Label>Contenido / Transcripción</Label><Textarea name="content" rows={4} /></div>
                  <Button type="submit" disabled={createMutation.isPending} className="w-full">Publicar</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar sermones..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(SERMON_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {selectedSermon ? (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setSelectedSermon(null)}>← Volver al catálogo</Button>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{selectedSermon.title}</CardTitle>
                <div className="flex gap-2 items-center text-sm text-muted-foreground">
                  {selectedSermon.preacherName && <span>Por {selectedSermon.preacherName}</span>}
                  {selectedSermon.sermonDate && <span>• {format(new Date(selectedSermon.sermonDate), "dd MMMM yyyy", { locale: es })}</span>}
                  <Badge variant="secondary">{SERMON_CATEGORIES[selectedSermon.category] || selectedSermon.category}</Badge>
                  {selectedSermon.seriesName && <Badge variant="outline">{selectedSermon.seriesName}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSermon.videoUrl && (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe src={selectedSermon.videoUrl.replace("watch?v=", "embed/")} className="w-full h-full" allowFullScreen title={selectedSermon.title} />
                  </div>
                )}
                {selectedSermon.audioUrl && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Mic className="h-6 w-6 text-orange-500" />
                    <audio controls src={selectedSermon.audioUrl} className="flex-1" />
                  </div>
                )}
                {selectedSermon.description && <p className="text-muted-foreground">{selectedSermon.description}</p>}
                {selectedSermon.content && (
                  <div className="prose dark:prose-invert max-w-none">
                    <h3>Contenido</h3>
                    <div className="whitespace-pre-wrap">{selectedSermon.content}</div>
                  </div>
                )}

                {/* Notes section */}
                {user && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> Mis Notas</h3>
                    <div className="space-y-2 mb-3">
                      {myNotes.map((n: any) => (
                        <div key={n.id} className="p-3 bg-muted rounded-lg text-sm">
                          <p>{n.content}</p>
                          <span className="text-xs text-muted-foreground">{n.createdAt ? format(new Date(n.createdAt), "dd MMM yyyy HH:mm", { locale: es }) : ""}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Escribe tu nota..." rows={2} className="flex-1" />
                      <Button onClick={() => { if (noteText.trim()) saveNoteMutation.mutate({ sermonId: selectedSermon.id, content: noteText }); }} disabled={!noteText.trim()}>Guardar</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sermonsList.map((s: any) => (
              <Card key={s.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedSermon(s)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-2">{s.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        {s.preacherName && <span>{s.preacherName}</span>}
                        {s.sermonDate && <span>• {format(new Date(s.sermonDate), "dd MMM yyyy", { locale: es })}</span>}
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Badge variant="secondary" className="text-xs">{SERMON_CATEGORIES[s.category] || s.category}</Badge>
                        {s.seriesName && <Badge variant="outline" className="text-xs">{s.seriesName}</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      {s.videoUrl && <Video className="h-4 w-4 text-red-500" />}
                      {s.audioUrl && <Mic className="h-4 w-4 text-blue-500" />}
                      {s.content && <FileText className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                  {s.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <Button size="sm" variant="ghost" className="gap-1"><Play className="h-3 w-3" /> Ver</Button>
                    {isTeacherOrAdmin && (
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(s.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {sermonsList.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No hay sermones publicados aún.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
