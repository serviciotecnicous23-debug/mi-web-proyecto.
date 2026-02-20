import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("miembro"),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(false),
  cargo: text("cargo"),
  country: text("country"),
  phone: text("phone"),
  email: text("email"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  youtube: text("youtube"),
  tiktok: text("tiktok"),
  twitter: text("twitter"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const MINISTRY_POSITIONS = [
  "Pastor", "Evangelista", "Coordinador", "Lider de Alabanza",
  "Maestro", "Diacono", "Misionero", "Intercesor", "Ujier",
  "Lider de Jovenes", "Lider de Ninos", "Tesorero", "Secretario",
] as const;

export const MINISTRY_COUNTRIES = [
  "Estados Unidos", "Venezuela", "Peru", "Colombia", "Mexico",
  "Guatemala", "Honduras", "El Salvador", "Nicaragua", "Costa Rica", "Panama",
  "Ecuador", "Chile", "Argentina", "Brasil", "Bolivia", "Paraguay", "Uruguay",
  "Republica Dominicana", "Cuba", "Puerto Rico", "Espana",
  "Otro",
] as const;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memberPosts = pgTable("member_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventEndDate: timestamp("event_end_date"),
  location: text("location").notNull(),
  meetingUrl: text("meeting_url"),
  meetingPlatform: text("meeting_platform"),
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("confirmado"),
  reminder: boolean("reminder").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  sectionKey: text("section_key").notNull().unique(),
  title: text("title"),
  content: text("content"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("general"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  maxStudents: integer("max_students"),
  teacherId: integer("teacher_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courseMaterials = pgTable("course_materials", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"),
  materialType: text("material_type").notNull().default("documento"),
  // file attachment attributes
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  fileData: text("file_data"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courseSessions = pgTable("course_sessions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  sessionDate: timestamp("session_date").notNull(),
  duration: integer("duration"),
  meetingUrl: text("meeting_url"),
  meetingPlatform: text("meeting_platform").default("zoom"),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  status: text("status").notNull().default("solicitado"),
  grade: text("grade"),
  observations: text("observations"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
  isActive: true,
  country: true,
  phone: true,
  email: true,
  facebook: true,
  instagram: true,
  youtube: true,
  tiktok: true,
  twitter: true,
  website: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  displayName: true,
  bio: true,
  avatarUrl: true,
  country: true,
  phone: true,
  email: true,
  username: true,
  facebook: true,
  instagram: true,
  youtube: true,
  tiktok: true,
  twitter: true,
  website: true,
}).partial();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
});

export const insertMessageSchema = createInsertSchema(messages);

export const insertMemberPostSchema = createInsertSchema(memberPosts).pick({
  content: true,
  imageUrl: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  location: true,
  meetingUrl: true,
  meetingPlatform: true,
  imageUrl: true,
  isPublished: true,
}).extend({
  eventDate: z.string(),
  eventEndDate: z.string().optional().nullable(),
  meetingUrl: z.string().optional().nullable(),
  meetingPlatform: z.string().optional().nullable(),
});

export const updateEventSchema = insertEventSchema.partial();

export const insertEventRsvpSchema = z.object({
  eventId: z.number(),
  status: z.enum(["confirmado", "tal_vez", "no_asistire"]).optional(),
  reminder: z.boolean().optional(),
});

export const updateSiteContentSchema = z.object({
  title: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  category: true,
  imageUrl: true,
  isActive: true,
  maxStudents: true,
  teacherId: true,
});

export const updateCourseSchema = insertCourseSchema.partial();

export const insertCourseMaterialSchema = createInsertSchema(courseMaterials).pick({
  courseId: true,
  title: true,
  description: true,
  fileUrl: true,
  materialType: true,
  fileName: true,
  fileSize: true,
  fileData: true,
  sortOrder: true,
});

export const updateCourseMaterialSchema = insertCourseMaterialSchema.omit({ courseId: true }).partial();

export const insertCourseSessionSchema = createInsertSchema(courseSessions).pick({
  courseId: true,
  title: true,
  description: true,
  duration: true,
  meetingUrl: true,
  meetingPlatform: true,
}).extend({
  sessionDate: z.string(),
});

export const updateCourseSessionSchema = insertCourseSessionSchema.omit({ courseId: true }).partial().extend({
  isCompleted: z.boolean().optional(),
});

export const insertEnrollmentSchema = z.object({
  courseId: z.number(),
});

export const updateEnrollmentSchema = z.object({
  status: z.enum(["solicitado", "aprobado", "rechazado", "completado"]).optional(),
  grade: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type MemberPost = typeof memberPosts.$inferSelect;
export type InsertMemberPost = z.infer<typeof insertMemberPostSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type SiteContent = typeof siteContent.$inferSelect;
export type UpdateSiteContent = z.infer<typeof updateSiteContentSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type UpdateCourse = z.infer<typeof updateCourseSchema>;
export type CourseMaterial = typeof courseMaterials.$inferSelect;
export type InsertCourseMaterial = z.infer<typeof insertCourseMaterialSchema>;
export type UpdateCourseMaterial = z.infer<typeof updateCourseMaterialSchema>;
export type CourseSession = typeof courseSessions.$inferSelect;
export type InsertCourseSession = z.infer<typeof insertCourseSessionSchema>;
export type UpdateCourseSession = z.infer<typeof updateCourseSessionSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type UpdateEnrollment = z.infer<typeof updateEnrollmentSchema>;

export const teacherRequests = pgTable("teacher_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  status: text("status").notNull().default("solicitado"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeacherRequestSchema = z.object({
  courseId: z.number(),
  message: z.string().optional().nullable(),
});

export const updateTeacherRequestSchema = z.object({
  status: z.enum(["solicitado", "aprobado", "rechazado"]),
});

export type TeacherRequest = typeof teacherRequests.$inferSelect;
export type InsertTeacherRequest = z.infer<typeof insertTeacherRequestSchema>;
export type UpdateTeacherRequest = z.infer<typeof updateTeacherRequestSchema>;

export const courseAnnouncements = pgTable("course_announcements", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  // file attachment optional fields
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  fileData: text("file_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courseSchedule = pgTable("course_schedule", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  specificDate: text("specific_date"),
  meetingUrl: text("meeting_url"),
  meetingPlatform: text("meeting_platform").default("zoom"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
});

// ========== CARTELERA CENTRAL ==========
export const carteleraAnnouncements = pgTable("cartelera_announcements", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  isPinned: boolean("is_pinned").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  // file attachment support
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  fileData: text("file_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessionAttendance = pgTable("session_attendance", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => courseSessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("presente"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseAnnouncementSchema = z.object({
  courseId: z.number(),
  title: z.string().min(1),
  content: z.string().min(1),
  isPinned: z.boolean().optional(),
});

export const updateCourseAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  isPinned: z.boolean().optional(),
});

export const insertCourseScheduleSchema = z.object({
  courseId: z.number(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  specificDate: z.string().optional().nullable(),
  meetingUrl: z.string().optional().nullable(),
  meetingPlatform: z.string().optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const insertCarteleraAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().optional(),
  isPinned: z.boolean().optional(),
  expiresAt: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  fileData: z.string().optional().nullable(),
});
export const updateCarteleraAnnouncementSchema = insertCarteleraAnnouncementSchema.partial();
export type CarteleraAnnouncement = typeof carteleraAnnouncements.$inferSelect;
export type InsertCarteleraAnnouncement = z.infer<typeof insertCarteleraAnnouncementSchema>;
export type UpdateCarteleraAnnouncement = z.infer<typeof updateCarteleraAnnouncementSchema>;

export const updateCourseScheduleSchema = insertCourseScheduleSchema.omit({ courseId: true }).partial();

export const insertSessionAttendanceSchema = z.object({
  sessionId: z.number(),
  userId: z.number(),
  status: z.enum(["presente", "ausente", "tardanza", "excusado"]).optional(),
});

export type CourseAnnouncement = typeof courseAnnouncements.$inferSelect;
export type InsertCourseAnnouncement = z.infer<typeof insertCourseAnnouncementSchema>;
export type UpdateCourseAnnouncement = z.infer<typeof updateCourseAnnouncementSchema>;
export type CourseScheduleEntry = typeof courseSchedule.$inferSelect;
export type InsertCourseSchedule = z.infer<typeof insertCourseScheduleSchema>;
export type UpdateCourseSchedule = z.infer<typeof updateCourseScheduleSchema>;
export type SessionAttendance = typeof sessionAttendance.$inferSelect;
export type InsertSessionAttendance = z.infer<typeof insertSessionAttendanceSchema>;

export const DAYS_OF_WEEK = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado",
} as const;

export const MEETING_PLATFORMS = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  teams: "Microsoft Teams",
  otro: "Otro",
} as const;

export const CARTELERA_CATEGORIES = {
  general: "General",
  urgente: "Urgente",
  academico: "Academico",
  evento: "Evento",
  devocional: "Devocional",
} as const;

export const ATTENDANCE_STATUSES = {
  presente: "Presente",
  ausente: "Ausente",
  tardanza: "Tardanza",
  excusado: "Excusado",
} as const;

export const TEACHER_REQUEST_STATUSES = {
  solicitado: "Solicitado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
} as const;

export const ROLES = {
  admin: "Administrador",
  obrero: "Maestro",
  miembro: "Miembro",
  usuario: "Usuario",
} as const;

export const MINISTRY_REGIONS = [
  "Venezuela", "Peru", "Estados Unidos",
] as const;

export const ministryRegions = pgTable("ministry_regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  facebook: text("facebook"),
  instagram: text("instagram"),
  youtube: text("youtube"),
  tiktok: text("tiktok"),
  twitter: text("twitter"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMinistryRegionSchema = createInsertSchema(ministryRegions).pick({
  name: true,
  isActive: true,
  sortOrder: true,
  facebook: true,
  instagram: true,
  youtube: true,
  tiktok: true,
  twitter: true,
  website: true,
});
export const updateMinistryRegionSchema = insertMinistryRegionSchema.partial();
export type MinistryRegion = typeof ministryRegions.$inferSelect;
export type InsertMinistryRegion = z.infer<typeof insertMinistryRegionSchema>;
export type UpdateMinistryRegion = z.infer<typeof updateMinistryRegionSchema>;

// ========== IGLESIAS (COBERTURA Y RESPALDO) ==========

export const CHURCH_TYPES = {
  cobertura: "Iglesia Cobertura",
  respaldo: "Iglesia en Respaldo",
} as const;

export const ministryChurches = pgTable("ministry_churches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  churchType: text("church_type").notNull().default("respaldo"),
  pastor: text("pastor"),
  city: text("city"),
  country: text("country"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  description: text("description"),
  imageUrl: text("image_url"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  youtube: text("youtube"),
  tiktok: text("tiktok"),
  twitter: text("twitter"),
  website: text("website"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMinistryChurchSchema = createInsertSchema(ministryChurches).pick({
  name: true,
  churchType: true,
  pastor: true,
  city: true,
  country: true,
  address: true,
  phone: true,
  email: true,
  description: true,
  imageUrl: true,
  facebook: true,
  instagram: true,
  youtube: true,
  tiktok: true,
  twitter: true,
  website: true,
  isActive: true,
  sortOrder: true,
});
export const updateMinistryChurchSchema = insertMinistryChurchSchema.partial();
export type MinistryChurch = typeof ministryChurches.$inferSelect;
export type InsertMinistryChurch = z.infer<typeof insertMinistryChurchSchema>;
export type UpdateMinistryChurch = z.infer<typeof updateMinistryChurchSchema>;

export const churchPosts = pgTable("church_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  churchId: integer("church_id").notNull().references(() => ministryChurches.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChurchPostSchema = z.object({
  churchId: z.number(),
  content: z.string().min(1),
  imageUrl: z.string().optional().nullable(),
});

export type ChurchPost = typeof churchPosts.$inferSelect;
export type InsertChurchPost = z.infer<typeof insertChurchPostSchema>;

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  role: text("role").notNull(),
  description: text("description"),
  verse: text("verse"),
  initials: text("initials"),
  avatarUrl: text("avatar_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  userId: true,
  name: true,
  role: true,
  description: true,
  verse: true,
  initials: true,
  avatarUrl: true,
  sortOrder: true,
  isActive: true,
});
export const updateTeamMemberSchema = insertTeamMemberSchema.partial();
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type UpdateTeamMember = z.infer<typeof updateTeamMemberSchema>;

export const ENROLLMENT_STATUSES = {
  solicitado: "Solicitado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  completado: "Completado",
} as const;

export const MATERIAL_TYPES = {
  documento: "Documento",
  video: "Video",
  enlace: "Enlace",
  audio: "Audio",
  presentacion: "Presentacion",
} as const;

export const COURSE_CATEGORIES = {
  general: "General",
  doctrina: "Doctrina",
  liderazgo: "Liderazgo",
  evangelismo: "Evangelismo",
  adoracion: "Adoracion",
  consejeria: "Consejeria",
  ninos: "Ministerio Infantil",
  jovenes: "Jovenes",
} as const;

// ========== BIBLIOTECA ==========

export const bibleHighlights = pgTable("bible_highlights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  book: text("book").notNull(),
  chapter: integer("chapter").notNull(),
  verseStart: integer("verse_start").notNull(),
  verseEnd: integer("verse_end").notNull(),
  color: text("color").notNull().default("#FFA500"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bibleNotes = pgTable("bible_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  book: text("book").notNull(),
  chapter: integer("chapter").notNull(),
  verse: integer("verse").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const readingPlans = pgTable("reading_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const readingPlanItems = pgTable("reading_plan_items", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => readingPlans.id),
  book: text("book").notNull(),
  chapter: integer("chapter").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const readingClubPosts = pgTable("reading_club_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  book: text("book").notNull(),
  chapter: integer("chapter").notNull(),
  verseStart: integer("verse_start"),
  verseEnd: integer("verse_end"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const readingClubComments = pgTable("reading_club_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => readingClubPosts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const readingClubPostLikes = pgTable("reading_club_post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => readingClubPosts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const libraryResources = pgTable("library_resources", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  resourceType: text("resource_type").notNull().default("documento"),
  fileData: text("file_data"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  category: text("category").notNull().default("general"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const libraryResourceLikes = pgTable("library_resource_likes", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => libraryResources.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBibleHighlightSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().min(1),
  verseStart: z.number().min(1),
  verseEnd: z.number().min(1),
  color: z.string().optional(),
  note: z.string().optional().nullable(),
});

export const insertBibleNoteSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().min(1),
  verse: z.number().min(1),
  content: z.string().min(1),
});

export const insertReadingPlanSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
});

export const insertReadingPlanItemSchema = z.object({
  planId: z.number(),
  book: z.string().min(1),
  chapter: z.number().min(1),
  sortOrder: z.number().optional(),
});

export const insertReadingClubPostSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().min(1),
  verseStart: z.number().optional().nullable(),
  verseEnd: z.number().optional().nullable(),
  content: z.string().min(1),
});

export const insertReadingClubCommentSchema = z.object({
  postId: z.number(),
  content: z.string().min(1),
});

export const insertLibraryResourceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  resourceType: z.string().optional(),
  fileData: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  category: z.string().optional(),
});

export type BibleHighlight = typeof bibleHighlights.$inferSelect;
export type InsertBibleHighlight = z.infer<typeof insertBibleHighlightSchema>;
export type BibleNote = typeof bibleNotes.$inferSelect;
export type InsertBibleNote = z.infer<typeof insertBibleNoteSchema>;
export type ReadingPlan = typeof readingPlans.$inferSelect;
export type InsertReadingPlan = z.infer<typeof insertReadingPlanSchema>;
export type ReadingPlanItem = typeof readingPlanItems.$inferSelect;
export type InsertReadingPlanItem = z.infer<typeof insertReadingPlanItemSchema>;
export type ReadingClubPost = typeof readingClubPosts.$inferSelect;
export type InsertReadingClubPost = z.infer<typeof insertReadingClubPostSchema>;
export type ReadingClubComment = typeof readingClubComments.$inferSelect;
export type InsertReadingClubComment = z.infer<typeof insertReadingClubCommentSchema>;
export type LibraryResource = typeof libraryResources.$inferSelect;
export type InsertLibraryResource = z.infer<typeof insertLibraryResourceSchema>;
export type LibraryResourceLike = typeof libraryResourceLikes.$inferSelect;

// ========== NOTIFICACIONES ==========

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull().default("general"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  link: text("link"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = z.object({
  userId: z.number(),
  type: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
  link: z.string().optional().nullable(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// ========== ACTIVIDADES DE ORACION ==========

export const prayerActivities = pgTable("prayer_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  meetingUrl: text("meeting_url"),
  meetingPlatform: text("meeting_platform").default("zoom"),
  scheduledDate: timestamp("scheduled_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPrayerActivitySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  meetingUrl: z.string().optional().nullable(),
  meetingPlatform: z.string().optional(),
  scheduledDate: z.string().optional().nullable(),
});

export const updatePrayerActivitySchema = insertPrayerActivitySchema.partial();
export type PrayerActivity = typeof prayerActivities.$inferSelect;
export type InsertPrayerActivity = z.infer<typeof insertPrayerActivitySchema>;
export type UpdatePrayerActivity = z.infer<typeof updatePrayerActivitySchema>;

// ========== ASISTENCIA A ORACION ==========

export const prayerAttendees = pgTable("prayer_attendees", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull().references(() => prayerActivities.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("confirmado"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPrayerAttendeeSchema = z.object({
  activityId: z.number(),
  status: z.enum(["confirmado", "tal_vez", "no_asistire"]).optional(),
});

export type PrayerAttendee = typeof prayerAttendees.$inferSelect;
export type InsertPrayerAttendee = z.infer<typeof insertPrayerAttendeeSchema>;

// ========== PUBLICACIONES REGIONALES ==========

export const regionPosts = pgTable("region_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  region: text("region").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRegionPostSchema = z.object({
  region: z.string().min(1),
  content: z.string().min(1),
  imageUrl: z.string().optional().nullable(),
});

export type RegionPost = typeof regionPosts.$inferSelect;
export type InsertRegionPost = z.infer<typeof insertRegionPostSchema>;

// ========== REACCIONES REGIONALES ==========

export const REACTION_TYPES = {
  fuego: "Fuego",
  oracion: "Oracion",
  amen: "Amen",
  corazon: "Corazon",
  alabanza: "Alabanza",
} as const;

export const regionPostReactions = pgTable("region_post_reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => regionPosts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  reactionType: text("reaction_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type RegionPostReaction = typeof regionPostReactions.$inferSelect;

// ========== ENCUESTAS REGIONALES ==========

export const regionPostPolls = pgTable("region_post_polls", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => regionPosts.id),
  question: text("question").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const regionPostPollOptions = pgTable("region_post_poll_options", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => regionPostPolls.id),
  optionText: text("option_text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const regionPostPollVotes = pgTable("region_post_poll_votes", {
  id: serial("id").primaryKey(),
  optionId: integer("option_id").notNull().references(() => regionPostPollOptions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRegionPostPollSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
});

export type RegionPostPoll = typeof regionPostPolls.$inferSelect;
export type RegionPostPollOption = typeof regionPostPollOptions.$inferSelect;
export type RegionPostPollVote = typeof regionPostPollVotes.$inferSelect;

export const HIGHLIGHT_COLORS = {
  "#FFA500": "Naranja",
  "#FFD700": "Amarillo",
  "#90EE90": "Verde",
  "#87CEEB": "Azul",
  "#DDA0DD": "Morado",
  "#FFB6C1": "Rosa",
} as const;

export const RESOURCE_CATEGORIES = {
  general: "General",
  estudio: "Estudio Biblico",
  devocional: "Devocional",
  teologia: "Teologia",
  sermones: "Sermones",
  musica: "Musica",
  jovenes: "Jovenes",
  ninos: "Ninos",
} as const;

export const BIBLE_BOOKS = [
  "Genesis", "Exodo", "Levitico", "Numeros", "Deuteronomio",
  "Josue", "Jueces", "Rut", "1 Samuel", "2 Samuel",
  "1 Reyes", "2 Reyes", "1 Cronicas", "2 Cronicas",
  "Esdras", "Nehemias", "Ester", "Job", "Salmos",
  "Proverbios", "Eclesiastes", "Cantares", "Isaias", "Jeremias",
  "Lamentaciones", "Ezequiel", "Daniel", "Oseas", "Joel",
  "Amos", "Abdias", "Jonas", "Miqueas", "Nahum",
  "Habacuc", "Sofonias", "Hageo", "Zacarias", "Malaquias",
  "Mateo", "Marcos", "Lucas", "Juan", "Hechos",
  "Romanos", "1 Corintios", "2 Corintios", "Galatas", "Efesios",
  "Filipenses", "Colosenses", "1 Tesalonicenses", "2 Tesalonicenses",
  "1 Timoteo", "2 Timoteo", "Tito", "Filemon", "Hebreos",
  "Santiago", "1 Pedro", "2 Pedro", "1 Juan", "2 Juan",
  "3 Juan", "Judas", "Apocalipsis",
] as const;

export const BIBLE_CHAPTERS: Record<string, number> = {
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

// ========== COMENTARIOS EN PUBLICACIONES ==========

export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => memberPosts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPostCommentSchema = z.object({
  postId: z.number(),
  content: z.string().min(1),
});

export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;

// ========== MENSAJES DIRECTOS ==========

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDirectMessageSchema = z.object({
  receiverId: z.number(),
  content: z.string().min(1),
});

export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;

// ========== AMISTADES ==========

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  addresseeId: integer("addressee_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const FRIENDSHIP_STATUSES = {
  pending: "Pendiente",
  accepted: "Aceptado",
  rejected: "Rechazado",
} as const;

export type Friendship = typeof friendships.$inferSelect;
