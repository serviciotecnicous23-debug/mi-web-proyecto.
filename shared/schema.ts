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
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventEndDate: timestamp("event_end_date"),
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
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
});

export const updateUserSchema = createInsertSchema(users).pick({
  displayName: true,
  bio: true,
  avatarUrl: true,
  country: true,
  phone: true,
  email: true,
}).partial();

export const insertMessageSchema = createInsertSchema(messages);

export const insertMemberPostSchema = createInsertSchema(memberPosts).pick({
  content: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  location: true,
  imageUrl: true,
  isPublished: true,
}).extend({
  eventDate: z.string(),
  eventEndDate: z.string().optional().nullable(),
});

export const updateEventSchema = insertEventSchema.partial();

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
  createdAt: timestamp("created_at").defaultNow(),
});

export const courseSchedule = pgTable("course_schedule", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  meetingUrl: text("meeting_url"),
  meetingPlatform: text("meeting_platform").default("zoom"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
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
  meetingUrl: z.string().optional().nullable(),
  meetingPlatform: z.string().optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMinistryRegionSchema = createInsertSchema(ministryRegions).pick({
  name: true,
  isActive: true,
  sortOrder: true,
});
export const updateMinistryRegionSchema = insertMinistryRegionSchema.partial();
export type MinistryRegion = typeof ministryRegions.$inferSelect;
export type InsertMinistryRegion = z.infer<typeof insertMinistryRegionSchema>;
export type UpdateMinistryRegion = z.infer<typeof updateMinistryRegionSchema>;

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
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

export type PrayerActivity = typeof prayerActivities.$inferSelect;
export type InsertPrayerActivity = z.infer<typeof insertPrayerActivitySchema>;

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

// ========== JUEGO: EL GUARDIAN DE LA LLAMA ==========

export const GAME_DIFFICULTIES = {
  facil: "Facil",
  medio: "Medio",
  dificil: "Dificil",
  experto: "Experto",
} as const;

export const GAME_QUESTION_TYPES = {
  multiple: "Opcion Multiple",
  verdadero_falso: "Verdadero o Falso",
  completar: "Completar",
} as const;

export const gameQuestions = pgTable("game_questions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("multiple"),
  difficulty: text("difficulty").notNull().default("facil"),
  category: text("category").notNull().default("biblia"),
  question: text("question").notNull(),
  options: text("options").array(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  bibleReference: text("bible_reference"),
  points: integer("points").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameProfiles = pgTable("game_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  level: integer("level").notNull().default(1),
  totalPoints: integer("total_points").notNull().default(0),
  energy: integer("energy").notNull().default(15),
  maxEnergy: integer("max_energy").notNull().default(15),
  streak: integer("streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  questionsAnswered: integer("questions_answered").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  currentFlameLevel: integer("current_flame_level").notNull().default(1),
  lastEnergyRefill: timestamp("last_energy_refill").defaultNow(),
  lastPlayedAt: timestamp("last_played_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameAnswers = pgTable("game_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  questionId: integer("question_id").notNull().references(() => gameQuestions.id),
  selectedAnswer: text("selected_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  pointsEarned: integer("points_earned").notNull().default(0),
  difficulty: text("difficulty").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameMissions = pgTable("game_missions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  missionType: text("mission_type").notNull(),
  targetAction: text("target_action").notNull(),
  targetCount: integer("target_count").notNull().default(1),
  rewardEnergy: integer("reward_energy").notNull().default(1),
  rewardPoints: integer("reward_points").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userMissions = pgTable("user_missions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  missionId: integer("mission_id").notNull().references(() => gameMissions.id),
  progress: integer("progress").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const STORY_ACTIVITY_TYPES = {
  completar_versiculo: "Completar Versiculo",
  ordenar_eventos: "Ordenar Eventos",
  parear: "Parear Conceptos",
  comparar_pasajes: "Comparar Pasajes",
  opcion_multiple: "Opcion Multiple",
  verdadero_falso: "Verdadero o Falso",
  reflexion: "Reflexion",
} as const;

export const storyChapters = pgTable("story_chapters", {
  id: serial("id").primaryKey(),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("Antiguo Testamento"),
  bibleBook: text("bible_book"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storyActivities = pgTable("story_activities", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull().references(() => storyChapters.id),
  activityOrder: integer("activity_order").notNull().default(1),
  activityType: text("activity_type").notNull(),
  title: text("title").notNull(),
  instruction: text("instruction").notNull(),
  content: text("content").notNull(),
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  bibleReference: text("bible_reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storyProgress = pgTable("story_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  chapterId: integer("chapter_id").notNull().references(() => storyChapters.id),
  activityId: integer("activity_id").notNull().references(() => storyActivities.id),
  completed: boolean("completed").notNull().default(false),
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type StoryChapter = typeof storyChapters.$inferSelect;
export type StoryActivity = typeof storyActivities.$inferSelect;
export type StoryProgressRecord = typeof storyProgress.$inferSelect;

export const insertGameQuestionSchema = z.object({
  type: z.string().default("multiple"),
  difficulty: z.string().default("facil"),
  category: z.string().default("biblia"),
  question: z.string().min(1),
  options: z.array(z.string()).optional().nullable(),
  correctAnswer: z.string().min(1),
  explanation: z.string().optional().nullable(),
  bibleReference: z.string().optional().nullable(),
  points: z.number().optional(),
});

export const submitAnswerSchema = z.object({
  questionId: z.number(),
  selectedAnswer: z.string().min(1),
});

export type GameQuestion = typeof gameQuestions.$inferSelect;
export type InsertGameQuestion = z.infer<typeof insertGameQuestionSchema>;
export type GameProfile = typeof gameProfiles.$inferSelect;
export type GameAnswer = typeof gameAnswers.$inferSelect;
export type GameMission = typeof gameMissions.$inferSelect;
export type UserMission = typeof userMissions.$inferSelect;

export const cityProfiles = pgTable("city_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  cityName: text("city_name").notNull().default("Nueva Jerusalem"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  gold: integer("gold").notNull().default(100),
  food: integer("food").notNull().default(50),
  wood: integer("wood").notNull().default(80),
  stone: integer("stone").notNull().default(40),
  faith: integer("faith").notNull().default(10),
  population: integer("population").notNull().default(0),
  maxPopulation: integer("max_population").notNull().default(10),
  lastCollectedAt: timestamp("last_collected_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cityTiles = pgTable("city_tiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  buildingKey: text("building_key").notNull(),
  level: integer("level").notNull().default(1),
  state: text("state").notNull().default("ready"),
  plantedAt: timestamp("planted_at"),
  readyAt: timestamp("ready_at"),
  lastHarvestAt: timestamp("last_harvest_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cityMissions = pgTable("city_missions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  bibleReference: text("bible_reference"),
  missionType: text("mission_type").notNull().default("build"),
  targetKey: text("target_key"),
  targetCount: integer("target_count").notNull().default(1),
  rewardGold: integer("reward_gold").notNull().default(0),
  rewardFood: integer("reward_food").notNull().default(0),
  rewardWood: integer("reward_wood").notNull().default(0),
  rewardStone: integer("reward_stone").notNull().default(0),
  rewardFaith: integer("reward_faith").notNull().default(0),
  rewardXp: integer("reward_xp").notNull().default(10),
  requiredLevel: integer("required_level").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const userCityMissions = pgTable("user_city_missions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  missionId: integer("mission_id").notNull().references(() => cityMissions.id),
  progress: integer("progress").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  isClaimed: boolean("is_claimed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  claimedAt: timestamp("claimed_at"),
});

export const cityHelps = pgTable("city_helps", {
  id: serial("id").primaryKey(),
  helperId: integer("helper_id").notNull().references(() => users.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  helpType: text("help_type").notNull().default("boost"),
  tileId: integer("tile_id").references(() => cityTiles.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cityTrades = pgTable("city_trades", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id"),
  offerResource: text("offer_resource").notNull(),
  offerAmount: integer("offer_amount").notNull(),
  requestResource: text("request_resource").notNull(),
  requestAmount: integer("request_amount").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCityProfileSchema = createInsertSchema(cityProfiles).omit({ id: true, createdAt: true });
export const insertCityTileSchema = createInsertSchema(cityTiles).omit({ id: true, createdAt: true });
export const insertCityMissionSchema = createInsertSchema(cityMissions).omit({ id: true });
export const insertCityTradeSchema = createInsertSchema(cityTrades).omit({ id: true, createdAt: true, status: true });

export type CityProfile = typeof cityProfiles.$inferSelect;
export type CityTile = typeof cityTiles.$inferSelect;
export type CityMission = typeof cityMissions.$inferSelect;
export type UserCityMission = typeof userCityMissions.$inferSelect;
export type CityHelp = typeof cityHelps.$inferSelect;
export type CityTrade = typeof cityTrades.$inferSelect;
export type InsertCityProfile = z.infer<typeof insertCityProfileSchema>;
export type InsertCityTile = z.infer<typeof insertCityTileSchema>;
export type InsertCityTrade = z.infer<typeof insertCityTradeSchema>;

export const gameRooms = pgTable("game_rooms", {
  id: serial("id").primaryKey(),
  gameType: text("game_type").notNull(),
  roomCode: text("room_code").notNull(),
  player1Id: integer("player1_id").notNull().references(() => users.id),
  player2Id: integer("player2_id").references(() => users.id),
  status: text("status").notNull().default("waiting"),
  gameState: text("game_state").notNull().default("{}"),
  currentTurn: integer("current_turn"),
  winnerId: integer("winner_id").references(() => users.id),
  isDraw: boolean("is_draw").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameStats = pgTable("game_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: text("game_type").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  draws: integer("draws").notNull().default(0),
});

export const insertGameRoomSchema = createInsertSchema(gameRooms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGameStatsSchema = createInsertSchema(gameStats).omit({ id: true });

export type GameRoom = typeof gameRooms.$inferSelect;
export type InsertGameRoom = z.infer<typeof insertGameRoomSchema>;
export type GameStat = typeof gameStats.$inferSelect;

export const GAME_TYPES = {
  tictactoe: { name: "Tres en Raya", description: "Clasico juego de X y O", icon: "grid3x3", players: 2, category: "estrategia" },
  connect4: { name: "Conecta 4", description: "Conecta cuatro fichas en linea", icon: "circle", players: 2, category: "estrategia" },
  memory: { name: "Memoria", description: "Encuentra los pares de cartas", icon: "brain", players: 2, category: "mental" },
  checkers: { name: "Damas", description: "Juego clasico de damas", icon: "crown", players: 2, category: "estrategia" },
  chess: { name: "Ajedrez", description: "El rey de los juegos de mesa", icon: "castle", players: 2, category: "estrategia" },
  bingo: { name: "Bingo", description: "Bingo en tiempo real", icon: "ticket", players: 2, category: "suerte" },
  domino: { name: "Domino", description: "Juego clasico de fichas", icon: "rectangleHorizontal", players: 2, category: "estrategia" },
} as const;

export const CITY_BUILDINGS = {
  casa: { name: "Casa", category: "vivienda", description: "Hogar para tu pueblo", icon: "home", costGold: 30, costWood: 20, costStone: 10, costFood: 0, costFaith: 0, buildTimeSec: 60, populationAdd: 5, requiredLevel: 1 },
  granja: { name: "Granja de Trigo", category: "produccion", description: "Produce alimento para tu pueblo", icon: "wheat", costGold: 20, costWood: 15, costStone: 0, costFood: 0, costFaith: 0, buildTimeSec: 30, produceResource: "food", produceAmount: 15, produceTimeSec: 120, requiredLevel: 1 },
  vinedo: { name: "Vinedo", category: "produccion", description: "Cultiva uvas para vino y comercio", icon: "grape", costGold: 40, costWood: 10, costStone: 0, costFood: 10, costFaith: 0, buildTimeSec: 45, produceResource: "gold", produceAmount: 20, produceTimeSec: 180, requiredLevel: 2 },
  olivar: { name: "Olivar", category: "produccion", description: "Aceite de oliva para ofrendas", icon: "trees", costGold: 35, costWood: 10, costStone: 0, costFood: 10, costFaith: 0, buildTimeSec: 45, produceResource: "faith", produceAmount: 8, produceTimeSec: 150, requiredLevel: 2 },
  aserradero: { name: "Aserradero", category: "produccion", description: "Produce madera para construccion", icon: "axe", costGold: 25, costWood: 0, costStone: 15, costFood: 10, costFaith: 0, buildTimeSec: 40, produceResource: "wood", produceAmount: 12, produceTimeSec: 120, requiredLevel: 1 },
  cantera: { name: "Cantera", category: "produccion", description: "Extrae piedra para edificaciones", icon: "mountain", costGold: 30, costWood: 15, costStone: 0, costFood: 10, costFaith: 0, buildTimeSec: 50, produceResource: "stone", produceAmount: 10, produceTimeSec: 150, requiredLevel: 2 },
  pozo: { name: "Pozo de Agua", category: "servicio", description: "Agua fresca para tu ciudad", icon: "droplets", costGold: 15, costWood: 10, costStone: 10, costFood: 0, costFaith: 0, buildTimeSec: 20, requiredLevel: 1 },
  mercado: { name: "Mercado", category: "comercio", description: "Centro de comercio e intercambio", icon: "store", costGold: 60, costWood: 30, costStone: 20, costFood: 0, costFaith: 5, buildTimeSec: 90, produceResource: "gold", produceAmount: 25, produceTimeSec: 240, requiredLevel: 3 },
  templo: { name: "Templo", category: "fe", description: "Lugar de adoracion y oracion", icon: "church", costGold: 100, costWood: 40, costStone: 50, costFood: 0, costFaith: 10, buildTimeSec: 120, produceResource: "faith", produceAmount: 15, produceTimeSec: 180, requiredLevel: 3 },
  muralla: { name: "Muralla", category: "defensa", description: "Protege tu ciudad como Nehemias", icon: "brick-wall", costGold: 40, costWood: 10, costStone: 30, costFood: 0, costFaith: 0, buildTimeSec: 60, requiredLevel: 4 },
  granero: { name: "Granero", category: "almacen", description: "Almacena alimento como Jose en Egipto", icon: "warehouse", costGold: 50, costWood: 25, costStone: 15, costFood: 0, costFaith: 0, buildTimeSec: 70, requiredLevel: 3 },
  torre_vigia: { name: "Torre Vigia", category: "defensa", description: "Vigila y protege como los atalayeros", icon: "tower-control", costGold: 45, costWood: 20, costStone: 25, costFood: 0, costFaith: 5, buildTimeSec: 80, requiredLevel: 5 },
  escuela: { name: "Escuela de Profetas", category: "fe", description: "Forma nuevos lideres espirituales", icon: "book-open", costGold: 70, costWood: 30, costStone: 20, costFood: 20, costFaith: 15, buildTimeSec: 100, produceResource: "faith", produceAmount: 20, produceTimeSec: 300, requiredLevel: 5 },
  palacio: { name: "Palacio de Salomon", category: "especial", description: "Corona de tu ciudad biblica", icon: "crown", costGold: 200, costWood: 80, costStone: 100, costFood: 50, costFaith: 30, buildTimeSec: 300, populationAdd: 20, requiredLevel: 8 },
  huerto: { name: "Huerto de Higueras", category: "produccion", description: "Higos dulces como en la tierra prometida", icon: "apple", costGold: 25, costWood: 10, costStone: 0, costFood: 5, costFaith: 0, buildTimeSec: 35, produceResource: "food", produceAmount: 10, produceTimeSec: 90, requiredLevel: 1 },
} as const;

export const CITY_LEVEL_XP = [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500, 5000] as const;

export const CITY_RESOURCES = ["gold", "food", "wood", "stone", "faith"] as const;

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
