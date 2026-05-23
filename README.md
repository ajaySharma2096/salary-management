# Salary Management Application

A full-stack salary management platform for HR teams. Browse, filter, and analyse employee compensation data across countries and departments.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5, Ant Design 5, Redux Toolkit + Redux-Saga |
| Backend | Node.js + Express 4, Sequelize 6, MySQL 8 |
| Auth | JWT via httpOnly cookies |
| Testing | Jest 29 + Supertest (server), Jest 29 + React Testing Library (client) |

---

## Prerequisites

- **Node.js** 18 or higher
- **MySQL 8** (local or Docker)
- **npm** 9+ (workspaces support required)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/ajaySharma2096/salary-management
cd SalaryManagementAssessment
```

### 2. Start MySQL

**Option A — Docker (recommended)**

```bash
docker run -d \
  --name salary-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=salary_management \
  -p 3306:3306 \
  mysql:8
```

**Option B — local MySQL**

```sql
CREATE DATABASE salary_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=salary_management
DB_USER=root
DB_PASSWORD=root
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=8h
NODE_ENV=development
```

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### 4. Install dependencies

```bash
npm install
```

All dependencies for both workspaces are hoisted to the root `node_modules/`.

### 5. Seed the database

```bash
npm run seed
```

Inserts 10,000 sample employees with realistic data across multiple countries, departments, and salary bands. This also creates a default admin account:

| Field | Value |
|-------|-------|
| Email | `admin@company.com` |
| Password | `Admin@123456` |

### 6. Start the application

```bash
npm run dev
```

This starts both the API server (port 5000) and the Vite dev server (port 5173) concurrently.

Open **http://localhost:5173** in your browser and log in with the credentials above.

---

## API Endpoints

All endpoints are prefixed with `/api`. Protected routes require an auth cookie obtained via login.

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Log in and receive session cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Return current authenticated user |

### Employees

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/employees` | List employees (pagination, search, filter, sort) |
| `POST` | `/api/employees` | Create a new employee |
| `GET` | `/api/employees/:id` | Get a single employee |
| `PUT` | `/api/employees/:id` | Update an employee |
| `DELETE` | `/api/employees/:id` | Delete an employee |

**Query parameters for `GET /api/employees`:**

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `20` | Items per page (max 100) |
| `search` | — | Partial match on first name, last name, or email |
| `country` | — | Filter by country |
| `department` | — | Filter by department |
| `status` | — | `active`, `inactive`, or `on_leave` |
| `sortBy` | `createdAt` | Field to sort by (whitelisted) |
| `sortOrder` | `DESC` | `ASC` or `DESC` |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics/salary-by-country` | Min, max, avg, median salary per country |
| `GET` | `/api/analytics/salary-by-job-title` | Salary breakdown by job title for a country |
| `GET` | `/api/analytics/salary-distribution` | Employee count per salary bracket |
| `GET` | `/api/analytics/top-earners` | Top N employees by salary |
| `GET` | `/api/analytics/department-summary` | Active headcount and payroll per department |

---

## Running Tests

```bash
# Run all server tests
npm run test:server

# Run all client tests
npm run test:client

# Run both
npm test
```

Server tests use an **SQLite in-memory database** (`NODE_ENV=test`) — no MySQL required.

---

## Architecture Decisions

### Security

- **httpOnly cookies** — JWT tokens are stored in httpOnly, SameSite=Strict cookies so they are inaccessible to JavaScript and protected from XSS.
- **Request size limit** — `express.json({ limit: '10kb' })` prevents large payload attacks.
- **Sort field whitelist** — Only explicitly allowed field names are accepted as `sortBy` values; all others fall back to `createdAt`, preventing SQL injection through sort parameters.
- **LIKE sanitisation** — `%` and `_` in search strings are escaped before being used in SQL LIKE expressions.
- **Rate limiting** — 100 requests/15 min globally, 10 requests/15 min on auth endpoints.
- **Helmet** — Security headers applied to all responses.
- **bcryptjs** — Passwords are hashed with bcrypt before storage; plain-text passwords are never persisted.

### Performance

- **Server-side pagination** — The employee list endpoint never returns the full dataset; all filtering and pagination is done in the database.
- **Database indexes** — Columns used in WHERE clauses (`country`, `department`, `status`, `salary`) are indexed.
- **Debounced search** — The frontend waits 400 ms after the user stops typing before sending a search request.

### Frontend State

- **Redux Toolkit + Redux-Saga** — Async side effects (API calls) are isolated in sagas, keeping reducers pure.
- **Optimistic UI patterns** — Loading and error states are tracked per feature slice (`auth`, `employees`, `analytics`).

---

## Documentation

All extended documentation is in the [`docs/`](docs/) folder.

| Document | Path | Description |
|----------|------|-------------|
| Planning | [docs/planning.md](docs/planning.md) | How the overall requirement was planned, how it was broken down into 10 subtasks, risk register, and completion summary |
| Architecture | [docs/architecture.md](docs/architecture.md) | Full system architecture — directory layout, middleware chain, database schema, API map, auth flow, testing strategy |
| ADR | [docs/ADR.md](docs/ADR.md) | Architecture Decision Records — ADR-001: JWT in httpOnly cookie; ADR-002: RBAC middleware factory |
| Trade-offs | [docs/trade-offs.md](docs/trade-offs.md) | Technology choice rationale — React vs Next.js, Node.js vs alternatives, MySQL vs alternatives, Sequelize vs alternatives |
| Performance & Security | [docs/performance-security.md](docs/performance-security.md) | Performance optimisations and security controls with implementation details and a summary matrix |
