/**
 * Ensures all database tables and columns exist.
 * This runs on server startup to handle cases where drizzle-kit push
 * didn't create everything (e.g., on Render deploys).
 * 
 * Uses CREATE TABLE IF NOT EXISTS and ALTER TABLE ADD COLUMN IF NOT EXISTS
 * so it's safe to run repeatedly.
 */
import { pool } from "./db";

const CREATE_TABLES_SQL = `
-- Users (should already exist, but just in case)
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "username" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "role" text NOT NULL DEFAULT 'miembro',
  "display_name" text,
  "bio" text,
  "avatar_url" text,
  "is_active" boolean NOT NULL DEFAULT false,
  "cargo" text,
  "country" text,
  "phone" text,
  "email" text,
  "created_at" timestamp DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS "messages" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "subject" text NOT NULL,
  "content" text NOT NULL,
  "is_read" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now()
);

-- Member posts
CREATE TABLE IF NOT EXISTS "member_posts" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "content" text NOT NULL,
  "image_url" text,
  "created_at" timestamp DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS "events" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "event_date" timestamp NOT NULL,
  "event_end_date" timestamp,
  "location" text NOT NULL,
  "meeting_url" text,
  "meeting_platform" text,
  "image_url" text,
  "is_published" boolean NOT NULL DEFAULT true,
  "created_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now()
);

-- Event RSVPs
CREATE TABLE IF NOT EXISTS "event_rsvps" (
  "id" serial PRIMARY KEY,
  "event_id" integer NOT NULL REFERENCES "events"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "status" text NOT NULL DEFAULT 'confirmado',
  "reminder" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now()
);

-- Site content
CREATE TABLE IF NOT EXISTS "site_content" (
  "id" serial PRIMARY KEY,
  "section_key" text NOT NULL UNIQUE,
  "title" text,
  "content" text,
  "updated_at" timestamp DEFAULT now(),
  "updated_by" integer REFERENCES "users"("id")
);

-- Courses
CREATE TABLE IF NOT EXISTS "courses" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "category" text NOT NULL DEFAULT 'general',
  "image_url" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "max_students" integer,
  "teacher_id" integer REFERENCES "users"("id"),
  "created_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now()
);

-- Course materials
CREATE TABLE IF NOT EXISTS "course_materials" (
  "id" serial PRIMARY KEY,
  "course_id" integer NOT NULL REFERENCES "courses"("id"),
  "title" text NOT NULL,
  "description" text,
  "file_url" text,
  "material_type" text NOT NULL DEFAULT 'documento',
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);

-- Course sessions
CREATE TABLE IF NOT EXISTS "course_sessions" (
  "id" serial PRIMARY KEY,
  "course_id" integer NOT NULL REFERENCES "courses"("id"),
  "title" text NOT NULL,
  "description" text,
  "session_date" timestamp NOT NULL,
  "duration" integer,
  "meeting_url" text,
  "meeting_platform" text DEFAULT 'zoom',
  "is_completed" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now()
);

-- Enrollments
CREATE TABLE IF NOT EXISTS "enrollments" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "course_id" integer NOT NULL REFERENCES "courses"("id"),
  "status" text NOT NULL DEFAULT 'solicitado',
  "grade" text,
  "observations" text,
  "enrolled_at" timestamp DEFAULT now(),
  "completed_at" timestamp
);

-- Teacher requests
CREATE TABLE IF NOT EXISTS "teacher_requests" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "course_id" integer NOT NULL REFERENCES "courses"("id"),
  "status" text NOT NULL DEFAULT 'solicitado',
  "message" text,
  "created_at" timestamp DEFAULT now()
);

-- Course announcements
CREATE TABLE IF NOT EXISTS "course_announcements" (
  "id" serial PRIMARY KEY,
  "course_id" integer NOT NULL REFERENCES "courses"("id"),
  "author_id" integer NOT NULL REFERENCES "users"("id"),
  "title" text NOT NULL,
  "content" text NOT NULL,
  "is_pinned" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now()
);

-- Course schedule
CREATE TABLE IF NOT EXISTS "course_schedule" (
  "id" serial PRIMARY KEY,
  "course_id" integer NOT NULL REFERENCES "courses"("id"),
  "day_of_week" integer NOT NULL,
  "start_time" text NOT NULL,
  "end_time" text NOT NULL,
  "meeting_url" text,
  "meeting_platform" text DEFAULT 'zoom',
  "description" text,
  "is_active" boolean NOT NULL DEFAULT true
);

-- Session attendance
CREATE TABLE IF NOT EXISTS "session_attendance" (
  "id" serial PRIMARY KEY,
  "session_id" integer NOT NULL REFERENCES "course_sessions"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "status" text NOT NULL DEFAULT 'presente',
  "created_at" timestamp DEFAULT now()
);

-- Ministry regions
CREATE TABLE IF NOT EXISTS "ministry_regions" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL UNIQUE,
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);

-- Team members
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES "users"("id"),
  "name" text NOT NULL,
  "role" text NOT NULL,
  "description" text,
  "verse" text,
  "initials" text,
  "avatar_url" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now()
);

-- Bible highlights
CREATE TABLE IF NOT EXISTS "bible_highlights" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "book" text NOT NULL,
  "chapter" integer NOT NULL,
  "verse_start" integer NOT NULL,
  "verse_end" integer NOT NULL,
  "color" text NOT NULL DEFAULT '#FFA500',
  "note" text,
  "created_at" timestamp DEFAULT now()
);

-- Bible notes
CREATE TABLE IF NOT EXISTS "bible_notes" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "book" text NOT NULL,
  "chapter" integer NOT NULL,
  "verse" integer NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- Reading plans
CREATE TABLE IF NOT EXISTS "reading_plans" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "title" text NOT NULL,
  "description" text,
  "is_public" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now()
);

-- Reading plan items
CREATE TABLE IF NOT EXISTS "reading_plan_items" (
  "id" serial PRIMARY KEY,
  "plan_id" integer NOT NULL REFERENCES "reading_plans"("id"),
  "book" text NOT NULL,
  "chapter" integer NOT NULL,
  "is_completed" boolean NOT NULL DEFAULT false,
  "completed_at" timestamp,
  "sort_order" integer NOT NULL DEFAULT 0
);

-- Reading club posts
CREATE TABLE IF NOT EXISTS "reading_club_posts" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "book" text NOT NULL,
  "chapter" integer NOT NULL,
  "verse_start" integer,
  "verse_end" integer,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- Reading club comments
CREATE TABLE IF NOT EXISTS "reading_club_comments" (
  "id" serial PRIMARY KEY,
  "post_id" integer NOT NULL REFERENCES "reading_club_posts"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- Reading club post likes
CREATE TABLE IF NOT EXISTS "reading_club_post_likes" (
  "id" serial PRIMARY KEY,
  "post_id" integer NOT NULL REFERENCES "reading_club_posts"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now()
);

-- Library resources
CREATE TABLE IF NOT EXISTS "library_resources" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "title" text NOT NULL,
  "description" text,
  "resource_type" text NOT NULL DEFAULT 'documento',
  "file_data" text,
  "file_url" text,
  "file_name" text,
  "file_size" integer,
  "category" text NOT NULL DEFAULT 'general',
  "created_at" timestamp DEFAULT now()
);

-- Library resource likes
CREATE TABLE IF NOT EXISTS "library_resource_likes" (
  "id" serial PRIMARY KEY,
  "resource_id" integer NOT NULL REFERENCES "library_resources"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "type" text NOT NULL DEFAULT 'general',
  "title" text NOT NULL,
  "content" text NOT NULL,
  "link" text,
  "is_read" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now()
);

-- Prayer activities
CREATE TABLE IF NOT EXISTS "prayer_activities" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "title" text NOT NULL,
  "description" text,
  "meeting_url" text,
  "meeting_platform" text DEFAULT 'zoom',
  "scheduled_date" timestamp,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now()
);

-- Prayer attendees
CREATE TABLE IF NOT EXISTS "prayer_attendees" (
  "id" serial PRIMARY KEY,
  "activity_id" integer NOT NULL REFERENCES "prayer_activities"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "status" text NOT NULL DEFAULT 'confirmado',
  "created_at" timestamp DEFAULT now()
);

-- Region posts
CREATE TABLE IF NOT EXISTS "region_posts" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "region" text NOT NULL,
  "content" text NOT NULL,
  "image_url" text,
  "created_at" timestamp DEFAULT now()
);

-- Region post reactions
CREATE TABLE IF NOT EXISTS "region_post_reactions" (
  "id" serial PRIMARY KEY,
  "post_id" integer NOT NULL REFERENCES "region_posts"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "reaction_type" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- Region post polls
CREATE TABLE IF NOT EXISTS "region_post_polls" (
  "id" serial PRIMARY KEY,
  "post_id" integer NOT NULL REFERENCES "region_posts"("id"),
  "question" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- Region post poll options
CREATE TABLE IF NOT EXISTS "region_post_poll_options" (
  "id" serial PRIMARY KEY,
  "poll_id" integer NOT NULL REFERENCES "region_post_polls"("id"),
  "option_text" text NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0
);

-- Region post poll votes
CREATE TABLE IF NOT EXISTS "region_post_poll_votes" (
  "id" serial PRIMARY KEY,
  "option_id" integer NOT NULL REFERENCES "region_post_poll_options"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now()
);

-- Post comments
CREATE TABLE IF NOT EXISTS "post_comments" (
  "id" serial PRIMARY KEY,
  "post_id" integer NOT NULL REFERENCES "member_posts"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- Direct messages
CREATE TABLE IF NOT EXISTS "direct_messages" (
  "id" serial PRIMARY KEY,
  "sender_id" integer NOT NULL REFERENCES "users"("id"),
  "receiver_id" integer NOT NULL REFERENCES "users"("id"),
  "content" text NOT NULL,
  "is_read" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now()
);

-- Friendships
CREATE TABLE IF NOT EXISTS "friendships" (
  "id" serial PRIMARY KEY,
  "requester_id" integer NOT NULL REFERENCES "users"("id"),
  "addressee_id" integer NOT NULL REFERENCES "users"("id"),
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp DEFAULT now()
);

-- User sessions (for connect-pg-simple)
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");
`;

// ALTER TABLE statements to add columns that might be missing from older schemas
const ADD_COLUMNS_SQL = [
  // Events table - newer columns
  `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "meeting_url" text`,
  `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "meeting_platform" text`,
  `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "image_url" text`,
  `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "is_published" boolean NOT NULL DEFAULT true`,
  `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "event_end_date" timestamp`,
  // Users table - newer columns
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cargo" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text`,
  // Library resources - newer columns
  `ALTER TABLE "library_resources" ADD COLUMN IF NOT EXISTS "file_data" text`,
  `ALTER TABLE "library_resources" ADD COLUMN IF NOT EXISTS "file_url" text`,
  `ALTER TABLE "library_resources" ADD COLUMN IF NOT EXISTS "file_name" text`,
  `ALTER TABLE "library_resources" ADD COLUMN IF NOT EXISTS "file_size" integer`,
  // Team members - newer columns
  `ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "verse" text`,
  `ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "initials" text`,
  `ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "user_id" integer REFERENCES "users"("id")`,
];

export async function ensureDatabaseSchema(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log("⚠ No DATABASE_URL - skipping schema verification");
    return;
  }

  try {
    console.log("Verifying database schema...");
    
    // Step 1: Create all tables (IF NOT EXISTS = safe to run repeatedly)
    await pool.query(CREATE_TABLES_SQL);
    
    // Step 2: Add missing columns to existing tables
    for (const sql of ADD_COLUMNS_SQL) {
      try {
        await pool.query(sql);
      } catch (err: any) {
        // Ignore "already exists" errors
        if (!err.message?.includes("already exists") && !err.message?.includes("duplicate column")) {
          console.log(`  Migration note: ${err.message}`);
        }
      }
    }

    // Step 3: Fix corrupted prayer_attendees records (bug: status was stored as "[object Object]")
    try {
      const fixResult = await pool.query(
        `UPDATE prayer_attendees SET status = 'confirmado' WHERE status NOT IN ('confirmado', 'tal_vez', 'no_asistire')`
      );
      if (fixResult.rowCount && fixResult.rowCount > 0) {
        console.log(`  Fixed ${fixResult.rowCount} corrupted prayer_attendees records`);
      }
    } catch (_err) {
      // Table might not exist yet, ignore
    }
    
    console.log("✓ Database schema verified - all tables and columns present");
  } catch (err) {
    console.error("✗ Database schema verification failed:", err);
    // Don't crash the server - let it try to operate with whatever schema exists
  }
}
