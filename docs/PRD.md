# Product Requirements Document (PRD) — TaskFlow

**Product Name:** TaskFlow  
**Project Identifier:** `CodeAlpha_ProjectManagementTool`  
**Document Version:** 1.0.0  
**Target Audience:** CodeAlpha Evaluation Team, Project Stakeholders, Human Implementer  

---

## 1. Product Overview

**TaskFlow** is a modern, collaborative project management web application engineered to help individuals and cross-functional teams organize work, allocate resources, track task progress through distinct lifecycles, and monitor productivity metrics in real-time.

---

## 2. Target Personas & User Roles

TaskFlow enforces strict server-side Role-Based Access Control (RBAC). Permissions are never governed solely by UI visibility.

### 2.1. Registered User (Base Authenticated Actor)
* **Description:** An authenticated account holder within TaskFlow.
* **Capabilities:**
  * Register an account with a unique email and secure credentials.
  * Log in and maintain an authenticated session.
  * View and update personal profile attributes (display name, email).
  * Create new projects (thereby becoming the `OWNER` of those projects).
  * Access the personalized user Dashboard.

### 2.2. Project Owner (`OWNER`)
* **Description:** The creator of a project or a designated project administrator.
* **Capabilities:**
  * Update project metadata (title, description, status).
  * Add, invite, or remove project members.
  * Promote a project member or manage member roles.
  * Create, edit, reassign, or delete any task within the project.
  * Archive or permanently delete the project (with cascade safety).
  * View complete project activity audit trails and progress analytics.

### 2.3. Project Member (`MEMBER`)
* **Description:** A user granted access to collaborate on a specific project.
* **Capabilities:**
  * View project details, task lists, and member rosters.
  * Create new tasks within the project.
  * Update tasks assigned to them (status, description, time estimates).
  * Post comments and participate in task discussion threads.
  * View project activity logs.
* **Restrictions:**
  * Cannot delete or archive the project.
  * Cannot remove other members or modify member roles.
  * Cannot delete tasks created by other users unless assigned or elevated.

---

## 3. Role & Permission Matrix

| Feature / Action | Non-Member / Unauth | Registered User | Project Member | Project Owner |
| :--- | :---: | :---: | :---: | :---: |
| Register / Sign In | ✅ | N/A | N/A | N/A |
| View Personal Dashboard | ❌ | ✅ | ✅ | ✅ |
| Create Project | ❌ | ✅ | ✅ | ✅ |
| View Project Details & Tasks | ❌ | ❌ | ✅ | ✅ |
| Edit Project Details | ❌ | ❌ | ❌ | ✅ |
| Delete / Archive Project | ❌ | ❌ | ❌ | ✅ |
| Add / Remove Members | ❌ | ❌ | ❌ | ✅ |
| Create Task in Project | ❌ | ❌ | ✅ | ✅ |
| Assign Task to Member | ❌ | ❌ | ✅ | ✅ |
| Update Task Status / Details | ❌ | ❌ | ✅ | ✅ |
| Delete Task | ❌ | ❌ | Creator Only | ✅ |
| Comment on Task | ❌ | ❌ | ✅ | ✅ |
| View Project Activity Stream | ❌ | ❌ | ✅ | ✅ |

---

## 4. Functional Requirements

### 4.1. Authentication & Session Management
* **FR-AUTH-01:** System must allow new users to register with `name`, valid unique `email`, and a password (minimum 8 characters).
* **FR-AUTH-02:** System must hash passwords using `bcrypt` (minimum 10 salt rounds) before persisting to the database.
* **FR-AUTH-03:** System must authenticate credentials and issue a cryptographically signed session token / JWT.
* **FR-AUTH-04:** Tokens/sessions must be stored in HTTP-only, SameSite secure cookies or transmitted via standard `Authorization: Bearer <token>` headers.
* **FR-AUTH-05:** System must invalidate the session upon user logout.
* **FR-AUTH-06:** System must provide a `/api/auth/me` endpoint to verify the active session state.

### 4.2. Project Management
* **FR-PROJ-01:** Authenticated users can create projects with `name` (required, 3–100 chars), `description` (optional), and default status (`ACTIVE`).
* **FR-PROJ-02:** When a user creates a project, the system must automatically assign that user as `OWNER` in the project membership table.
* **FR-PROJ-03:** Users can view a list of all projects they own or belong to as members.
* **FR-PROJ-04:** Owners can edit project details or change project status (`ACTIVE`, `COMPLETED`, `ARCHIVED`).
* **FR-PROJ-05:** Owners can delete a project. The system must prompt for confirmation and cleanly delete associated tasks, memberships, comments, and activity logs via database cascading.

### 4.3. Team Membership & Collaboration
* **FR-MEM-01:** Project Owners can add existing registered users to a project by their registered email address.
* **FR-MEM-02:** A user cannot be added multiple times to the same project (enforced by unique database constraint).
* **FR-MEM-03:** Project Owners can remove members from a project.
* **FR-MEM-04:** Any project member can view the list of collaborators (names and emails) in that project.

### 4.4. Task Management & Workflows
* **FR-TASK-01:** Tasks must be scoped to a specific project and include:
  * `title` (required, 1–150 chars)
  * `description` (optional)
  * `status`: Strictly constrained to `TODO`, `IN_PROGRESS`, `COMPLETED`
  * `priority`: Strictly constrained to `LOW`, `MEDIUM`, `HIGH`, `URGENT`
  * `due_date`: ISO 8601 Date string (optional)
  * `assignee_id`: User ID of an eligible project member (optional/nullable)
  * `creator_id`: User ID of the user creating the task
* **FR-TASK-02:** Validation must reject assigning tasks to users who are not active members of the parent project.
* **FR-TASK-03:** System must enforce valid status transitions and log status modifications.
* **FR-TASK-04:** Project members can filter and search tasks by status, priority, assignee, and search query.

### 4.5. Comments & Task Discussions
* **FR-COM-01:** Project members can post comments on any task within their accessible project.
* **FR-COM-02:** Comments must not be empty (minimum 1 character, trimmed).
* **FR-COM-03:** Each comment must display author name, timestamp, and comment content.
* **FR-COM-04:** Authors can delete their own comments; Project Owners can moderate/delete any comment.

### 4.6. Activity History & Audit Logging
* **FR-ACT-01:** System must record an activity event when:
  * A project is created or status updated.
  * A member is added or removed.
  * A task is created, assigned, updated in status, or deleted.
* **FR-ACT-02:** Activity entries must capture: `project_id`, `actor_id`, `task_id` (optional), `action_type`, `details`, and `created_at`.
* **FR-ACT-03:** Activity stream must be readable by all project members.

### 4.7. Dynamic Dashboard
* **FR-DASH-01:** Dashboard must aggregate real-time metrics strictly from database records for the authenticated user:
  * Total Accessible Projects
  * Total Active Projects
  * Total Assigned Tasks
  * Total Completed Tasks
  * Total Overdue Tasks (where `status != 'COMPLETED'` and `due_date < CURRENT_DATE`)
  * Upcoming Deadlines (tasks due within next 7 days)
  * Recent Activity feed across all user's projects.
* **FR-DASH-02:** Mock, hardcoded, or static counts are strictly prohibited.

---

## 5. Non-Functional Requirements

* **Performance:** API endpoints must respond within $\le 200\text{ ms}$ under normal local execution.
* **Data Integrity:** Foreign keys and cascading rules must be enabled on SQLite (`PRAGMA foreign_keys = ON;`).
* **Security:** No unauthorized data disclosure (IDOR prevention). Input sanitization for all strings.
* **Reliability:** Data must persist reliably across server restarts in an SQLite database file.
* **Accessibility:** Semantic HTML elements with appropriate ARIA attributes and keyboard navigability.
