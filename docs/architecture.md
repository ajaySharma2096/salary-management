# System Architecture

## Overview

The Salary Management Application is a full-stack web application built using a **client–server** architecture. The client is a single-page application (SPA) served by Vite; the server is a RESTful API. Both live in a single Git repository managed as **npm workspaces**.

```
SalaryManagementAssessment/
├── client/          # React SPA (Vite)
├── server/          # Node.js REST API (Express)
├── docs/            # Architecture & decision records
├── package.json     # Workspace root — shared scripts
└── README.md
```

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser                                │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │               React SPA  (Vite dev / dist)              │  │
│   │                                                         │  │
│   │  Redux Store  ──►  Redux-Saga  ──►  Axios (apiClient)  │  │
│   │  (auth / employees / analytics)       withCredentials   │  │
│   └──────────────────────────┬──────────────────────────────┘  │
│                              │  HTTPS  (httpOnly cookie: token) │
└──────────────────────────────┼─────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Node.js / Express API                       │
│                                                                 │
│   Middleware chain:                                             │
│     Helmet → CORS → Rate Limit → Body Parser → Cookie Parser    │
│     → isAuthenticated → isAuthorized → validate → Controller   │
│                                                                 │
│   Routes:                                                       │
│     /api/auth          authRoutes                              │
│     /api/employees     employeeRoutes                          │
│     /api/analytics     analyticsRoutes                         │
│     /api/health        inline                                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │  Sequelize ORM
                                ▼
                    ┌───────────────────────┐
                    │    MySQL 8 Database   │
                    │                       │
                    │   Tables:             │
                    │     users             │
                    │     employees         │
                    └───────────────────────┘
```

---

## Frontend Architecture

### Technology Choices

| Concern | Technology |
|---------|-----------|
| UI framework | React 18 (concurrent rendering) |
| Build tool | Vite 5 (fast HMR, ESM-native) |
| UI component library | Ant Design 5 |
| State management | Redux Toolkit 2 |
| Side-effect management | Redux-Saga 1.3 |
| Routing | React Router 6 |
| HTTP client | Axios (with `withCredentials: true`) |
| Date handling | Day.js |

### Directory Layout

```
client/src/
├── __mocks__/          # Manual Jest mocks (axios, fileMock)
├── components/         # Shared presentational components
│   ├── AppLayout.jsx      Ant Design Layout + collapsible Sider
│   ├── EmployeeFormModal.jsx  Add / Edit modal with 13 fields
│   ├── ProtectedRoute.jsx    Redirect unauthenticated users
│   └── StatusTag.jsx         active / inactive / on_leave badge
├── pages/
│   ├── DashboardPage.jsx  Analytics: stats, charts, tables
│   ├── EmployeesPage.jsx  CRUD table with server-side pagination
│   ├── LoginPage.jsx
│   └── SignupPage.jsx
├── redux/
│   ├── actions/           Plain action creators (string constants)
│   ├── reducers/          Pure reducers (auth, employees, analytics)
│   ├── sagas/             Side-effect watchers (call API → put action)
│   └── store.js           configureStore + sagaMiddleware
├── services/              Thin wrappers around Axios calls
│   ├── apiClient.js       Base Axios instance
│   ├── authService.js
│   ├── employeeService.js
│   └── analyticsService.js
├── tests/                 Jest + React Testing Library suites
├── utils/
│   └── formatters.js      formatSalary / formatDate
├── App.jsx                Route definitions
├── main.jsx               ReactDOM.createRoot entry point
└── setupTests.js          matchMedia / ResizeObserver mocks
```

### State Management Flow

```
User Action
    │
    ▼
Component dispatches Action Creator
    │
    ▼
Redux Store receives action
    │  (if loading/error type)  ──► Reducer updates state ──► Component re-renders
    │
    │  (if REQUEST type)
    ▼
Redux-Saga watcher picks up action
    │
    ▼
Saga calls Service (Axios)
    │
    ├── success ──► put(SUCCESS_ACTION, payload) ──► Reducer ──► Component
    └── failure ──► put(FAILURE_ACTION, error)   ──► Reducer ──► Error UI
```

**Three feature slices:**

| Slice | State shape |
|-------|-------------|
| `auth` | `{ user, isAuthenticated, loading, error }` |
| `employees` | `{ list, total, page, limit, totalPages, filters, currentEmployee, loading, submitting, error }` |
| `analytics` | `{ byCountry, byJobTitle, distribution, topEarners, deptSummary, loading, error }` |

---

## Backend Architecture

### Technology Choices

| Concern | Technology |
|---------|-----------|
| Runtime | Node.js 18 (LTS) |
| Framework | Express 4 |
| ORM | Sequelize 6 |
| Database | MySQL 8 |
| Auth | JWT via `jsonwebtoken` + `cookie-parser` |
| Password hashing | `bcryptjs` (salt rounds: 10) |
| Security headers | `helmet` |
| Rate limiting | `express-rate-limit` |
| Request logging | `morgan` |

### Directory Layout

```
server/
├── config/
│   └── database.js    Sequelize instance (MySQL in prod, SQLite in test)
├── controllers/
│   ├── authController.js       signup / login / logout / me
│   ├── employeeController.js   CRUD + list with filtering/sorting/pagination
│   └── analyticsController.js  5 analytics endpoints
├── middlewares/
│   ├── isAuthenticated.js   JWT cookie verification
│   ├── isAuthorized.js      Role-based access factory
│   └── validate.js          express-validator result handler
├── models/
│   ├── index.js    Sequelize instance + model exports
│   ├── User.js     users table (bcrypt hook, role enum)
│   └── Employee.js employees table (virtual fullName, DB indexes)
├── routes/
│   ├── authRoutes.js
│   ├── employeeRoutes.js
│   └── analyticsRoutes.js
├── seeders/
│   └── seedEmployees.js   10 000-employee seeder (chunked bulkCreate)
├── tests/                 Jest + Supertest suites
├── validators/            express-validator rule arrays
└── app.js                 Express app setup (no listen — index.js does that)
```

### Middleware Chain (per request)

```
Incoming HTTP Request
       │
       ▼
 1. helmet()             — security headers (X-Frame-Options, HSTS, etc.)
 2. cors()               — whitelist CLIENT_URL, allow credentials
 3. rateLimit()          — global: 100 req / 15 min per IP
 4. express.json()       — body parse, 10 kb limit
 5. express.urlencoded() — form body parse, 10 kb limit
 6. cookieParser()       — parse httpOnly cookie → req.cookies
 7. morgan()             — dev-only request log
       │
       ▼  (auth endpoints: additional authLimiter — 10 req / 15 min)
       │
       ▼
 Router match
       │
       ▼
 8. isAuthenticated()    — verify JWT from req.cookies.token
 9. isAuthorized(role)   — check req.user.role against allowed list
10. validate()           — collect express-validator errors → 422
11. Controller function  — business logic → Sequelize → JSON response
```

### Database Models

#### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO_INCREMENT | |
| `email` | VARCHAR(255) UNIQUE | |
| `password` | VARCHAR(255) | bcrypt hash |
| `firstName` | VARCHAR(100) | |
| `lastName` | VARCHAR(100) | |
| `role` | ENUM('admin','hr_manager') | default: `hr_manager` |
| `createdAt` | DATETIME | |
| `updatedAt` | DATETIME | |

#### `employees`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO_INCREMENT | |
| `firstName` | VARCHAR(100) | |
| `lastName` | VARCHAR(100) | |
| `fullName` | VIRTUAL | `firstName + ' ' + lastName` |
| `email` | VARCHAR(255) UNIQUE nullable | |
| `phone` | VARCHAR(20) nullable | |
| `jobTitle` | VARCHAR(150) | |
| `department` | VARCHAR(100) | indexed |
| `country` | VARCHAR(100) | indexed |
| `city` | VARCHAR(100) nullable | |
| `salary` | DECIMAL(12,2) | indexed |
| `currency` | VARCHAR(10) | default: `USD` |
| `hireDate` | DATEONLY | |
| `employmentType` | ENUM | `full_time / part_time / contract / intern` |
| `status` | ENUM | `active / inactive / on_leave`, indexed |
| `createdAt` | DATETIME | |
| `updatedAt` | DATETIME | |

---

## API Endpoint Map

### Auth — `/api/auth`

| Method | Path | Auth | Body / Params | Response |
|--------|------|------|---------------|----------|
| POST | `/signup` | — | `{ email, password, firstName, lastName }` | 201 `{ user }` |
| POST | `/login` | — | `{ email, password }` | 200 `{ user }` + sets `token` cookie |
| POST | `/logout` | ✓ | — | 200 `{ message }` + clears cookie |
| GET | `/me` | ✓ | — | 200 `{ user }` |

### Employees — `/api/employees`

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| GET | `/` | any | Paginated, filterable, sortable list |
| POST | `/` | any | Create employee |
| GET | `/:id` | any | Single employee |
| PUT | `/:id` | any | Update fields |
| DELETE | `/:id` | admin, hr_manager | Hard delete |

**GET `/` query parameters:**

| Param | Default | Constraints |
|-------|---------|-------------|
| `page` | `1` | integer ≥ 1 |
| `limit` | `20` | capped at 100 |
| `search` | — | LIKE on firstName, lastName, email (wildcards escaped) |
| `country` | — | exact match |
| `department` | — | exact match |
| `status` | — | `active / inactive / on_leave` |
| `sortBy` | `createdAt` | whitelisted fields only |
| `sortOrder` | `DESC` | `ASC / DESC` |

### Analytics — `/api/analytics`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/salary-by-country` | Min / max / avg / median per country |
| GET | `/salary-by-job-title?country=` | Job-title breakdown within a country |
| GET | `/salary-distribution` | Employee count per $10 000 salary bracket |
| GET | `/top-earners?limit=` | Top N employees by salary |
| GET | `/department-summary` | Active headcount + total payroll per dept |

---

## Authentication & Session Flow

```
1. POST /api/auth/login
   ├── Validate body (express-validator)
   ├── Query User by email
   ├── bcrypt.compare(password, user.password)
   ├── jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
   └── res.cookie('token', token, { httpOnly: true, sameSite: 'strict', secure: prod })

2. Subsequent requests
   ├── Browser automatically sends cookie
   ├── isAuthenticated: jwt.verify(req.cookies.token, JWT_SECRET)
   ├── Attaches decoded payload to req.user
   └── Passes to next middleware

3. POST /api/auth/logout
   └── res.clearCookie('token')
```

---

## Testing Architecture

### Server Tests (`server/tests/`)

| File | Scope | Key technique |
|------|-------|---------------|
| `models.test.js` | Sequelize model validation | SQLite in-memory |
| `auth.test.js` | Auth endpoints | Supertest + cookie extraction |
| `employee.test.js` | Employee CRUD + edge cases | beforeEach truncate |
| `analytics.test.js` | All 5 analytics endpoints | Known fixture data |
| `middleware.test.js` | isAuthenticated / isAuthorized / validate | Direct fn + Supertest |
| `seed.test.js` | Seeder correctness | 10 000 row count assertions |

All server tests switch to **SQLite `:memory:`** via `NODE_ENV=test`. Rate limiters are skipped in test mode.

### Client Tests (`client/src/tests/`)

| File | Scope | Key technique |
|------|-------|---------------|
| `authSaga.test.js` | Auth saga flows | Factory mock for authService |
| `employeeReducer.test.js` | Employee reducer | Pure function assertions |
| `employeeSaga.test.js` | Employee saga flows | Factory mock for employeeService |
| `analyticsReducer.test.js` | Analytics reducer | Pure function assertions |
| `formatters.test.js` | formatSalary / formatDate | Unit |
| `LoginPage.test.jsx` | Login form rendering + error state | RTL + Redux Provider |
| `EmployeeFormModal.test.jsx` | Add/edit modal rendering + validation | RTL + fireEvent |

`import.meta.env` (used by `apiClient.js`) is never evaluated in tests because all service modules are replaced with factory mocks (`jest.mock('../services/...')`).

---

## Development Workflow

```
npm install              # install all workspace deps
npm run dev              # concurrently: Vite (5173) + Express (5000)
npm run seed             # seed 10 000 employees into MySQL
npm run test:server      # Jest server tests (SQLite, no DB needed)
npm run test:client      # Jest client tests (jsdom)
npm test                 # both
npm run build            # Vite production build
```

---

## Deployment Considerations

- The Express server should sit behind a reverse proxy (nginx / Caddy) that handles TLS termination.
- `secure: true` on the JWT cookie is enforced in production (`NODE_ENV=production`).
- Environment variables must be supplied via a secrets manager or platform-native config — never committed to version control.
- The client build output (`client/dist/`) can be served by the same nginx or a CDN (Cloudflare, S3 + CloudFront).
- MySQL should be run with a dedicated application user with `SELECT, INSERT, UPDATE, DELETE` privileges only — not `root`.
