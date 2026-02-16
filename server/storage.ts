import { db } from "./db";
import {
  users, messages, memberPosts, events, siteContent,
  courses, courseMaterials, courseSessions, enrollments, teacherRequests,
  courseAnnouncements, courseSchedule, sessionAttendance,
  bibleHighlights, bibleNotes, readingPlans, readingPlanItems,
  readingClubPosts, readingClubComments, readingClubPostLikes, libraryResources, libraryResourceLikes,
  notifications, prayerActivities, regionPosts,
  regionPostReactions, regionPostPolls, regionPostPollOptions, regionPostPollVotes,
  type User, type InsertUser, type UpdateUser,
  type Message, type InsertMessage,
  type MemberPost,
  type Event, type InsertEvent, type UpdateEvent,
  type SiteContent, type UpdateSiteContent,
  type Course, type InsertCourse, type UpdateCourse,
  type CourseMaterial, type InsertCourseMaterial, type UpdateCourseMaterial,
  type CourseSession, type InsertCourseSession, type UpdateCourseSession,
  type Enrollment, type UpdateEnrollment,
  type TeacherRequest, type UpdateTeacherRequest,
  type CourseAnnouncement, type InsertCourseAnnouncement, type UpdateCourseAnnouncement,
  type CourseScheduleEntry, type InsertCourseSchedule, type UpdateCourseSchedule,
  type SessionAttendance, type InsertSessionAttendance,
  type BibleHighlight, type InsertBibleHighlight,
  type BibleNote, type InsertBibleNote,
  type ReadingPlan, type InsertReadingPlan,
  type ReadingPlanItem, type InsertReadingPlanItem,
  type ReadingClubPost, type InsertReadingClubPost,
  type ReadingClubComment, type InsertReadingClubComment,
  type LibraryResource, type InsertLibraryResource,
  type LibraryResourceLike,
  type Notification, type InsertNotification,
  type PrayerActivity, type InsertPrayerActivity,
  type RegionPost, type InsertRegionPost,
  type RegionPostPoll, type RegionPostPollOption, type RegionPostPollVote, type RegionPostReaction,
  ministryRegions, teamMembers,
  type MinistryRegion, type InsertMinistryRegion, type UpdateMinistryRegion,
  type TeamMember, type InsertTeamMember, type UpdateTeamMember,
} from "@shared/schema";
import { eq, desc, asc, and, ilike, or, sql, inArray, ne } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  listPendingUsers(): Promise<User[]>;
  toggleUserActive(id: number): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  createMessage(message: InsertMessage): Promise<Message>;
  listMessages(): Promise<Message[]>;
  toggleMessageRead(id: number): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<void>;

  createMemberPost(userId: number, content: string): Promise<MemberPost>;
  listMemberPosts(): Promise<(MemberPost & { user: { username: string; displayName: string | null; avatarUrl: string | null; cargo: string | null; country: string | null } })[]>;
  deleteMemberPost(id: number): Promise<void>;

  createEvent(event: InsertEvent & { createdBy: number }): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  listEvents(): Promise<Event[]>;
  listPublishedEvents(): Promise<Event[]>;
  updateEvent(id: number, updates: UpdateEvent): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<void>;

  getSiteContent(key: string): Promise<SiteContent | undefined>;
  listSiteContent(): Promise<SiteContent[]>;
  upsertSiteContent(key: string, data: UpdateSiteContent, updatedBy: number): Promise<SiteContent>;

  createCourse(course: InsertCourse & { createdBy: number }): Promise<Course>;
  getCourse(id: number): Promise<Course | undefined>;
  listCourses(): Promise<Course[]>;
  listActiveCourses(): Promise<Course[]>;
  listCoursesByTeacher(teacherId: number): Promise<Course[]>;
  searchCourses(query: string, category?: string): Promise<Course[]>;
  updateCourse(id: number, updates: UpdateCourse): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<void>;

  createCourseMaterial(material: InsertCourseMaterial): Promise<CourseMaterial>;
  listCourseMaterials(courseId: number): Promise<CourseMaterial[]>;
  updateCourseMaterial(id: number, updates: UpdateCourseMaterial): Promise<CourseMaterial | undefined>;
  deleteCourseMaterial(id: number): Promise<void>;

  createCourseSession(session: InsertCourseSession): Promise<CourseSession>;
  listCourseSessions(courseId: number): Promise<CourseSession[]>;
  updateCourseSession(id: number, updates: UpdateCourseSession): Promise<CourseSession | undefined>;
  deleteCourseSession(id: number): Promise<void>;

  createEnrollment(userId: number, courseId: number): Promise<Enrollment>;
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentByUserAndCourse(userId: number, courseId: number): Promise<Enrollment | undefined>;
  listEnrollmentsByUser(userId: number): Promise<(Enrollment & { course: Course })[]>;
  listEnrollmentsByCourse(courseId: number): Promise<(Enrollment & { user: { id: number; username: string; displayName: string | null; role: string } })[]>;
  updateEnrollment(id: number, updates: UpdateEnrollment): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<void>;

  createTeacherRequest(userId: number, courseId: number, message?: string | null): Promise<TeacherRequest>;
  getTeacherRequestByUserAndCourse(userId: number, courseId: number): Promise<TeacherRequest | undefined>;
  listTeacherRequests(): Promise<(TeacherRequest & { user: { id: number; username: string; displayName: string | null; role: string }; course: { id: number; title: string } })[]>;
  listTeacherRequestsByUser(userId: number): Promise<(TeacherRequest & { course: Course })[]>;
  updateTeacherRequest(id: number, updates: UpdateTeacherRequest): Promise<TeacherRequest | undefined>;
  deleteTeacherRequest(id: number): Promise<void>;

  createCourseAnnouncement(data: InsertCourseAnnouncement & { authorId: number }): Promise<CourseAnnouncement>;
  listCourseAnnouncements(courseId: number): Promise<(CourseAnnouncement & { author: { username: string; displayName: string | null } })[]>;
  updateCourseAnnouncement(id: number, updates: UpdateCourseAnnouncement): Promise<CourseAnnouncement | undefined>;
  deleteCourseAnnouncement(id: number): Promise<void>;

  createCourseScheduleEntry(data: InsertCourseSchedule): Promise<CourseScheduleEntry>;
  listCourseSchedule(courseId: number): Promise<CourseScheduleEntry[]>;
  updateCourseScheduleEntry(id: number, updates: UpdateCourseSchedule): Promise<CourseScheduleEntry | undefined>;
  deleteCourseScheduleEntry(id: number): Promise<void>;

  upsertSessionAttendance(data: InsertSessionAttendance): Promise<SessionAttendance>;
  listSessionAttendance(sessionId: number): Promise<(SessionAttendance & { user: { id: number; username: string; displayName: string | null } })[]>;
  listPostsByUser(userId: number): Promise<MemberPost[]>;
  listAttendanceByUser(userId: number): Promise<SessionAttendance[]>;

  // Biblioteca
  createBibleHighlight(userId: number, data: InsertBibleHighlight): Promise<BibleHighlight>;
  listBibleHighlights(userId: number, book?: string, chapter?: number): Promise<BibleHighlight[]>;
  deleteBibleHighlight(id: number): Promise<void>;

  createBibleNote(userId: number, data: InsertBibleNote): Promise<BibleNote>;
  listBibleNotes(userId: number, book?: string, chapter?: number): Promise<BibleNote[]>;
  updateBibleNote(id: number, content: string): Promise<BibleNote | undefined>;
  deleteBibleNote(id: number): Promise<void>;

  createReadingPlan(userId: number, data: InsertReadingPlan): Promise<ReadingPlan>;
  getReadingPlan(id: number): Promise<ReadingPlan | undefined>;
  listReadingPlans(userId: number): Promise<ReadingPlan[]>;
  listPublicReadingPlans(): Promise<(ReadingPlan & { user: { username: string; displayName: string | null } })[]>;
  deleteReadingPlan(id: number): Promise<void>;
  addReadingPlanItem(data: InsertReadingPlanItem): Promise<ReadingPlanItem>;
  listReadingPlanItems(planId: number): Promise<ReadingPlanItem[]>;
  toggleReadingPlanItem(id: number): Promise<ReadingPlanItem | undefined>;
  deleteReadingPlanItem(id: number): Promise<void>;

  createReadingClubPost(userId: number, data: InsertReadingClubPost): Promise<ReadingClubPost>;
  listReadingClubPosts(): Promise<(ReadingClubPost & { user: { id: number; username: string; displayName: string | null; avatarUrl: string | null }; commentCount: number; likeCount: number })[]>;
  deleteReadingClubPost(id: number): Promise<void>;
  toggleReadingClubPostLike(postId: number, userId: number): Promise<{ liked: boolean }>;
  getUserLikedPosts(userId: number): Promise<number[]>;
  createReadingClubComment(userId: number, data: InsertReadingClubComment): Promise<ReadingClubComment>;
  listReadingClubComments(postId: number): Promise<(ReadingClubComment & { user: { id: number; username: string; displayName: string | null; avatarUrl: string | null } })[]>;
  deleteReadingClubComment(id: number): Promise<void>;

  updateUserInfo(id: number, cargo: string | null, country: string | null): Promise<User | undefined>;

  createNotification(data: InsertNotification): Promise<Notification>;
  createNotificationForAll(data: Omit<InsertNotification, "userId">): Promise<void>;
  listNotifications(userId: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;

  createPrayerActivity(userId: number, data: InsertPrayerActivity): Promise<PrayerActivity>;
  listPrayerActivities(): Promise<(PrayerActivity & { user: { username: string; displayName: string | null } })[]>;
  deletePrayerActivity(id: number): Promise<void>;

  createRegionPost(userId: number, data: InsertRegionPost): Promise<RegionPost>;
  listRegionPosts(region?: string): Promise<(RegionPost & { user: { username: string; displayName: string | null; avatarUrl: string | null; country: string | null } })[]>;
  deleteRegionPost(id: number): Promise<void>;

  listMinistryRegions(): Promise<MinistryRegion[]>;
  createMinistryRegion(data: InsertMinistryRegion): Promise<MinistryRegion>;
  updateMinistryRegion(id: number, data: UpdateMinistryRegion): Promise<MinistryRegion | undefined>;
  deleteMinistryRegion(id: number): Promise<void>;

  listTeamMembers(): Promise<TeamMember[]>;
  createTeamMember(data: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: number, data: UpdateTeamMember): Promise<TeamMember | undefined>;
  deleteTeamMember(id: number): Promise<void>;

  createLibraryResource(userId: number, data: InsertLibraryResource): Promise<LibraryResource>;
  listLibraryResources(category?: string, search?: string): Promise<(LibraryResource & { user: { username: string; displayName: string | null }; likeCount: number })[]>;
  deleteLibraryResource(id: number): Promise<void>;
  toggleLibraryResourceLike(resourceId: number, userId: number): Promise<{ liked: boolean }>;
  getUserLikedResources(userId: number): Promise<number[]>;

  toggleRegionPostReaction(postId: number, userId: number, reactionType: string): Promise<{ added: boolean }>;
  getRegionPostReactions(postId: number): Promise<{ reactionType: string; count: number; users: number[] }[]>;

  createRegionPostPoll(postId: number, question: string, options: string[]): Promise<RegionPostPoll>;
  getRegionPostPoll(postId: number): Promise<{ poll: RegionPostPoll; options: (RegionPostPollOption & { voteCount: number })[] } | null>;
  voteRegionPostPoll(optionId: number, userId: number): Promise<{ success: boolean }>;
  getUserPollVote(postId: number, userId: number): Promise<number | null>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async listPendingUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, false)).orderBy(desc(users.createdAt));
  }

  async toggleUserActive(id: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const [updatedUser] = await db
      .update(users)
      .set({ isActive: !user.isActive })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.userId, id));
    await db.delete(memberPosts).where(eq(memberPosts.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async listMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async toggleMessageRead(id: number): Promise<Message | undefined> {
    const [msg] = await db.select().from(messages).where(eq(messages.id, id));
    if (!msg) return undefined;
    const [updated] = await db
      .update(messages)
      .set({ isRead: !msg.isRead })
      .where(eq(messages.id, id))
      .returning();
    return updated;
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async createMemberPost(userId: number, content: string): Promise<MemberPost> {
    const [post] = await db.insert(memberPosts).values({ userId, content }).returning();
    return post;
  }

  async listMemberPosts(): Promise<(MemberPost & { user: { username: string; displayName: string | null; avatarUrl: string | null; cargo: string | null; country: string | null } })[]> {
    const posts = await db
      .select({
        id: memberPosts.id,
        userId: memberPosts.userId,
        content: memberPosts.content,
        createdAt: memberPosts.createdAt,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        cargo: users.cargo,
        country: users.country,
      })
      .from(memberPosts)
      .innerJoin(users, eq(memberPosts.userId, users.id))
      .orderBy(desc(memberPosts.createdAt));
    return posts.map((p) => ({
      id: p.id,
      userId: p.userId,
      content: p.content,
      createdAt: p.createdAt,
      user: { username: p.username, displayName: p.displayName, avatarUrl: p.avatarUrl, cargo: p.cargo, country: p.country },
    }));
  }

  async deleteMemberPost(id: number): Promise<void> {
    await db.delete(memberPosts).where(eq(memberPosts.id, id));
  }

  async createEvent(event: InsertEvent & { createdBy: number }): Promise<Event> {
    const [created] = await db.insert(events).values({
      title: event.title,
      description: event.description,
      eventDate: new Date(event.eventDate),
      eventEndDate: event.eventEndDate ? new Date(event.eventEndDate) : null,
      location: event.location,
      imageUrl: event.imageUrl || null,
      isPublished: event.isPublished ?? true,
      createdBy: event.createdBy,
    }).returning();
    return created;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async listEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.eventDate));
  }

  async listPublishedEvents(): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.isPublished, true)).orderBy(desc(events.eventDate));
  }

  async updateEvent(id: number, updates: UpdateEvent): Promise<Event | undefined> {
    const updateData: any = { ...updates };
    if (updates.eventDate) updateData.eventDate = new Date(updates.eventDate);
    if (updates.eventEndDate) updateData.eventEndDate = new Date(updates.eventEndDate);
    if (updates.eventEndDate === null) updateData.eventEndDate = null;
    const [updated] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getSiteContent(key: string): Promise<SiteContent | undefined> {
    const [content] = await db.select().from(siteContent).where(eq(siteContent.sectionKey, key));
    return content;
  }

  async listSiteContent(): Promise<SiteContent[]> {
    return await db.select().from(siteContent).orderBy(siteContent.sectionKey);
  }

  async upsertSiteContent(key: string, data: UpdateSiteContent, updatedBy: number): Promise<SiteContent> {
    const existing = await this.getSiteContent(key);
    if (existing) {
      const [updated] = await db
        .update(siteContent)
        .set({ ...data, updatedAt: new Date(), updatedBy })
        .where(eq(siteContent.sectionKey, key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(siteContent).values({
        sectionKey: key,
        ...data,
        updatedBy,
      }).returning();
      return created;
    }
  }

  async createCourse(course: InsertCourse & { createdBy: number }): Promise<Course> {
    const [created] = await db.insert(courses).values({
      title: course.title,
      description: course.description,
      category: course.category || "general",
      imageUrl: course.imageUrl || null,
      isActive: course.isActive ?? true,
      maxStudents: course.maxStudents || null,
      teacherId: course.teacherId || null,
      createdBy: course.createdBy,
    }).returning();
    return created;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async listCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async listActiveCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isActive, true)).orderBy(desc(courses.createdAt));
  }

  async listCoursesByTeacher(teacherId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.teacherId, teacherId)).orderBy(desc(courses.createdAt));
  }

  async searchCourses(query: string, category?: string): Promise<Course[]> {
    const conditions = [eq(courses.isActive, true)];
    if (category && category !== "all") {
      conditions.push(eq(courses.category, category));
    }
    if (query) {
      conditions.push(
        or(
          ilike(courses.title, `%${query}%`),
          ilike(courses.description, `%${query}%`),
        )!
      );
    }
    return await db.select().from(courses).where(and(...conditions)).orderBy(desc(courses.createdAt));
  }

  async updateCourse(id: number, updates: UpdateCourse): Promise<Course | undefined> {
    const [updated] = await db
      .update(courses)
      .set(updates)
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.courseId, id));
    await db.delete(courseMaterials).where(eq(courseMaterials.courseId, id));
    await db.delete(courseSessions).where(eq(courseSessions.courseId, id));
    await db.delete(courses).where(eq(courses.id, id));
  }

  async createCourseMaterial(material: InsertCourseMaterial): Promise<CourseMaterial> {
    const [created] = await db.insert(courseMaterials).values(material).returning();
    return created;
  }

  async listCourseMaterials(courseId: number): Promise<CourseMaterial[]> {
    return await db.select().from(courseMaterials)
      .where(eq(courseMaterials.courseId, courseId))
      .orderBy(courseMaterials.sortOrder);
  }

  async updateCourseMaterial(id: number, updates: UpdateCourseMaterial): Promise<CourseMaterial | undefined> {
    const [updated] = await db
      .update(courseMaterials)
      .set(updates)
      .where(eq(courseMaterials.id, id))
      .returning();
    return updated;
  }

  async deleteCourseMaterial(id: number): Promise<void> {
    await db.delete(courseMaterials).where(eq(courseMaterials.id, id));
  }

  async createCourseSession(session: InsertCourseSession): Promise<CourseSession> {
    const [created] = await db.insert(courseSessions).values({
      courseId: session.courseId,
      title: session.title,
      description: session.description || null,
      sessionDate: new Date(session.sessionDate),
      duration: session.duration || null,
      meetingUrl: session.meetingUrl || null,
      meetingPlatform: session.meetingPlatform || "zoom",
    }).returning();
    return created;
  }

  async listCourseSessions(courseId: number): Promise<CourseSession[]> {
    return await db.select().from(courseSessions)
      .where(eq(courseSessions.courseId, courseId))
      .orderBy(courseSessions.sessionDate);
  }

  async updateCourseSession(id: number, updates: UpdateCourseSession): Promise<CourseSession | undefined> {
    const updateData: any = { ...updates };
    if (updates.sessionDate) updateData.sessionDate = new Date(updates.sessionDate);
    const [updated] = await db
      .update(courseSessions)
      .set(updateData)
      .where(eq(courseSessions.id, id))
      .returning();
    return updated;
  }

  async deleteCourseSession(id: number): Promise<void> {
    await db.delete(courseSessions).where(eq(courseSessions.id, id));
  }

  async createEnrollment(userId: number, courseId: number): Promise<Enrollment> {
    const [created] = await db.insert(enrollments).values({
      userId,
      courseId,
      status: "solicitado",
    }).returning();
    return created;
  }

  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async getEnrollmentByUserAndCourse(userId: number, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return enrollment;
  }

  async listEnrollmentsByUser(userId: number): Promise<(Enrollment & { course: Course })[]> {
    const rows = await db
      .select({
        id: enrollments.id,
        userId: enrollments.userId,
        courseId: enrollments.courseId,
        status: enrollments.status,
        grade: enrollments.grade,
        observations: enrollments.observations,
        enrolledAt: enrollments.enrolledAt,
        completedAt: enrollments.completedAt,
        courseTitle: courses.title,
        courseDescription: courses.description,
        courseCategory: courses.category,
        courseImageUrl: courses.imageUrl,
        courseIsActive: courses.isActive,
        courseMaxStudents: courses.maxStudents,
        courseTeacherId: courses.teacherId,
        courseCreatedBy: courses.createdBy,
        courseCreatedAt: courses.createdAt,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt));

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      courseId: r.courseId,
      status: r.status,
      grade: r.grade,
      observations: r.observations,
      enrolledAt: r.enrolledAt,
      completedAt: r.completedAt,
      course: {
        id: r.courseId,
        title: r.courseTitle,
        description: r.courseDescription,
        category: r.courseCategory,
        imageUrl: r.courseImageUrl,
        isActive: r.courseIsActive,
        maxStudents: r.courseMaxStudents,
        teacherId: r.courseTeacherId,
        createdBy: r.courseCreatedBy,
        createdAt: r.courseCreatedAt,
      },
    }));
  }

  async listEnrollmentsByCourse(courseId: number): Promise<(Enrollment & { user: { id: number; username: string; displayName: string | null; role: string } })[]> {
    const rows = await db
      .select({
        id: enrollments.id,
        userId: enrollments.userId,
        courseId: enrollments.courseId,
        status: enrollments.status,
        grade: enrollments.grade,
        observations: enrollments.observations,
        enrolledAt: enrollments.enrolledAt,
        completedAt: enrollments.completedAt,
        username: users.username,
        displayName: users.displayName,
        userRole: users.role,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .where(eq(enrollments.courseId, courseId))
      .orderBy(desc(enrollments.enrolledAt));

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      courseId: r.courseId,
      status: r.status,
      grade: r.grade,
      observations: r.observations,
      enrolledAt: r.enrolledAt,
      completedAt: r.completedAt,
      user: { id: r.userId, username: r.username, displayName: r.displayName, role: r.userRole },
    }));
  }

  async updateEnrollment(id: number, updates: UpdateEnrollment): Promise<Enrollment | undefined> {
    const updateData: any = { ...updates };
    if (updates.status === "completado") {
      updateData.completedAt = new Date();
    }
    const [updated] = await db
      .update(enrollments)
      .set(updateData)
      .where(eq(enrollments.id, id))
      .returning();
    return updated;
  }

  async deleteEnrollment(id: number): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.id, id));
  }

  async createTeacherRequest(userId: number, courseId: number, message?: string | null): Promise<TeacherRequest> {
    const [request] = await db.insert(teacherRequests).values({ userId, courseId, message }).returning();
    return request;
  }

  async getTeacherRequestByUserAndCourse(userId: number, courseId: number): Promise<TeacherRequest | undefined> {
    const [request] = await db.select().from(teacherRequests).where(and(eq(teacherRequests.userId, userId), eq(teacherRequests.courseId, courseId)));
    return request;
  }

  async listTeacherRequests(): Promise<(TeacherRequest & { user: { id: number; username: string; displayName: string | null; role: string }; course: { id: number; title: string } })[]> {
    const rows = await db
      .select({
        id: teacherRequests.id,
        userId: teacherRequests.userId,
        courseId: teacherRequests.courseId,
        status: teacherRequests.status,
        message: teacherRequests.message,
        createdAt: teacherRequests.createdAt,
        username: users.username,
        displayName: users.displayName,
        userRole: users.role,
        courseTitle: courses.title,
      })
      .from(teacherRequests)
      .innerJoin(users, eq(teacherRequests.userId, users.id))
      .innerJoin(courses, eq(teacherRequests.courseId, courses.id))
      .orderBy(desc(teacherRequests.createdAt));

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      courseId: r.courseId,
      status: r.status,
      message: r.message,
      createdAt: r.createdAt,
      user: { id: r.userId, username: r.username, displayName: r.displayName, role: r.userRole },
      course: { id: r.courseId, title: r.courseTitle },
    }));
  }

  async listTeacherRequestsByUser(userId: number): Promise<(TeacherRequest & { course: Course })[]> {
    const rows = await db
      .select()
      .from(teacherRequests)
      .innerJoin(courses, eq(teacherRequests.courseId, courses.id))
      .where(eq(teacherRequests.userId, userId))
      .orderBy(desc(teacherRequests.createdAt));

    return rows.map((r) => ({
      ...r.teacher_requests,
      course: r.courses,
    }));
  }

  async updateTeacherRequest(id: number, updates: UpdateTeacherRequest): Promise<TeacherRequest | undefined> {
    const [updated] = await db.update(teacherRequests).set(updates).where(eq(teacherRequests.id, id)).returning();
    return updated;
  }

  async deleteTeacherRequest(id: number): Promise<void> {
    await db.delete(teacherRequests).where(eq(teacherRequests.id, id));
  }

  async createCourseAnnouncement(data: InsertCourseAnnouncement & { authorId: number }): Promise<CourseAnnouncement> {
    const [created] = await db.insert(courseAnnouncements).values({
      courseId: data.courseId,
      authorId: data.authorId,
      title: data.title,
      content: data.content,
      isPinned: data.isPinned ?? false,
    }).returning();
    return created;
  }

  async listCourseAnnouncements(courseId: number): Promise<(CourseAnnouncement & { author: { username: string; displayName: string | null } })[]> {
    const rows = await db
      .select({
        id: courseAnnouncements.id,
        courseId: courseAnnouncements.courseId,
        authorId: courseAnnouncements.authorId,
        title: courseAnnouncements.title,
        content: courseAnnouncements.content,
        isPinned: courseAnnouncements.isPinned,
        createdAt: courseAnnouncements.createdAt,
        username: users.username,
        displayName: users.displayName,
      })
      .from(courseAnnouncements)
      .innerJoin(users, eq(courseAnnouncements.authorId, users.id))
      .where(eq(courseAnnouncements.courseId, courseId))
      .orderBy(desc(courseAnnouncements.isPinned), desc(courseAnnouncements.createdAt));

    return rows.map((r) => ({
      id: r.id,
      courseId: r.courseId,
      authorId: r.authorId,
      title: r.title,
      content: r.content,
      isPinned: r.isPinned,
      createdAt: r.createdAt,
      author: { username: r.username, displayName: r.displayName },
    }));
  }

  async updateCourseAnnouncement(id: number, updates: UpdateCourseAnnouncement): Promise<CourseAnnouncement | undefined> {
    const [updated] = await db.update(courseAnnouncements).set(updates).where(eq(courseAnnouncements.id, id)).returning();
    return updated;
  }

  async deleteCourseAnnouncement(id: number): Promise<void> {
    await db.delete(courseAnnouncements).where(eq(courseAnnouncements.id, id));
  }

  async createCourseScheduleEntry(data: InsertCourseSchedule): Promise<CourseScheduleEntry> {
    const [created] = await db.insert(courseSchedule).values({
      courseId: data.courseId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      meetingUrl: data.meetingUrl || null,
      meetingPlatform: data.meetingPlatform || "zoom",
      description: data.description || null,
      isActive: data.isActive ?? true,
    }).returning();
    return created;
  }

  async listCourseSchedule(courseId: number): Promise<CourseScheduleEntry[]> {
    return await db.select().from(courseSchedule)
      .where(eq(courseSchedule.courseId, courseId))
      .orderBy(courseSchedule.dayOfWeek);
  }

  async updateCourseScheduleEntry(id: number, updates: UpdateCourseSchedule): Promise<CourseScheduleEntry | undefined> {
    const [updated] = await db.update(courseSchedule).set(updates).where(eq(courseSchedule.id, id)).returning();
    return updated;
  }

  async deleteCourseScheduleEntry(id: number): Promise<void> {
    await db.delete(courseSchedule).where(eq(courseSchedule.id, id));
  }

  async upsertSessionAttendance(data: InsertSessionAttendance): Promise<SessionAttendance> {
    const existing = await db.select().from(sessionAttendance)
      .where(and(eq(sessionAttendance.sessionId, data.sessionId), eq(sessionAttendance.userId, data.userId)));
    if (existing.length > 0) {
      const [updated] = await db.update(sessionAttendance)
        .set({ status: data.status || "presente" })
        .where(eq(sessionAttendance.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(sessionAttendance).values({
      sessionId: data.sessionId,
      userId: data.userId,
      status: data.status || "presente",
    }).returning();
    return created;
  }

  async listSessionAttendance(sessionId: number): Promise<(SessionAttendance & { user: { id: number; username: string; displayName: string | null } })[]> {
    const rows = await db
      .select({
        id: sessionAttendance.id,
        sessionId: sessionAttendance.sessionId,
        userId: sessionAttendance.userId,
        status: sessionAttendance.status,
        createdAt: sessionAttendance.createdAt,
        username: users.username,
        displayName: users.displayName,
      })
      .from(sessionAttendance)
      .innerJoin(users, eq(sessionAttendance.userId, users.id))
      .where(eq(sessionAttendance.sessionId, sessionId));

    return rows.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      userId: r.userId,
      status: r.status,
      createdAt: r.createdAt,
      user: { id: r.userId, username: r.username, displayName: r.displayName },
    }));
  }

  async listPostsByUser(userId: number): Promise<MemberPost[]> {
    return await db.select().from(memberPosts).where(eq(memberPosts.userId, userId)).orderBy(desc(memberPosts.createdAt));
  }

  async listAttendanceByUser(userId: number): Promise<SessionAttendance[]> {
    return await db.select().from(sessionAttendance).where(eq(sessionAttendance.userId, userId)).orderBy(desc(sessionAttendance.createdAt));
  }

  // ========== BIBLIOTECA ==========

  async createBibleHighlight(userId: number, data: InsertBibleHighlight): Promise<BibleHighlight> {
    const [created] = await db.insert(bibleHighlights).values({ ...data, userId }).returning();
    return created;
  }

  async listBibleHighlights(userId: number, book?: string, chapter?: number): Promise<BibleHighlight[]> {
    const conditions = [eq(bibleHighlights.userId, userId)];
    if (book) conditions.push(eq(bibleHighlights.book, book));
    if (chapter !== undefined) conditions.push(eq(bibleHighlights.chapter, chapter));
    return await db.select().from(bibleHighlights).where(and(...conditions)).orderBy(bibleHighlights.verseStart);
  }

  async deleteBibleHighlight(id: number): Promise<void> {
    await db.delete(bibleHighlights).where(eq(bibleHighlights.id, id));
  }

  async createBibleNote(userId: number, data: InsertBibleNote): Promise<BibleNote> {
    const [created] = await db.insert(bibleNotes).values({ ...data, userId }).returning();
    return created;
  }

  async listBibleNotes(userId: number, book?: string, chapter?: number): Promise<BibleNote[]> {
    const conditions = [eq(bibleNotes.userId, userId)];
    if (book) conditions.push(eq(bibleNotes.book, book));
    if (chapter !== undefined) conditions.push(eq(bibleNotes.chapter, chapter));
    return await db.select().from(bibleNotes).where(and(...conditions)).orderBy(bibleNotes.verse);
  }

  async updateBibleNote(id: number, content: string): Promise<BibleNote | undefined> {
    const [updated] = await db.update(bibleNotes).set({ content }).where(eq(bibleNotes.id, id)).returning();
    return updated;
  }

  async deleteBibleNote(id: number): Promise<void> {
    await db.delete(bibleNotes).where(eq(bibleNotes.id, id));
  }

  async createReadingPlan(userId: number, data: InsertReadingPlan): Promise<ReadingPlan> {
    const [created] = await db.insert(readingPlans).values({ ...data, userId }).returning();
    return created;
  }

  async getReadingPlan(id: number): Promise<ReadingPlan | undefined> {
    const [plan] = await db.select().from(readingPlans).where(eq(readingPlans.id, id));
    return plan;
  }

  async listReadingPlans(userId: number): Promise<ReadingPlan[]> {
    return await db.select().from(readingPlans).where(eq(readingPlans.userId, userId)).orderBy(desc(readingPlans.createdAt));
  }

  async listPublicReadingPlans(): Promise<(ReadingPlan & { user: { username: string; displayName: string | null } })[]> {
    const rows = await db
      .select({
        id: readingPlans.id, userId: readingPlans.userId, title: readingPlans.title,
        description: readingPlans.description, isPublic: readingPlans.isPublic, createdAt: readingPlans.createdAt,
        username: users.username, displayName: users.displayName,
      })
      .from(readingPlans)
      .innerJoin(users, eq(readingPlans.userId, users.id))
      .where(eq(readingPlans.isPublic, true))
      .orderBy(desc(readingPlans.createdAt));
    return rows.map(r => ({
      id: r.id, userId: r.userId, title: r.title, description: r.description,
      isPublic: r.isPublic, createdAt: r.createdAt,
      user: { username: r.username, displayName: r.displayName },
    }));
  }

  async deleteReadingPlan(id: number): Promise<void> {
    await db.delete(readingPlanItems).where(eq(readingPlanItems.planId, id));
    await db.delete(readingPlans).where(eq(readingPlans.id, id));
  }

  async addReadingPlanItem(data: InsertReadingPlanItem): Promise<ReadingPlanItem> {
    const [created] = await db.insert(readingPlanItems).values(data).returning();
    return created;
  }

  async listReadingPlanItems(planId: number): Promise<ReadingPlanItem[]> {
    return await db.select().from(readingPlanItems).where(eq(readingPlanItems.planId, planId)).orderBy(readingPlanItems.sortOrder);
  }

  async toggleReadingPlanItem(id: number): Promise<ReadingPlanItem | undefined> {
    const [item] = await db.select().from(readingPlanItems).where(eq(readingPlanItems.id, id));
    if (!item) return undefined;
    const [updated] = await db.update(readingPlanItems)
      .set({ isCompleted: !item.isCompleted, completedAt: !item.isCompleted ? new Date() : null })
      .where(eq(readingPlanItems.id, id)).returning();
    return updated;
  }

  async deleteReadingPlanItem(id: number): Promise<void> {
    await db.delete(readingPlanItems).where(eq(readingPlanItems.id, id));
  }

  async createReadingClubPost(userId: number, data: InsertReadingClubPost): Promise<ReadingClubPost> {
    const [created] = await db.insert(readingClubPosts).values({ ...data, userId }).returning();
    return created;
  }

  async listReadingClubPosts(): Promise<(ReadingClubPost & { user: { id: number; username: string; displayName: string | null; avatarUrl: string | null; cargo: string | null; country: string | null }; commentCount: number; likeCount: number })[]> {
    const rows = await db
      .select({
        id: readingClubPosts.id, userId: readingClubPosts.userId, book: readingClubPosts.book,
        chapter: readingClubPosts.chapter, verseStart: readingClubPosts.verseStart, verseEnd: readingClubPosts.verseEnd,
        content: readingClubPosts.content, createdAt: readingClubPosts.createdAt,
        username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl,
        cargo: users.cargo, country: users.country,
        commentCount: sql<number>`(SELECT count(*)::int FROM reading_club_comments WHERE post_id = ${readingClubPosts.id})`,
        likeCount: sql<number>`(SELECT count(*)::int FROM reading_club_post_likes WHERE post_id = ${readingClubPosts.id})`,
      })
      .from(readingClubPosts)
      .innerJoin(users, eq(readingClubPosts.userId, users.id))
      .orderBy(desc(readingClubPosts.createdAt));
    return rows.map(r => ({
      id: r.id, userId: r.userId, book: r.book, chapter: r.chapter,
      verseStart: r.verseStart, verseEnd: r.verseEnd, content: r.content, createdAt: r.createdAt,
      user: { id: r.userId, username: r.username, displayName: r.displayName, avatarUrl: r.avatarUrl, cargo: r.cargo, country: r.country },
      commentCount: r.commentCount,
      likeCount: r.likeCount,
    }));
  }

  async deleteReadingClubPost(id: number): Promise<void> {
    await db.delete(readingClubPostLikes).where(eq(readingClubPostLikes.postId, id));
    await db.delete(readingClubComments).where(eq(readingClubComments.postId, id));
    await db.delete(readingClubPosts).where(eq(readingClubPosts.id, id));
  }

  async toggleReadingClubPostLike(postId: number, userId: number): Promise<{ liked: boolean }> {
    const [existing] = await db.select().from(readingClubPostLikes)
      .where(and(eq(readingClubPostLikes.postId, postId), eq(readingClubPostLikes.userId, userId)));
    if (existing) {
      await db.delete(readingClubPostLikes).where(eq(readingClubPostLikes.id, existing.id));
      return { liked: false };
    }
    await db.insert(readingClubPostLikes).values({ postId, userId });
    return { liked: true };
  }

  async getUserLikedPosts(userId: number): Promise<number[]> {
    const rows = await db.select({ postId: readingClubPostLikes.postId }).from(readingClubPostLikes).where(eq(readingClubPostLikes.userId, userId));
    return rows.map(r => r.postId);
  }

  async createReadingClubComment(userId: number, data: InsertReadingClubComment): Promise<ReadingClubComment> {
    const [created] = await db.insert(readingClubComments).values({ ...data, userId }).returning();
    return created;
  }

  async listReadingClubComments(postId: number): Promise<(ReadingClubComment & { user: { id: number; username: string; displayName: string | null; avatarUrl: string | null } })[]> {
    const rows = await db
      .select({
        id: readingClubComments.id, postId: readingClubComments.postId, userId: readingClubComments.userId,
        content: readingClubComments.content, createdAt: readingClubComments.createdAt,
        username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl,
      })
      .from(readingClubComments)
      .innerJoin(users, eq(readingClubComments.userId, users.id))
      .where(eq(readingClubComments.postId, postId))
      .orderBy(readingClubComments.createdAt);
    return rows.map(r => ({
      id: r.id, postId: r.postId, userId: r.userId, content: r.content, createdAt: r.createdAt,
      user: { id: r.userId, username: r.username, displayName: r.displayName, avatarUrl: r.avatarUrl },
    }));
  }

  async deleteReadingClubComment(id: number): Promise<void> {
    await db.delete(readingClubComments).where(eq(readingClubComments.id, id));
  }

  async createLibraryResource(userId: number, data: InsertLibraryResource): Promise<LibraryResource> {
    const [created] = await db.insert(libraryResources).values({ ...data, userId }).returning();
    return created;
  }

  async listLibraryResources(category?: string, search?: string): Promise<(LibraryResource & { user: { username: string; displayName: string | null }; likeCount: number })[]> {
    const conditions: any[] = [];
    if (category && category !== "all") conditions.push(eq(libraryResources.category, category));
    if (search) conditions.push(or(ilike(libraryResources.title, `%${search}%`), ilike(libraryResources.description, `%${search}%`)));

    const query = db
      .select({
        id: libraryResources.id, userId: libraryResources.userId, title: libraryResources.title,
        description: libraryResources.description, resourceType: libraryResources.resourceType,
        fileData: libraryResources.fileData, fileUrl: libraryResources.fileUrl,
        fileName: libraryResources.fileName, fileSize: libraryResources.fileSize,
        category: libraryResources.category, createdAt: libraryResources.createdAt,
        username: users.username, displayName: users.displayName,
        likeCount: sql<number>`(SELECT count(*)::int FROM library_resource_likes WHERE resource_id = ${libraryResources.id})`,
      })
      .from(libraryResources)
      .innerJoin(users, eq(libraryResources.userId, users.id))
      .orderBy(desc(libraryResources.createdAt));

    const rows = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

    return rows.map(r => ({
      id: r.id, userId: r.userId, title: r.title, description: r.description,
      resourceType: r.resourceType, fileData: r.fileData, fileUrl: r.fileUrl,
      fileName: r.fileName, fileSize: r.fileSize, category: r.category, createdAt: r.createdAt,
      user: { username: r.username, displayName: r.displayName },
      likeCount: r.likeCount,
    }));
  }

  async deleteLibraryResource(id: number): Promise<void> {
    await db.delete(libraryResourceLikes).where(eq(libraryResourceLikes.resourceId, id));
    await db.delete(libraryResources).where(eq(libraryResources.id, id));
  }

  async toggleLibraryResourceLike(resourceId: number, userId: number): Promise<{ liked: boolean }> {
    const [existing] = await db.select().from(libraryResourceLikes)
      .where(and(eq(libraryResourceLikes.resourceId, resourceId), eq(libraryResourceLikes.userId, userId)));
    if (existing) {
      await db.delete(libraryResourceLikes).where(eq(libraryResourceLikes.id, existing.id));
      return { liked: false };
    }
    await db.insert(libraryResourceLikes).values({ resourceId, userId });
    return { liked: true };
  }

  async getUserLikedResources(userId: number): Promise<number[]> {
    const rows = await db.select({ resourceId: libraryResourceLikes.resourceId })
      .from(libraryResourceLikes).where(eq(libraryResourceLikes.userId, userId));
    return rows.map(r => r.resourceId);
  }

  async updateUserInfo(id: number, cargo: string | null, country: string | null): Promise<User | undefined> {
    const [user] = await db.update(users).set({ cargo, country }).where(eq(users.id, id)).returning();
    return user;
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [n] = await db.insert(notifications).values(data).returning();
    return n;
  }

  async createNotificationForAll(data: Omit<InsertNotification, "userId">): Promise<void> {
    const allUsers = await db.select({ id: users.id }).from(users);
    if (allUsers.length === 0) return;
    const values = allUsers.map(u => ({ ...data, userId: u.id }));
    await db.insert(notifications).values(values);
  }

  async listNotifications(userId: number): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count || 0;
  }

  async createPrayerActivity(userId: number, data: InsertPrayerActivity): Promise<PrayerActivity> {
    const [a] = await db.insert(prayerActivities).values({
      ...data,
      userId,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
    }).returning();
    return a;
  }

  async listPrayerActivities(): Promise<(PrayerActivity & { user: { username: string; displayName: string | null } })[]> {
    const rows = await db
      .select({
        id: prayerActivities.id, userId: prayerActivities.userId,
        title: prayerActivities.title, description: prayerActivities.description,
        meetingUrl: prayerActivities.meetingUrl, meetingPlatform: prayerActivities.meetingPlatform,
        scheduledDate: prayerActivities.scheduledDate, isActive: prayerActivities.isActive,
        createdAt: prayerActivities.createdAt,
        username: users.username, displayName: users.displayName,
      })
      .from(prayerActivities)
      .leftJoin(users, eq(prayerActivities.userId, users.id))
      .orderBy(desc(prayerActivities.createdAt));
    return rows.map(r => ({
      id: r.id, userId: r.userId, title: r.title, description: r.description,
      meetingUrl: r.meetingUrl, meetingPlatform: r.meetingPlatform,
      scheduledDate: r.scheduledDate, isActive: r.isActive, createdAt: r.createdAt,
      user: { username: r.username!, displayName: r.displayName },
    }));
  }

  async deletePrayerActivity(id: number): Promise<void> {
    await db.delete(prayerActivities).where(eq(prayerActivities.id, id));
  }

  async createRegionPost(userId: number, data: InsertRegionPost): Promise<RegionPost> {
    const [p] = await db.insert(regionPosts).values({ ...data, userId }).returning();
    return p;
  }

  async listRegionPosts(region?: string): Promise<(RegionPost & { user: { username: string; displayName: string | null; avatarUrl: string | null; country: string | null } })[]> {
    const query = db
      .select({
        id: regionPosts.id, userId: regionPosts.userId,
        region: regionPosts.region, content: regionPosts.content,
        imageUrl: regionPosts.imageUrl, createdAt: regionPosts.createdAt,
        username: users.username, displayName: users.displayName,
        avatarUrl: users.avatarUrl, country: users.country,
      })
      .from(regionPosts)
      .leftJoin(users, eq(regionPosts.userId, users.id))
      .orderBy(desc(regionPosts.createdAt));
    const rows = region ? await query.where(eq(regionPosts.region, region)) : await query;
    return rows.map(r => ({
      id: r.id, userId: r.userId, region: r.region, content: r.content,
      imageUrl: r.imageUrl, createdAt: r.createdAt,
      user: { username: r.username!, displayName: r.displayName, avatarUrl: r.avatarUrl, country: r.country },
    }));
  }

  async deleteRegionPost(id: number): Promise<void> {
    await db.delete(regionPosts).where(eq(regionPosts.id, id));
  }

  async listMinistryRegions(): Promise<MinistryRegion[]> {
    return db.select().from(ministryRegions).orderBy(asc(ministryRegions.sortOrder), asc(ministryRegions.name));
  }

  async createMinistryRegion(data: InsertMinistryRegion): Promise<MinistryRegion> {
    const [created] = await db.insert(ministryRegions).values(data).returning();
    return created;
  }

  async updateMinistryRegion(id: number, data: UpdateMinistryRegion): Promise<MinistryRegion | undefined> {
    const [updated] = await db.update(ministryRegions).set(data).where(eq(ministryRegions.id, id)).returning();
    return updated;
  }

  async deleteMinistryRegion(id: number): Promise<void> {
    await db.delete(ministryRegions).where(eq(ministryRegions.id, id));
  }

  async listTeamMembers(): Promise<TeamMember[]> {
    return db.select().from(teamMembers).orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name));
  }

  async createTeamMember(data: InsertTeamMember): Promise<TeamMember> {
    const [created] = await db.insert(teamMembers).values(data).returning();
    return created;
  }

  async updateTeamMember(id: number, data: UpdateTeamMember): Promise<TeamMember | undefined> {
    const [updated] = await db.update(teamMembers).set(data).where(eq(teamMembers.id, id)).returning();
    return updated;
  }

  async deleteTeamMember(id: number): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  async toggleRegionPostReaction(postId: number, userId: number, reactionType: string): Promise<{ added: boolean }> {
    const [existing] = await db.select().from(regionPostReactions)
      .where(and(eq(regionPostReactions.postId, postId), eq(regionPostReactions.userId, userId), eq(regionPostReactions.reactionType, reactionType)));
    if (existing) {
      await db.delete(regionPostReactions).where(eq(regionPostReactions.id, existing.id));
      return { added: false };
    }
    await db.insert(regionPostReactions).values({ postId, userId, reactionType });
    return { added: true };
  }

  async getRegionPostReactions(postId: number): Promise<{ reactionType: string; count: number; users: number[] }[]> {
    const rows = await db.select({
      reactionType: regionPostReactions.reactionType,
      userId: regionPostReactions.userId,
    }).from(regionPostReactions).where(eq(regionPostReactions.postId, postId));

    const grouped: Record<string, number[]> = {};
    for (const r of rows) {
      if (!grouped[r.reactionType]) grouped[r.reactionType] = [];
      grouped[r.reactionType].push(r.userId);
    }
    return Object.entries(grouped).map(([reactionType, userIds]) => ({
      reactionType,
      count: userIds.length,
      users: userIds,
    }));
  }

  async createRegionPostPoll(postId: number, question: string, options: string[]): Promise<RegionPostPoll> {
    const [poll] = await db.insert(regionPostPolls).values({ postId, question }).returning();
    for (let i = 0; i < options.length; i++) {
      await db.insert(regionPostPollOptions).values({ pollId: poll.id, optionText: options[i], sortOrder: i });
    }
    return poll;
  }

  async getRegionPostPoll(postId: number): Promise<{ poll: RegionPostPoll; options: (RegionPostPollOption & { voteCount: number })[] } | null> {
    const [poll] = await db.select().from(regionPostPolls).where(eq(regionPostPolls.postId, postId));
    if (!poll) return null;
    const opts = await db.select({
      id: regionPostPollOptions.id,
      pollId: regionPostPollOptions.pollId,
      optionText: regionPostPollOptions.optionText,
      sortOrder: regionPostPollOptions.sortOrder,
      voteCount: sql<number>`(SELECT count(*)::int FROM region_post_poll_votes WHERE option_id = ${regionPostPollOptions.id})`,
    }).from(regionPostPollOptions).where(eq(regionPostPollOptions.pollId, poll.id)).orderBy(regionPostPollOptions.sortOrder);
    return { poll, options: opts };
  }

  async voteRegionPostPoll(optionId: number, userId: number): Promise<{ success: boolean }> {
    const [option] = await db.select().from(regionPostPollOptions).where(eq(regionPostPollOptions.id, optionId));
    if (!option) return { success: false };
    const allOptions = await db.select({ id: regionPostPollOptions.id }).from(regionPostPollOptions)
      .where(eq(regionPostPollOptions.pollId, option.pollId));
    const optionIds = allOptions.map(o => o.id);
    if (optionIds.length > 0) {
      await db.delete(regionPostPollVotes).where(
        and(eq(regionPostPollVotes.userId, userId), inArray(regionPostPollVotes.optionId, optionIds))
      );
    }
    await db.insert(regionPostPollVotes).values({ optionId, userId });
    return { success: true };
  }

  async getUserPollVote(postId: number, userId: number): Promise<number | null> {
    const [poll] = await db.select().from(regionPostPolls).where(eq(regionPostPolls.postId, postId));
    if (!poll) return null;
    const allOptions = await db.select({ id: regionPostPollOptions.id }).from(regionPostPollOptions)
      .where(eq(regionPostPollOptions.pollId, poll.id));
    const optionIds = allOptions.map(o => o.id);
    if (optionIds.length === 0) return null;
    const [vote] = await db.select().from(regionPostPollVotes)
      .where(and(eq(regionPostPollVotes.userId, userId), inArray(regionPostPollVotes.optionId, optionIds)));
    return vote ? vote.optionId : null;
  }

  async getOrCreateGameProfile(userId: number): Promise<GameProfile> {
    const [existing] = await db.select().from(gameProfiles).where(eq(gameProfiles.userId, userId));
    if (existing) {
      if (existing.maxEnergy < 15) {
        const [updated] = await db.update(gameProfiles).set({ maxEnergy: 15, energy: Math.min(existing.energy + (15 - existing.maxEnergy), 15) }).where(eq(gameProfiles.userId, userId)).returning();
        return updated;
      }
      return existing;
    }
    const [created] = await db.insert(gameProfiles).values({ userId }).returning();
    return created;
  }

  async updateGameProfile(userId: number, updates: Partial<GameProfile>): Promise<GameProfile> {
    const [updated] = await db.update(gameProfiles).set(updates).where(eq(gameProfiles.userId, userId)).returning();
    return updated;
  }

  async getRandomQuestion(difficulty: string, excludeIds?: number[]): Promise<GameQuestion | null> {
    const conditions: any[] = [eq(gameQuestions.difficulty, difficulty)];
    if (excludeIds && excludeIds.length > 0) {
      conditions.push(sql`${gameQuestions.id} NOT IN (${sql.join(excludeIds.map(id => sql`${id}`), sql`, `)})`);
    }
    const rows = await db.select().from(gameQuestions).where(and(...conditions)).orderBy(sql`RANDOM()`).limit(1);
    return rows[0] || null;
  }

  async submitGameAnswer(userId: number, questionId: number, selectedAnswer: string): Promise<{ correct: boolean; pointsEarned: number; explanation: string | null }> {
    const [question] = await db.select().from(gameQuestions).where(eq(gameQuestions.id, questionId));
    if (!question) throw new Error("Question not found");

    const correct = selectedAnswer === question.correctAnswer;
    const difficultyPoints: Record<string, number> = { facil: 10, medio: 20, dificil: 35, experto: 50 };
    const pointsEarned = correct ? (difficultyPoints[question.difficulty] || 10) : 0;

    const profile = await this.getOrCreateGameProfile(userId);

    const newStreak = correct ? profile.streak + 1 : 0;
    const newBestStreak = Math.max(profile.bestStreak, newStreak);

    await db.update(gameProfiles).set({
      totalPoints: profile.totalPoints + pointsEarned,
      questionsAnswered: profile.questionsAnswered + 1,
      correctAnswers: correct ? profile.correctAnswers + 1 : profile.correctAnswers,
      streak: newStreak,
      bestStreak: newBestStreak,
      lastPlayedAt: new Date(),
    }).where(eq(gameProfiles.userId, userId));

    await db.insert(gameAnswers).values({
      userId,
      questionId,
      selectedAnswer,
      isCorrect: correct,
      pointsEarned,
      difficulty: question.difficulty,
    });

    return { correct, pointsEarned, explanation: question.explanation };
  }

  async getLeaderboard(limit: number = 20): Promise<{ userId: number; username: string; displayName: string | null; avatarUrl: string | null; totalPoints: number; level: number; correctAnswers: number }[]> {
    const rows = await db.select({
      userId: gameProfiles.userId,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      totalPoints: gameProfiles.totalPoints,
      level: gameProfiles.level,
      correctAnswers: gameProfiles.correctAnswers,
    }).from(gameProfiles)
      .innerJoin(users, eq(gameProfiles.userId, users.id))
      .orderBy(desc(gameProfiles.totalPoints))
      .limit(limit);
    return rows;
  }

  async getGameMissions(userId: number): Promise<(GameMission & { progress: number; isCompleted: boolean })[]> {
    const rows = await db.select({
      id: gameMissions.id,
      title: gameMissions.title,
      description: gameMissions.description,
      missionType: gameMissions.missionType,
      targetAction: gameMissions.targetAction,
      targetCount: gameMissions.targetCount,
      rewardEnergy: gameMissions.rewardEnergy,
      rewardPoints: gameMissions.rewardPoints,
      isActive: gameMissions.isActive,
      createdAt: gameMissions.createdAt,
      progress: sql<number>`COALESCE(${userMissions.progress}, 0)`,
      userIsCompleted: sql<boolean>`COALESCE(${userMissions.isCompleted}, false)`,
    }).from(gameMissions)
      .leftJoin(userMissions, and(eq(userMissions.missionId, gameMissions.id), eq(userMissions.userId, userId)))
      .where(eq(gameMissions.isActive, true));

    return rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      missionType: r.missionType,
      targetAction: r.targetAction,
      targetCount: r.targetCount,
      rewardEnergy: r.rewardEnergy,
      rewardPoints: r.rewardPoints,
      isActive: r.isActive,
      createdAt: r.createdAt,
      progress: r.progress,
      isCompleted: r.userIsCompleted,
    }));
  }

  async progressMission(userId: number, actionType: string): Promise<void> {
    const missions = await db.select().from(gameMissions)
      .where(and(eq(gameMissions.isActive, true), eq(gameMissions.targetAction, actionType)));

    for (const mission of missions) {
      const [existing] = await db.select().from(userMissions)
        .where(and(eq(userMissions.userId, userId), eq(userMissions.missionId, mission.id)));

      if (existing) {
        if (existing.isCompleted) continue;
        const newProgress = existing.progress + 1;
        const completed = newProgress >= mission.targetCount;
        await db.update(userMissions).set({
          progress: newProgress,
          isCompleted: completed,
          completedAt: completed ? new Date() : null,
        }).where(eq(userMissions.id, existing.id));
      } else {
        const completed = 1 >= mission.targetCount;
        await db.insert(userMissions).values({
          userId,
          missionId: mission.id,
          progress: 1,
          isCompleted: completed,
          completedAt: completed ? new Date() : null,
        });
      }
    }
  }

  async claimMissionReward(userId: number, missionId: number): Promise<{ energy: number; points: number }> {
    const [um] = await db.select().from(userMissions)
      .where(and(eq(userMissions.userId, userId), eq(userMissions.missionId, missionId), eq(userMissions.isCompleted, true)));
    if (!um) throw new Error("Mission not completed or not found");

    const [mission] = await db.select().from(gameMissions).where(eq(gameMissions.id, missionId));
    if (!mission) throw new Error("Mission not found");

    const profile = await this.getOrCreateGameProfile(userId);
    const newEnergy = Math.min(profile.energy + mission.rewardEnergy, profile.maxEnergy);
    await db.update(gameProfiles).set({
      energy: newEnergy,
      totalPoints: profile.totalPoints + mission.rewardPoints,
    }).where(eq(gameProfiles.userId, userId));

    await db.delete(userMissions).where(eq(userMissions.id, um.id));

    return { energy: mission.rewardEnergy, points: mission.rewardPoints };
  }

  async refillEnergy(userId: number): Promise<GameProfile> {
    const profile = await this.getOrCreateGameProfile(userId);
    const now = new Date();
    const lastRefill = profile.lastEnergyRefill || profile.createdAt || now;
    const minutesElapsed = Math.floor((now.getTime() - new Date(lastRefill).getTime()) / (1000 * 60));
    const energyToAdd = Math.floor(minutesElapsed / 10);

    if (energyToAdd <= 0) return profile;

    const newEnergy = Math.min(profile.energy + energyToAdd, profile.maxEnergy);
    const [updated] = await db.update(gameProfiles).set({
      energy: newEnergy,
      lastEnergyRefill: now,
    }).where(eq(gameProfiles.userId, userId)).returning();
    return updated;
  }

  async getEnrollmentCounts(): Promise<Record<number, { total: number; approved: number; pending: number }>> {
    const rows = await db
      .select({
        courseId: enrollments.courseId,
        status: enrollments.status,
        count: sql<number>`count(*)::int`,
      })
      .from(enrollments)
      .groupBy(enrollments.courseId, enrollments.status);

    const counts: Record<number, { total: number; approved: number; pending: number }> = {};
    for (const r of rows) {
      if (!counts[r.courseId]) counts[r.courseId] = { total: 0, approved: 0, pending: 0 };
      counts[r.courseId].total += r.count;
      if (r.status === "aprobado" || r.status === "completado") counts[r.courseId].approved += r.count;
      if (r.status === "solicitado") counts[r.courseId].pending += r.count;
    }
    return counts;
  }

  async getStoryChapters(): Promise<StoryChapter[]> {
    return db.select().from(storyChapters)
      .where(eq(storyChapters.isActive, true))
      .orderBy(asc(storyChapters.chapterNumber));
  }

  async getStoryChapter(id: number): Promise<StoryChapter | null> {
    const [chapter] = await db.select().from(storyChapters).where(eq(storyChapters.id, id));
    return chapter || null;
  }

  async getStoryActivities(chapterId: number): Promise<StoryActivity[]> {
    return db.select().from(storyActivities)
      .where(eq(storyActivities.chapterId, chapterId))
      .orderBy(asc(storyActivities.activityOrder));
  }

  async getStoryActivity(id: number): Promise<StoryActivity | null> {
    const [activity] = await db.select().from(storyActivities).where(eq(storyActivities.id, id));
    return activity || null;
  }

  async getUserStoryProgress(userId: number): Promise<StoryProgressRecord[]> {
    return db.select().from(storyProgress)
      .where(eq(storyProgress.userId, userId));
  }

  async getChapterProgress(userId: number, chapterId: number): Promise<StoryProgressRecord[]> {
    return db.select().from(storyProgress)
      .where(and(eq(storyProgress.userId, userId), eq(storyProgress.chapterId, chapterId)));
  }

  async saveStoryActivityProgress(userId: number, chapterId: number, activityId: number, userAnswer: string | null, isCorrect: boolean | null): Promise<StoryProgressRecord> {
    const existing = await db.select().from(storyProgress)
      .where(and(
        eq(storyProgress.userId, userId),
        eq(storyProgress.activityId, activityId)
      ));
    if (existing.length > 0) {
      const [updated] = await db.update(storyProgress)
        .set({ userAnswer, isCorrect, completed: true, completedAt: new Date() })
        .where(eq(storyProgress.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(storyProgress)
      .values({ userId, chapterId, activityId, userAnswer, isCorrect, completed: true, completedAt: new Date() })
      .returning();
    return created;
  }

  async getOrCreateCityProfile(userId: number): Promise<CityProfile> {
    const [existing] = await db.select().from(cityProfiles).where(eq(cityProfiles.userId, userId));
    if (existing) return existing;
    const [created] = await db.insert(cityProfiles).values({
      userId,
      cityName: "Nueva Jerusalem",
      gold: 100,
      food: 50,
      wood: 80,
      stone: 40,
      faith: 10,
      level: 1,
      xp: 0,
    }).returning();
    return created;
  }

  async getCityTiles(userId: number): Promise<CityTile[]> {
    return db.select().from(cityTiles).where(eq(cityTiles.userId, userId));
  }

  async getCityState(userId: number): Promise<{ profile: CityProfile; tiles: CityTile[]; missions: any[] }> {
    const profile = await this.getOrCreateCityProfile(userId);
    const tiles = await this.getCityTiles(userId);
    const missions = await this.getCityMissions(userId);
    return { profile, tiles, missions };
  }

  async placeCityBuilding(userId: number, x: number, y: number, buildingKey: string): Promise<CityTile> {
    const building = (CITY_BUILDINGS as any)[buildingKey];
    if (!building) throw new Error("Edificio no valido");

    const profile = await this.getOrCreateCityProfile(userId);

    if (profile.level < building.requiredLevel) {
      throw new Error(`Necesitas nivel ${building.requiredLevel} para construir ${building.name}`);
    }

    if (profile.gold < (building.costGold || 0) ||
        profile.wood < (building.costWood || 0) ||
        profile.stone < (building.costStone || 0) ||
        profile.food < (building.costFood || 0) ||
        profile.faith < (building.costFaith || 0)) {
      throw new Error("No tienes suficientes recursos");
    }

    const [existingTile] = await db.select().from(cityTiles)
      .where(and(eq(cityTiles.userId, userId), eq(cityTiles.x, x), eq(cityTiles.y, y)));
    if (existingTile) throw new Error("Ya hay un edificio en esa posicion");

    const now = new Date();
    const readyAt = new Date(now.getTime() + (building.buildTimeSec || 0) * 1000);

    const popAdd = (building as any).populationAdd || 0;

    await db.update(cityProfiles).set({
      gold: profile.gold - (building.costGold || 0),
      wood: profile.wood - (building.costWood || 0),
      stone: profile.stone - (building.costStone || 0),
      food: profile.food - (building.costFood || 0),
      faith: profile.faith - (building.costFaith || 0),
      xp: profile.xp + 5,
      maxPopulation: profile.maxPopulation + popAdd,
    }).where(eq(cityProfiles.userId, userId));

    const [tile] = await db.insert(cityTiles).values({
      userId,
      x,
      y,
      buildingKey,
      state: "building",
      plantedAt: now,
      readyAt,
    }).returning();

    await this.updateCityMissionProgress(userId, "build", buildingKey);
    await this.checkLevelUp(userId);

    return tile;
  }

  async harvestCityTile(userId: number, tileId: number): Promise<{ tile: CityTile; resourceGained: string; amountGained: number }> {
    const [tile] = await db.select().from(cityTiles).where(eq(cityTiles.id, tileId));
    if (!tile || tile.userId !== userId) throw new Error("Tile no encontrado");

    const building = (CITY_BUILDINGS as any)[tile.buildingKey];
    if (!building || !building.produceResource) throw new Error("Este edificio no produce recursos");

    const now = new Date();
    const isReady = tile.state === "ready" || 
      ((tile.state === "producing" || tile.state === "building") && tile.readyAt && tile.readyAt <= now);
    if (!isReady) {
      throw new Error("Este edificio aun no esta listo para cosechar");
    }

    const resource = building.produceResource as string;
    const amount = building.produceAmount as number;

    const profile = await this.getOrCreateCityProfile(userId);
    const updateData: any = { xp: profile.xp + 3 };
    if (resource === "gold") updateData.gold = profile.gold + amount;
    else if (resource === "food") updateData.food = profile.food + amount;
    else if (resource === "wood") updateData.wood = profile.wood + amount;
    else if (resource === "stone") updateData.stone = profile.stone + amount;
    else if (resource === "faith") updateData.faith = profile.faith + amount;

    await db.update(cityProfiles).set(updateData).where(eq(cityProfiles.userId, userId));

    const newReadyAt = new Date(now.getTime() + (building.produceTimeSec || 0) * 1000);
    const [updatedTile] = await db.update(cityTiles).set({
      state: "producing",
      plantedAt: now,
      readyAt: newReadyAt,
      lastHarvestAt: now,
    }).where(eq(cityTiles.id, tileId)).returning();

    await this.updateCityMissionProgress(userId, "harvest", null);
    await this.checkLevelUp(userId);

    return { tile: updatedTile, resourceGained: resource, amountGained: amount };
  }

  async collectAllReady(userId: number): Promise<{ collected: number; resources: Record<string, number> }> {
    const tiles = await this.getCityTiles(userId);
    const now = new Date();
    const resources: Record<string, number> = {};
    let collected = 0;

    for (const tile of tiles) {
      const building = (CITY_BUILDINGS as any)[tile.buildingKey];
      if (!building || !building.produceResource) continue;
      const tileReady = tile.state === "ready" || 
        ((tile.state === "producing" || tile.state === "building") && tile.readyAt && tile.readyAt <= now);
      if (!tileReady || !tile.readyAt) continue;

      const resource = building.produceResource as string;
      const amount = building.produceAmount as number;
      resources[resource] = (resources[resource] || 0) + amount;
      collected++;

      const newReadyAt = new Date(now.getTime() + (building.produceTimeSec || 0) * 1000);
      await db.update(cityTiles).set({
        state: "producing",
        plantedAt: now,
        readyAt: newReadyAt,
        lastHarvestAt: now,
      }).where(eq(cityTiles.id, tile.id));
    }

    if (collected > 0) {
      const profile = await this.getOrCreateCityProfile(userId);
      const updateData: any = { xp: profile.xp + (3 * collected) };
      if (resources.gold) updateData.gold = profile.gold + resources.gold;
      if (resources.food) updateData.food = profile.food + resources.food;
      if (resources.wood) updateData.wood = profile.wood + resources.wood;
      if (resources.stone) updateData.stone = profile.stone + resources.stone;
      if (resources.faith) updateData.faith = profile.faith + resources.faith;

      await db.update(cityProfiles).set(updateData).where(eq(cityProfiles.userId, userId));

      for (let i = 0; i < collected; i++) {
        await this.updateCityMissionProgress(userId, "harvest", null);
      }
      await this.checkLevelUp(userId);
    }

    return { collected, resources };
  }

  async demolishCityTile(userId: number, tileId: number): Promise<void> {
    const [tile] = await db.select().from(cityTiles).where(eq(cityTiles.id, tileId));
    if (!tile || tile.userId !== userId) throw new Error("Tile no encontrado");

    const building = (CITY_BUILDINGS as any)[tile.buildingKey];
    if (!building) throw new Error("Edificio no encontrado");

    const profile = await this.getOrCreateCityProfile(userId);
    const popReduce = (building as any).populationAdd || 0;

    await db.update(cityProfiles).set({
      gold: profile.gold + Math.floor((building.costGold || 0) / 2),
      wood: profile.wood + Math.floor((building.costWood || 0) / 2),
      stone: profile.stone + Math.floor((building.costStone || 0) / 2),
      food: profile.food + Math.floor((building.costFood || 0) / 2),
      faith: profile.faith + Math.floor((building.costFaith || 0) / 2),
      maxPopulation: Math.max(0, profile.maxPopulation - popReduce),
    }).where(eq(cityProfiles.userId, userId));

    await db.delete(cityTiles).where(eq(cityTiles.id, tileId));
  }

  async moveCityTile(userId: number, tileId: number, toX: number, toY: number): Promise<void> {
    if (toX < 0 || toX >= 8 || toY < 0 || toY >= 8) throw new Error("Posicion fuera del mapa");
    const [tile] = await db.select().from(cityTiles).where(eq(cityTiles.id, tileId));
    if (!tile || tile.userId !== userId) throw new Error("Tile no encontrado");
    const [existing] = await db.select().from(cityTiles).where(and(eq(cityTiles.userId, userId), eq(cityTiles.x, toX), eq(cityTiles.y, toY)));
    if (existing) throw new Error("Ya hay un edificio en esa posicion");
    await db.update(cityTiles).set({ x: toX, y: toY }).where(eq(cityTiles.id, tileId));
  }

  async swapCityTiles(userId: number, tileId1: number, tileId2: number): Promise<void> {
    const [tile1] = await db.select().from(cityTiles).where(eq(cityTiles.id, tileId1));
    const [tile2] = await db.select().from(cityTiles).where(eq(cityTiles.id, tileId2));
    if (!tile1 || !tile2 || tile1.userId !== userId || tile2.userId !== userId) throw new Error("Tiles no encontrados");
    const t1x = tile1.x, t1y = tile1.y;
    await db.update(cityTiles).set({ x: tile2.x, y: tile2.y }).where(eq(cityTiles.id, tileId1));
    await db.update(cityTiles).set({ x: t1x, y: t1y }).where(eq(cityTiles.id, tileId2));
  }

  async getCityMissions(userId: number): Promise<(CityMission & { progress: number; isCompleted: boolean; isClaimed: boolean })[]> {
    const allMissions = await db.select().from(cityMissions).orderBy(asc(cityMissions.sortOrder));
    const userProgress = await db.select().from(userCityMissions).where(eq(userCityMissions.userId, userId));

    const progressMap = new Map<number, { progress: number; isCompleted: boolean; isClaimed: boolean }>();
    for (const up of userProgress) {
      progressMap.set(up.missionId, { progress: up.progress, isCompleted: up.isCompleted, isClaimed: up.isClaimed });
    }

    return allMissions.map(m => ({
      ...m,
      progress: progressMap.get(m.id)?.progress || 0,
      isCompleted: progressMap.get(m.id)?.isCompleted || false,
      isClaimed: progressMap.get(m.id)?.isClaimed || false,
    }));
  }

  async updateCityMissionProgress(userId: number, missionType: string, targetKey: string | null): Promise<void> {
    const matchingMissions = await db.select().from(cityMissions)
      .where(eq(cityMissions.missionType, missionType));

    for (const mission of matchingMissions) {
      if (mission.targetKey !== null && mission.targetKey !== targetKey && targetKey !== null) continue;

      const [existing] = await db.select().from(userCityMissions)
        .where(and(eq(userCityMissions.userId, userId), eq(userCityMissions.missionId, mission.id)));

      if (existing) {
        if (existing.isCompleted) continue;
        const newProgress = existing.progress + 1;
        const completed = newProgress >= mission.targetCount;
        await db.update(userCityMissions).set({
          progress: newProgress,
          isCompleted: completed,
          completedAt: completed ? new Date() : null,
        }).where(eq(userCityMissions.id, existing.id));
      } else {
        const completed = 1 >= mission.targetCount;
        await db.insert(userCityMissions).values({
          userId,
          missionId: mission.id,
          progress: 1,
          isCompleted: completed,
          completedAt: completed ? new Date() : null,
        });
      }
    }
  }

  async claimCityMissionReward(userId: number, missionId: number): Promise<CityProfile> {
    const [userMission] = await db.select().from(userCityMissions)
      .where(and(eq(userCityMissions.userId, userId), eq(userCityMissions.missionId, missionId)));

    if (!userMission || !userMission.isCompleted) throw new Error("Mision no completada");
    if (userMission.isClaimed) throw new Error("Recompensa ya reclamada");

    const [mission] = await db.select().from(cityMissions).where(eq(cityMissions.id, missionId));
    if (!mission) throw new Error("Mision no encontrada");

    const profile = await this.getOrCreateCityProfile(userId);

    await db.update(cityProfiles).set({
      gold: profile.gold + mission.rewardGold,
      food: profile.food + mission.rewardFood,
      wood: profile.wood + mission.rewardWood,
      stone: profile.stone + mission.rewardStone,
      faith: profile.faith + mission.rewardFaith,
      xp: profile.xp + mission.rewardXp,
    }).where(eq(cityProfiles.userId, userId));

    await db.update(userCityMissions).set({
      isClaimed: true,
      claimedAt: new Date(),
    }).where(eq(userCityMissions.id, userMission.id));

    await this.checkLevelUp(userId);

    const [updated] = await db.select().from(cityProfiles).where(eq(cityProfiles.userId, userId));
    return updated;
  }

  async getNeighborCities(): Promise<(CityProfile & { username: string; displayName: string | null; tileCount: number })[]> {
    const profiles = await db
      .select({
        id: cityProfiles.id,
        userId: cityProfiles.userId,
        cityName: cityProfiles.cityName,
        level: cityProfiles.level,
        xp: cityProfiles.xp,
        gold: cityProfiles.gold,
        food: cityProfiles.food,
        wood: cityProfiles.wood,
        stone: cityProfiles.stone,
        faith: cityProfiles.faith,
        population: cityProfiles.population,
        maxPopulation: cityProfiles.maxPopulation,
        lastCollectedAt: cityProfiles.lastCollectedAt,
        createdAt: cityProfiles.createdAt,
        username: users.username,
        displayName: users.displayName,
        tileCount: sql<number>`(SELECT count(*)::int FROM city_tiles WHERE city_tiles.user_id = ${cityProfiles.userId})`,
      })
      .from(cityProfiles)
      .innerJoin(users, eq(cityProfiles.userId, users.id))
      .orderBy(desc(cityProfiles.level));

    return profiles.map(p => ({
      id: p.id,
      userId: p.userId,
      cityName: p.cityName,
      level: p.level,
      xp: p.xp,
      gold: p.gold,
      food: p.food,
      wood: p.wood,
      stone: p.stone,
      faith: p.faith,
      population: p.population,
      maxPopulation: p.maxPopulation,
      lastCollectedAt: p.lastCollectedAt,
      createdAt: p.createdAt,
      username: p.username,
      displayName: p.displayName,
      tileCount: p.tileCount,
    }));
  }

  async helpNeighbor(helperId: number, _ownerId: number, tileId: number): Promise<CityHelp> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [tile] = await db.select().from(cityTiles).where(eq(cityTiles.id, tileId));
    if (!tile) throw new Error("Edificio no encontrado");
    const ownerId = tile.userId;
    if (ownerId === helperId) throw new Error("No puedes ayudarte a ti mismo");

    const [existingHelp] = await db.select().from(cityHelps)
      .where(and(
        eq(cityHelps.helperId, helperId),
        eq(cityHelps.tileId, tileId),
        sql`${cityHelps.createdAt} >= ${today}`,
      ));

    if (existingHelp) throw new Error("Ya ayudaste a este edificio hoy");

    if (tile.readyAt) {
      const now = new Date();
      const remaining = tile.readyAt.getTime() - now.getTime();
      if (remaining > 0) {
        const reduced = new Date(now.getTime() + remaining * 0.8);
        await db.update(cityTiles).set({ readyAt: reduced }).where(eq(cityTiles.id, tileId));
      }
    }

    const [help] = await db.insert(cityHelps).values({
      helperId,
      ownerId,
      tileId,
      helpType: "boost",
    }).returning();

    return help;
  }

  async createCityTrade(fromUserId: number, data: InsertCityTrade): Promise<CityTrade> {
    const profile = await this.getOrCreateCityProfile(fromUserId);

    const resourceKey = data.offerResource as string;
    const amount = data.offerAmount;
    const currentAmount = (profile as any)[resourceKey] || 0;
    if (currentAmount < amount) throw new Error("No tienes suficientes recursos para ofrecer");

    const updateData: any = {};
    updateData[resourceKey] = currentAmount - amount;
    await db.update(cityProfiles).set(updateData).where(eq(cityProfiles.userId, fromUserId));

    const [trade] = await db.insert(cityTrades).values({
      fromUserId,
      offerResource: data.offerResource,
      offerAmount: data.offerAmount,
      requestResource: data.requestResource,
      requestAmount: data.requestAmount,
    }).returning();

    return trade;
  }

  async acceptCityTrade(userId: number, tradeId: number): Promise<CityTrade> {
    const [trade] = await db.select().from(cityTrades).where(eq(cityTrades.id, tradeId));
    if (!trade || trade.status !== "open") throw new Error("Comercio no disponible");
    if (trade.fromUserId === userId) throw new Error("No puedes aceptar tu propio comercio");

    const acceptorProfile = await this.getOrCreateCityProfile(userId);
    const acceptorAmount = (acceptorProfile as any)[trade.requestResource] || 0;
    if (acceptorAmount < trade.requestAmount) throw new Error("No tienes suficientes recursos");

    const acceptorUpdate: any = {};
    acceptorUpdate[trade.requestResource] = acceptorAmount - trade.requestAmount;
    acceptorUpdate[trade.offerResource] = ((acceptorProfile as any)[trade.offerResource] || 0) + trade.offerAmount;
    await db.update(cityProfiles).set(acceptorUpdate).where(eq(cityProfiles.userId, userId));

    const senderProfile = await this.getOrCreateCityProfile(trade.fromUserId);
    const senderUpdate: any = {};
    senderUpdate[trade.requestResource] = ((senderProfile as any)[trade.requestResource] || 0) + trade.requestAmount;
    await db.update(cityProfiles).set(senderUpdate).where(eq(cityProfiles.userId, trade.fromUserId));

    const [updated] = await db.update(cityTrades).set({
      status: "accepted",
      toUserId: userId,
    }).where(eq(cityTrades.id, tradeId)).returning();

    return updated;
  }

  async cancelCityTrade(userId: number, tradeId: number): Promise<void> {
    const [trade] = await db.select().from(cityTrades).where(eq(cityTrades.id, tradeId));
    if (!trade || trade.fromUserId !== userId) throw new Error("Comercio no encontrado");
    if (trade.status !== "open") throw new Error("Este comercio ya no esta abierto");

    const profile = await this.getOrCreateCityProfile(userId);
    const updateData: any = {};
    updateData[trade.offerResource] = ((profile as any)[trade.offerResource] || 0) + trade.offerAmount;
    await db.update(cityProfiles).set(updateData).where(eq(cityProfiles.userId, userId));

    await db.update(cityTrades).set({ status: "cancelled" }).where(eq(cityTrades.id, tradeId));
  }

  async getOpenTrades(): Promise<(CityTrade & { fromUsername: string })[]> {
    const trades = await db
      .select({
        id: cityTrades.id,
        fromUserId: cityTrades.fromUserId,
        toUserId: cityTrades.toUserId,
        offerResource: cityTrades.offerResource,
        offerAmount: cityTrades.offerAmount,
        requestResource: cityTrades.requestResource,
        requestAmount: cityTrades.requestAmount,
        status: cityTrades.status,
        createdAt: cityTrades.createdAt,
        fromUsername: users.username,
      })
      .from(cityTrades)
      .innerJoin(users, eq(cityTrades.fromUserId, users.id))
      .where(eq(cityTrades.status, "open"))
      .orderBy(desc(cityTrades.createdAt));

    return trades.map(t => ({
      id: t.id,
      fromUserId: t.fromUserId,
      toUserId: t.toUserId,
      offerResource: t.offerResource,
      offerAmount: t.offerAmount,
      requestResource: t.requestResource,
      requestAmount: t.requestAmount,
      status: t.status,
      createdAt: t.createdAt,
      fromUsername: t.fromUsername,
    }));
  }

  async checkLevelUp(userId: number): Promise<CityProfile> {
    const [profile] = await db.select().from(cityProfiles).where(eq(cityProfiles.userId, userId));
    if (!profile) throw new Error("Perfil no encontrado");

    let newLevel = profile.level;
    for (let i = 0; i < CITY_LEVEL_XP.length; i++) {
      if (profile.xp >= CITY_LEVEL_XP[i]) {
        newLevel = i + 1;
      }
    }

    if (newLevel > profile.level) {
      const [updated] = await db.update(cityProfiles)
        .set({ level: newLevel })
        .where(eq(cityProfiles.userId, userId))
        .returning();
      return updated;
    }

    return profile;
  }

  async createGameRoom(userId: number, gameType: string, roomCode: string): Promise<GameRoom> {
    const [room] = await db.insert(gameRooms).values({
      gameType,
      roomCode,
      player1Id: userId,
      status: "waiting",
      gameState: "{}",
      currentTurn: userId,
    }).returning();
    return room;
  }

  async joinGameRoom(userId: number, roomId: number): Promise<GameRoom> {
    const [room] = await db.select().from(gameRooms).where(eq(gameRooms.id, roomId));
    if (!room) throw new Error("Sala no encontrada");
    if (room.status !== "waiting") throw new Error("La sala ya esta en juego");
    if (room.player1Id === userId) throw new Error("Ya estas en esta sala");
    if (room.player2Id) throw new Error("La sala esta llena");
    const [updated] = await db.update(gameRooms).set({
      player2Id: userId,
      status: "playing",
      updatedAt: new Date(),
    }).where(eq(gameRooms.id, roomId)).returning();
    return updated;
  }

  async getGameRoom(roomId: number): Promise<GameRoom | null> {
    const [room] = await db.select().from(gameRooms).where(eq(gameRooms.id, roomId));
    return room || null;
  }

  async getGameRoomByCode(code: string): Promise<GameRoom | null> {
    const [room] = await db.select().from(gameRooms).where(eq(gameRooms.roomCode, code));
    return room || null;
  }

  async listGameRooms(gameType?: string): Promise<(GameRoom & { player1Name: string; player2Name: string | null })[]> {
    const conditions = [or(eq(gameRooms.status, "waiting"), eq(gameRooms.status, "playing"))];
    if (gameType) {
      conditions.push(eq(gameRooms.gameType, gameType));
    }

    const rooms = await db.select().from(gameRooms)
      .where(and(...conditions))
      .orderBy(desc(gameRooms.createdAt));

    const result = [];
    for (const room of rooms) {
      const [p1] = await db.select().from(users).where(eq(users.id, room.player1Id));
      let player2Name: string | null = null;
      if (room.player2Id) {
        const [p2] = await db.select().from(users).where(eq(users.id, room.player2Id));
        player2Name = p2 ? (p2.displayName || p2.username) : null;
      }
      result.push({
        ...room,
        player1Name: p1 ? (p1.displayName || p1.username) : "Desconocido",
        player2Name,
      });
    }
    return result;
  }

  async updateGameState(userId: number, roomId: number, gameState: string, currentTurn: number | null): Promise<GameRoom> {
    const [room] = await db.select().from(gameRooms).where(eq(gameRooms.id, roomId));
    if (!room) throw new Error("Sala no encontrada");
    if (room.player1Id !== userId && room.player2Id !== userId) throw new Error("No eres parte de esta sala");
    if (room.status !== "playing") throw new Error("El juego no esta activo");
    const [updated] = await db.update(gameRooms).set({
      gameState,
      currentTurn,
      updatedAt: new Date(),
    }).where(eq(gameRooms.id, roomId)).returning();
    return updated;
  }

  async finishGame(roomId: number, winnerId: number | null, isDraw: boolean): Promise<GameRoom> {
    const [updated] = await db.update(gameRooms).set({
      status: "finished",
      winnerId,
      isDraw,
      updatedAt: new Date(),
    }).where(eq(gameRooms.id, roomId)).returning();
    return updated;
  }

  async leaveGameRoom(userId: number, roomId: number): Promise<void> {
    const [room] = await db.select().from(gameRooms).where(eq(gameRooms.id, roomId));
    if (!room) throw new Error("Sala no encontrada");
    if (room.player1Id === userId && !room.player2Id) {
      await db.delete(gameRooms).where(eq(gameRooms.id, roomId));
    } else if (room.status === "playing") {
      const winnerId = room.player1Id === userId ? room.player2Id : room.player1Id;
      await db.update(gameRooms).set({ status: "finished", winnerId, updatedAt: new Date() }).where(eq(gameRooms.id, roomId));
    }
  }

  async getGameStats(userId: number): Promise<GameStat[]> {
    return db.select().from(gameStats).where(eq(gameStats.userId, userId));
  }

  async updateGameStats(userId: number, gameType: string, result: "win" | "loss" | "draw"): Promise<GameStat> {
    const [existing] = await db.select().from(gameStats).where(and(eq(gameStats.userId, userId), eq(gameStats.gameType, gameType)));
    if (existing) {
      const upd: any = {};
      if (result === "win") upd.wins = existing.wins + 1;
      else if (result === "loss") upd.losses = existing.losses + 1;
      else upd.draws = existing.draws + 1;
      const [updated] = await db.update(gameStats).set(upd).where(eq(gameStats.id, existing.id)).returning();
      return updated;
    }
    const vals: any = { userId, gameType, wins: 0, losses: 0, draws: 0 };
    if (result === "win") vals.wins = 1;
    else if (result === "loss") vals.losses = 1;
    else vals.draws = 1;
    const [created] = await db.insert(gameStats).values(vals).returning();
    return created;
  }

  async getGameLeaderboard(gameType: string): Promise<(GameStat & { username: string; displayName: string | null })[]> {
    return db.select({
      id: gameStats.id, userId: gameStats.userId, gameType: gameStats.gameType,
      wins: gameStats.wins, losses: gameStats.losses, draws: gameStats.draws,
      username: users.username, displayName: users.displayName,
    }).from(gameStats)
      .innerJoin(users, eq(gameStats.userId, users.id))
      .where(eq(gameStats.gameType, gameType))
      .orderBy(desc(gameStats.wins));
  }
}

export const storage = new DatabaseStorage();
