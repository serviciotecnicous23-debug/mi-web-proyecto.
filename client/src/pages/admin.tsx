import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useAdminUsers, useToggleUserActive, useDeleteUser, useUpdateUserRole,
  useAdminMessages, useToggleMessageRead, useDeleteMessage,
  useMemberPosts, useDeleteMemberPost,
  useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent,
  useAllSiteContent, useUpdateSiteContent,
  useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse,
  useCourseEnrollments, useUpdateEnrollment,
  useTeacherRequests, useUpdateTeacherRequest, useDeleteTeacherRequest,
  useUpdateUserInfo, useWhatsappLink, useUpdateWhatsappLink,
  useLiveStreamConfig, useUpdateLiveStream,
  useAdminUserDetail,
} from "@/hooks/use-users";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Loader2, Search, CheckCircle2, XCircle, UserPlus, Users, Mail,
  MessageSquare, Trash2, Eye, EyeOff, Clock, Calendar,
  Plus, Pencil, FileText, Save, X, GraduationCap, BookOpen, Radio,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ROLES, COURSE_CATEGORIES, ENROLLMENT_STATUSES, ENROLLMENT_MODES, TEACHER_REQUEST_STATUSES, MINISTRY_POSITIONS, MINISTRY_COUNTRIES } from "@shared/schema";
import type { Event as EventType, SiteContent, Course } from "@shared/schema";
import { SiWhatsapp } from "react-icons/si";
import { ChevronDown, ChevronRight, Shield } from "lucide-react";

const CONTENT_SECTIONS = [
  { key: "home_hero", label: "Inicio - Hero Principal", description: "Texto principal y versiculo de la pagina de inicio" },
  { key: "home_cta", label: "Inicio - Llamado a la Accion", description: "Seccion final de la pagina de inicio" },
  { key: "historia_intro", label: "Historia - Introduccion", description: "Texto introductorio de la pagina de historia" },
  { key: "en_vivo_info", label: "En Vivo - Informacion", description: "Informacion sobre transmisiones en vivo" },
  { key: "footer_info", label: "Pie de Pagina", description: "Informacion del pie de pagina" },
  { key: "anuncio_general", label: "Anuncio General", description: "Anuncio visible en la pagina de inicio" },
];

function LiveStreamAdmin() {
  const { data: config, isLoading } = useLiveStreamConfig();
  const updateLive = useUpdateLiveStream();
  const [sourceType, setSourceType] = useState("radio");
  const [sourceUrl, setSourceUrl] = useState("");
  const [radioUrl, setRadioUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (config) {
      setSourceType(config.sourceType || "radio");
      setSourceUrl(config.sourceUrl || "");
      setRadioUrl(config.radioUrl || "");
      setTitle(config.title || "");
      setIsLive(config.isLive || false);
    }
  }, [config]);

  const handleSave = () => {
    updateLive.mutate({ sourceType, sourceUrl, radioUrl, title, isLive });
  };

  const handleQuickSwitch = (type: string) => {
    if (type === "radio") {
      updateLive.mutate({ sourceType: "radio", sourceUrl: "", radioUrl, title: "", isLive: false });
    } else {
      setSourceType(type);
      setIsLive(true);
    }
  };

  const handleGoLive = () => {
    if (sourceUrl.trim()) {
      updateLive.mutate({ sourceType, sourceUrl, radioUrl, title, isLive: true });
    }
  };

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" /> Control de Transmision En Vivo
          </CardTitle>
          <CardDescription>
            Administra la senal de radio y las transmisiones en vivo. Cambia entre radio y plataformas de streaming.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Cambio Rapido de Fuente</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sourceType === "radio" && !isLive ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSwitch("radio")}
                data-testid="button-quick-radio"
              >
                <Radio className="w-4 h-4 mr-1" /> Volver a Radio
              </Button>
              <Button
                variant={sourceType === "youtube" && isLive ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSwitch("youtube")}
                data-testid="button-quick-youtube"
              >
                YouTube Live
              </Button>
              <Button
                variant={sourceType === "facebook" && isLive ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSwitch("facebook")}
                data-testid="button-quick-facebook"
              >
                Facebook Live
              </Button>
              <Button
                variant={sourceType === "tiktok" && isLive ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSwitch("tiktok")}
                data-testid="button-quick-tiktok"
              >
                TikTok Live
              </Button>
              <Button
                variant={sourceType === "restream" && isLive ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSwitch("restream")}
                data-testid="button-quick-restream"
              >
                Restream
              </Button>
              <Button
                variant={sourceType === "hls" && isLive ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSwitch("hls")}
                data-testid="button-quick-hls"
              >
                HLS Stream
              </Button>
              <Button
                variant={sourceType === "custom" && isLive ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSwitch("custom")}
                data-testid="button-quick-custom"
              >
                Otra Plataforma
              </Button>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div>
              <Label>URL de la Radio (senal de relleno 24/7)</Label>
              <Input
                value={radioUrl}
                onChange={(e) => setRadioUrl(e.target.value)}
                placeholder="https://stream.example.com/radio.mp3"
                data-testid="input-radio-url"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL del stream de audio (MP3/AAC). Se reproduce cuando no hay transmision en vivo.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={isLive}
                onCheckedChange={setIsLive}
                data-testid="switch-is-live"
              />
              <Label>Activar transmision en vivo (desactiva la radio temporal)</Label>
            </div>

            {isLive && (
              <>
                <div>
                  <Label>Tipo de Fuente</Label>
                  <Select value={sourceType} onValueChange={setSourceType}>
                    <SelectTrigger data-testid="select-source-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube Live</SelectItem>
                      <SelectItem value="facebook">Facebook Live</SelectItem>
                      <SelectItem value="tiktok">TikTok Live</SelectItem>
                      <SelectItem value="restream">Restream.io (retransmision)</SelectItem>
                      <SelectItem value="hls">HLS Stream (m3u8)</SelectItem>
                      <SelectItem value="custom">Otra Plataforma (iframe)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>URL de la Transmision</Label>
                  <Input
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder={
                      sourceType === "youtube" ? "https://youtube.com/watch?v=XXXXX o https://youtube.com/live/XXXXX" :
                      sourceType === "facebook" ? "https://www.facebook.com/user/videos/XXXXX" :
                      sourceType === "tiktok" ? "https://www.tiktok.com/@user/live" :
                      sourceType === "restream" ? "https://player.restream.io/player/xxxxxxxx" :
                      sourceType === "hls" ? "https://tu-servidor.com/live/stream.m3u8" :
                      "https://..."
                    }
                    data-testid="input-source-url"
                  />
                  {sourceType === "restream" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Usa Restream.io para retransmitir a YouTube, Facebook y TikTok al mismo tiempo. Pega aqui la URL del player embebible que Restream te proporciona.
                    </p>
                  )}
                  {sourceType === "hls" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Pega la URL del stream HLS (.m3u8). Puedes obtenerla de servicios como Restream, Castr, o tu propio servidor RTMP con nginx-rtmp.
                    </p>
                  )}
                </div>

                <div>
                  <Label>Titulo de la Transmision (opcional)</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Culto Dominical, Noche de Avivamiento..."
                    data-testid="input-stream-title"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 border-t pt-4 flex-wrap">
            <Button onClick={handleSave} disabled={updateLive.isPending} data-testid="button-save-live">
              {updateLive.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar Configuracion
            </Button>
            {isLive && sourceUrl.trim() && (
              <Button onClick={handleGoLive} disabled={updateLive.isPending} variant="destructive" data-testid="button-go-live">
                <Radio className="h-4 w-4 mr-1" /> Transmitir Ahora
              </Button>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${isLive ? "bg-red-500" : "bg-green-500"}`} />
              {isLive ? `En vivo por ${sourceType === "youtube" ? "YouTube" : sourceType === "facebook" ? "Facebook" : sourceType === "tiktok" ? "TikTok" : sourceType === "restream" ? "Restream" : sourceType === "hls" ? "HLS Stream" : "Otra plataforma"}` : "Radio activa"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminCourseEnrollments({ courseId, updateEnrollment }: { courseId: number; updateEnrollment: any }) {
  const { data: enrollmentsList, isLoading } = useCourseEnrollments(courseId);

  if (isLoading) return <div className="py-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!enrollmentsList?.length) return <p className="text-muted-foreground text-sm py-4 text-center mt-3 border-t">No hay inscripciones en este curso.</p>;

  return (
    <div className="mt-4 pt-3 border-t space-y-2">
      <h4 className="text-sm font-semibold mb-2">Inscripciones del Curso</h4>
      {enrollmentsList.map((e: any) => (
        <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md bg-muted/50" data-testid={`admin-enrollment-${e.id}`}>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{e.user.displayName || e.user.username}</p>
            <p className="text-xs text-muted-foreground">@{e.user.username} - {ROLES[e.user.role as keyof typeof ROLES]}</p>
            {e.grade && <p className="text-xs mt-1">Calificacion: <span className="font-semibold">{e.grade}</span></p>}
            {e.observations && <p className="text-xs text-muted-foreground mt-1">{e.observations}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={e.status === "aprobado" ? "default" : e.status === "completado" ? "secondary" : e.status === "rechazado" ? "destructive" : "outline"}>
              {ENROLLMENT_STATUSES[e.status as keyof typeof ENROLLMENT_STATUSES]}
            </Badge>
            {e.status === "solicitado" && (
              <>
                <Button size="sm" variant="outline" onClick={() => updateEnrollment.mutate({ id: e.id, courseId, updates: { status: "aprobado" } })} data-testid={`button-admin-approve-enrollment-${e.id}`}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => updateEnrollment.mutate({ id: e.id, courseId, updates: { status: "rechazado" } })} data-testid={`button-admin-reject-enrollment-${e.id}`}>
                  <XCircle className="w-4 h-4 mr-1" /> Rechazar
                </Button>
              </>
            )}
            {e.status === "aprobado" && (
              <Button size="sm" variant="ghost" onClick={() => updateEnrollment.mutate({ id: e.id, courseId, updates: { status: "completado" } })} data-testid={`button-admin-complete-enrollment-${e.id}`}>
                <CheckCircle2 className="w-4 h-4" /> Completar
              </Button>
            )}
            {e.status === "completado" && (
              <Button size="sm" variant="ghost" onClick={() => updateEnrollment.mutate({ id: e.id, courseId, updates: { status: "aprobado" } })} data-testid={`button-admin-revert-enrollment-${e.id}`}>
                <XCircle className="w-4 h-4 mr-1" /> Revertir
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: users, isLoading: isLoadingUsers } = useAdminUsers();
  const toggleActive = useToggleUserActive();
  const deleteUser = useDeleteUser();
  const updateUserRole = useUpdateUserRole();
  const { data: contactMessages, isLoading: isLoadingMessages } = useAdminMessages();
  const toggleMessageRead = useToggleMessageRead();
  const deleteMessage = useDeleteMessage();
  const { data: posts, isLoading: isLoadingPosts } = useMemberPosts();
  const deleteMemberPost = useDeleteMemberPost();
  const { data: allEvents, isLoading: isLoadingEvents } = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { data: siteContentList } = useAllSiteContent();
  const updateSiteContent = useUpdateSiteContent();
  const { data: allCourses, isLoading: isLoadingCourses } = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const updateEnrollment = useUpdateEnrollment();
  const { data: teacherRequestsList } = useTeacherRequests();
  const updateTeacherRequest = useUpdateTeacherRequest();
  const deleteTeacherRequest = useDeleteTeacherRequest();
  const updateUserInfo = useUpdateUserInfo();
  const { data: whatsappData } = useWhatsappLink();
  const updateWhatsappLink = useUpdateWhatsappLink();
  const [search, setSearch] = useState("");
  const [editingUserInfo, setEditingUserInfo] = useState<number | null>(null);
  const [userInfoForm, setUserInfoForm] = useState({ cargo: "", country: "" });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { data: userDetail, isLoading: isLoadingDetail } = useAdminUserDetail(selectedUserId);
  const [whatsappLinkEdit, setWhatsappLinkEdit] = useState(false);
  const [whatsappLinkValue, setWhatsappLinkValue] = useState("");
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "", description: "", location: "", eventDate: "", eventEndDate: "", imageUrl: "", isPublished: true,
  });

  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [contentForm, setContentForm] = useState({ title: "", content: "" });

  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: "", description: "", category: "general", imageUrl: "", maxStudents: "", teacherId: "", isActive: true,
    enrollmentStatus: "open", enrollmentOpenDate: "", enrollmentCloseDate: "",
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const pendingUsers = users?.filter((u: any) => !u.isActive) || [];
  const activeUsers = users?.filter((u: any) => u.isActive) || [];
  const unreadMessages = contactMessages?.filter((m: any) => !m.isRead) || [];
  const obreros = users?.filter((u: any) => u.isActive) || [];

  const filteredUsers = users?.filter(
    (u: any) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.displayName && u.displayName.toLowerCase().includes(search.toLowerCase()))
  );

  function openNewEventDialog() {
    setEditingEvent(null);
    setEventForm({ title: "", description: "", location: "", eventDate: "", eventEndDate: "", imageUrl: "", isPublished: true });
    setEventDialogOpen(true);
  }

  function openEditEventDialog(event: EventType) {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      location: event.location,
      eventDate: event.eventDate ? new Date(event.eventDate as any).toISOString().slice(0, 16) : "",
      eventEndDate: event.eventEndDate ? new Date(event.eventEndDate as any).toISOString().slice(0, 16) : "",
      imageUrl: event.imageUrl || "",
      isPublished: event.isPublished,
    });
    setEventDialogOpen(true);
  }

  async function handleEventSubmit() {
    const data = {
      title: eventForm.title,
      description: eventForm.description,
      location: eventForm.location,
      eventDate: eventForm.eventDate,
      eventEndDate: eventForm.eventEndDate || null,
      imageUrl: eventForm.imageUrl || null,
      isPublished: eventForm.isPublished,
    };
    if (editingEvent) {
      await updateEvent.mutateAsync({ id: editingEvent.id, updates: data });
    } else {
      await createEvent.mutateAsync(data);
    }
    setEventDialogOpen(false);
  }

  function openContentEditor(key: string) {
    const existing = siteContentList?.find((c: SiteContent) => c.sectionKey === key);
    setEditingContent(key);
    setContentForm({ title: existing?.title || "", content: existing?.content || "" });
  }

  async function handleContentSave() {
    if (!editingContent) return;
    await updateSiteContent.mutateAsync({
      key: editingContent,
      data: { title: contentForm.title || null, content: contentForm.content || null },
    });
    setEditingContent(null);
  }

  function openNewCourseDialog() {
    setEditingCourse(null);
    setCourseForm({ title: "", description: "", category: "general", imageUrl: "", maxStudents: "", teacherId: "", isActive: true, enrollmentStatus: "open", enrollmentOpenDate: "", enrollmentCloseDate: "" });
    setCourseDialogOpen(true);
  }

  function openEditCourseDialog(course: Course) {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description,
      category: course.category,
      imageUrl: course.imageUrl || "",
      maxStudents: course.maxStudents ? String(course.maxStudents) : "",
      teacherId: course.teacherId ? String(course.teacherId) : "",
      isActive: course.isActive,
      enrollmentStatus: (course as any).enrollmentStatus || "open",
      enrollmentOpenDate: (course as any).enrollmentOpenDate ? new Date((course as any).enrollmentOpenDate).toISOString().slice(0, 16) : "",
      enrollmentCloseDate: (course as any).enrollmentCloseDate ? new Date((course as any).enrollmentCloseDate).toISOString().slice(0, 16) : "",
    });
    setCourseDialogOpen(true);
  }

  async function handleCourseSubmit() {
    const data: any = {
      title: courseForm.title,
      description: courseForm.description,
      category: courseForm.category,
      imageUrl: courseForm.imageUrl || null,
      maxStudents: courseForm.maxStudents ? parseInt(courseForm.maxStudents) : null,
      teacherId: courseForm.teacherId && courseForm.teacherId !== "none" ? parseInt(courseForm.teacherId) : null,
      isActive: courseForm.isActive,
      enrollmentStatus: courseForm.enrollmentStatus,
      enrollmentOpenDate: courseForm.enrollmentOpenDate || null,
      enrollmentCloseDate: courseForm.enrollmentCloseDate || null,
    };
    if (editingCourse) {
      await updateCourse.mutateAsync({ id: editingCourse.id, updates: data });
    } else {
      await createCourse.mutateAsync(data);
    }
    setCourseDialogOpen(false);
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-admin-title">Panel de Administracion</h1>
            <p className="text-muted-foreground mt-1">Gestiona miembros, cursos, eventos, contenido y mensajes del ministerio.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold" data-testid="text-total-users">{users?.length || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Activos
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600" data-testid="text-active-users">{activeUsers.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Cursos
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold" data-testid="text-total-courses">{allCourses?.length || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Eventos
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold" data-testid="text-total-events">{allEvents?.length || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" /> Mensajes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-unread-messages">
                {unreadMessages.length} <span className="text-sm font-normal text-muted-foreground">sin leer</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={pendingUsers.length > 0 ? "pending" : "courses"}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="pending" className="gap-2" data-testid="tab-pending">
              <UserPlus className="h-4 w-4" /> Solicitudes
              {pendingUsers.length > 0 && <Badge variant="destructive" className="ml-1">{pendingUsers.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2" data-testid="tab-courses">
              <GraduationCap className="h-4 w-4" /> Cursos
            </TabsTrigger>
            <TabsTrigger value="teacher-requests" className="gap-2" data-testid="tab-teacher-requests">
              <BookOpen className="h-4 w-4" /> Maestros
              {teacherRequestsList?.filter((r: any) => r.status === "solicitado").length > 0 && (
                <Badge variant="destructive" className="ml-1">{teacherRequestsList.filter((r: any) => r.status === "solicitado").length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2" data-testid="tab-events">
              <Calendar className="h-4 w-4" /> Eventos
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2" data-testid="tab-content">
              <FileText className="h-4 w-4" /> Contenido
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
              <Users className="h-4 w-4" /> Miembros
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2" data-testid="tab-messages">
              <Mail className="h-4 w-4" /> Contacto
              {unreadMessages.length > 0 && <Badge variant="destructive" className="ml-1">{unreadMessages.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2" data-testid="tab-posts">
              <MessageSquare className="h-4 w-4" /> Publicaciones
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-2" data-testid="tab-live">
              <Radio className="h-4 w-4" /> En Vivo
            </TabsTrigger>
          </TabsList>

          {/* Solicitudes Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes Pendientes</CardTitle>
                <CardDescription>Usuarios que solicitan unirse al ministerio.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingUsers ? (
                  <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : pendingUsers.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">No hay solicitudes pendientes.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol Solicitado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((u: any) => (
                        <TableRow key={u.id} data-testid={`row-pending-${u.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/5 text-primary text-xs">
                                  {u.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-semibold">{u.displayName || u.username}</span>
                                <span className="text-xs text-muted-foreground">@{u.username}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{ROLES[u.role as keyof typeof ROLES] || u.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-ES') : '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" onClick={() => toggleActive.mutate(u.id)} disabled={toggleActive.isPending} data-testid={`button-approve-${u.id}`}>
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteUser.mutate(u.id)} disabled={deleteUser.isPending} data-testid={`button-reject-${u.id}`}>
                                <XCircle className="h-4 w-4 mr-1" /> Rechazar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cursos Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Gestion de Cursos</CardTitle>
                    <CardDescription>Crea cursos y asigna maestros.</CardDescription>
                  </div>
                  <Button onClick={openNewCourseDialog} data-testid="button-new-course">
                    <Plus className="h-4 w-4 mr-1" /> Nuevo Curso
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCourses ? (
                  <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : !allCourses?.length ? (
                  <div className="p-12 text-center text-muted-foreground">
                    No hay cursos creados. Haz clic en "Nuevo Curso" para crear uno.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allCourses.map((course: Course) => {
                      const teacher = users?.find((u: any) => u.id === course.teacherId);
                      const isExpanded = expandedCourse === course.id;
                      return (
                        <Card key={course.id} data-testid={`admin-course-${course.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-semibold">{course.title}</span>
                                  <Badge variant="secondary">{COURSE_CATEGORIES[course.category as keyof typeof COURSE_CATEGORIES] || course.category}</Badge>
                                  {!course.isActive && <Badge variant="outline">Inactivo</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                                  {teacher && <span>Maestro: {teacher.displayName || teacher.username}</span>}
                                  {!teacher && <span className="text-primary">Sin maestro asignado</span>}
                                  <span>Inscritos: {(course as any).enrolledCount || 0}{course.maxStudents ? `/${course.maxStudents}` : ""}</span>
                                  {(course as any).pendingCount > 0 && (
                                    <Badge variant="outline" className="text-xs">{(course as any).pendingCount} solicitud(es)</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setExpandedCourse(isExpanded ? null : course.id)} data-testid={`button-expand-enrollments-${course.id}`}>
                                  {isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                                  Inscripciones
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditCourseDialog(course)} data-testid={`button-edit-course-${course.id}`}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteCourse.mutate(course.id)} disabled={deleteCourse.isPending} data-testid={`button-delete-course-${course.id}`}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            {isExpanded && (
                              <AdminCourseEnrollments courseId={course.id} updateEnrollment={updateEnrollment} />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teacher Requests Tab */}
          <TabsContent value="teacher-requests">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Maestros</CardTitle>
                <CardDescription>Obreros que solicitan ensenar un curso. Al aprobar, el obrero se asigna automaticamente como maestro del curso.</CardDescription>
              </CardHeader>
              <CardContent>
                {!teacherRequestsList?.length ? (
                  <div className="p-12 text-center text-muted-foreground">No hay solicitudes de maestros.</div>
                ) : (
                  <div className="space-y-3">
                    {teacherRequestsList.map((req: any) => (
                      <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-md bg-muted/50" data-testid={`teacher-request-${req.id}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{req.user.displayName || req.user.username}</p>
                          <p className="text-xs text-muted-foreground">@{req.user.username} - {ROLES[req.user.role as keyof typeof ROLES]}</p>
                          <p className="text-sm mt-1">Curso: <span className="font-semibold">{req.course.title}</span></p>
                          {req.message && <p className="text-sm text-muted-foreground mt-1 italic">"{req.message}"</p>}
                          <span className="text-xs text-muted-foreground">{req.createdAt ? new Date(req.createdAt).toLocaleString('es-ES') : ''}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={req.status === "aprobado" ? "default" : req.status === "rechazado" ? "destructive" : "outline"}>
                            {TEACHER_REQUEST_STATUSES[req.status as keyof typeof TEACHER_REQUEST_STATUSES]}
                          </Badge>
                          {req.status === "solicitado" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => updateTeacherRequest.mutate({ id: req.id, updates: { status: "aprobado" } })} data-testid={`button-approve-teacher-${req.id}`}>
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => updateTeacherRequest.mutate({ id: req.id, updates: { status: "rechazado" } })} data-testid={`button-reject-teacher-${req.id}`}>
                                <XCircle className="w-4 h-4 mr-1" /> Rechazar
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => deleteTeacherRequest.mutate(req.id)} data-testid={`button-delete-teacher-request-${req.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Eventos Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Gestion de Eventos</CardTitle>
                    <CardDescription>Crea, edita y gestiona los eventos del ministerio.</CardDescription>
                  </div>
                  <Button onClick={openNewEventDialog} data-testid="button-new-event">
                    <Plus className="h-4 w-4 mr-1" /> Nuevo Evento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingEvents ? (
                  <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : !allEvents?.length ? (
                  <div className="p-12 text-center text-muted-foreground">No hay eventos creados.</div>
                ) : (
                  <div className="space-y-3">
                    {allEvents.map((event: EventType) => {
                      const isPast = new Date(event.eventDate as any) < new Date();
                      return (
                        <Card key={event.id} className={isPast ? "opacity-60" : ""} data-testid={`admin-event-${event.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-semibold">{event.title}</span>
                                  {!event.isPublished && <Badge variant="secondary">Borrador</Badge>}
                                  {isPast && <Badge variant="outline">Pasado</Badge>}
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(event.eventDate as any).toLocaleDateString("es-ES")}</span>
                                  <span>{event.location}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditEventDialog(event)} data-testid={`button-edit-event-${event.id}`}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteEvent.mutate(event.id)} disabled={deleteEvent.isPending} data-testid={`button-delete-event-${event.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenido Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Gestion de Contenido</CardTitle>
                <CardDescription>Modifica el contenido de las secciones del sitio web.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {CONTENT_SECTIONS.map((section) => {
                    const existing = siteContentList?.find((c: SiteContent) => c.sectionKey === section.key);
                    const isEditing = editingContent === section.key;
                    return (
                      <Card key={section.key} data-testid={`content-section-${section.key}`}>
                        <CardContent className="pt-4">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-semibold">{section.label}</h4>
                                <div className="flex items-center gap-1">
                                  <Button size="sm" onClick={handleContentSave} disabled={updateSiteContent.isPending} data-testid={`button-save-content-${section.key}`}>
                                    <Save className="h-4 w-4 mr-1" /> Guardar
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingContent(null)}><X className="h-4 w-4" /></Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div><Label>Titulo</Label><Input value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} data-testid={`input-content-title-${section.key}`} /></div>
                                <div><Label>Contenido</Label><Textarea value={contentForm.content} onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })} className="resize-none" rows={4} data-testid={`textarea-content-${section.key}`} /></div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-semibold">{section.label}</h4>
                                <p className="text-xs text-muted-foreground">{section.description}</p>
                                {existing?.title && <p className="text-sm mt-1"><span className="text-muted-foreground">Titulo:</span> {existing.title}</p>}
                                {existing?.content && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{existing.content}</p>}
                                {!existing?.title && !existing?.content && <p className="text-xs text-muted-foreground mt-1 italic">Sin contenido personalizado</p>}
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => openContentEditor(section.key)} data-testid={`button-edit-content-${section.key}`}><Pencil className="h-4 w-4" /></Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Miembros Tab - with role management */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Miembros del Ministerio</CardTitle>
                    <CardDescription>Gestiona miembros, cambia roles, estados, cargos y paises.</CardDescription>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-users" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingUsers ? (
                  <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Cargo / Pais</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((u: any) => (
                        <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/5 text-primary text-xs">
                                  {u.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-semibold">{u.displayName || u.username}</span>
                                <span className="text-xs text-muted-foreground">@{u.username}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {u.id === user?.id ? (
                              <Badge variant="default">{ROLES[u.role as keyof typeof ROLES]}</Badge>
                            ) : (
                              <Select value={u.role} onValueChange={(role) => updateUserRole.mutate({ id: u.id, role })}>
                                <SelectTrigger className="w-[140px]" data-testid={`select-role-${u.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(ROLES).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingUserInfo === u.id ? (
                              <div className="space-y-1">
                                <Select value={userInfoForm.cargo || "none"} onValueChange={(v) => setUserInfoForm(f => ({ ...f, cargo: v === "none" ? "" : v }))}>
                                  <SelectTrigger className="w-[160px]" data-testid={`select-cargo-${u.id}`}>
                                    <SelectValue placeholder="Cargo..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sin cargo</SelectItem>
                                    {MINISTRY_POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Select value={userInfoForm.country || "none"} onValueChange={(v) => setUserInfoForm(f => ({ ...f, country: v === "none" ? "" : v }))}>
                                  <SelectTrigger className="w-[160px]" data-testid={`select-country-${u.id}`}>
                                    <SelectValue placeholder="Pais..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sin pais</SelectItem>
                                    {MINISTRY_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1">
                                  <Button size="sm" variant="outline" onClick={() => {
                                    updateUserInfo.mutate({ id: u.id, cargo: userInfoForm.cargo || null, country: userInfoForm.country || null });
                                    setEditingUserInfo(null);
                                  }} data-testid={`button-save-info-${u.id}`}>
                                    <Save className="w-3 h-3 mr-1" /> Guardar
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingUserInfo(null)}>
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {u.cargo && <Badge variant="secondary" className="text-xs">{u.cargo}</Badge>}
                                {u.country && <span className="text-xs text-muted-foreground">{u.country}</span>}
                                {!u.cargo && !u.country && <span className="text-xs text-muted-foreground">-</span>}
                                <Button size="sm" variant="ghost" className="w-fit p-0 h-auto text-xs text-muted-foreground" onClick={() => {
                                  setEditingUserInfo(u.id);
                                  setUserInfoForm({ cargo: u.cargo || "", country: u.country || "" });
                                }} data-testid={`button-edit-info-${u.id}`}>
                                  <Pencil className="w-3 h-3 mr-1" /> Editar
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {u.isActive ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-primary" />}
                              <span className={`text-sm ${u.isActive ? "text-green-700 dark:text-green-400" : "text-primary"}`}>
                                {u.isActive ? "Activo" : "Pendiente"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setSelectedUserId(u.id)} data-testid={`button-view-detail-${u.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => toggleActive.mutate(u.id)} disabled={u.id === user?.id || toggleActive.isPending} data-testid={`button-toggle-${u.id}`}>
                                {u.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                              </Button>
                              {u.id !== user?.id && (
                                <Button variant="ghost" size="icon" onClick={() => deleteUser.mutate(u.id)} disabled={deleteUser.isPending} data-testid={`button-delete-user-${u.id}`}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredUsers?.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center">No se encontraron usuarios.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* WhatsApp Group Link Management */}
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <SiWhatsapp className="h-5 w-5 text-green-500" />
                  <CardTitle>Enlace de Grupo WhatsApp</CardTitle>
                </div>
                <CardDescription>Configura el enlace del grupo de WhatsApp del Club de Lectura. Los miembros podran verlo y unirse desde la seccion de Biblioteca.</CardDescription>
              </CardHeader>
              <CardContent>
                {whatsappLinkEdit ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      placeholder="https://chat.whatsapp.com/..."
                      value={whatsappLinkValue}
                      onChange={(e) => setWhatsappLinkValue(e.target.value)}
                      className="flex-1"
                      data-testid="input-whatsapp-link"
                    />
                    <Button size="sm" onClick={() => {
                      updateWhatsappLink.mutate(whatsappLinkValue);
                      setWhatsappLinkEdit(false);
                    }} disabled={updateWhatsappLink.isPending} data-testid="button-save-whatsapp">
                      <Save className="w-4 h-4 mr-1" /> Guardar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setWhatsappLinkEdit(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    {whatsappData?.link ? (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-green-600 dark:text-green-400 truncate">{whatsappData.link}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay enlace configurado.</p>
                    )}
                    <Button size="sm" variant="outline" onClick={() => {
                      setWhatsappLinkValue(whatsappData?.link || "");
                      setWhatsappLinkEdit(true);
                    }} data-testid="button-edit-whatsapp">
                      <Pencil className="w-4 h-4 mr-1" /> {whatsappData?.link ? "Editar" : "Agregar"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={!!selectedUserId} onOpenChange={(open) => { if (!open) setSelectedUserId(null); }}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                {isLoadingDetail ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : userDetail ? (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3" data-testid="text-user-detail-name">
                        <Avatar className="h-10 w-10">
                          {userDetail.user.avatarUrl && <AvatarImage src={userDetail.user.avatarUrl} alt={userDetail.user.displayName || userDetail.user.username} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {(userDetail.user.displayName || userDetail.user.username).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span>{userDetail.user.displayName || userDetail.user.username}</span>
                          <p className="text-sm text-muted-foreground font-normal">@{userDetail.user.username}</p>
                        </div>
                      </DialogTitle>
                      <DialogDescription>Informacion completa del usuario en el sistema</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Datos del Perfil</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Rol:</span>
                              <Badge variant="secondary" className="ml-2" data-testid="badge-user-role">
                                {ROLES[userDetail.user.role as keyof typeof ROLES] || userDetail.user.role}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Estado:</span>
                              <Badge variant={userDetail.user.isActive ? "outline" : "destructive"} className="ml-2" data-testid="badge-user-status">
                                {userDetail.user.isActive ? "Activo" : "Pendiente"}
                              </Badge>
                            </div>
                            <div data-testid="text-user-country">
                              <span className="text-muted-foreground">Pais:</span>{" "}
                              <span>{userDetail.user.country || "No especificado"}</span>
                            </div>
                            <div data-testid="text-user-cargo">
                              <span className="text-muted-foreground">Cargo:</span>{" "}
                              <span>{userDetail.user.cargo || "Sin cargo"}</span>
                            </div>
                            <div className="col-span-2" data-testid="text-user-bio">
                              <span className="text-muted-foreground">Biografia:</span>{" "}
                              <span>{userDetail.user.bio || "Sin biografia"}</span>
                            </div>
                            <div data-testid="text-user-registered">
                              <span className="text-muted-foreground">Registrado:</span>{" "}
                              <span>{userDetail.user.createdAt ? new Date(userDetail.user.createdAt).toLocaleDateString("es") : "N/A"}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Inscripciones en Cursos ({userDetail.enrollments?.length || 0})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {userDetail.enrollments?.length > 0 ? (
                            <div className="space-y-2">
                              {userDetail.enrollments.map((e: any) => (
                                <div key={e.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0" data-testid={`enrollment-${e.id}`}>
                                  <div>
                                    <span className="font-medium">{e.courseName}</span>
                                    <p className="text-xs text-muted-foreground">
                                      Inscrito: {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString("es") : "N/A"}
                                    </p>
                                  </div>
                                  <Badge variant={e.status === "aprobado" ? "default" : e.status === "completado" ? "outline" : "secondary"}>
                                    {ENROLLMENT_STATUSES[e.status as keyof typeof ENROLLMENT_STATUSES] || e.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No tiene inscripciones.</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Publicaciones en Comunidad ({userDetail.posts?.length || 0})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {userDetail.posts?.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {userDetail.posts.slice(0, 10).map((p: any) => (
                                <div key={p.id} className="text-sm border-b pb-2 last:border-0" data-testid={`post-${p.id}`}>
                                  <p className="line-clamp-2">{p.content}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString("es") : ""}
                                  </p>
                                </div>
                              ))}
                              {userDetail.posts.length > 10 && (
                                <p className="text-xs text-muted-foreground">...y {userDetail.posts.length - 10} publicaciones mas.</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No tiene publicaciones.</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Asistencia ({userDetail.attendance?.length || 0} registros)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {userDetail.attendance?.length > 0 ? (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {userDetail.attendance.slice(0, 10).map((a: any) => (
                                <div key={a.id} className="flex items-center justify-between text-sm" data-testid={`attendance-${a.id}`}>
                                  <span className="text-muted-foreground">{a.createdAt ? new Date(a.createdAt).toLocaleDateString("es") : ""}</span>
                                  <Badge variant={a.status === "presente" ? "outline" : a.status === "ausente" ? "destructive" : "secondary"}>
                                    {a.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No tiene registros de asistencia.</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSelectedUserId(null)} data-testid="button-close-detail">Cerrar</Button>
                    </DialogFooter>
                  </>
                ) : null}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Contacto Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Mensajes de Contacto</CardTitle>
                <CardDescription>Mensajes recibidos a traves del formulario de contacto.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMessages ? (
                  <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : !contactMessages?.length ? (
                  <div className="p-12 text-center text-muted-foreground">No hay mensajes de contacto.</div>
                ) : (
                  <div className="space-y-4">
                    {contactMessages.map((msg: any) => (
                      <Card key={msg.id} className={msg.isRead ? "opacity-60" : ""} data-testid={`card-message-${msg.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold">{msg.name}</span>
                                <span className="text-xs text-muted-foreground">({msg.email})</span>
                                {!msg.isRead && <Badge variant="default">Nuevo</Badge>}
                              </div>
                              <div className="text-sm font-medium text-primary mb-1">{msg.subject}</div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.content}</p>
                              <span className="text-xs text-muted-foreground mt-2 block">{msg.createdAt ? new Date(msg.createdAt).toLocaleString('es-ES') : ''}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => toggleMessageRead.mutate(msg.id)} data-testid={`button-toggle-read-${msg.id}`}>
                                {msg.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMessage.mutate(msg.id)} data-testid={`button-delete-message-${msg.id}`}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Publicaciones Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Publicaciones de Miembros</CardTitle>
                <CardDescription>Mensajes publicados por los miembros en la comunidad.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPosts ? (
                  <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : !posts?.length ? (
                  <div className="p-12 text-center text-muted-foreground">No hay publicaciones aun.</div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post: any) => (
                      <Card key={post.id} data-testid={`card-post-${post.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="bg-primary/5 text-primary text-xs">
                                    {(post.user?.username || '??').slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-sm">{post.user?.displayName || post.user?.username || 'Usuario'}</span>
                                <span className="text-xs text-muted-foreground">{post.createdAt ? new Date(post.createdAt).toLocaleString('es-ES') : ''}</span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteMemberPost.mutate(post.id)} data-testid={`button-delete-post-${post.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* En Vivo Tab */}
          <TabsContent value="live">
            <LiveStreamAdmin />
          </TabsContent>
        </Tabs>
      </div>

      {/* Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Editar Evento" : "Nuevo Evento"}</DialogTitle>
            <DialogDescription>{editingEvent ? "Modifica los detalles del evento." : "Completa los datos para crear un nuevo evento."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Titulo *</Label><Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} data-testid="input-event-title" /></div>
            <div><Label>Descripcion *</Label><Textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} className="resize-none" rows={3} data-testid="input-event-description" /></div>
            <div><Label>Ubicacion *</Label><Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} data-testid="input-event-location" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha y Hora Inicio *</Label><Input type="datetime-local" value={eventForm.eventDate} onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })} data-testid="input-event-date" /></div>
              <div><Label>Fecha y Hora Fin</Label><Input type="datetime-local" value={eventForm.eventEndDate} onChange={(e) => setEventForm({ ...eventForm, eventEndDate: e.target.value })} data-testid="input-event-end-date" /></div>
            </div>
            <div><Label>URL de Imagen (opcional)</Label><Input value={eventForm.imageUrl} onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })} data-testid="input-event-image" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={eventForm.isPublished} onCheckedChange={(checked) => setEventForm({ ...eventForm, isPublished: checked })} data-testid="switch-event-published" />
              <Label>Publicar evento</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEventDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEventSubmit} disabled={!eventForm.title || !eventForm.description || !eventForm.location || !eventForm.eventDate || createEvent.isPending || updateEvent.isPending} data-testid="button-submit-event">
              {createEvent.isPending || updateEvent.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editingEvent ? "Guardar Cambios" : "Crear Evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Editar Curso" : "Nuevo Curso"}</DialogTitle>
            <DialogDescription>{editingCourse ? "Modifica los detalles del curso." : "Completa los datos para crear un nuevo curso de capacitacion."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Titulo *</Label><Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} data-testid="input-course-title" /></div>
            <div><Label>Descripcion *</Label><Textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} className="resize-none" rows={3} data-testid="input-course-description" /></div>
            <div><Label>Categoria</Label>
              <Select value={courseForm.category} onValueChange={(v) => setCourseForm({ ...courseForm, category: v })}>
                <SelectTrigger data-testid="select-course-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(COURSE_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Maestro Asignado</Label>
              <Select value={courseForm.teacherId} onValueChange={(v) => setCourseForm({ ...courseForm, teacherId: v })}>
                <SelectTrigger data-testid="select-course-teacher"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {obreros.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.displayName || u.username} ({ROLES[u.role as keyof typeof ROLES]})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Inscripciones</Label>
              <Select value={courseForm.enrollmentStatus} onValueChange={(v) => setCourseForm({ ...courseForm, enrollmentStatus: v })}>
                <SelectTrigger data-testid="select-enrollment-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ENROLLMENT_MODES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {courseForm.enrollmentStatus === "scheduled" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Fecha Apertura</Label><Input type="datetime-local" value={courseForm.enrollmentOpenDate} onChange={(e) => setCourseForm({ ...courseForm, enrollmentOpenDate: e.target.value })} data-testid="input-enrollment-open" /></div>
                <div><Label>Fecha Cierre</Label><Input type="datetime-local" value={courseForm.enrollmentCloseDate} onChange={(e) => setCourseForm({ ...courseForm, enrollmentCloseDate: e.target.value })} data-testid="input-enrollment-close" /></div>
              </div>
            )}
            {courseForm.enrollmentStatus === "open" && (
              <div>
                <Label>Fecha de Cierre Automatico (opcional)</Label>
                <Input type="datetime-local" value={courseForm.enrollmentCloseDate} onChange={(e) => setCourseForm({ ...courseForm, enrollmentCloseDate: e.target.value })} data-testid="input-enrollment-close-auto" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Max Estudiantes</Label><Input type="number" value={courseForm.maxStudents} onChange={(e) => setCourseForm({ ...courseForm, maxStudents: e.target.value })} placeholder="Ilimitado" data-testid="input-course-max-students" /></div>
              <div><Label>URL de Imagen</Label><Input value={courseForm.imageUrl} onChange={(e) => setCourseForm({ ...courseForm, imageUrl: e.target.value })} placeholder="https://..." data-testid="input-course-image" /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={courseForm.isActive} onCheckedChange={(checked) => setCourseForm({ ...courseForm, isActive: checked })} data-testid="switch-course-active" />
              <Label>Curso activo (visible para estudiantes)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCourseDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCourseSubmit} disabled={!courseForm.title || !courseForm.description || createCourse.isPending || updateCourse.isPending} data-testid="button-submit-course">
              {createCourse.isPending || updateCourse.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editingCourse ? "Guardar Cambios" : "Crear Curso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
