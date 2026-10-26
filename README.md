# TaskFlow — Project Management Tool

**TaskFlow** is a full-stack project management web application built for the **CodeAlpha Full Stack Development Internship (Task 3)**.

The application enables authenticated users to create and organize projects, manage team memberships with role-based access control (RBAC), track tasks through distinct workflow stages, assign priorities and deadlines, participate in task-specific discussions, and view real-time productivity statistics via an interactive dashboard.

---

## 🚀 Technology Stack

* **Frontend:** Semantic HTML5, Vanilla CSS3 (Custom Responsive Design System), Modern Vanilla JavaScript (ES6+ Modules, Fetch API)
* **Backend:** Node.js, Express.js (REST API Architecture)
* **Database:** SQLite 3 (`better-sqlite3` driver with foreign key constraints and WAL mode)
* **Authentication:** JSON Web Tokens (JWT) / Session Cookies with `bcryptjs` password hashing
* **Security:** Server-side RBAC, prepared SQL statements, parameter validation, and OWASP Top 10 defenses

---

## 📋 Features Overview

* 🔐 **User Authentication & Profiles:** User registration, credential validation, salted password hashing, and session verification.
* 📁 **Project Management:** Project creation, editing, viewing, and deletion with ownership permissions.
* 👥 **Team Membership & Roles:** Add collaborators via registered email, enforce `OWNER` vs `MEMBER` roles with server-side authorization.
* ✅ **Task Tracking:** Full task lifecycle (`TODO`, `IN_PROGRESS`, `COMPLETED`), priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and due dates.
* 💬 **Comments & Discussions:** Task-level discussion threads with author attribution and timestamps.
* 📜 **Activity Stream:** Audit logging of project and task updates.
* 📊 **Live Dashboard:** Real-time database aggregations for active projects, assigned tasks, completed tasks, overdue items, and upcoming deadlines.
* 🔎 **Search & Filter:** Multi-criteria task filtering by status, priority, and assignee.

---

## 🛠️ Prerequisites

* [Node.js](https://nodejs.org/) (Version `>=18.x`, tested on `v25.1.0`)
* [npm](https://www.npmjs.com/) (Version `>=9.x`, tested on `11.14.1`)
* [Git](https://git-scm.com/)

---

## ⚙️ Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/CodeAlpha_ProjectManagementTool.git
   cd CodeAlpha_ProjectManagementTool
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

   Review the settings in `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_here
   DB_PATH=./data/taskflow.db
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Initialize the database:**
   ```bash
   npm run db:init
   ```

5. **Start the application:**
   * **Development Mode (with auto-reload):**
     ```bash
     npm run dev
     ```
   * **Production Mode:**
     ```bash
     npm start
     ```

6. **Access the application:**
   Open your browser and navigate to: `http://localhost:3000`

---

## 📖 Technical Documentation

Comprehensive specifications and architecture documentation are available in the [`docs/`](./docs) directory:

* [`docs/REPOSITORY_AUDIT.md`](./docs/REPOSITORY_AUDIT.md) — Workspace baseline audit and dependency review
* [`docs/PRD.md`](./docs/PRD.md) — Product Requirements Document and Role-Based Access Control matrix
* [`docs/TRD.md`](./docs/TRD.md) — Technical Architecture, module boundaries, and request lifecycle
* [`docs/DATABASE.md`](./docs/DATABASE.md) — Relational Entity Diagram, SQLite schema DDL, and constraints
* [`docs/API.md`](./docs/API.md) — Complete REST API specification and JSON contracts
* [`docs/SECURITY.md`](./docs/SECURITY.md) — Security model, IDOR/BOLA mitigations, and threat analysis
* [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) — Human-led milestone roadmap
* [`docs/TESTING.md`](./docs/TESTING.md) — Verification scenarios, curl test cases, and expected outputs
* [`docs/DECISIONS.md`](./docs/DECISIONS.md) — Architecture Decision Records (ADRs)

---

## ⚠️ Known Status & Scope Notice

* Currently in **Milestone 1** of development.
* Architecture blueprints, database design, API specifications, and testing plans are fully established.
* Implementation code is authored directly by the developer to comply with CodeAlpha internship submission policies.

---

## 📄 License

This project is developed as part of the CodeAlpha Full Stack Development Internship.
