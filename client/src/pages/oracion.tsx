import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, ExternalLink, Video, Calendar, Users, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePrayerAttendees, useMyPrayerAttendance, useAttendPrayer, useCancelPrayerAttendance } from "@/hooks/use-users";

const createPrayerSchema = z.object({
  title: z.string().min(3, "Minimo 3 caracteres"),
  description: z.string().optional(),
  meetingUrl: z.string().url("URL invalida").optional().or(z.literal("")),
  meetingPlatform: z.string().default("zoom"),
  scheduledDate: z.string().optional(),
});

type PrayerActivity = {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  meetingUrl: string | null;
  meetingPlatform: string | null;
  scheduledDate: string | null;
  isActive: boolean;
  createdAt: string;
  user?: { displayName: string; username: string; avatarUrl: string | null };
};

export default function OracionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: activities = [], isLoading } = useQuery<PrayerActivity[]>({
    queryKey: ["/api/prayer-activities"],
  });

  const form = useForm<z.infer<typeof createPrayerSchema>>({
    resolver: zodResolver(createPrayerSchema),
    defaultValues: { title: "", description: "", meetingUrl: "", meetingPlatform: "zoom", scheduledDate: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createPrayerSchema>) => {
      const body: any = { ...data };
      if (body.scheduledDate) {
        body.scheduledDate = new Date(body.scheduledDate).toISOString();
      } else {
        delete body.scheduledDate;
      }
      if (!body.meetingUrl) delete body.meetingUrl;
      if (!body.description) delete body.description;
      const res = await apiRequest("POST", "/api/prayer-activities", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-activities"] });
      toast({ title: "Actividad creada", description: "La actividad de oracion ha sido publicada." });
      form.reset();
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear la actividad.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/prayer-activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-activities"] });
      toast({ title: "Eliminada", description: "La actividad ha sido eliminada." });
    },
  });

  function getPlatformLabel(platform: string | null) {
    switch (platform) {
      case "zoom": return "Zoom";
      case "google_meet": return "Google Meet";
      case "youtube": return "YouTube Live";
      case "facebook": return "Facebook Live";
      default: return "Enlace";
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-oracion-title">Oracion</h1>
            <p className="text-muted-foreground mt-1">Actividades de oracion, reuniones y enlaces en vivo</p>
          </div>
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-prayer">
                  <Plus className="w-4 h-4 mr-1" /> Nueva Actividad
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Actividad de Oracion</DialogTitle>
                  <DialogDescription>Comparte una actividad de oracion con la comunidad.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titulo</FormLabel>
                        <FormControl><Input placeholder="Vigilia de oracion..." {...field} data-testid="input-prayer-title" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripcion</FormLabel>
                        <FormControl><Textarea placeholder="Detalles de la actividad..." className="resize-none" {...field} data-testid="input-prayer-description" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="meetingPlatform" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plataforma</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger data-testid="select-prayer-platform"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="zoom">Zoom</SelectItem>
                            <SelectItem value="google_meet">Google Meet</SelectItem>
                            <SelectItem value="youtube">YouTube Live</SelectItem>
                            <SelectItem value="facebook">Facebook Live</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="meetingUrl" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enlace de Reunion</FormLabel>
                        <FormControl><Input type="url" placeholder="https://zoom.us/j/..." {...field} data-testid="input-prayer-url" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="scheduledDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha y Hora</FormLabel>
                        <FormControl><Input type="datetime-local" {...field} data-testid="input-prayer-date" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                      <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-prayer">
                        {createMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                        Publicar
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No hay actividades de oracion</p>
              <p className="text-muted-foreground text-sm mt-1">Se la primera persona en crear una actividad.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activities.map((activity) => (
              <PrayerActivityCard key={activity.id} activity={activity} user={user} deleteMutation={deleteMutation} getPlatformLabel={getPlatformLabel} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function PrayerActivityCard({ activity, user, deleteMutation, getPlatformLabel }: {
  activity: PrayerActivity;
  user: any;
  deleteMutation: any;
  getPlatformLabel: (p: string | null) => string;
}) {
  const { data: attendeesData } = usePrayerAttendees(activity.id);
  const { data: myAttendance } = useMyPrayerAttendance(activity.id);
  const attendMutation = useAttendPrayer();
  const cancelMutation = useCancelPrayerAttendance();

  const count = attendeesData?.count || { confirmado: 0, tal_vez: 0 };
  const totalAttendees = (count.confirmado || 0) + (count.tal_vez || 0);

  return (
    <Card data-testid={`card-prayer-${activity.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <CardTitle className="text-lg">{activity.title}</CardTitle>
            {activity.isActive && <Badge variant="secondary">Activa</Badge>}
            {totalAttendees > 0 && (
              <Badge variant="outline" className="gap-1">
                <Users className="w-3 h-3" />
                {totalAttendees} {totalAttendees === 1 ? "asistente" : "asistentes"}
              </Badge>
            )}
          </div>
          <CardDescription className="flex flex-wrap items-center gap-2">
            {activity.user && (
              <span className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  {activity.user.avatarUrl && <AvatarImage src={activity.user.avatarUrl} />}
                  <AvatarFallback className="text-[10px]">
                    {(activity.user.displayName || activity.user.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {activity.user.displayName || activity.user.username}
              </span>
            )}
            {activity.scheduledDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(activity.scheduledDate).toLocaleString("es")}
              </span>
            )}
          </CardDescription>
        </div>
        {user && (user.role === "admin" || user.id === activity.userId) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate(activity.id)}
            disabled={deleteMutation.isPending}
            data-testid={`button-delete-prayer-${activity.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      {(activity.description || activity.meetingUrl) && (
        <CardContent className="space-y-3">
          {activity.description && <p className="text-sm text-muted-foreground">{activity.description}</p>}
          {activity.meetingUrl && (
            <a href={activity.meetingUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" data-testid={`button-join-prayer-${activity.id}`}>
                <Video className="w-4 h-4 mr-1" />
                Unirse a {getPlatformLabel(activity.meetingPlatform)}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </a>
          )}
        </CardContent>
      )}
      {user && (
        <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
          <span className="text-sm text-muted-foreground mr-2">Asistencia:</span>
          <Button
            size="sm"
            variant={myAttendance?.status === "confirmado" ? "default" : "outline"}
            className="gap-1"
            onClick={() => attendMutation.mutate({ activityId: activity.id, status: "confirmado" })}
            disabled={attendMutation.isPending}
          >
            <CheckCircle className="w-4 h-4" />
            Asistiré
            {count.confirmado > 0 && <Badge variant="secondary" className="ml-1 text-xs px-1">{count.confirmado}</Badge>}
          </Button>
          <Button
            size="sm"
            variant={myAttendance?.status === "tal_vez" ? "default" : "outline"}
            className="gap-1"
            onClick={() => attendMutation.mutate({ activityId: activity.id, status: "tal_vez" })}
            disabled={attendMutation.isPending}
          >
            <HelpCircle className="w-4 h-4" />
            Tal vez
            {count.tal_vez > 0 && <Badge variant="secondary" className="ml-1 text-xs px-1">{count.tal_vez}</Badge>}
          </Button>
          {myAttendance && myAttendance.status !== "cancelado" && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 text-destructive"
              onClick={() => cancelMutation.mutate(activity.id)}
              disabled={cancelMutation.isPending}
            >
              <XCircle className="w-4 h-4" />
              Cancelar
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
