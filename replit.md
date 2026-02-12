# Avivando el Fuego - Ministerio Evangelistico Internacional

## Overview
This project is the official website for "Avivando el Fuego," an international evangelical ministry founded in 2017. The ministry operates from Austin, Texas, USA, with a presence in Venezuela, Peru, and the USA. The website aims to serve as a central hub for the ministry's activities, outreach, and internal operations. A core feature of the platform is a comprehensive ministerial training and formation system, designed to equip members and aspiring ministers. The site will facilitate community engagement, event management, content dissemination, and administrative tasks, supporting the ministry's global vision and expanding its reach.

## User Preferences
I prefer detailed explanations and a clean, organized code structure. I value clear communication regarding significant changes or architectural decisions before they are implemented. I like functional programming paradigms where appropriate and well-documented code. Ensure all user-facing text is in Spanish.

## System Architecture
The project is built with a modern web stack. The frontend utilizes **React, TypeScript, Vite, Tailwind CSS, and Shadcn/UI** for a responsive and visually consistent user interface. The backend is developed with **Express.js and TypeScript**, providing a robust API layer. **PostgreSQL** serves as the database, managed with **Drizzle ORM** for type-safe and efficient data interaction. User authentication is handled via **Passport.js** with a local strategy and session-based management. Routing on the frontend uses **Wouter**, while the backend uses Express routing.

### UI/UX Decisions
The UI features a "Fire/Orange" theme to reflect the ministry's identity. **Shadcn/UI** components ensure a consistent and accessible design system. The entire user interface is in Spanish.

### Technical Implementations
- **Role-Based Access Control (RBAC)**: Supports `admin`, `obrero` (teacher/leader), `miembro` (member), and `usuario` (visitor) roles. The first registered user becomes an admin.
- **Pre-Approval System**: New users get immediate login access with `isActive=false` (pre-approved state). Admin approves to fully activate. Community wall and all pages are accessible to pre-approved users.
- **Registration Fields**: Username, password, display name, role, country, phone (required), email (required).
- **Comprehensive Training System**: Includes a course catalog, detailed course views, material management, session scheduling, enrollment processes, student dashboards, and a dedicated teacher panel.
- **Event Management**: Any authenticated user can create, edit, and delete their own events from the /eventos page. Admin can manage all events. Events have title, description, date, optional end date, and location.
- **Content Management System**: Enables administrators to update key sections of the website dynamically.
- **Community Wall**: A platform for all logged-in members to post and interact.
- **Contact System**: Stores messages from the contact form in the database for admin review.
- **Virtual Classroom**: Provides a dedicated space (`/aula/:id`) for enrolled students and teachers with progress tracking, materials, schedule, and announcements.
- **Library Module**: Features a Bible reader, personal reading plans, a reading club, and shared resources.
- **Teacher Request System**: `Obreros` can request to teach courses, with admin approval automatically assigning them.
- **Attendance Tracking**: For course sessions.
- **Prayer Section (`/oracion`)**: Allows any authenticated user to create prayer activities with meeting URLs (Zoom, Google Meet, YouTube Live, Facebook Live). Lists all prayer activities with join links.
- **Regions Section (`/regiones`)**: Dynamic ministry regions managed from DB (`ministry_regions` table) with tabbed activity walls. Admin can add/edit/delete/toggle regions. Any logged-in user can post to a region's wall.
- **In-App Notifications**: Bell icon in navbar with unread count, popover list of recent notifications. Notifications created automatically for new courses, live streams, and prayer activities. `PATCH /api/notifications/read-all` to mark all read.
- **API Endpoints**: A well-defined set of RESTful APIs for all functionalities, ensuring clear separation of concerns between frontend and backend.

### Core Features
- **User Authentication & Authorization**: Secure login, registration with role selection, phone/email fields, and pre-approval workflow for new users.
- **Admin Dashboard**: Centralized control panel for managing users, courses, teachers, events, content, contact messages, and member posts.
- **Training & Formation**: End-to-end course management, from creation to enrollment, material distribution, session delivery, and student progress tracking.
- **Member Engagement**: Community wall, prayer activities, regional walls with reactions/polls/images, personal profiles, and access to library resources.
- **Biblical Game "El Guardian de la Llama"** (`/juego`): Three game modes: (1) **Modo Competitivo** - Infinite biblical trivia with energy system (15 max, recharges 1/10min), 4 difficulty levels, 15+ progression levels, global leaderboard, mission system. 80+ seeded questions. (2) **Modo Historia** - Chapter-based biblical study with 12 chapters, 34+ activities across 7 types (reflexion, completar versiculo, ordenar eventos, parear, comparar pasajes, opcion multiple, verdadero/falso). No energy limits. Retry buttons for incorrect answers. (3) **Juegos de Mesa** - Online board games hub with 7 classic games: Tres en Raya (tic-tac-toe), Conecta 4, Memoria (memory matching), Damas (checkers), Ajedrez (chess with chess.js), Bingo, Domino. Features multiplayer rooms with room codes, local play mode (same device), win/loss/draw tracking per game type, and game leaderboards. Tables: `gameRooms`, `gameStats`. City builder tables (`cityProfiles`, `cityTiles`, etc.) remain dormant in the database. **Domino Enhanced** (`client/src/components/domino-game.tsx`): Standalone full domino game with SVG tiles (ivory gradients, depth effects), 2-4 player support with AI opponents, green felt table design with wood trim, 3 rule variations (Clasico/Draw, Bloqueo/Block, All Fives/Muggins with scoring multiples of 5 to 100 points), local multiplayer mode with turn transition screens, and multi-round support for All Fives.
- **Dynamic Team Members** (`/equipo`): Team members managed from DB (`team_members` table) with admin inline add/edit/delete. Displays leader cards with photo, name, role, and description.
- **Region Post Enhancements**: Posts support image uploads, icon-based reactions (fuego, oracion, amen, corazon, alabanza), and polls with 2-6 options and vote tracking. Tables: `regionPostReactions`, `regionPostPolls`, `regionPostPollOptions`, `regionPostPollVotes`.
- **Dynamic Content**: Editable site sections for ministry updates and information.
- **Live Streaming System (En Vivo)**: Multi-source media player supporting online radio (24/7 audio stream), YouTube Live, Facebook Live, TikTok Live, and custom iframe embeds. Admin can switch between radio and live sources, with radio as the default fallback. Configuration stored as JSON in `site_content` table with key `live_stream_config`.

## External Dependencies
- **PostgreSQL**: Relational database for all application data.
- **Drizzle ORM**: TypeScript ORM for interacting with PostgreSQL.
- **Passport.js**: Authentication middleware for Node.js.
- **Tailwind CSS**: Utility-first CSS framework.
- **Shadcn/UI**: Reusable UI components.
- **Vite**: Frontend build tool.
- **React**: Frontend JavaScript library.
- **Express.js**: Backend web application framework.
- **Wouter**: Small routing library for React.
- **TanStack Query**: For data fetching, caching, and synchronization.
- **Zod**: For schema validation.
- **chess.js**: Chess game logic library for legal moves, check/checkmate detection.