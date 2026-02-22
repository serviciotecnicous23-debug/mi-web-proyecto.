import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Users, BookOpen, Calendar, Heart, Download, TrendingUp, GraduationCap, Library } from "lucide-react";

const COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function ReportesPage() {
  const { user } = useAuth();

  const { data: dashboard } = useQuery<any>({
    queryKey: ["/api/reports/dashboard"],
    enabled: user?.role === "admin",
  });

  const { data: memberGrowth } = useQuery<any>({
    queryKey: ["/api/reports/member-growth"],
    enabled: user?.role === "admin",
  });

  const { data: courseStats } = useQuery<any>({
    queryKey: ["/api/reports/course-stats"],
    enabled: user?.role === "admin",
  });

  const { data: prayerStats } = useQuery<any>({
    queryKey: ["/api/reports/prayer"],
    enabled: user?.role === "admin",
  });

  const { data: libraryStats } = useQuery<any>({
    queryKey: ["/api/reports/library"],
    enabled: user?.role === "admin",
  });

  if (!user || user.role !== "admin") {
    return (
      <Layout>
        <div className="container mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold text-red-500">Acceso Denegado</h1>
          <p className="text-muted-foreground mt-2">Solo administradores pueden ver los reportes.</p>
        </div>
      </Layout>
    );
  }

  const handleExport = () => {
    window.open("/api/reports/enrollments/export", "_blank");
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-orange-600">Reportes y Estadísticas</h1>
            <p className="text-muted-foreground">Panel de análisis del ministerio</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exportar Inscripciones
          </Button>
        </div>

        {/* Dashboard Cards */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card><CardContent className="p-4 text-center"><Users className="h-8 w-8 mx-auto text-blue-500 mb-2" /><div className="text-2xl font-bold">{dashboard.totalUsers}</div><div className="text-xs text-muted-foreground">Miembros ({dashboard.activeUsers} activos)</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><BookOpen className="h-8 w-8 mx-auto text-green-500 mb-2" /><div className="text-2xl font-bold">{dashboard.totalCourses}</div><div className="text-xs text-muted-foreground">Cursos ({dashboard.activeCourses} activos)</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><GraduationCap className="h-8 w-8 mx-auto text-purple-500 mb-2" /><div className="text-2xl font-bold">{dashboard.totalEnrollments}</div><div className="text-xs text-muted-foreground">Inscripciones ({dashboard.completedEnrollments} completadas)</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><Calendar className="h-8 w-8 mx-auto text-orange-500 mb-2" /><div className="text-2xl font-bold">{dashboard.totalEvents}</div><div className="text-xs text-muted-foreground">Eventos</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><Heart className="h-8 w-8 mx-auto text-red-500 mb-2" /><div className="text-2xl font-bold">{dashboard.totalPrayerActivities}</div><div className="text-xs text-muted-foreground">Actividades de Oración</div></CardContent></Card>
          </div>
        )}

        <Tabs defaultValue="members">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members">Miembros</TabsTrigger>
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="prayer">Oración</TabsTrigger>
            <TabsTrigger value="library">Biblioteca</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Crecimiento de Miembros por Mes</CardTitle></CardHeader>
              <CardContent>
                {memberGrowth?.monthly && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={memberGrowth.monthly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f97316" name="Nuevos Miembros" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Miembros por País</CardTitle></CardHeader>
              <CardContent>
                {memberGrowth?.byCountry && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={memberGrowth.byCountry} dataKey="count" nameKey="country" cx="50%" cy="50%" outerRadius={100} label>
                        {memberGrowth.byCountry.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card>
              <CardHeader><CardTitle>Estadísticas de Cursos</CardTitle></CardHeader>
              <CardContent>
                {courseStats && Array.isArray(courseStats) && (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={courseStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="title" width={150} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="enrolled" fill="#22c55e" name="Inscritos" />
                      <Bar dataKey="completed" fill="#3b82f6" name="Completados" />
                      <Bar dataKey="pending" fill="#eab308" name="Pendientes" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prayer" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Actividades de Oración por Mes</CardTitle></CardHeader>
              <CardContent>
                {prayerStats?.activities && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={prayerStats.activities}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#f97316" name="Actividades" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Participantes en Oración por Mes</CardTitle></CardHeader>
              <CardContent>
                {prayerStats?.attendees && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={prayerStats.attendees}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="Participantes" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Library className="h-5 w-5" /> Recursos por Categoría</CardTitle></CardHeader>
              <CardContent>
                {libraryStats?.byCategory && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={libraryStats.byCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                        {libraryStats.byCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {libraryStats?.planStats && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p><strong>Planes de Lectura:</strong> {libraryStats.planStats.completed} de {libraryStats.planStats.total} capítulos completados</p>
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
