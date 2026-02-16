import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type UpdateUser, type InsertEvent, type UpdateEvent, type UpdateSiteContent, type InsertCourse, type UpdateCourse, type InsertCourseMaterial, type UpdateCourseMaterial, type InsertCourseSession, type UpdateCourseSession, type UpdateEnrollment, type UpdateTeacherRequest, type InsertCourseAnnouncement, type UpdateCourseAnnouncement, type InsertCourseSchedule, type UpdateCourseSchedule, type InsertBibleHighlight, type InsertBibleNote, type InsertReadingPlan, type InsertReadingPlanItem, type InsertReadingClubPost, type InsertReadingClubComment, type InsertLibraryResource } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useUser(id: number) {
  return useQuery({
    queryKey: [api.users.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.users.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener usuario");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateUser }) => {
      const url = buildUrl(api.users.update.path, { id });
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error("Error al actualizar perfil");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.users.get.path, data.id] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "Perfil actualizado", description: "Los cambios han sido guardados." });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: [api.admin.listUsers.path],
    queryFn: async () => {
      const res = await fetch(api.admin.listUsers.path);
      if (!res.ok) throw new Error("Error al obtener usuarios");
      return res.json();
    },
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.toggleActive.path, { id });
      const res = await fetch(url, { method: "PATCH" });
      if (!res.ok) throw new Error("Error al cambiar estado");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listUsers.path] });
      toast({
        title: data.isActive ? "Usuario aprobado" : "Usuario desactivado",
        description: data.isActive ? `${data.displayName || data.username} ahora puede acceder al sistema.` : `${data.displayName || data.username} ha sido desactivado.`,
      });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const url = buildUrl(api.admin.updateRole.path, { id });
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
      if (!res.ok) throw new Error("Error al cambiar rol");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listUsers.path] });
      queryClient.invalidateQueries({ queryKey: [api.courses.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.teacherRequests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.teacherRequests.myRequests.path] });
      toast({ title: "Rol actualizado", description: `El rol de ${data.displayName || data.username} ha sido actualizado.` });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.deleteUser.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar usuario");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listUsers.path] });
      toast({ title: "Usuario eliminado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useAdminMessages() {
  return useQuery({
    queryKey: [api.admin.listMessages.path],
    queryFn: async () => {
      const res = await fetch(api.admin.listMessages.path);
      if (!res.ok) throw new Error("Error al obtener mensajes");
      return res.json();
    },
  });
}

export function useToggleMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.toggleMessageRead.path, { id });
      const res = await fetch(url, { method: "PATCH" });
      if (!res.ok) throw new Error("Error al marcar mensaje");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [api.admin.listMessages.path] }); },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.deleteMessage.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar mensaje");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listMessages.path] });
      toast({ title: "Mensaje eliminado" });
    },
  });
}

export function useMemberPosts() {
  return useQuery({
    queryKey: [api.posts.list.path],
    queryFn: async () => {
      const res = await fetch(api.posts.list.path);
      if (!res.ok) throw new Error("Error al obtener publicaciones");
      return res.json();
    },
  });
}

export function useCreateMemberPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ content, imageUrl }: { content: string; imageUrl?: string | null }) => {
      const res = await fetch(api.posts.create.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, imageUrl }) });
      if (!res.ok) throw new Error("Error al publicar mensaje");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      toast({ title: "Mensaje publicado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteMemberPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.posts.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar publicacion");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      toast({ title: "Publicacion eliminada" });
    },
  });
}

export function useEvents() {
  return useQuery({
    queryKey: [api.events.list.path],
    queryFn: async () => {
      const res = await fetch(api.events.list.path);
      if (!res.ok) throw new Error("Error al obtener eventos");
      return res.json();
    },
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: [api.events.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.events.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener evento");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertEvent) => {
      const res = await fetch(api.events.create.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al crear evento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Evento creado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateEvent }) => {
      const url = buildUrl(api.events.update.path, { id });
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error("Error al actualizar evento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Evento actualizado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.events.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar evento");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Evento eliminado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useSiteContent(key: string) {
  return useQuery({
    queryKey: [api.siteContent.get.path, key],
    queryFn: async () => {
      const url = buildUrl(api.siteContent.get.path, { key });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener contenido");
      return res.json();
    },
  });
}

export function useAllSiteContent() {
  return useQuery({
    queryKey: [api.siteContent.list.path],
    queryFn: async () => {
      const res = await fetch(api.siteContent.list.path);
      if (!res.ok) throw new Error("Error al obtener contenido");
      return res.json();
    },
  });
}

export function useUpdateSiteContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ key, data }: { key: string; data: UpdateSiteContent }) => {
      const url = buildUrl(api.siteContent.update.path, { key });
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al actualizar contenido");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.siteContent.get.path, variables.key] });
      queryClient.invalidateQueries({ queryKey: [api.siteContent.list.path] });
      toast({ title: "Contenido actualizado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

// ========== COURSES ==========
export function useCourses(params?: { search?: string; category?: string; teacher?: number }) {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set("search", params.search);
  if (params?.category) queryParams.set("category", params.category);
  if (params?.teacher) queryParams.set("teacher", String(params.teacher));
  const qs = queryParams.toString();

  return useQuery({
    queryKey: [api.courses.list.path, params?.search || "", params?.category || "", params?.teacher || ""],
    queryFn: async () => {
      const res = await fetch(`${api.courses.list.path}${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Error al obtener cursos");
      return res.json();
    },
  });
}

export function useCourse(id: number) {
  return useQuery({
    queryKey: [api.courses.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.courses.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener curso");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertCourse) => {
      const res = await fetch(api.courses.create.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al crear curso");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.courses.list.path] });
      toast({ title: "Curso creado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateCourse }) => {
      const url = buildUrl(api.courses.update.path, { id });
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error("Error al actualizar curso");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courses.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.courses.get.path, variables.id] });
      queryClient.invalidateQueries({ queryKey: [api.teacherRequests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.teacherRequests.myRequests.path] });
      queryClient.invalidateQueries({ queryKey: [api.enrollments.list.path] });
      toast({ title: "Curso actualizado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.courses.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar curso");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.courses.list.path] });
      toast({ title: "Curso eliminado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

// ========== COURSE MATERIALS ==========
export function useCourseMaterials(courseId: number) {
  return useQuery({
    queryKey: [api.courseMaterials.list.path, courseId],
    queryFn: async () => {
      const url = buildUrl(api.courseMaterials.list.path, { courseId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener materiales");
      return res.json();
    },
    enabled: !!courseId,
  });
}

export function useCreateCourseMaterial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertCourseMaterial) => {
      const url = buildUrl(api.courseMaterials.list.path, { courseId: data.courseId });
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al crear material");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courseMaterials.list.path, variables.courseId] });
      toast({ title: "Material agregado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useUpdateCourseMaterial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, courseId, updates }: { id: number; courseId: number; updates: UpdateCourseMaterial }) => {
      const url = buildUrl(api.courseMaterials.update.path, { id });
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error("Error al actualizar material");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courseMaterials.list.path, variables.courseId] });
      toast({ title: "Material actualizado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteCourseMaterial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, courseId }: { id: number; courseId: number }) => {
      const url = buildUrl(api.courseMaterials.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar material");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courseMaterials.list.path, variables.courseId] });
      toast({ title: "Material eliminado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

// ========== COURSE SESSIONS ==========
export function useCourseSessions(courseId: number) {
  return useQuery({
    queryKey: [api.courseSessions.list.path, courseId],
    queryFn: async () => {
      const url = buildUrl(api.courseSessions.list.path, { courseId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener sesiones");
      return res.json();
    },
    enabled: !!courseId,
  });
}

export function useCreateCourseSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertCourseSession) => {
      const url = buildUrl(api.courseSessions.list.path, { courseId: data.courseId });
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al crear sesion");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courseSessions.list.path, variables.courseId] });
      toast({ title: "Sesion programada" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useUpdateCourseSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, courseId, updates }: { id: number; courseId: number; updates: UpdateCourseSession }) => {
      const url = buildUrl(api.courseSessions.update.path, { id });
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error("Error al actualizar sesion");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courseSessions.list.path, variables.courseId] });
      toast({ title: "Sesion actualizada" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteCourseSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, courseId }: { id: number; courseId: number }) => {
      const url = buildUrl(api.courseSessions.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar sesion");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courseSessions.list.path, variables.courseId] });
      toast({ title: "Sesion eliminada" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

// ========== ENROLLMENTS ==========
export function useMyEnrollments() {
  return useQuery({
    queryKey: [api.enrollments.list.path],
    queryFn: async () => {
      const res = await fetch(api.enrollments.list.path);
      if (!res.ok) throw new Error("Error al obtener inscripciones");
      return res.json();
    },
  });
}

export function useCourseEnrollments(courseId: number) {
  return useQuery({
    queryKey: [api.enrollments.listByCourse.path, courseId],
    queryFn: async () => {
      const url = buildUrl(api.enrollments.listByCourse.path, { courseId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener inscripciones");
      return res.json();
    },
    enabled: !!courseId,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (courseId: number) => {
      const res = await fetch(api.enrollments.create.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId }) });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Error al solicitar inscripcion");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.enrollments.list.path] });
      toast({ title: "Inscripcion solicitada", description: "Tu solicitud sera revisada por el profesor o administrador." });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, courseId, updates }: { id: number; courseId: number; updates: UpdateEnrollment }) => {
      const url = buildUrl(api.enrollments.update.path, { id });
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error("Error al actualizar inscripcion");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.enrollments.listByCourse.path, variables.courseId] });
      queryClient.invalidateQueries({ queryKey: [api.enrollments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.courses.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.courses.get.path] });
      toast({ title: "Inscripcion actualizada" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, courseId }: { id: number; courseId: number }) => {
      const url = buildUrl(api.enrollments.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al cancelar inscripcion");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.enrollments.listByCourse.path, variables.courseId] });
      queryClient.invalidateQueries({ queryKey: [api.enrollments.list.path] });
      toast({ title: "Inscripcion cancelada" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useTeacherRequests() {
  return useQuery({
    queryKey: [api.teacherRequests.list.path],
    queryFn: async () => {
      const res = await fetch(api.teacherRequests.list.path);
      if (!res.ok) throw new Error("Error al obtener solicitudes de maestros");
      return res.json();
    },
  });
}

export function useMyTeacherRequests() {
  return useQuery({
    queryKey: [api.teacherRequests.myRequests.path],
    queryFn: async () => {
      const res = await fetch(api.teacherRequests.myRequests.path);
      if (!res.ok) throw new Error("Error al obtener mis solicitudes");
      return res.json();
    },
  });
}

export function useCreateTeacherRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ courseId, message }: { courseId: number; message?: string }) => {
      const res = await fetch(api.teacherRequests.create.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, message }) });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Error al enviar solicitud");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teacherRequests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.teacherRequests.myRequests.path] });
      toast({ title: "Solicitud enviada", description: "Tu solicitud para ensenar este curso sera revisada por el administrador." });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useUpdateTeacherRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateTeacherRequest }) => {
      const url = buildUrl(api.teacherRequests.update.path, { id });
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error("Error al actualizar solicitud");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teacherRequests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.teacherRequests.myRequests.path] });
      queryClient.invalidateQueries({ queryKey: [api.courses.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.courses.get.path] });
      toast({ title: "Solicitud actualizada" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteTeacherRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.teacherRequests.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar solicitud");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teacherRequests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.teacherRequests.myRequests.path] });
      queryClient.invalidateQueries({ queryKey: [api.courses.list.path] });
      toast({ title: "Solicitud eliminada" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

// ========== COURSE ANNOUNCEMENTS ==========
export function useCourseAnnouncements(courseId: number) {
  return useQuery({
    queryKey: [api.courseAnnouncements.list.path, courseId],
    queryFn: async () => {
      const url = buildUrl(api.courseAnnouncements.list.path, { courseId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener anuncios");
      return res.json();
    },
    enabled: !!courseId,
  });
}

export function useCreateCourseAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertCourseAnnouncement) => {
      const url = buildUrl(api.courseAnnouncements.list.path, { courseId: data.courseId });
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al crear anuncio");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courseAnnouncements.list.path, variables.courseId] });
      toast({ title: "Anuncio publicado" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteCourseAnnouncement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, courseId }: { id: number; courseId: number }) => {
      const url = buildUrl(api.courseAnnouncements.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar anuncio");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courseAnnouncements.list.path, variables.courseId] });
      toast({ title: "Anuncio eliminado" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

// ========== COURSE SCHEDULE ==========
export function useCourseSchedule(courseId: number) {
  return useQuery({
    queryKey: [api.courseScheduleEntries.list.path, courseId],
    queryFn: async () => {
      const url = buildUrl(api.courseScheduleEntries.list.path, { courseId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener horario");
      return res.json();
    },
    enabled: !!courseId,
  });
}

export function useCreateCourseScheduleEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertCourseSchedule) => {
      const url = buildUrl(api.courseScheduleEntries.list.path, { courseId: data.courseId });
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al crear horario");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courseScheduleEntries.list.path, variables.courseId] });
      toast({ title: "Horario agregado" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteCourseScheduleEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, courseId }: { id: number; courseId: number }) => {
      const url = buildUrl(api.courseScheduleEntries.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar horario");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.courseScheduleEntries.list.path, variables.courseId] });
      toast({ title: "Horario eliminado" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

// ========== SESSION ATTENDANCE ==========
export function useSessionAttendance(sessionId: number) {
  return useQuery({
    queryKey: [api.sessionAttendance.list.path, sessionId],
    queryFn: async () => {
      const url = buildUrl(api.sessionAttendance.list.path, { sessionId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener asistencia");
      return res.json();
    },
    enabled: !!sessionId,
  });
}

export function useUpsertSessionAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: { sessionId: number; userId: number; status?: string }) => {
      const url = buildUrl(api.sessionAttendance.list.path, { sessionId: data.sessionId });
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al registrar asistencia");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.sessionAttendance.list.path, variables.sessionId] });
      toast({ title: "Asistencia registrada" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

// ========== BIBLIOTECA: BIBLE HIGHLIGHTS ==========
export function useBibleHighlights(book?: string, chapter?: number) {
  const params = new URLSearchParams();
  if (book) params.set("book", book);
  if (chapter !== undefined) params.set("chapter", String(chapter));
  const qs = params.toString();
  return useQuery({
    queryKey: [api.bibleHighlights.list.path, book || "", chapter ?? ""],
    queryFn: async () => {
      const res = await fetch(`${api.bibleHighlights.list.path}${qs ? `?${qs}` : ""}`);
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useCreateBibleHighlight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBibleHighlight) => {
      const res = await fetch(api.bibleHighlights.create.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al crear resaltado");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [api.bibleHighlights.list.path] }); },
  });
}

export function useDeleteBibleHighlight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.bibleHighlights.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar resaltado");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [api.bibleHighlights.list.path] }); },
  });
}

// ========== BIBLIOTECA: BIBLE NOTES ==========
export function useBibleNotes(book?: string, chapter?: number) {
  const params = new URLSearchParams();
  if (book) params.set("book", book);
  if (chapter !== undefined) params.set("chapter", String(chapter));
  const qs = params.toString();
  return useQuery({
    queryKey: [api.bibleNotes.list.path, book || "", chapter ?? ""],
    queryFn: async () => {
      const res = await fetch(`${api.bibleNotes.list.path}${qs ? `?${qs}` : ""}`);
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useCreateBibleNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertBibleNote) => {
      const res = await fetch(api.bibleNotes.create.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al crear nota");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bibleNotes.list.path] });
      toast({ title: "Nota guardada" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteBibleNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.bibleNotes.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar nota");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [api.bibleNotes.list.path] }); },
  });
}

// ========== BIBLIOTECA: READING PLANS ==========
export function useReadingPlans(isPublic?: boolean) {
  return useQuery({
    queryKey: [api.readingPlans.list.path, isPublic ? "public" : "mine"],
    queryFn: async () => {
      const res = await fetch(`${api.readingPlans.list.path}${isPublic ? "?public=true" : ""}`);
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useReadingPlan(id: number) {
  return useQuery({
    queryKey: [api.readingPlans.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.readingPlans.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener plan");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateReadingPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertReadingPlan) => {
      const res = await fetch(api.readingPlans.create.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al crear plan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.readingPlans.list.path] });
      toast({ title: "Plan de lectura creado" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteReadingPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.readingPlans.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar plan");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.readingPlans.list.path] });
      toast({ title: "Plan eliminado" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useAddReadingPlanItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, data }: { planId: number; data: Omit<InsertReadingPlanItem, "planId"> }) => {
      const url = buildUrl(api.readingPlans.addItem.path, { id: planId });
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, planId }) });
      if (!res.ok) throw new Error("Error al agregar lectura");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.readingPlans.get.path, variables.planId] });
    },
  });
}

export function useToggleReadingPlanItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, planId }: { id: number; planId: number }) => {
      const url = buildUrl(api.readingPlans.toggleItem.path, { id });
      const res = await fetch(url, { method: "PATCH" });
      if (!res.ok) throw new Error("Error al actualizar lectura");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.readingPlans.get.path, variables.planId] });
      queryClient.invalidateQueries({ queryKey: [api.readingPlans.list.path] });
    },
  });
}

export function useDeleteReadingPlanItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, planId }: { id: number; planId: number }) => {
      const url = buildUrl(api.readingPlans.deleteItem.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar lectura");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.readingPlans.get.path, variables.planId] });
    },
  });
}

// ========== BIBLIOTECA: READING CLUB ==========
export function useReadingClubPosts() {
  return useQuery({
    queryKey: [api.readingClub.list.path],
    queryFn: async () => {
      const res = await fetch(api.readingClub.list.path);
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useCreateReadingClubPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertReadingClubPost) => {
      const res = await fetch(api.readingClub.create.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al publicar reflexion");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.readingClub.list.path] });
      toast({ title: "Reflexion publicada" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteReadingClubPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.readingClub.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar reflexion");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [api.readingClub.list.path] }); },
  });
}

export function useReadingClubComments(postId: number) {
  return useQuery({
    queryKey: [api.readingClub.listComments.path, postId],
    queryFn: async () => {
      const url = buildUrl(api.readingClub.listComments.path, { id: postId });
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!postId,
  });
}

export function useCreateReadingClubComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const url = buildUrl(api.readingClub.createComment.path, { id: postId });
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, content }) });
      if (!res.ok) throw new Error("Error al comentar");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.readingClub.listComments.path, variables.postId] });
      queryClient.invalidateQueries({ queryKey: [api.readingClub.list.path] });
    },
  });
}

// ========== BIBLIOTECA: READING CLUB LIKES ==========
export function useReadingClubLikedPosts() {
  return useQuery({
    queryKey: ["/api/reading-club/my-likes"],
    queryFn: async () => {
      const res = await fetch("/api/reading-club/my-likes");
      if (!res.ok) return [];
      return res.json() as Promise<number[]>;
    },
  });
}

export function useToggleReadingClubPostLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const url = buildUrl(api.readingClubLikes.toggle.path, { id: postId });
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Error al dar like");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.readingClub.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/reading-club/my-likes"] });
    },
  });
}

// ========== ADMIN: USER INFO ==========
export function useUpdateUserInfo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, cargo, country }: { id: number; cargo: string | null; country: string | null }) => {
      const url = buildUrl(api.admin.updateUserInfo.path, { id });
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cargo, country }) });
      if (!res.ok) throw new Error("Error al actualizar info");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listUsers.path] });
      toast({ title: "Informacion actualizada" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

// ========== WHATSAPP GROUP LINK ==========
export function useWhatsappLink() {
  return useQuery({
    queryKey: [api.admin.getWhatsappLink.path],
    queryFn: async () => {
      const res = await fetch(api.admin.getWhatsappLink.path);
      if (!res.ok) return { link: "" };
      return res.json() as Promise<{ link: string }>;
    },
  });
}

export function useUpdateWhatsappLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (link: string) => {
      const res = await fetch(api.admin.updateWhatsappLink.path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ link }) });
      if (!res.ok) throw new Error("Error al actualizar enlace");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.getWhatsappLink.path] });
      toast({ title: "Enlace de WhatsApp actualizado" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

// ========== BIBLIOTECA: LIBRARY RESOURCES ==========
export function useLibraryResources(category?: string, search?: string) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (search) params.set("search", search);
  const qs = params.toString();
  return useQuery({
    queryKey: [api.libraryResources.list.path, category || "", search || ""],
    queryFn: async () => {
      const res = await fetch(`${api.libraryResources.list.path}${qs ? `?${qs}` : ""}`);
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useCreateLibraryResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertLibraryResource) => {
      const res = await fetch(api.libraryResources.create.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al compartir recurso");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.libraryResources.list.path] });
      toast({ title: "Recurso compartido" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteLibraryResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.libraryResources.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar recurso");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.libraryResources.list.path] });
      toast({ title: "Recurso eliminado" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useToggleLibraryResourceLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.libraryResources.toggleLike.path, { id });
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [api.libraryResources.list.path] }); },
  });
}

export function useLiveStreamConfig() {
  return useQuery({
    queryKey: [api.admin.getLiveStream.path],
    queryFn: async () => {
      const res = await fetch(api.admin.getLiveStream.path);
      if (!res.ok) throw new Error("Error al obtener configuracion");
      return res.json();
    },
    refetchInterval: 15000,
  });
}

export function useUpdateLiveStream() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (config: { sourceType: string; sourceUrl: string; radioUrl: string; title: string; isLive: boolean }) => {
      const res = await fetch(api.admin.updateLiveStream.path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.getLiveStream.path] });
      toast({ title: "Transmision actualizada" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useAdminUserDetail(userId: number | null) {
  return useQuery({
    queryKey: [api.admin.getUserDetail.path, userId],
    queryFn: async () => {
      const url = buildUrl(api.admin.getUserDetail.path, { id: userId! });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener detalles del usuario");
      return res.json();
    },
    enabled: !!userId,
  });
}

// ========== POST COMMENTS ==========
export function usePostComments(postId: number) {
  return useQuery({
    queryKey: [api.postComments.list.path, postId],
    queryFn: async () => {
      const url = buildUrl(api.postComments.list.path, { postId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener comentarios");
      return res.json();
    },
    enabled: !!postId,
  });
}

export function useCreatePostComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const url = buildUrl(api.postComments.create.path, { postId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      });
      if (!res.ok) throw new Error("Error al comentar");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.postComments.list.path, variables.postId] });
      toast({ title: "Comentario publicado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeletePostComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, postId }: { id: number; postId: number }) => {
      const url = buildUrl(api.postComments.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar comentario");
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.postComments.list.path, variables.postId] });
      toast({ title: "Comentario eliminado" });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

// ========== DIRECT MESSAGES ==========
export function useConversations() {
  return useQuery({
    queryKey: [api.directMessages.conversations.path],
    queryFn: async () => {
      const res = await fetch(api.directMessages.conversations.path);
      if (!res.ok) throw new Error("Error al obtener conversaciones");
      return res.json();
    },
    refetchInterval: 10000,
  });
}

export function useDirectMessages(userId: number | null) {
  return useQuery({
    queryKey: [api.directMessages.list.path, userId],
    queryFn: async () => {
      const url = buildUrl(api.directMessages.list.path, { userId: userId! });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener mensajes");
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 5000,
  });
}

export function useSendDirectMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: number; content: string }) => {
      const res = await fetch(api.directMessages.send.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, content }),
      });
      if (!res.ok) throw new Error("Error al enviar mensaje");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.directMessages.list.path, variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: [api.directMessages.conversations.path] });
    },
  });
}

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: [api.directMessages.unreadCount.path],
    queryFn: async () => {
      const res = await fetch(api.directMessages.unreadCount.path);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    refetchInterval: 15000,
  });
}
