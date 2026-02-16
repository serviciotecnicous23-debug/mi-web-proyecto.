import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { memoryStorage } from "./memory-storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import MemoryStore from "memorystore";
import multer from "multer";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function isAdmin(req: any): boolean {
  return req.isAuthenticated() && req.user?.role === "admin";
}

function isTeacherOrAdmin(req: any): boolean {
  return req.isAuthenticated() && (req.user?.role === "admin" || req.user?.role === "obrero");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev_secret",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({ checkPeriod: 86400000 }),
      cookie: { secure: false },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        let user = null;
        try {
          user = await storage.getUserByUsername(username);
        } catch (dbErr) {
          // Si la BD falla, usar almacenamiento en memoria
          console.log("Database unavailable, using memory storage");
          user = await memoryStorage.getUserByUsername(username);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Usuario o contrasena incorrectos" });
        }
        if (!user.isActive) {
          return done(null, false, { message: "Tu cuenta esta pendiente de aprobacion por un administrador" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      let user = await storage.getUser(id);
      // Fallback a almacenamiento en memoria
      if (!user) {
        user = await memoryStorage.getUser(id) as any;
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Inicializar usuario administrador en base de datos y almacenamiento en memoria
  (async () => {
    try {
      const adminUsername = "servicio-tecnico";
      const adminEmail = "serviciotecnico.us23@gmail.com";
      const adminPassword = "l27182454";
      const hashedPassword = await hashPassword(adminPassword);

      // Crear en almacenamiento en memoria (fallback)
      const existingMemory = await memoryStorage.findUserByEmail(adminEmail);
      if (!existingMemory) {
        await memoryStorage.createUser({
          username: adminUsername,
          password: hashedPassword,
          email: adminEmail,
          role: "admin",
          displayName: "Servicio Técnico",
          isActive: true,
        } as any);
        console.log("✓ Admin inicializado en memoria");
      }

      // Crear en base de datos PostgreSQL
      try {
        const existingDB = await storage.getUserByUsername(adminUsername);
        if (!existingDB) {
          await storage.createUser({
            username: adminUsername,
            password: hashedPassword,
            email: adminEmail,
            role: "admin",
            displayName: "Servicio Técnico",
            isActive: true,
          });
          console.log("✓ Admin inicializado en PostgreSQL");
        } else {
          console.log("✓ Admin ya existe en PostgreSQL");
        }
      } catch (dbErr) {
        console.log("⚠ No se pudo crear admin en PostgreSQL (usando solo memoria):", (dbErr as Error).message);
      }

      console.log(`  Email: ${adminEmail}`);
      console.log(`  Usuario: ${adminUsername}`);
      console.log(`  Rol: admin`);
    } catch (err) {
      console.error("Error al inicializar admin:", err);
    }
  })();

  // ========== AUTH ===========
  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Error al iniciar sesion" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      let existing = null;
      try {
        existing = await storage.getUserByUsername(input.username);
      } catch (dbErr) {
        console.log('storage.getUserByUsername failed, using memoryStorage fallback');
        existing = await memoryStorage.getUserByUsername(input.username);
      }

      if (existing) {
        return res.status(400).json({ message: "Este nombre de usuario ya esta en uso" });
      }

      const hashedPassword = await hashPassword(input.password);

      let allUsers: any[] = [];
      try {
        allUsers = await storage.listUsers();
      } catch (dbErr) {
        console.log('storage.listUsers failed, using memoryStorage fallback');
        allUsers = await memoryStorage.listUsers() as any[];
      }

      const isFirstUser = allUsers.length === 0;
      const validRoles = ["miembro", "usuario", "obrero"];
      const role = isFirstUser ? "admin" : (validRoles.includes(input.role || "") ? input.role! : "miembro");
      
      // Guardar en PostgreSQL (persistente)
      let user: any;
      try {
        user = await storage.createUser({
          ...input,
          password: hashedPassword,
          role,
          isActive: isFirstUser,
        });
      } catch (dbErr) {
        console.log('storage.createUser failed, using memoryStorage fallback');
        user = await memoryStorage.createUser({
          ...input,
          password: hashedPassword,
          role,
          isActive: isFirstUser,
        } as any);
      }

      req.logIn(user as any, (err) => {
        if (err) throw err;
        res.status(201).json({ ...user, pending: !isFirstUser });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Registration error:", err);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout(() => { res.sendStatus(200); });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // ========== USER PROFILE ==========
  app.get(api.users.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    if (!user) return res.sendStatus(404);
    res.json(user);
  });

  app.patch(api.users.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    if (id !== (req.user as any).id && !isAdmin(req)) {
      return res.sendStatus(403);
    }
    try {
      const updates = api.users.update.input.parse(req.body);
      const user = await storage.updateUser(id, updates);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  // ========== CONTACT ==========
  app.post(api.contact.send.path, async (req, res) => {
    try {
      const input = api.contact.send.input.parse(req.body);
      await storage.createMessage(input);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  // ========== MEMBER POSTS ==========
  app.get(api.posts.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    const posts = await storage.listMemberPosts();
    res.json(posts);
  });

  app.post(api.posts.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    try {
      const input = api.posts.create.input.parse(req.body);
      const post = await storage.createMemberPost((req.user as any).id, input.content);
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.posts.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);
    await storage.deleteMemberPost(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== EVENTS ==========
  app.get(api.events.list.path, async (req, res) => {
    if (isAdmin(req)) {
      res.json(await storage.listEvents());
    } else {
      res.json(await storage.listPublishedEvents());
    }
  });

  app.get(api.events.get.path, async (req, res) => {
    const event = await storage.getEvent(parseInt(req.params.id));
    if (!event) return res.sendStatus(404);
    if (!event.isPublished && !isAdmin(req)) return res.sendStatus(404);
    res.json(event);
  });

  app.post(api.events.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.events.create.input.parse(req.body);
      const event = await storage.createEvent({ ...input, createdBy: (req.user as any).id });
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.patch(api.events.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const event = await storage.getEvent(parseInt(req.params.id));
    if (!event) return res.sendStatus(404);
    if (!isAdmin(req) && event.createdBy !== (req.user as any).id) return res.sendStatus(403);
    try {
      const input = api.events.update.input.parse(req.body);
      const updated = await storage.updateEvent(parseInt(req.params.id), input);
      if (!updated) return res.sendStatus(404);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.events.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const event = await storage.getEvent(parseInt(req.params.id));
    if (!event) return res.sendStatus(404);
    if (!isAdmin(req) && event.createdBy !== (req.user as any).id) return res.sendStatus(403);
    await storage.deleteEvent(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== SITE CONTENT ==========
  app.get(api.siteContent.list.path, async (_req, res) => {
    res.json(await storage.listSiteContent());
  });

  app.get(api.siteContent.get.path, async (req, res) => {
    const content = await storage.getSiteContent(req.params.key);
    res.json(content || { sectionKey: req.params.key, title: null, content: null });
  });

  app.patch(api.siteContent.update.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.siteContent.update.input.parse(req.body);
      const content = await storage.upsertSiteContent(req.params.key, input, (req.user as any).id);
      res.json(content);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  // ========== COURSES ==========
  app.get(api.courses.list.path, async (req, res) => {
    const { search, category, teacher } = req.query;
    let courseList;
    if (search || category) {
      courseList = await storage.searchCourses(search as string || "", category as string);
    } else if (teacher && req.isAuthenticated()) {
      courseList = await storage.listCoursesByTeacher(parseInt(teacher as string));
    } else if (isAdmin(req)) {
      courseList = await storage.listCourses();
    } else {
      courseList = await storage.listActiveCourses();
    }
    const counts = await storage.getEnrollmentCounts();
    res.json(courseList.map(c => ({
      ...c,
      enrolledCount: counts[c.id]?.approved || 0,
      pendingCount: counts[c.id]?.pending || 0,
    })));
  });

  app.get(api.courses.get.path, async (req, res) => {
    const course = await storage.getCourse(parseInt(req.params.id));
    if (!course) return res.sendStatus(404);
    if (!course.isActive && !isAdmin(req) && !(isTeacherOrAdmin(req) && course.teacherId === (req.user as any)?.id)) {
      return res.sendStatus(404);
    }
    const counts = await storage.getEnrollmentCounts();
    res.json({
      ...course,
      enrolledCount: counts[course.id]?.approved || 0,
      pendingCount: counts[course.id]?.pending || 0,
    });
  });

  app.post(api.courses.create.path, async (req, res) => {
    if (!isTeacherOrAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.courses.create.input.parse(req.body);
      const course = await storage.createCourse({ ...input, createdBy: (req.user as any).id });
      await storage.createNotificationForAll({
        type: "curso",
        title: "Nuevo Curso Disponible",
        content: `Se abrio el curso: ${course.title}`,
        link: `/capacitaciones/${course.id}`,
      });
      res.status(201).json(course);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.patch(api.courses.update.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const course = await storage.getCourse(id);
    if (!course) return res.sendStatus(404);
    if (!isAdmin(req) && !(isTeacherOrAdmin(req) && course.teacherId === (req.user as any)?.id)) {
      return res.sendStatus(403);
    }
    try {
      const input = api.courses.update.input.parse(req.body);
      const updated = await storage.updateCourse(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.courses.delete.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    await storage.deleteCourse(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== COURSE MATERIALS ==========
  app.get(api.courseMaterials.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const courseId = parseInt(req.params.courseId);
    const materials = await storage.listCourseMaterials(courseId);
    res.json(materials);
  });

  app.post(api.courseMaterials.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);
    if (!course) return res.sendStatus(404);
    if (!isAdmin(req) && !(isTeacherOrAdmin(req) && course.teacherId === (req.user as any)?.id)) {
      return res.sendStatus(403);
    }
    try {
      const input = api.courseMaterials.create.input.parse({ ...req.body, courseId });
      const material = await storage.createCourseMaterial(input);
      res.status(201).json(material);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.patch(api.courseMaterials.update.path, async (req, res) => {
    if (!isTeacherOrAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.courseMaterials.update.input.parse(req.body);
      const material = await storage.updateCourseMaterial(parseInt(req.params.id), input);
      if (!material) return res.sendStatus(404);
      res.json(material);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.courseMaterials.delete.path, async (req, res) => {
    if (!isTeacherOrAdmin(req)) return res.sendStatus(403);
    await storage.deleteCourseMaterial(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== COURSE SESSIONS ==========
  app.get(api.courseSessions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const courseId = parseInt(req.params.courseId);
    const sessions = await storage.listCourseSessions(courseId);
    res.json(sessions);
  });

  app.post(api.courseSessions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);
    if (!course) return res.sendStatus(404);
    if (!isAdmin(req) && !(isTeacherOrAdmin(req) && course.teacherId === (req.user as any)?.id)) {
      return res.sendStatus(403);
    }
    try {
      const input = api.courseSessions.create.input.parse({ ...req.body, courseId });
      const s = await storage.createCourseSession(input);
      res.status(201).json(s);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.patch(api.courseSessions.update.path, async (req, res) => {
    if (!isTeacherOrAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.courseSessions.update.input.parse(req.body);
      const s = await storage.updateCourseSession(parseInt(req.params.id), input);
      if (!s) return res.sendStatus(404);
      res.json(s);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.courseSessions.delete.path, async (req, res) => {
    if (!isTeacherOrAdmin(req)) return res.sendStatus(403);
    await storage.deleteCourseSession(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== ENROLLMENTS ==========
  app.get(api.enrollments.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const myEnrollments = await storage.listEnrollmentsByUser((req.user as any).id);
    res.json(myEnrollments);
  });

  app.get(api.enrollments.listByCourse.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);
    if (!course) return res.sendStatus(404);
    if (!isAdmin(req) && !(isTeacherOrAdmin(req) && course.teacherId === (req.user as any)?.id)) {
      return res.sendStatus(403);
    }
    const enrollmentsList = await storage.listEnrollmentsByCourse(courseId);
    res.json(enrollmentsList);
  });

  app.post(api.enrollments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    try {
      const input = api.enrollments.create.input.parse(req.body);
      const existing = await storage.getEnrollmentByUserAndCourse((req.user as any).id, input.courseId);
      if (existing) {
        return res.status(400).json({ message: "Ya tienes una inscripcion en este curso" });
      }
      const enrollment = await storage.createEnrollment((req.user as any).id, input.courseId);
      res.status(201).json(enrollment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.patch(api.enrollments.update.path, async (req, res) => {
    if (!isTeacherOrAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.enrollments.update.input.parse(req.body);
      const enrollment = await storage.updateEnrollment(parseInt(req.params.id), input);
      if (!enrollment) return res.sendStatus(404);
      res.json(enrollment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.enrollments.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const enrollment = await storage.getEnrollment(id);
    if (!enrollment) return res.sendStatus(404);
    if (enrollment.userId !== (req.user as any).id && !isAdmin(req)) {
      return res.sendStatus(403);
    }
    await storage.deleteEnrollment(id);
    res.sendStatus(200);
  });

  // ========== TEACHER REQUESTS ==========
  app.get(api.teacherRequests.list.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    const requests = await storage.listTeacherRequests();
    res.json(requests);
  });

  app.get(api.teacherRequests.myRequests.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const requests = await storage.listTeacherRequestsByUser((req.user as any).id);
    res.json(requests);
  });

  app.post(api.teacherRequests.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    const userRole = (req.user as any).role;
    if (userRole !== "obrero" && userRole !== "admin") {
      return res.status(403).json({ message: "Solo obreros pueden solicitar ensenar un curso" });
    }
    try {
      const input = api.teacherRequests.create.input.parse(req.body);
      const existing = await storage.getTeacherRequestByUserAndCourse((req.user as any).id, input.courseId);
      if (existing) {
        return res.status(400).json({ message: "Ya tienes una solicitud para este curso" });
      }
      const course = await storage.getCourse(input.courseId);
      if (!course) return res.sendStatus(404);
      if (course.teacherId === (req.user as any).id) {
        return res.status(400).json({ message: "Ya eres el maestro de este curso" });
      }
      const request = await storage.createTeacherRequest((req.user as any).id, input.courseId, input.message);
      res.status(201).json(request);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.patch(api.teacherRequests.update.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.teacherRequests.update.input.parse(req.body);
      const id = parseInt(req.params.id);
      const request = await storage.updateTeacherRequest(id, input);
      if (!request) return res.sendStatus(404);
      if (input.status === "aprobado") {
        await storage.updateCourse(request.courseId, { teacherId: request.userId });
      }
      res.json(request);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.teacherRequests.delete.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    await storage.deleteTeacherRequest(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== COURSE ANNOUNCEMENTS ==========
  app.get(api.courseAnnouncements.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const courseId = parseInt(req.params.courseId);
    const announcements = await storage.listCourseAnnouncements(courseId);
    res.json(announcements);
  });

  app.post(api.courseAnnouncements.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);
    if (!course) return res.sendStatus(404);
    if (!isAdmin(req) && !(isTeacherOrAdmin(req) && course.teacherId === (req.user as any)?.id)) {
      return res.sendStatus(403);
    }
    try {
      const input = api.courseAnnouncements.create.input.parse({ ...req.body, courseId });
      const announcement = await storage.createCourseAnnouncement({ ...input, authorId: (req.user as any).id });
      res.status(201).json(announcement);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.patch(api.courseAnnouncements.update.path, async (req, res) => {
    if (!isTeacherOrAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.courseAnnouncements.update.input.parse(req.body);
      const announcement = await storage.updateCourseAnnouncement(parseInt(req.params.id), input);
      if (!announcement) return res.sendStatus(404);
      res.json(announcement);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.courseAnnouncements.delete.path, async (req, res) => {
    if (!isTeacherOrAdmin(req)) return res.sendStatus(403);
    await storage.deleteCourseAnnouncement(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== COURSE SCHEDULE ==========
  app.get(api.courseScheduleEntries.list.path, async (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const schedule = await storage.listCourseSchedule(courseId);
    res.json(schedule);
  });

  app.post(api.courseScheduleEntries.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);
    if (!course) return res.sendStatus(404);
    if (!isAdmin(req) && !(isTeacherOrAdmin(req) && course.teacherId === (req.user as any)?.id)) {
      return res.sendStatus(403);
    }
    try {
      const input = api.courseScheduleEntries.create.input.parse({ ...req.body, courseId });
      const entry = await storage.createCourseScheduleEntry(input);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.patch(api.courseScheduleEntries.update.path, async (req, res) => {
    if (!isTeacherOrAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.courseScheduleEntries.update.input.parse(req.body);
      const entry = await storage.updateCourseScheduleEntry(parseInt(req.params.id), input);
      if (!entry) return res.sendStatus(404);
      res.json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.courseScheduleEntries.delete.path, async (req, res) => {
    if (!isTeacherOrAdmin(req)) return res.sendStatus(403);
    await storage.deleteCourseScheduleEntry(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== SESSION ATTENDANCE ==========
  app.get(api.sessionAttendance.list.path, async (req, res) => {
    if (!isTeacherOrAdmin(req)) return res.sendStatus(403);
    const sessionId = parseInt(req.params.sessionId);
    const attendance = await storage.listSessionAttendance(sessionId);
    res.json(attendance);
  });

  app.post(api.sessionAttendance.list.path, async (req, res) => {
    if (!isTeacherOrAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.sessionAttendance.upsert.input.parse({ ...req.body, sessionId: parseInt(req.params.sessionId) });
      const attendance = await storage.upsertSessionAttendance(input);
      res.json(attendance);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  // ========== ADMIN ==========
  app.get(api.admin.listUsers.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    res.json(await storage.listUsers());
  });

  app.patch(api.admin.toggleActive.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    const user = await storage.toggleUserActive(parseInt(req.params.id));
    if (!user) return res.sendStatus(404);
    res.json(user);
  });

  app.patch(api.admin.updateRole.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const { role } = req.body;
    if (!["admin", "obrero", "aspirante", "miembro"].includes(role)) {
      return res.status(400).json({ message: "Rol invalido" });
    }
    const user = await storage.updateUserRole(id, role);
    if (!user) return res.sendStatus(404);
    res.json(user);
  });

  app.patch(api.admin.updateUserInfo.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const { cargo, country } = req.body;
    const user = await storage.updateUserInfo(id, cargo || null, country || null);
    if (!user) return res.sendStatus(404);
    res.json(user);
  });

  app.get(api.admin.getUserDetail.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    if (!user) return res.sendStatus(404);
    const { password, ...safeUser } = user;
    const userEnrollments = await storage.listEnrollmentsByUser(id);
    const userPosts = await storage.listPostsByUser(id);
    const enrichedEnrollments = await Promise.all(
      userEnrollments.map(async (e: any) => {
        const course = await storage.getCourse(e.courseId);
        return { ...e, courseName: course?.title || "Curso desconocido" };
      })
    );
    const attendanceRecords = await storage.listAttendanceByUser(id);
    res.json({ user: safeUser, enrollments: enrichedEnrollments, posts: userPosts, attendance: attendanceRecords });
  });

  app.delete(api.admin.deleteUser.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    const id = parseInt(req.params.id);
    if (id === (req.user as any).id) {
      return res.status(400).json({ message: "No puedes eliminarte a ti mismo" });
    }
    await storage.deleteUser(id);
    res.sendStatus(200);
  });

  app.get(api.admin.getWhatsappLink.path, async (req, res) => {
    const content = await storage.getSiteContent("whatsapp_group_link");
    res.json({ link: content?.content || "" });
  });

  app.patch(api.admin.updateWhatsappLink.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    const { link } = req.body;
    await storage.upsertSiteContent("whatsapp_group_link", { content: link || "" }, (req.user as any).id);
    res.json({ link: link || "" });
  });

  app.get(api.admin.getLiveStream.path, async (req, res) => {
    const content = await storage.getSiteContent("live_stream_config");
    const defaultConfig = { sourceType: "radio", sourceUrl: "", radioUrl: "", title: "", isLive: false };
    try {
      const config = content?.content ? JSON.parse(content.content) : defaultConfig;
      res.json(config);
    } catch {
      res.json(defaultConfig);
    }
  });

  app.patch(api.admin.updateLiveStream.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    const { sourceType, sourceUrl, radioUrl, title, isLive } = req.body;
    const validTypes = ["radio", "youtube", "facebook", "tiktok", "custom"];
    const type = validTypes.includes(sourceType) ? sourceType : "radio";
    const cleanUrl = (url: string) => {
      if (!url || !url.trim()) return "";
      let cleaned = url.trim();
      if (!/^https?:\/\//i.test(cleaned)) cleaned = "https://" + cleaned;
      try { const u = new URL(cleaned); return ["http:", "https:"].includes(u.protocol) ? cleaned : ""; } catch { return ""; }
    };
    const config = JSON.stringify({ sourceType: type, sourceUrl: cleanUrl(sourceUrl || ""), radioUrl: cleanUrl(radioUrl || ""), title: (title || "").slice(0, 200), isLive: !!isLive });
    await storage.upsertSiteContent("live_stream_config", { content: config }, (req.user as any).id);
    if (!!isLive && type !== "radio") {
      await storage.createNotificationForAll({
        type: "transmision",
        title: "Nueva Transmision en Vivo",
        content: (title || "").slice(0, 200) || "Se inicio una transmision en vivo",
        link: "/en-vivo",
      });
    }
    res.json(JSON.parse(config));
  });

  app.get(api.admin.listMessages.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    res.json(await storage.listMessages());
  });

  app.patch(api.admin.toggleMessageRead.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    const msg = await storage.toggleMessageRead(parseInt(req.params.id));
    if (!msg) return res.sendStatus(404);
    res.json(msg);
  });

  app.delete(api.admin.deleteMessage.path, async (req, res) => {
    if (!isAdmin(req)) return res.sendStatus(403);
    await storage.deleteMessage(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== BIBLIOTECA: BIBLE HIGHLIGHTS ==========
  app.get(api.bibleHighlights.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { book, chapter } = req.query;
    const highlights = await storage.listBibleHighlights(
      (req.user as any).id,
      book as string | undefined,
      chapter ? parseInt(chapter as string) : undefined
    );
    res.json(highlights);
  });

  app.post(api.bibleHighlights.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    try {
      const input = api.bibleHighlights.create.input.parse(req.body);
      const highlight = await storage.createBibleHighlight((req.user as any).id, input);
      res.status(201).json(highlight);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.bibleHighlights.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteBibleHighlight(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== BIBLIOTECA: BIBLE NOTES ==========
  app.get(api.bibleNotes.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { book, chapter } = req.query;
    const notes = await storage.listBibleNotes(
      (req.user as any).id,
      book as string | undefined,
      chapter ? parseInt(chapter as string) : undefined
    );
    res.json(notes);
  });

  app.post(api.bibleNotes.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    try {
      const input = api.bibleNotes.create.input.parse(req.body);
      const note = await storage.createBibleNote((req.user as any).id, input);
      res.status(201).json(note);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.patch(api.bibleNotes.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.bibleNotes.update.input.parse(req.body);
      const note = await storage.updateBibleNote(parseInt(req.params.id), input.content);
      if (!note) return res.sendStatus(404);
      res.json(note);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.bibleNotes.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteBibleNote(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== BIBLIOTECA: READING PLANS ==========
  app.get(api.readingPlans.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { public: isPublic } = req.query;
    if (isPublic === "true") {
      res.json(await storage.listPublicReadingPlans());
    } else {
      res.json(await storage.listReadingPlans((req.user as any).id));
    }
  });

  app.get(api.readingPlans.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const plan = await storage.getReadingPlan(parseInt(req.params.id));
    if (!plan) return res.sendStatus(404);
    const items = await storage.listReadingPlanItems(plan.id);
    res.json({ ...plan, items });
  });

  app.post(api.readingPlans.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    try {
      const input = api.readingPlans.create.input.parse(req.body);
      const plan = await storage.createReadingPlan((req.user as any).id, input);
      res.status(201).json(plan);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.readingPlans.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const plan = await storage.getReadingPlan(parseInt(req.params.id));
    if (!plan) return res.sendStatus(404);
    if (plan.userId !== (req.user as any).id && !isAdmin(req)) return res.sendStatus(403);
    await storage.deleteReadingPlan(plan.id);
    res.sendStatus(200);
  });

  app.post(api.readingPlans.addItem.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const planId = parseInt(req.params.id);
      const input = api.readingPlans.addItem.input.parse({ ...req.body, planId });
      const item = await storage.addReadingPlanItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.patch(api.readingPlans.toggleItem.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const item = await storage.toggleReadingPlanItem(parseInt(req.params.id));
    if (!item) return res.sendStatus(404);
    res.json(item);
  });

  app.delete(api.readingPlans.deleteItem.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteReadingPlanItem(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== BIBLIOTECA: READING CLUB ==========
  app.get(api.readingClub.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    res.json(await storage.listReadingClubPosts());
  });

  app.post(api.readingClub.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    try {
      const input = api.readingClub.create.input.parse(req.body);
      const post = await storage.createReadingClubPost((req.user as any).id, input);
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.readingClub.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    if (!isAdmin(req)) return res.sendStatus(403);
    await storage.deleteReadingClubPost(id);
    res.sendStatus(200);
  });

  app.post(api.readingClubLikes.toggle.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    const postId = parseInt(req.params.id);
    const result = await storage.toggleReadingClubPostLike(postId, (req.user as any).id);
    res.json(result);
  });

  app.get("/api/reading-club/my-likes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(await storage.getUserLikedPosts((req.user as any).id));
  });

  app.get(api.readingClub.listComments.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(await storage.listReadingClubComments(parseInt(req.params.id)));
  });

  app.post(api.readingClub.createComment.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    try {
      const postId = parseInt(req.params.id);
      const input = api.readingClub.createComment.input.parse({ ...req.body, postId });
      const comment = await storage.createReadingClubComment((req.user as any).id, input);
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.readingClub.deleteComment.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);
    await storage.deleteReadingClubComment(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // ========== BIBLIOTECA: LIBRARY RESOURCES ==========
  app.get(api.libraryResources.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    const { category, search } = req.query;
    const resources = await storage.listLibraryResources(category as string, search as string);
    const likedIds = await storage.getUserLikedResources((req.user as any).id);
    res.json(resources.map(r => ({ ...r, isLiked: likedIds.includes(r.id) })));
  });

  app.post(api.libraryResources.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!(req.user as any).isActive) return res.sendStatus(403);
    try {
      const input = api.libraryResources.create.input.parse(req.body);
      const resource = await storage.createLibraryResource((req.user as any).id, input);
      res.status(201).json(resource);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.sendStatus(500);
    }
  });

  app.delete(api.libraryResources.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);
    await storage.deleteLibraryResource(parseInt(req.params.id));
    res.sendStatus(200);
  });

  app.post(api.libraryResources.toggleLike.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const result = await storage.toggleLibraryResourceLike(parseInt(req.params.id), (req.user as any).id);
    res.json(result);
  });

  // ========== NOTIFICACIONES ==========
  app.get(api.notifications.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const notifs = await storage.listNotifications((req.user as any).id);
    res.json(notifs);
  });

  app.get(api.notifications.unreadCount.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const count = await storage.getUnreadNotificationCount((req.user as any).id);
    res.json({ count });
  });

  app.patch(api.notifications.markRead.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.markNotificationRead(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.patch(api.notifications.markAllRead.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.markAllNotificationsRead((req.user as any).id);
    res.json({ success: true });
  });

  // ========== ACTIVIDADES DE ORACION ==========
  app.get(api.prayerActivities.list.path, async (req, res) => {
    const activities = await storage.listPrayerActivities();
    res.json(activities);
  });

  app.post(api.prayerActivities.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.prayerActivities.create.input.parse(req.body);
    const activity = await storage.createPrayerActivity((req.user as any).id, input);
    await storage.createNotificationForAll({
      type: "oracion",
      title: "Nueva Actividad de Oracion",
      content: `Se creo la actividad: ${activity.title}`,
      link: "/oracion",
    });
    res.status(201).json(activity);
  });

  app.delete(api.prayerActivities.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const activities = await storage.listPrayerActivities();
    const activity = activities.find(a => a.id === id);
    if (!activity) return res.sendStatus(404);
    if (activity.userId !== (req.user as any).id && !isAdmin(req)) return res.sendStatus(403);
    await storage.deletePrayerActivity(id);
    res.json({ success: true });
  });

  // ========== REGIONES DEL MINISTERIO ==========
  app.get(api.ministryRegions.list.path, async (_req, res) => {
    const regions = await storage.listMinistryRegions();
    res.json(regions);
  });

  app.post(api.ministryRegions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.ministryRegions.create.input.parse(req.body);
      const region = await storage.createMinistryRegion(input);
      res.status(201).json(region);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error al crear la region" });
    }
  });

  app.patch(api.ministryRegions.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.ministryRegions.update.input.parse(req.body);
      const updated = await storage.updateMinistryRegion(parseInt(req.params.id), input);
      if (!updated) return res.status(404).json({ message: "Region no encontrada" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error al actualizar la region" });
    }
  });

  app.delete(api.ministryRegions.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);
    await storage.deleteMinistryRegion(parseInt(req.params.id));
    res.json({ success: true });
  });

  // ========== MIEMBROS DEL EQUIPO ==========
  app.get(api.teamMembers.list.path, async (_req, res) => {
    const members = await storage.listTeamMembers();
    res.json(members);
  });

  app.post(api.teamMembers.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.teamMembers.create.input.parse(req.body);
      const member = await storage.createTeamMember(input);
      res.status(201).json(member);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error al crear el miembro" });
    }
  });

  app.patch(api.teamMembers.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);
    try {
      const input = api.teamMembers.update.input.parse(req.body);
      const updated = await storage.updateTeamMember(parseInt(req.params.id), input);
      if (!updated) return res.status(404).json({ message: "Miembro no encontrado" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error al actualizar el miembro" });
    }
  });

  app.delete(api.teamMembers.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!isAdmin(req)) return res.sendStatus(403);
    await storage.deleteTeamMember(parseInt(req.params.id));
    res.json({ success: true });
  });

  // ========== PUBLICACIONES REGIONALES ==========
  app.get(api.regionPosts.list.path, async (req, res) => {
    const region = req.query.region as string | undefined;
    const posts = await storage.listRegionPosts(region);
    res.json(posts);
  });

  app.post(api.regionPosts.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.regionPosts.create.input.parse(req.body);
    const allRegions = await storage.listMinistryRegions();
    const validRegionNames = allRegions.filter(r => r.isActive).map(r => r.name);
    if (!validRegionNames.includes(input.region)) return res.status(400).json({ message: "Region no valida" });
    const post = await storage.createRegionPost((req.user as any).id, input);
    res.status(201).json(post);
  });

  app.delete(api.regionPosts.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    await storage.deleteRegionPost(id);
    res.json({ success: true });
  });

  // ========== REACCIONES REGIONALES ==========
  app.post("/api/region-posts/:id/reactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const postId = parseInt(req.params.id);
    const { reactionType } = req.body;
    if (!reactionType) return res.status(400).json({ message: "Tipo de reaccion requerido" });
    const result = await storage.toggleRegionPostReaction(postId, (req.user as any).id, reactionType);
    res.json(result);
  });

  app.get("/api/region-posts/:id/reactions", async (req, res) => {
    const postId = parseInt(req.params.id);
    const reactions = await storage.getRegionPostReactions(postId);
    res.json(reactions);
  });

  // ========== ENCUESTAS REGIONALES ==========
  app.post("/api/region-posts/:id/poll", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const postId = parseInt(req.params.id);
    const { question, options } = req.body;
    if (!question || !options || options.length < 2) return res.status(400).json({ message: "Pregunta y al menos 2 opciones requeridas" });
    const poll = await storage.createRegionPostPoll(postId, question, options);
    res.status(201).json(poll);
  });

  app.get("/api/region-posts/:id/poll", async (req, res) => {
    const postId = parseInt(req.params.id);
    const poll = await storage.getRegionPostPoll(postId);
    res.json(poll);
  });

  app.post("/api/region-polls/:optionId/vote", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const optionId = parseInt(req.params.optionId);
    const result = await storage.voteRegionPostPoll(optionId, (req.user as any).id);
    res.json(result);
  });

  app.get("/api/region-posts/:id/my-vote", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const postId = parseInt(req.params.id);
    const optionId = await storage.getUserPollVote(postId, (req.user as any).id);
    res.json({ optionId });
  });

  return httpServer;
}
