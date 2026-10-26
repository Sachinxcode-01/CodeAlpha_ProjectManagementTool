# Human-Led Implementation Plan — TaskFlow

**Program:** CodeAlpha Full Stack Development Internship — Task 3  
**Policy:** Human-authored application and test code. Antigravity provides architecture, code review, debugging assistance, and conceptual guidance.

---

## Roadmap Overview

* **Milestone 1:** Repository Initialization & Environment Configuration
* **Milestone 2:** Database Initialization, Schema & Connection Layer
* **Milestone 3:** User Registration, Password Hashing & Authentication Middleware
* **Milestone 4:** Project CRUD & Ownership Attribution
* **Milestone 5:** Project Membership & RBAC Authorization Middleware
* **Milestone 6:** Task Lifecycle (CRUD, Status, Priority, Assignment)
* **Milestone 7:** Task Comments & Activity Audit Trail
* **Milestone 8:** Real-Time Analytics & Dashboard Aggregation Queries
* **Milestone 9:** Responsive Frontend Interface & Design System
* **Milestone 10:** Client-Side API Integration & State Handling
* **Milestone 11:** Edge Cases, Hardening & Security Audit Verification
* **Milestone 12:** Project Documentation & Final Repository Packaging

---

## Detailed Milestone Specifications

### Milestone 1: Repository Initialization & Environment Configuration
* **1. Goal:** Establish a clean, isolated project repository, initialize npm dependencies, and set up the development environment.
* **2. Prerequisites:** Node.js (`>=18`), npm, Git installed.
* **3. Target Files:**
  * `.gitignore`
  * `.env.example`
  * `.env`
  * `package.json`
  * `server.js`
* **4. Concepts to Understand:**
  * Node.js module system (`CommonJS` or `ES Modules`).
  * Environment variable isolation with `dotenv`.
  * Git ignore patterns for local databases and secrets.
* **5. Implementation Steps (Plain English):**
  1. Run `git init` inside `CodeAlpha_ProjectManagementTool`.
  2. Create a `.gitignore` file excluding `node_modules/`, `data/`, `*.db`, `.env`, and OS artifacts (`.DS_Store`).
  3. Run `npm init -y` to generate `package.json`.
  4. Add scripts to `package.json`: `"start": "node server.js"` and `"dev": "nodemon server.js"`.
  5. Install production packages: `express`, `dotenv`, `better-sqlite3`, `bcryptjs`, `jsonwebtoken`, `cors`.
  6. Install development package: `nodemon` (as `-D`).
  7. Create `.env.example` with `PORT=3000`, `NODE_ENV=development`, `JWT_SECRET=supersecretkey_change_in_production`, `DB_PATH=./data/taskflow.db`.
  8. Copy `.env.example` to `.env`.
  9. Create a minimal `server.js` that initializes Express, loads `dotenv`, and binds to `process.env.PORT`.
* **6. Manual Verification Checklist:**
  * Run `git status` -> Confirms clean branch with only tracked files.
  * Run `npm run dev` -> Server outputs listening message on port 3000.
  * Access `http://localhost:3000/api/health` -> Returns JSON `{ "status": "ok" }`.
* **7. Common Bugs to Watch For:**
  * Accidentally committing `.env` containing sensitive keys.
  * Hardcoding the port instead of falling back to `process.env.PORT || 3000`.
* **8. Definition of Done:** Server launches cleanly without errors using `npm run dev` and `.env` settings are properly parsed.

---

### Milestone 2: Database Initialization, Schema & Connection Layer
* **1. Goal:** Create the SQLite database connection, configure WAL mode and foreign key enforcement, and execute schema migrations.
* **2. Prerequisites:** Milestone 1 complete.
* **3. Target Files:**
  * `src/config/db.js`
  * `src/models/schema.sql`
  * `src/models/initDb.js` (migration runner)
* **4. Concepts to Understand:**
  * SQLite `PRAGMA foreign_keys = ON;` requirement.
  * SQLite WAL (Write-Ahead Logging) mode.
  * Database schema idempotency (`CREATE TABLE IF NOT EXISTS`).
* **5. Implementation Steps (Plain English):**
  1. Ensure directory `data/` exists (create dynamically if missing).
  2. In `src/config/db.js`, instantiate the database using `better-sqlite3` pointing to `process.env.DB_PATH`.
  3. Execute `PRAGMA foreign_keys = ON;` and `PRAGMA journal_mode = WAL;`.
  4. In `src/models/schema.sql`, write DDL for `users`, `projects`, `project_members`, `tasks`, `comments`, and `activity_logs` as specified in [`docs/DATABASE.md`](file:///c:/Users/kalin/.gemini/antigravity-ide/scratch/CodeAlpha_ProjectManagementTool/docs/DATABASE.md).
  5. Create `src/models/initDb.js` that reads `schema.sql` and executes it against the database.
* **6. Manual Verification Checklist:**
  * Run `node src/models/initDb.js` -> Creates `data/taskflow.db`.
  * Inspect tables using an SQLite viewer or CLI to confirm all 6 tables and indexes are present.
* **7. Common Bugs to Watch For:**
  * Forgetting `PRAGMA foreign_keys = ON`, causing cascade deletions to silently fail.
* **8. Definition of Done:** Database file is created with all tables, constraints, and indexes verified.

---

### Milestone 3: User Registration, Login & Authentication Guard
* **1. Goal:** Build secure user registration, password hashing, login token generation, and the `authMiddleware` gatekeeper.
* **2. Prerequisites:** Milestones 1 and 2 complete.
* **3. Target Files:**
  * `src/controllers/authController.js`
  * `src/routes/authRoutes.js`
  * `src/middleware/authMiddleware.js`
* **4. Concepts to Understand:**
  * Asynchronous/synchronous password hashing with salt rounds.
  * Signing and verifying JWT tokens with expiration.
  * Bearer token extraction from HTTP headers.
* **5. Implementation Steps (Plain English):**
  1. In `authController.js`, implement `register`:
     * Validate input (email syntax, password length $\ge 8$).
     * Check if email already exists in `users` table; if so, return `409 Conflict`.
     * Hash password using `bcryptjs.hash(password, 10)`.
     * Insert user into database.
     * Generate JWT containing `{ id, email }`.
     * Return `201 Created` with user details (excluding password hash) and token.
  2. Implement `login`:
     * Query user by email.
     * Compare password using `bcryptjs.compare()`.
     * If mismatch, return `401 Unauthorized` with generic "Invalid credentials".
     * Generate JWT and return `200 OK`.
  3. Implement `authMiddleware.js`:
     * Inspect `req.headers.authorization`.
     * Verify token using `jwt.verify(token, process.env.JWT_SECRET)`.
     * Attach decoded user object to `req.user`.
     * Call `next()`.
  4. Implement `GET /api/auth/me` protected by `authMiddleware`.
* **6. Manual Verification Checklist:**
  * Register new user via curl/Postman -> Receives 201 with JWT.
  * Attempt registration with same email -> Receives 409 error.
  * Login with wrong password -> Receives 401 error.
  * Call `GET /api/auth/me` with header `Authorization: Bearer <token>` -> Receives user profile without `password_hash`.
* **7. Common Bugs to Watch For:**
  * Exposing the `password_hash` in the response JSON.
  * Failing to handle expired or malformed JWTs gracefully (causing unhandled exceptions).
* **8. Definition of Done:** User authentication flow functions smoothly with tests confirming valid and invalid cases.

---

*(Milestones 4 through 12 follow the exact sequence defined in the roadmap.)*
