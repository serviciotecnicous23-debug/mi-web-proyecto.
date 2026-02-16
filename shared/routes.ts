import { z } from "zod";
import {
  insertUserSchema, updateUserSchema, users, changePasswordSchema,
  insertMessageSchema, insertMemberPostSchema,
  insertEventSchema, updateEventSchema, updateSiteContentSchema,
  insertCourseSchema, updateCourseSchema,
  insertCourseMaterialSchema, updateCourseMaterialSchema,
  insertCourseSessionSchema, updateCourseSessionSchema,
  insertEnrollmentSchema, updateEnrollmentSchema,
  insertTeacherRequestSchema, updateTeacherRequestSchema,
  insertCourseAnnouncementSchema, updateCourseAnnouncementSchema,
  insertCourseScheduleSchema, updateCourseScheduleSchema,
  insertSessionAttendanceSchema,
  insertBibleHighlightSchema, insertBibleNoteSchema,
  insertReadingPlanSchema, insertReadingPlanItemSchema,
  insertReadingClubPostSchema, insertReadingClubCommentSchema,
  insertLibraryResourceSchema,
  insertPrayerActivitySchema, insertRegionPostSchema,
  insertNotificationSchema,
  insertMinistryRegionSchema, updateMinistryRegionSchema,
  insertTeamMemberSchema, updateTeamMemberSchema,
  insertPostCommentSchema, insertDirectMessageSchema,
} from "./schema";

export { insertUserSchema, updateUserSchema, users };

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login" as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    register: {
      method: "POST" as const,
      path: "/api/register" as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout" as const,
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/user" as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  users: {
    get: {
      method: "GET" as const,
      path: "/api/users/:id" as const,
    },
    update: {
      method: "PATCH" as const,
      path: "/api/users/:id" as const,
      input: updateUserSchema,
    },
    changePassword: {
      method: "POST" as const,
      path: "/api/users/change-password" as const,
      input: changePasswordSchema,
    },
  },
  contact: {
    send: {
      method: "POST" as const,
      path: "/api/contact" as const,
      input: insertMessageSchema.omit({ id: true, createdAt: true, isRead: true }),
    },
  },
  posts: {
    list: { method: "GET" as const, path: "/api/posts" as const },
    create: { method: "POST" as const, path: "/api/posts" as const, input: insertMemberPostSchema },
    delete: { method: "DELETE" as const, path: "/api/posts/:id" as const },
  },
  events: {
    list: { method: "GET" as const, path: "/api/events" as const },
    get: { method: "GET" as const, path: "/api/events/:id" as const },
    create: { method: "POST" as const, path: "/api/events" as const, input: insertEventSchema },
    update: { method: "PATCH" as const, path: "/api/events/:id" as const, input: updateEventSchema },
    delete: { method: "DELETE" as const, path: "/api/events/:id" as const },
  },
  siteContent: {
    get: { method: "GET" as const, path: "/api/content/:key" as const },
    list: { method: "GET" as const, path: "/api/content" as const },
    update: { method: "PATCH" as const, path: "/api/content/:key" as const, input: updateSiteContentSchema },
  },
  courses: {
    list: { method: "GET" as const, path: "/api/courses" as const },
    get: { method: "GET" as const, path: "/api/courses/:id" as const },
    create: { method: "POST" as const, path: "/api/courses" as const, input: insertCourseSchema },
    update: { method: "PATCH" as const, path: "/api/courses/:id" as const, input: updateCourseSchema },
    delete: { method: "DELETE" as const, path: "/api/courses/:id" as const },
  },
  courseMaterials: {
    list: { method: "GET" as const, path: "/api/courses/:courseId/materials" as const },
    create: { method: "POST" as const, path: "/api/courses/:courseId/materials" as const, input: insertCourseMaterialSchema },
    update: { method: "PATCH" as const, path: "/api/materials/:id" as const, input: updateCourseMaterialSchema },
    delete: { method: "DELETE" as const, path: "/api/materials/:id" as const },
  },
  courseSessions: {
    list: { method: "GET" as const, path: "/api/courses/:courseId/sessions" as const },
    create: { method: "POST" as const, path: "/api/courses/:courseId/sessions" as const, input: insertCourseSessionSchema },
    update: { method: "PATCH" as const, path: "/api/sessions/:id" as const, input: updateCourseSessionSchema },
    delete: { method: "DELETE" as const, path: "/api/sessions/:id" as const },
  },
  enrollments: {
    list: { method: "GET" as const, path: "/api/enrollments" as const },
    listByCourse: { method: "GET" as const, path: "/api/courses/:courseId/enrollments" as const },
    create: { method: "POST" as const, path: "/api/enrollments" as const, input: insertEnrollmentSchema },
    update: { method: "PATCH" as const, path: "/api/enrollments/:id" as const, input: updateEnrollmentSchema },
    delete: { method: "DELETE" as const, path: "/api/enrollments/:id" as const },
  },
  teacherRequests: {
    list: { method: "GET" as const, path: "/api/teacher-requests" as const },
    myRequests: { method: "GET" as const, path: "/api/my-teacher-requests" as const },
    create: { method: "POST" as const, path: "/api/teacher-requests" as const, input: insertTeacherRequestSchema },
    update: { method: "PATCH" as const, path: "/api/teacher-requests/:id" as const, input: updateTeacherRequestSchema },
    delete: { method: "DELETE" as const, path: "/api/teacher-requests/:id" as const },
  },
  courseAnnouncements: {
    list: { method: "GET" as const, path: "/api/courses/:courseId/announcements" as const },
    create: { method: "POST" as const, path: "/api/courses/:courseId/announcements" as const, input: insertCourseAnnouncementSchema },
    update: { method: "PATCH" as const, path: "/api/announcements/:id" as const, input: updateCourseAnnouncementSchema },
    delete: { method: "DELETE" as const, path: "/api/announcements/:id" as const },
  },
  courseScheduleEntries: {
    list: { method: "GET" as const, path: "/api/courses/:courseId/schedule" as const },
    create: { method: "POST" as const, path: "/api/courses/:courseId/schedule" as const, input: insertCourseScheduleSchema },
    update: { method: "PATCH" as const, path: "/api/schedule/:id" as const, input: updateCourseScheduleSchema },
    delete: { method: "DELETE" as const, path: "/api/schedule/:id" as const },
  },
  sessionAttendance: {
    list: { method: "GET" as const, path: "/api/sessions/:sessionId/attendance" as const },
    upsert: { method: "POST" as const, path: "/api/sessions/:sessionId/attendance" as const, input: insertSessionAttendanceSchema },
  },
  // ========== BIBLIOTECA ==========
  bibleHighlights: {
    list: { method: "GET" as const, path: "/api/bible/highlights" as const },
    create: { method: "POST" as const, path: "/api/bible/highlights" as const, input: insertBibleHighlightSchema },
    delete: { method: "DELETE" as const, path: "/api/bible/highlights/:id" as const },
  },
  bibleNotes: {
    list: { method: "GET" as const, path: "/api/bible/notes" as const },
    create: { method: "POST" as const, path: "/api/bible/notes" as const, input: insertBibleNoteSchema },
    update: { method: "PATCH" as const, path: "/api/bible/notes/:id" as const, input: z.object({ content: z.string().min(1) }) },
    delete: { method: "DELETE" as const, path: "/api/bible/notes/:id" as const },
  },
  readingPlans: {
    list: { method: "GET" as const, path: "/api/reading-plans" as const },
    get: { method: "GET" as const, path: "/api/reading-plans/:id" as const },
    create: { method: "POST" as const, path: "/api/reading-plans" as const, input: insertReadingPlanSchema },
    delete: { method: "DELETE" as const, path: "/api/reading-plans/:id" as const },
    addItem: { method: "POST" as const, path: "/api/reading-plans/:id/items" as const, input: insertReadingPlanItemSchema },
    toggleItem: { method: "PATCH" as const, path: "/api/reading-plan-items/:id/toggle" as const },
    deleteItem: { method: "DELETE" as const, path: "/api/reading-plan-items/:id" as const },
  },
  readingClub: {
    list: { method: "GET" as const, path: "/api/reading-club" as const },
    create: { method: "POST" as const, path: "/api/reading-club" as const, input: insertReadingClubPostSchema },
    delete: { method: "DELETE" as const, path: "/api/reading-club/:id" as const },
    listComments: { method: "GET" as const, path: "/api/reading-club/:id/comments" as const },
    createComment: { method: "POST" as const, path: "/api/reading-club/:id/comments" as const, input: insertReadingClubCommentSchema },
    deleteComment: { method: "DELETE" as const, path: "/api/reading-club-comments/:id" as const },
  },
  libraryResources: {
    list: { method: "GET" as const, path: "/api/library-resources" as const },
    create: { method: "POST" as const, path: "/api/library-resources" as const, input: insertLibraryResourceSchema },
    delete: { method: "DELETE" as const, path: "/api/library-resources/:id" as const },
    toggleLike: { method: "POST" as const, path: "/api/library-resources/:id/like" as const },
  },
  readingClubLikes: {
    toggle: { method: "POST" as const, path: "/api/reading-club/:id/like" as const },
  },
  admin: {
    listUsers: { method: "GET" as const, path: "/api/admin/users" as const },
    toggleActive: { method: "PATCH" as const, path: "/api/admin/users/:id/toggle-active" as const },
    updateRole: { method: "PATCH" as const, path: "/api/admin/users/:id/role" as const },
    updateUserInfo: { method: "PATCH" as const, path: "/api/admin/users/:id/info" as const },
    deleteUser: { method: "DELETE" as const, path: "/api/admin/users/:id" as const },
    listMessages: { method: "GET" as const, path: "/api/admin/messages" as const },
    toggleMessageRead: { method: "PATCH" as const, path: "/api/admin/messages/:id/toggle-read" as const },
    deleteMessage: { method: "DELETE" as const, path: "/api/admin/messages/:id" as const },
    getWhatsappLink: { method: "GET" as const, path: "/api/admin/whatsapp-link" as const },
    updateWhatsappLink: { method: "PATCH" as const, path: "/api/admin/whatsapp-link" as const },
    getLiveStream: { method: "GET" as const, path: "/api/live-stream" as const },
    updateLiveStream: { method: "PATCH" as const, path: "/api/admin/live-stream" as const },
    getUserDetail: { method: "GET" as const, path: "/api/admin/users/:id/detail" as const },
  },
  notifications: {
    list: { method: "GET" as const, path: "/api/notifications" as const },
    markRead: { method: "PATCH" as const, path: "/api/notifications/:id/read" as const },
    markAllRead: { method: "PATCH" as const, path: "/api/notifications/read-all" as const },
    unreadCount: { method: "GET" as const, path: "/api/notifications/unread-count" as const },
  },
  prayerActivities: {
    list: { method: "GET" as const, path: "/api/prayer-activities" as const },
    create: { method: "POST" as const, path: "/api/prayer-activities" as const, input: insertPrayerActivitySchema },
    delete: { method: "DELETE" as const, path: "/api/prayer-activities/:id" as const },
  },
  regionPosts: {
    list: { method: "GET" as const, path: "/api/region-posts" as const },
    create: { method: "POST" as const, path: "/api/region-posts" as const, input: insertRegionPostSchema },
    delete: { method: "DELETE" as const, path: "/api/region-posts/:id" as const },
  },
  ministryRegions: {
    list: { method: "GET" as const, path: "/api/ministry-regions" as const },
    create: { method: "POST" as const, path: "/api/ministry-regions" as const, input: insertMinistryRegionSchema },
    update: { method: "PATCH" as const, path: "/api/ministry-regions/:id" as const, input: updateMinistryRegionSchema },
    delete: { method: "DELETE" as const, path: "/api/ministry-regions/:id" as const },
  },
  teamMembers: {
    list: { method: "GET" as const, path: "/api/team-members" as const },
    create: { method: "POST" as const, path: "/api/team-members" as const, input: insertTeamMemberSchema },
    update: { method: "PATCH" as const, path: "/api/team-members/:id" as const, input: updateTeamMemberSchema },
    delete: { method: "DELETE" as const, path: "/api/team-members/:id" as const },
  },
  friends: {
    list: { method: "GET" as const, path: "/api/friends" as const },
    requests: { method: "GET" as const, path: "/api/friends/requests" as const },
    send: { method: "POST" as const, path: "/api/friends/request" as const },
    accept: { method: "PATCH" as const, path: "/api/friends/:id/accept" as const },
    reject: { method: "PATCH" as const, path: "/api/friends/:id/reject" as const },
    remove: { method: "DELETE" as const, path: "/api/friends/:id" as const },
    search: { method: "GET" as const, path: "/api/friends/search" as const },
  },
  postComments: {
    list: { method: "GET" as const, path: "/api/posts/:postId/comments" as const },
    create: { method: "POST" as const, path: "/api/posts/:postId/comments" as const, input: insertPostCommentSchema },
    delete: { method: "DELETE" as const, path: "/api/post-comments/:id" as const },
  },
  directMessages: {
    conversations: { method: "GET" as const, path: "/api/messages/conversations" as const },
    list: { method: "GET" as const, path: "/api/messages/:userId" as const },
    send: { method: "POST" as const, path: "/api/messages" as const, input: insertDirectMessageSchema },
    markRead: { method: "PATCH" as const, path: "/api/messages/:userId/read" as const },
    unreadCount: { method: "GET" as const, path: "/api/messages/unread-count" as const },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
