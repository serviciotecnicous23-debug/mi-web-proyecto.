import { useState } from "react";
import { Layout } from "@/components/layout";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Calendar, MapPin, Clock, Plus, Pencil, Trash2 } from "lucide-react";
import type { Event } from "@shared/schema";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) >= new Date();
}

function isPast(dateStr: string) {
  return new Date(dateStr) < new Date();
}

function toDatetimeLocal(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

const emptyForm = {
  title: "",
  description: "",
  eventDate: "",
  eventEndDate: "",
  location: "",
};

export default function Eventos() {
  const { data: events, isLoading } = useEvents();
  const { user } = useAuth();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyForm);

  const upcoming = events?.filter((e: Event) => isUpcoming(e.eventDate as any)) || [];
  const past = events?.filter((e: Event) => isPast(e.eventDate as any)) || [];

  const isAdmin = user?.role === "admin";

  function canManage(event: Event) {
    if (!user) return false;
    return isAdmin || event.createdBy === user.id;
  }

  function handleCreateOpen() {
    setForm(emptyForm);
    setCreateOpen(true);
  }

  function handleEditOpen(event: Event) {
    setForm({
      title: event.title,
      description: event.description,
      eventDate: toDatetimeLocal(event.eventDate as any),
      eventEndDate: toDatetimeLocal(event.eventEndDate as any),
      location: event.location,
    });
    setEditingEvent(event);
    setEditOpen(true);
  }

  function handleCreate() {
    if (!form.title || !form.description || !form.eventDate || !form.location) return;
    createEvent.mutate(
      {
        title: form.title,
        description: form.description,
        eventDate: form.eventDate,
        eventEndDate: form.eventEndDate || null,
        location: form.location,
        isPublished: true,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setForm(emptyForm);
        },
      },
    );
  }

  function handleUpdate() {
    if (!editingEvent || !form.title || !form.description || !form.eventDate || !form.location) return;
    updateEvent.mutate(
      {
        id: editingEvent.id,
        updates: {
          title: form.title,
          description: form.description,
          eventDate: form.eventDate,
          eventEndDate: form.eventEndDate || null,
          location: form.location,
        },
      },
      {
        onSuccess: () => {
          setEditOpen(false);
          setEditingEvent(null);
          setForm(emptyForm);
        },
      },
    );
  }

  function handleDelete(event: Event) {
    if (!confirm("Esta seguro que desea eliminar este evento?")) return;
    deleteEvent.mutate(event.id);
  }

  return (
    <Layout>
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 fire-gradient opacity-10 dark:opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-primary font-medium mb-2">Calendario del Ministerio</p>
          <h1 className="text-3xl md:text-5xl font-bold mb-4" data-testid="text-eventos-title">
            Eventos
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Encuentros, retiros, vigilias y actividades del ministerio. Ven y se parte de lo que Dios esta haciendo.
          </p>
          {user && (
            <Button className="mt-6" onClick={handleCreateOpen} data-testid="button-create-event">
              <Plus className="h-4 w-4 mr-2" />
              Crear Evento
            </Button>
          )}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !events?.length ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay eventos programados</h3>
              <p className="text-muted-foreground">
                Pronto anunciaremos nuevos eventos. Mantente atento a nuestras redes sociales.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2" data-testid="text-upcoming-title">
                  <Calendar className="h-5 w-5 text-primary" />
                  Proximos Eventos
                </h2>
                <div className="space-y-4">
                  {upcoming.map((event: Event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="upcoming"
                      canManage={canManage(event)}
                      onEdit={() => handleEditOpen(event)}
                      onDelete={() => handleDelete(event)}
                    />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2" data-testid="text-past-title">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Eventos Pasados
                </h2>
                <div className="space-y-4">
                  {past.map((event: Event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="past"
                      canManage={canManage(event)}
                      onEdit={() => handleEditOpen(event)}
                      onDelete={() => handleDelete(event)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <EventFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Crear Evento"
        form={form}
        setForm={setForm}
        onSubmit={handleCreate}
        isPending={createEvent.isPending}
        submitLabel="Crear"
      />

      <EventFormDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingEvent(null);
        }}
        title="Editar Evento"
        form={form}
        setForm={setForm}
        onSubmit={handleUpdate}
        isPending={updateEvent.isPending}
        submitLabel="Guardar"
      />
    </Layout>
  );
}

function EventFormDialog({
  open,
  onOpenChange,
  title,
  form,
  setForm,
  onSubmit,
  isPending,
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: typeof emptyForm;
  setForm: (form: typeof emptyForm) => void;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-event-form">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="event-title">Titulo</Label>
            <Input
              id="event-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Nombre del evento"
              data-testid="input-event-title"
            />
          </div>
          <div>
            <Label htmlFor="event-description">Descripcion</Label>
            <Textarea
              id="event-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripcion del evento"
              data-testid="input-event-description"
            />
          </div>
          <div>
            <Label htmlFor="event-date">Fecha y Hora</Label>
            <Input
              id="event-date"
              type="datetime-local"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              data-testid="input-event-date"
            />
          </div>
          <div>
            <Label htmlFor="event-end-date">Fecha y Hora de Fin (opcional)</Label>
            <Input
              id="event-end-date"
              type="datetime-local"
              value={form.eventEndDate}
              onChange={(e) => setForm({ ...form, eventEndDate: e.target.value })}
              data-testid="input-event-end-date"
            />
          </div>
          <div>
            <Label htmlFor="event-location">Ubicacion</Label>
            <Input
              id="event-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Lugar del evento"
              data-testid="input-event-location"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={onSubmit}
            disabled={isPending || !form.title || !form.description || !form.eventDate || !form.location}
            data-testid="button-submit-event"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventCard({
  event,
  variant,
  canManage,
  onEdit,
  onDelete,
}: {
  event: Event;
  variant: "upcoming" | "past";
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPastEvent = variant === "past";

  return (
    <Card className={isPastEvent ? "opacity-70" : ""} data-testid={`card-event-${event.id}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-shrink-0 text-center md:text-left md:min-w-[100px]">
            <div className={`text-3xl font-bold ${isPastEvent ? "text-muted-foreground" : "fire-text"}`}>
              {new Date(event.eventDate as any).getDate()}
            </div>
            <div className="text-sm text-muted-foreground capitalize">
              {new Date(event.eventDate as any).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h3 className="text-lg font-bold" data-testid={`text-event-title-${event.id}`}>
                {event.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {!isPastEvent && (
                  <Badge variant="default">Proximo</Badge>
                )}
                {canManage && (
                  <>
                    <Button size="icon" variant="ghost" onClick={onEdit} data-testid={`button-edit-event-${event.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={onDelete} data-testid={`button-delete-event-${event.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{event.description}</p>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(event.eventDate as any)}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatTime(event.eventDate as any)}</span>
                {event.eventEndDate && (
                  <span> - {formatTime(event.eventEndDate as any)}</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
