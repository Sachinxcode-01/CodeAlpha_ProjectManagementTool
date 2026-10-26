# Architecture Decision Records (ADRs) — TaskFlow

## ADR 01: Choice of Database Engine
* **Decision:** SQLite 3 with `better-sqlite3`.
* **Context:** The project requires a relational model with foreign keys, indexes, and transactions, while maintaining zero external server setup (e.g., PostgreSQL or MySQL services) for seamless portability and grading.
* **Rationale:** SQLite operates as an embedded file-based database (`taskflow.db`). `better-sqlite3` provides clean synchronous syntax, removing async callback noise and delivering superior speed for local operations.
* **Consequences:** Concurrency is file-based; write locks are mitigated using `PRAGMA journal_mode = WAL;`. `PRAGMA foreign_keys = ON;` must be run on every database connection.

---

## ADR 02: Choice of Frontend Stack
* **Decision:** Semantic HTML5, Vanilla CSS3, and ES6+ JavaScript (Fetch API, ES Modules).
* **Context:** The task specifies HTML, CSS, JavaScript, Node.js, Express, and SQLite.
* **Rationale:** Keeps the client free from build tooling overhead (Webpack/Vite/Babel), allowing direct file editing and execution. Enforces mastery of core web fundamentals: DOM manipulation, event delegation, and asynchronous network requests.
* **Consequences:** Reusable UI components (modals, toasts) will be built using modular JavaScript helper functions rather than a component library.

---

## ADR 03: Authentication & Authorization Architecture
* **Decision:** JSON Web Tokens (JWT) transmitted via Bearer headers or HTTP-only cookies, coupled with server-side RBAC middleware.
* **Context:** Authenticated users have differing permissions across projects (`OWNER` vs. `MEMBER`).
* **Rationale:** JWT is self-contained and allows stateless verification of user identity. Combining this with a database check in an RBAC middleware ensures that object-level access is validated on every single protected request.
* **Consequences:** Token revocation before expiration is handled by expiry times (`24h`).

---

## ADR 04: Project Membership Model
* **Decision:** Relational junction table `project_members` with a compound unique constraint on `(project_id, user_id)`.
* **Context:** A user can be an owner of some projects and a collaborator on others.
* **Rationale:** Decouples project ownership from participation. Allows flexible role assignment (`OWNER`, `MEMBER`) and scalable querying for user dashboards.
