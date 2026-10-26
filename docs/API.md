# REST API Specification — TaskFlow

**Base URL:** `/api`  
**Data Format:** JSON (`Content-Type: application/json`)  
**Standard Envelope:**
```json
// Success Response
{
  "success": true,
  "data": { ... }
}

// Error Response
{
  "success": false,
  "error": "Descriptive error message"
}
```

---

## 1. Authentication Endpoints

### 1.1. Register User
* **Method:** `POST`
* **Path:** `/api/auth/register`
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "created_at": "2026-10-26 08:00:00"
      },
      "token": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
  ```
* **Errors:**
  * `400 Bad Request`: Missing fields or validation error (e.g., password < 8 characters).
  * `409 Conflict`: Email already registered.

---

### 1.2. Login User
* **Method:** `POST`
* **Path:** `/api/auth/login`
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "token": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
  ```
* **Errors:**
  * `401 Unauthorized`: Invalid email or password.

---

### 1.3. Get Authenticated User Profile
* **Method:** `GET`
* **Path:** `/api/auth/me`
* **Auth Required:** Yes (`Authorization: Bearer <token>`)
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "created_at": "2026-10-26 08:00:00"
      }
    }
  }
  ```
* **Errors:**
  * `401 Unauthorized`: Missing, expired, or invalid token.

---

## 2. Project Endpoints

### 2.1. List Accessible Projects
* **Method:** `GET`
* **Path:** `/api/projects`
* **Auth Required:** Yes
* **Query Parameters:** `status` (optional: `ACTIVE`, `COMPLETED`, `ARCHIVED`)
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 10,
        "name": "Website Redesign",
        "description": "Revamp company website",
        "owner_id": 1,
        "owner_name": "Jane Doe",
        "status": "ACTIVE",
        "user_role": "OWNER",
        "total_tasks": 12,
        "completed_tasks": 5,
        "created_at": "2026-10-26 08:00:00"
      }
    ]
  }
  ```

---

### 2.2. Create Project
* **Method:** `POST`
* **Path:** `/api/projects`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "name": "Q4 Marketing Campaign",
    "description": "Planning and execution of marketing campaign"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": 11,
      "name": "Q4 Marketing Campaign",
      "description": "Planning and execution of marketing campaign",
      "owner_id": 1,
      "status": "ACTIVE",
      "created_at": "2026-10-26 08:15:00"
    }
  }
  ```

---

### 2.3. Get Project Details
* **Method:** `GET`
* **Path:** `/api/projects/:projectId`
* **Auth Required:** Yes (User must be a member or owner)
* **Success Response (200 OK):** Returns project metadata, member roster, and task status summary.
* **Errors:**
  * `403 Forbidden`: User does not belong to this project.
  * `404 Not Found`: Project ID does not exist.

---

### 2.4. Update Project
* **Method:** `PATCH`
* **Path:** `/api/projects/:projectId`
* **Auth Required:** Yes (Only `OWNER`)
* **Request Body:**
  ```json
  {
    "name": "Updated Project Name",
    "description": "New description",
    "status": "COMPLETED"
  }
  ```
* **Errors:**
  * `403 Forbidden`: User is a `MEMBER`, not an `OWNER`.

---

### 2.5. Delete Project
* **Method:** `DELETE`
* **Path:** `/api/projects/:projectId`
* **Auth Required:** Yes (Only `OWNER`)
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Project deleted successfully"
  }
  ```

---

## 3. Project Membership Endpoints

### 3.1. Add Project Member
* **Method:** `POST`
* **Path:** `/api/projects/:projectId/members`
* **Auth Required:** Yes (Only `OWNER`)
* **Request Body:**
  ```json
  {
    "email": "teammate@example.com",
    "role": "MEMBER"
  }
  ```
* **Errors:**
  * `400 Bad Request`: User already a member.
  * `404 Not Found`: No registered user with that email.

### 3.2. Remove Project Member
* **Method:** `DELETE`
* **Path:** `/api/projects/:projectId/members/:userId`
* **Auth Required:** Yes (Only `OWNER`)

---

## 4. Task Endpoints

### 4.1. List Tasks for Project
* **Method:** `GET`
* **Path:** `/api/projects/:projectId/tasks`
* **Auth Required:** Yes (Project Member or Owner)
* **Query Parameters:** `status`, `priority`, `assignee_id`, `search`
* **Success Response (200 OK):** Returns array of tasks with assignee details.

### 4.2. Create Task
* **Method:** `POST`
* **Path:** `/api/projects/:projectId/tasks`
* **Auth Required:** Yes (Project Member or Owner)
* **Request Body:**
  ```json
  {
    "title": "Design Database Schema",
    "description": "Define tables for users, projects, tasks",
    "priority": "HIGH",
    "status": "TODO",
    "assignee_id": 2,
    "due_date": "2026-11-01"
  }
  ```
* **Errors:**
  * `400 Bad Request`: Assigned user is not a member of this project.

### 4.3. Update Task
* **Method:** `PATCH`
* **Path:** `/api/tasks/:taskId`
* **Auth Required:** Yes (Project Member or Owner)
* **Request Body:** Any subset of `title`, `description`, `status`, `priority`, `assignee_id`, `due_date`.

### 4.4. Delete Task
* **Method:** `DELETE`
* **Path:** `/api/tasks/:taskId`
* **Auth Required:** Yes (`OWNER` or Task Creator)

---

## 5. Comment Endpoints

### 5.1. List Comments for Task
* **Method:** `GET`
* **Path:** `/api/tasks/:taskId/comments`
* **Auth Required:** Yes

### 5.2. Create Comment
* **Method:** `POST`
* **Path:** `/api/tasks/:taskId/comments`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "content": "Finished implementing the ER diagram!"
  }
  ```

---

## 6. Dashboard & Activity Endpoints

### 6.1. Get Dashboard Summary
* **Method:** `GET`
* **Path:** `/api/dashboard`
* **Auth Required:** Yes
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "metrics": {
        "total_projects": 4,
        "active_projects": 3,
        "total_tasks": 18,
        "assigned_to_me": 6,
        "completed_tasks": 9,
        "overdue_tasks": 2
      },
      "upcoming_deadlines": [
        {
          "id": 14,
          "title": "API Documentation",
          "project_name": "TaskFlow Core",
          "due_date": "2026-10-28",
          "priority": "HIGH"
        }
      ],
      "recent_activity": [ ... ]
    }
  }
  ```

### 6.2. Get Project Activity Log
* **Method:** `GET`
* **Path:** `/api/projects/:projectId/activity`
* **Auth Required:** Yes (Project Member or Owner)
