# Repository Audit: TaskFlow (CodeAlpha_ProjectManagementTool)

**Audit Date:** 2026-10-26  
**Auditor / Role:** Senior Full-Stack Architect & Security Reviewer  
**Repository Directory:** `CodeAlpha_ProjectManagementTool`  
**Internship Program:** CodeAlpha Full Stack Development Internship — Task 3  

---

## 1. Executive Summary

A comprehensive inspection of the workspace `c:\Users\kalin\.gemini\antigravity-ide\scratch\CodeAlpha_ProjectManagementTool` was conducted.

* **Confirmed Workspace State:** The repository directory is completely blank (fresh greenfield initialization). No source code files, configuration files (`package.json`, `.env`), documentation, or git repositories exist inside this directory yet.
* **Confirmed Environment:** 
  * Node.js: `v25.1.0`
  * npm: `11.14.1`
  * Git: `2.45.1.windows.1`
  * Operating System: Windows
* **Implementation Mode:** Strict compliance with CodeAlpha internship submission integrity rules. Architectural blueprints, database schemas, security models, API specifications, and test plans are provided as guidance and documentation; all application and test implementation code will be written directly by the developer.

---

## 2. Current Architecture

* **Architecture Status:** Greenfield / Uninitialized.
* **Target Stack:**
  * **Frontend:** Semantic HTML5, Vanilla CSS3 (custom responsive styling, CSS custom properties, no utility framework overhead), Modern Vanilla JavaScript (ES6+ Modules, Fetch API).
  * **Backend:** Node.js with Express.js (RESTful API architecture).
  * **Database:** SQLite (lightweight, zero-configuration file-based relational database) via a synchronous/asynchronous driver (such as `better-sqlite3` or `sqlite3`).
  * **Authentication:** Session-based (via secure HTTP-only cookies) or JWT-based (bearer tokens / HTTP-only cookies) with cryptographic password hashing (`bcrypt` or `bcryptjs`).

---

## 3. Existing Functionality

| Feature Area | Status | Evidence / Notes |
| :--- | :--- | :--- |
| Version Control (`.git`) | Not Initialized | Directory lacks local `.git` repository. |
| Node Package Config (`package.json`) | Missing | No package manifest present. |
| Server Application | Missing | No entry point (`server.js` or `app.js`). |
| Database Engine & Schema | Missing | No SQLite database file or SQL migration scripts. |
| Frontend Assets | Missing | No `index.html`, CSS stylesheets, or client scripts. |
| Documentation | Missing (Now initiating `docs/`) | Previous documentation was absent. |

---

## 4. Missing Functionality (Product Scope)

To meet the requirements of TaskFlow (CodeAlpha Task 3), the following core features must be developed from the ground up:

1. **User Authentication & Profiles:**
   * Registration with unique email validation.
   * Secure password hashing with salt.
   * Login, session/token management, and secure logout.
   * Profile retrieval (`/api/auth/me`).

2. **Project Management:**
   * Project creation, editing, viewing, and deletion/archival.
   * Project ownership attribution.
   * Progress calculation based on completed tasks.

3. **Project Membership & Role-Based Access Control (RBAC):**
   * Multi-user project collaboration.
   * Explicit roles (`OWNER`, `MEMBER`).
   * Member invitation/addition and removal.
   * Strict server-side authorization ensuring non-members cannot read or modify project data.

4. **Task Management:**
   * Full task lifecycle (Create, Read, Update, Delete).
   * Task assignment to verified project members only.
   * Priority tiers: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
   * Status workflow: `TODO`, `IN_PROGRESS`, `COMPLETED` (with transition integrity).
   * Deadlines and due date tracking.

5. **Comments & Activity Stream:**
   * Task-specific discussion comments with timestamp and author metadata.
   * Audit trail / activity logging (project creation, task state changes, member additions).

6. **Interactive Dashboard:**
   * Aggregated metrics calculated directly from database records (Total Projects, Active Projects, Total Tasks, Assigned Tasks, Completed Tasks, Overdue Tasks, Upcoming Deadlines).
   * No hardcoded or mock metric displays.

7. **Search, Sorting & Filtering:**
   * Server-side and client-side filtering by status, priority, assignee, and search terms.

---

## 5. Known Defects

* **Empty Project Root:** Because no files or directories exist, running any development or startup commands fails immediately.
* **Unenforced Git Scope:** Because `CodeAlpha_ProjectManagementTool` was not initialized with its own `.git` root, parent directories in user profile spaces were previously traversed by Git tooling. A dedicated local git initialization (`git init`) is required inside the project directory.

---

## 6. Dependencies & Tooling Evaluation

Recommended minimal, high-efficiency dependencies to be initialized in Milestone 1:

* **Production Dependencies:**
  * `express` (~4.21.x): Web server and routing framework.
  * `better-sqlite3` (~11.x) or `sqlite3` (~5.1.x): High-performance, reliable SQLite bindings.
  * `bcryptjs` (~2.4.x): Robust, pure-JS or native password hashing without cross-platform binary compilation headaches on Windows.
  * `jsonwebtoken` (~9.0.x) or `express-session` with `connect-sqlite3`: Clean session or token-based authentication.
  * `dotenv` (~16.4.x): Environment variable isolation.
  * `cors` (~2.8.x): Safe origin configuration.
* **Development Dependencies:**
  * `nodemon` (~3.1.x): Development hot-reloading for server code.

---

## 7. Security Observations & Baseline Requirements

1. **Broken Object Level Authorization (BOLA / IDOR):**
   * *Critical Risk:* Any endpoint accepting an ID parameter (e.g., `GET /api/projects/:projectId`, `PATCH /api/tasks/:taskId`) must check that `req.user.id` is an authorized member or owner of the associated project before returning or altering data.
2. **Credential Storage:**
   * Passwords must never be stored in plain text. Salt rounds must be calibrated (e.g., `bcrypt` rounds = 10–12).
   * Password hashes must be explicitly stripped from user queries before sending responses to the client.
3. **SQL Injection Defense:**
   * All database queries must use parameterized queries / prepared statements. Never concatenate user input directly into SQL strings.
4. **Cross-Site Scripting (XSS):**
   * Frontend DOM manipulation must use safe assignment properties (`textContent`, `createElement`) rather than injecting unescaped user comments or task descriptions via `innerHTML`.
5. **Data Isolation:**
   * Deleting or querying a project or task must ensure cascade safety and verification of project boundaries.

---

## 8. Recommended Next Steps

1. **Phase 1 Sign-Off:** Review this repository audit to confirm agreement on the baseline findings.
2. **Phases 2 through 6 Documentation Preparation:**
   * Create `docs/PRD.md` (Product Requirements Document).
   * Create `docs/TRD.md` (Technical Requirements & Architecture Document).
   * Create `docs/DATABASE.md` (Relational Schema, Constraints & Indexes).
   * Create `docs/API.md` (REST API Contract).
   * Create `docs/SECURITY.md` (Threat Model & Security Enforcement).
   * Create `docs/TESTING.md` (Manual & Automated Test Scenarios).
   * Create `docs/IMPLEMENTATION_PLAN.md` (Structured Milestones & Checklists).
3. **Execution of Milestone 1 (Human-Led Implementation):**
   * Developer initializes `git`, `package.json`, environment configurations, and the foundational server structure.
