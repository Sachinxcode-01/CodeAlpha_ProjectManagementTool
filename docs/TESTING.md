# Comprehensive Testing & Verification Plan — TaskFlow

**Program:** CodeAlpha Full Stack Development Internship — Task 3  
**Format:** Manual test scenarios, curl execution commands, and verification criteria in plain English.

---

## 1. Authentication Test Scenarios

| Test ID | Scenario | Input / Action | Expected Result |
| :--- | :--- | :--- | :--- |
| **AUTH-01** | Successful Registration | Valid `name`, unique `email`, password $\ge 8$ chars | HTTP 201 Created; returns user object (without password hash) and valid JWT. |
| **AUTH-02** | Duplicate Email Rejection | Attempt registration with existing email | HTTP 409 Conflict; descriptive error message; no duplicate row in DB. |
| **AUTH-03** | Weak Password Rejection | Register with password `< 8` chars | HTTP 400 Bad Request; registration rejected. |
| **AUTH-04** | Valid Login | Valid email and matching password | HTTP 200 OK; returns valid signed JWT token. |
| **AUTH-05** | Incorrect Password | Valid email, wrong password | HTTP 401 Unauthorized; generic error "Invalid credentials". |
| **AUTH-06** | Protected Route Guard | Request `GET /api/auth/me` with no token | HTTP 401 Unauthorized; access blocked. |
| **AUTH-07** | Invalid / Expired Token | Request `GET /api/auth/me` with tampered token | HTTP 401 Unauthorized; token rejection logged. |

---

## 2. Project Management Test Scenarios

| Test ID | Scenario | Input / Action | Expected Result |
| :--- | :--- | :--- | :--- |
| **PROJ-01** | Create Project | Valid name & description | HTTP 201 Created; creates row in `projects` AND adds creator to `project_members` as `OWNER`. |
| **PROJ-02** | List Projects | Authenticated user requests `/api/projects` | HTTP 200 OK; lists only projects where user is owner or member. |
| **PROJ-03** | Non-Member Isolation | User B requests `/api/projects/:id` of User A's project | HTTP 403 Forbidden; User B cannot read project details. |
| **PROJ-04** | Edit Project (Owner) | Owner updates project name / description | HTTP 200 OK; database updated and `updated_at` refreshed. |
| **PROJ-05** | Edit Project (Member) | Regular member attempts `PATCH /api/projects/:id` | HTTP 403 Forbidden; only `OWNER` can edit project details. |
| **PROJ-06** | Delete Project (Cascade) | Owner deletes project | HTTP 200 OK; project deleted; associated tasks, comments, and members removed. |

---

## 3. Team Membership & RBAC Scenarios

| Test ID | Scenario | Input / Action | Expected Result |
| :--- | :--- | :--- | :--- |
| **MEM-01** | Add Valid Member | Owner adds registered user by email | HTTP 201 Created; user added to `project_members` with role `MEMBER`. |
| **MEM-02** | Duplicate Membership | Owner adds same user again | HTTP 400 Bad Request / 409 Conflict; rejected by unique constraint. |
| **MEM-03** | Add Non-Existent User | Owner attempts to add email not in `users` | HTTP 404 Not Found; descriptive error. |
| **MEM-04** | Member Adds Member | Non-owner attempts `POST /api/projects/:id/members` | HTTP 403 Forbidden; rejected by RBAC middleware. |

---

## 4. Task Management Test Scenarios

| Test ID | Scenario | Input / Action | Expected Result |
| :--- | :--- | :--- | :--- |
| **TASK-01** | Create Task | Valid title, status, priority, due date | HTTP 201 Created; task persisted with `creator_id`. |
| **TASK-02** | Assign to Ineligible User | Assign task to user who is NOT a project member | HTTP 400 Bad Request; server rejects invalid assignment. |
| **TASK-03** | Invalid Status Value | Provide status `"RANDOM_STATUS"` | HTTP 400 Bad Request; strictly rejected by validation and SQLite CHECK constraint. |
| **TASK-04** | Status Transition | Update status `TODO` -> `IN_PROGRESS` -> `COMPLETED` | HTTP 200 OK; status updated; activity log event created. |
| **TASK-05** | Filter Tasks | Query `/api/projects/:id/tasks?status=TODO&priority=HIGH` | HTTP 200 OK; returns only matching tasks. |

---

## 5. Comment & Discussion Test Scenarios

| Test ID | Scenario | Input / Action | Expected Result |
| :--- | :--- | :--- | :--- |
| **COM-01** | Add Comment | Member submits valid text comment | HTTP 201 Created; saved with `author_id` and timestamp. |
| **COM-02** | Empty Comment | Member submits whitespace/empty string | HTTP 400 Bad Request; empty comments rejected. |
| **COM-03** | Inaccessible Task Comment | Non-member submits comment on private task | HTTP 403 Forbidden; comment rejected. |

---

## 6. Dashboard Calculations Test Scenarios

| Test ID | Scenario | Verification Method | Expected Result |
| :--- | :--- | :--- | :--- |
| **DASH-01** | Task Counts Integrity | Compare `/api/dashboard` counts with direct SQL query count | Counts match active database rows exactly (1:1 parity). |
| **DASH-02** | Overdue Calculation | Insert task with `due_date = '2020-01-01'` and `status = 'TODO'` | Increments `overdue_tasks` count by 1. |
| **DASH-03** | Completed Exclusion | Change overdue task to `status = 'COMPLETED'` | `overdue_tasks` count decreases by 1; `completed_tasks` increments. |
| **DASH-04** | Zero / Empty State | Query dashboard for newly registered user with 0 projects | HTTP 200 OK; returns zeros without crashes or null pointer errors. |

---

## 7. Security & Edge Case Test Scenarios

| Test ID | Scenario | Test Input | Expected Defense |
| :--- | :--- | :--- | :--- |
| **SEC-01** | SQL Injection in Login | `' OR 1=1 --` as email | Fails authentication; parameterized query treats string literally. |
| **SEC-02** | SQL Injection in Search | `'; DROP TABLE tasks; --` in task search parameter | Handled as literal string search; tables remain intact. |
| **SEC-03** | BOLA / IDOR URL Tampering | User A replaces `projectId` in URL with User B's private project ID | HTTP 403 Forbidden; access denied. |
| **SEC-04** | Stored XSS in Comment | `<script>alert('XSS')</script>` in comment body | Rendered safely via `element.textContent`; script never executes in browser. |
| **SEC-05** | Secret Leakage | Request user profile or project member lists | Password hashes are completely absent from all JSON responses. |
| **SEC-06** | Data Persistence After Restart | Insert records, kill server process (`Ctrl+C`), and restart server | All data remains intact in `taskflow.db`. |
