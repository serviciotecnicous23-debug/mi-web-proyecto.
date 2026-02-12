import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useCourse, useCourseMaterials, useCourseSessions, useMyEnrollments,
  useCourseAnnouncements, useCourseSchedule,
} from "@/hooks/use-users";
import { Layout } from "@/components/layout";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, BookOpen, Calendar, Clock, Video, FileText, Link as LinkIcon,
  Music, Presentation, ExternalLink, ArrowLeft, Users, Bell, MapPin,
  CheckCircle2, GraduationCap, Timer, Megaphone, CalendarDays,
} from "lucide-react";
import {
  COURSE_CATEGORIES, MATERIAL_TYPES, DAYS_OF_WEEK, MEETING_PLATFORMS,
  ENROLLMENT_STATUSES,
} from "@shared/schema";
import type { CourseMaterial, CourseSession, CourseScheduleEntry, CourseAnnouncement } from "@shared/schema";

const materialIcons: Record<string, any> = {
  documento: FileText,
  video: Video,
  enlace: LinkIcon,
  audio: Music,
  presentacion: Presentation,
};

export default function AulaVirtual({ params }: { params: { id: string } }) {
  const courseId = parseInt(params.id);
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: course, isLoading } = useCourse(courseId);
  const { data: materials } = useCourseMaterials(courseId);
  const { data: sessions } = useCourseSessions(courseId);
  const { data: myEnrollments } = useMyEnrollments();
  const { data: announcements } = useCourseAnnouncements(courseId);
  const { data: schedule } = useCourseSchedule(courseId);

  if (authLoading) {
    return <Layout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }
  if (!user) { setLocation("/login"); return null; }

  const myEnrollment = myEnrollments?.find((e: any) => e.courseId === courseId);
  const isEnrolled = myEnrollment && (myEnrollment.status === "aprobado" || myEnrollment.status === "completado");
  const isTeacher = course?.teacherId === user?.id;
  const isAdmin = user?.role === "admin";
  const hasAccess = isEnrolled || isTeacher || isAdmin;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-xl font-semibold mb-2">Curso no encontrado</h2>
          <Link href="/mis-capacitaciones">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-1" /> Volver</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (!hasAccess) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
          <p className="text-muted-foreground mb-4">Debes estar inscrito y aprobado en este curso para acceder al aula virtual.</p>
          <Link href={`/capacitaciones/${courseId}`}>
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-1" /> Ver Detalles del Curso</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const now = new Date();
  const upcomingSessions = sessions?.filter((s: CourseSession) => !s.isCompleted && new Date(s.sessionDate) >= now)
    .sort((a: CourseSession, b: CourseSession) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()) || [];
  const pastSessions = sessions?.filter((s: CourseSession) => s.isCompleted || new Date(s.sessionDate) < now)
    .sort((a: CourseSession, b: CourseSession) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()) || [];
  const completedSessions = sessions?.filter((s: CourseSession) => s.isCompleted)?.length || 0;
  const totalSessions = sessions?.length || 0;
  const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const nextSession = upcomingSessions[0];
  const todayDay = now.getDay();
  const todaySchedule = schedule?.filter((s: CourseScheduleEntry) => s.dayOfWeek === todayDay && s.isActive) || [];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/mis-capacitaciones">
              <Button variant="ghost" size="icon" data-testid="button-back-aula">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold" data-testid="text-aula-title">{course.title}</h1>
                <Badge variant="secondary">
                  {COURSE_CATEGORIES[course.category as keyof typeof COURSE_CATEGORIES] || course.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Aula Virtual</p>
            </div>
          </div>
          {isTeacher && (
            <Link href="/maestro">
              <Button variant="outline" size="sm" data-testid="button-goto-teacher-panel">
                Panel del Maestro
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card data-testid="card-progress">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{progress}%</p>
                  <p className="text-xs text-muted-foreground">Progreso del Curso</p>
                </div>
              </div>
              <div className="mt-3 w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{completedSessions} de {totalSessions} sesiones completadas</p>
            </CardContent>
          </Card>

          <Card data-testid="card-next-session">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{nextSession ? nextSession.title : "Sin sesiones"}</p>
                  <p className="text-xs text-muted-foreground">
                    {nextSession
                      ? new Date(nextSession.sessionDate).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                      : "No hay proximas clases"}
                  </p>
                </div>
              </div>
              {nextSession?.meetingUrl && (
                <a href={nextSession.meetingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                  <Button className="w-full" size="sm" data-testid="button-join-next-session">
                    <Video className="w-4 h-4 mr-1" /> Unirse a Clase
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-my-status">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  {isTeacher ? (
                    <>
                      <p className="text-sm font-semibold">Maestro</p>
                      <p className="text-xs text-muted-foreground">Eres el maestro de este curso</p>
                    </>
                  ) : myEnrollment ? (
                    <>
                      <Badge variant={myEnrollment.status === "aprobado" ? "default" : "secondary"}>
                        {ENROLLMENT_STATUSES[myEnrollment.status as keyof typeof ENROLLMENT_STATUSES]}
                      </Badge>
                      {myEnrollment.grade && (
                        <p className="text-xs mt-1">Calificacion: <span className="font-semibold">{myEnrollment.grade}</span></p>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {todaySchedule.length > 0 && (
          <Card className="mb-6 border-primary/30" data-testid="card-today-schedule">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-primary" />
                <p className="font-semibold text-sm">Clases de Hoy</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {todaySchedule.map((s: CourseScheduleEntry) => (
                  <div key={s.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50" data-testid={`today-schedule-${s.id}`}>
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">{s.startTime} - {s.endTime}</span>
                    {s.description && <span className="text-xs text-muted-foreground">({s.description})</span>}
                    {s.meetingUrl && (
                      <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" data-testid={`button-join-today-${s.id}`}>
                          <Video className="w-3 h-3 mr-1" /> Unirse
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="sessions" data-testid="tab-aula-sessions"><Calendar className="w-4 h-4 mr-1" /> Sesiones</TabsTrigger>
            <TabsTrigger value="schedule" data-testid="tab-aula-schedule"><CalendarDays className="w-4 h-4 mr-1" /> Horario</TabsTrigger>
            <TabsTrigger value="materials" data-testid="tab-aula-materials"><FileText className="w-4 h-4 mr-1" /> Materiales</TabsTrigger>
            <TabsTrigger value="announcements" data-testid="tab-aula-announcements"><Megaphone className="w-4 h-4 mr-1" /> Anuncios</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <div className="space-y-4">
              {upcomingSessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" /> Proximas Clases
                    </CardTitle>
                    <CardDescription>{upcomingSessions.length} sesion(es) programada(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingSessions.map((s: CourseSession) => (
                      <SessionCard key={s.id} session={s} isUpcoming />
                    ))}
                  </CardContent>
                </Card>
              )}

              {pastSessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-muted-foreground" /> Clases Anteriores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pastSessions.map((s: CourseSession) => (
                      <SessionCard key={s.id} session={s} isUpcoming={false} />
                    ))}
                  </CardContent>
                </Card>
              )}

              {!sessions?.length && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No hay sesiones programadas aun.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" /> Horario Semanal
                </CardTitle>
                <CardDescription>Horario regular de clases para este curso</CardDescription>
              </CardHeader>
              <CardContent>
                {schedule && schedule.length > 0 ? (
                  <div className="space-y-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                      const dayEntries = schedule.filter((s: CourseScheduleEntry) => s.dayOfWeek === day && s.isActive);
                      if (dayEntries.length === 0) return null;
                      return (
                        <div key={day} className={`flex flex-wrap items-center gap-3 p-3 rounded-md ${day === todayDay ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`} data-testid={`schedule-day-${day}`}>
                          <div className="w-24 shrink-0">
                            <p className={`font-semibold text-sm ${day === todayDay ? 'text-primary' : ''}`}>
                              {DAYS_OF_WEEK[day as keyof typeof DAYS_OF_WEEK]}
                            </p>
                            {day === todayDay && <Badge variant="default" className="text-xs mt-1">Hoy</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-2 flex-1">
                            {dayEntries.map((entry: CourseScheduleEntry) => (
                              <div key={entry.id} className="flex items-center gap-2 p-2 rounded-md bg-background" data-testid={`schedule-entry-${entry.id}`}>
                                <Clock className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-sm font-medium">{entry.startTime} - {entry.endTime}</span>
                                {entry.description && <span className="text-xs text-muted-foreground">- {entry.description}</span>}
                                {entry.meetingUrl && (
                                  <a href={entry.meetingUrl} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="outline">
                                      <Video className="w-3 h-3 mr-1" />
                                      {MEETING_PLATFORMS[entry.meetingPlatform as keyof typeof MEETING_PLATFORMS] || "Enlace"}
                                    </Button>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No hay horario semanal configurado para este curso.</p>
                    <p className="text-xs text-muted-foreground mt-1">El maestro puede configurar el horario desde el Panel del Maestro.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Materiales y Recursos
                </CardTitle>
                <CardDescription>{materials?.length || 0} recurso(s) disponible(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {materials && materials.length > 0 ? (
                  <div className="space-y-2">
                    {materials.map((m: CourseMaterial) => {
                      const Icon = materialIcons[m.materialType] || FileText;
                      return (
                        <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50" data-testid={`aula-material-${m.id}`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 shrink-0">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{m.title}</p>
                              {m.description && <p className="text-xs text-muted-foreground truncate">{m.description}</p>}
                              <Badge variant="outline" className="text-xs mt-1">
                                {MATERIAL_TYPES[m.materialType as keyof typeof MATERIAL_TYPES] || m.materialType}
                              </Badge>
                            </div>
                          </div>
                          {m.fileUrl && (
                            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" data-testid={`button-open-material-${m.id}`}>
                                <ExternalLink className="w-4 h-4 mr-1" /> Abrir
                              </Button>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No hay materiales disponibles aun.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" /> Anuncios del Curso
                </CardTitle>
                <CardDescription>Comunicaciones del maestro</CardDescription>
              </CardHeader>
              <CardContent>
                {announcements && announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((a: CourseAnnouncement & { author: { username: string; displayName: string | null } }) => (
                      <div key={a.id} className={`p-4 rounded-md ${a.isPinned ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'}`} data-testid={`announcement-${a.id}`}>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {a.isPinned && <MapPin className="w-4 h-4 text-primary" />}
                          <h3 className="font-semibold text-sm">{a.title}</h3>
                        </div>
                        <p className="text-sm whitespace-pre-wrap mb-3">{a.content}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{a.author.displayName || a.author.username}</span>
                          <span>-</span>
                          <span>{new Date(a.createdAt!).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No hay anuncios publicados.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function SessionCard({ session, isUpcoming }: { session: CourseSession; isUpcoming: boolean }) {
  const sessionDate = new Date(session.sessionDate);
  const now = new Date();
  const isHappeningNow = isUpcoming && sessionDate <= now && session.duration
    ? now <= new Date(sessionDate.getTime() + session.duration * 60000)
    : false;
  const timeUntil = isUpcoming ? getTimeUntil(sessionDate) : null;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-md ${isHappeningNow ? 'bg-primary/10 border border-primary/30' : session.isCompleted ? 'bg-muted/30' : 'bg-muted/50'}`} data-testid={`aula-session-${session.id}`}>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="font-semibold text-sm">{session.title}</p>
          {isHappeningNow && <Badge variant="default">En Vivo</Badge>}
          {session.isCompleted && <Badge variant="secondary">Completada</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {sessionDate.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
        {session.duration && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Timer className="w-3 h-3" /> Duracion: {session.duration} min
          </p>
        )}
        {session.description && <p className="text-xs text-muted-foreground mt-1">{session.description}</p>}
        {isUpcoming && timeUntil && !isHappeningNow && (
          <p className="text-xs text-primary mt-1 font-medium">{timeUntil}</p>
        )}
        {session.meetingPlatform && (
          <div className="flex items-center gap-1 mt-1">
            <Badge variant="outline" className="text-xs">
              {MEETING_PLATFORMS[session.meetingPlatform as keyof typeof MEETING_PLATFORMS] || session.meetingPlatform}
            </Badge>
          </div>
        )}
      </div>
      {session.meetingUrl && (isUpcoming || isHappeningNow) && (
        <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant={isHappeningNow ? "default" : "outline"} data-testid={`button-join-aula-session-${session.id}`}>
            <Video className="w-4 h-4 mr-1" /> {isHappeningNow ? "Unirse Ahora" : "Enlace de Reunion"}
          </Button>
        </a>
      )}
    </div>
  );
}

function getTimeUntil(date: Date): string | null {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `En ${days} dia(s) y ${hours} hora(s)`;
  if (hours > 0) return `En ${hours} hora(s) y ${minutes} minuto(s)`;
  return `En ${minutes} minuto(s)`;
}
