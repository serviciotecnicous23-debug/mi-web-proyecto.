import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCourses, useCreateEnrollment, useMyEnrollments } from "@/hooks/use-users";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, BookOpen, Users, Clock, MapPin, GraduationCap } from "lucide-react";
import { COURSE_CATEGORIES, ENROLLMENT_STATUSES } from "@shared/schema";
import type { Course } from "@shared/schema";

export default function Capacitaciones() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { data: courses, isLoading } = useCourses({ search: searchQuery, category: categoryFilter !== "all" ? categoryFilter : undefined });
  const { data: myEnrollments } = useMyEnrollments();
  const createEnrollment = useCreateEnrollment();

  const enrollmentMap = new Map<number, string>();
  if (myEnrollments) {
    myEnrollments.forEach((e: any) => {
      enrollmentMap.set(e.courseId, e.status);
    });
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <GraduationCap className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold mb-2" data-testid="text-capacitaciones-title">Capacitaciones</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explora nuestros cursos de formacion ministerial. Inscribete y crece en tu llamado.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-courses"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-category-filter">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorias</SelectItem>
              {Object.entries(COURSE_CATEGORIES).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !courses?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No se encontraron cursos disponibles.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course: Course) => {
              const enrollmentStatus = enrollmentMap.get(course.id);
              return (
                <Card key={course.id} className="flex flex-col" data-testid={`card-course-${course.id}`}>
                  {course.imageUrl && (
                    <div className="h-40 overflow-hidden rounded-t-md">
                      <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="flex-1">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {COURSE_CATEGORIES[course.category as keyof typeof COURSE_CATEGORIES] || course.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-capacity-${course.id}`}>
                        <Users className="w-3 h-3" /> {(course as any).enrolledCount || 0}{course.maxStudents ? `/${course.maxStudents}` : ""} inscritos
                      </span>
                    </div>
                    <CardTitle className="text-lg mt-2" data-testid={`text-course-title-${course.id}`}>{course.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {enrollmentStatus ? (
                        <Badge
                          variant={enrollmentStatus === "aprobado" ? "default" : enrollmentStatus === "completado" ? "secondary" : "outline"}
                          data-testid={`badge-enrollment-${course.id}`}
                        >
                          {ENROLLMENT_STATUSES[enrollmentStatus as keyof typeof ENROLLMENT_STATUSES] || enrollmentStatus}
                        </Badge>
                      ) : user?.isActive ? (
                        <Button
                          size="sm"
                          onClick={() => createEnrollment.mutate(course.id)}
                          disabled={createEnrollment.isPending}
                          data-testid={`button-enroll-${course.id}`}
                        >
                          {createEnrollment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <GraduationCap className="w-4 h-4 mr-1" />}
                          Inscribirse
                        </Button>
                      ) : !user ? (
                        <Link href="/login">
                          <Button size="sm" variant="outline">Inicia sesion para inscribirte</Button>
                        </Link>
                      ) : null}
                      <Link href={`/capacitaciones/${course.id}`}>
                        <Button size="sm" variant="ghost" data-testid={`button-view-course-${course.id}`}>
                          Ver detalles
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
