# Project Planning — Salary Management Tool

## 1. Understanding the Requirements

Before writing a single line of code, the overall requirement was broken down from the problem statement:

> **Build a minimal yet production-quality salary management tool for an organisation with 10,000 employees. The user persona is an HR Manager. The tool must support employee CRUD operations and salary insights/analytics.**

### Core Goals Identified

| Goal | Implication |
|---|---|
| 10,000-employee dataset | Data volume matters — queries and seed script must be performant |
| HR Manager persona | Auth is mandatory; role-based access required |
| Employee CRUD | Full create/read/update/delete API + management UI |
| Salary analytics | Aggregation queries: min/max/avg/median by country, job title, department |
| Production quality | Security hardening, input validation, error handling, tests |

### Questions Resolved Up Front

- **Where is state managed?** — Redux + Redux-Saga on the client (predictable, testable, separation of concerns)
- **How is auth handled?** — JWT in an httpOnly cookie (XSS-resistant; no client-side token storage)
- **How do tests run without MySQL?** — Sequelize dialect switch: `sqlite :memory:` in `NODE_ENV=test`
- **How are 10,000 rows seeded quickly?** — Chunked `bulkCreate` (500 rows/chunk) with `validate: false`
- **What component library?** — Ant Design (enterprise-grade, ships tables, forms, modals, charts, icons)

---

## 2. Technology Decisions (Pre-Development)

The full tech stack was locked in before any code was written to avoid mid-project pivots.

| Layer | Choice | Key Reason |
|---|---|---|
| Frontend framework | React 18 + Vite 5 | Fast HMR, ESM-native, no SSR overhead needed for internal tool |
| State management | Redux Toolkit + Redux-Saga | Saga pattern isolates async side effects, highly testable |
| UI library | Ant Design 5 | Ships production-ready Table, Form, Modal, Select, DatePicker |
| Backend runtime | Node.js 18 + Express 4 | Non-blocking I/O, same language as frontend |
| ORM | Sequelize 6 | Dialect switching enables SQLite in tests without MySQL |
| Database | MySQL 8 | Structured relational data, window functions, widespread hosting support |
| Auth | JWT + httpOnly cookie | Stateless, XSS-resistant, no additional session store needed |
| Security | Helmet, CORS, express-rate-limit, express-validator, bcryptjs | OWASP Top 10 baseline |
| Testing | Jest + Supertest (server), RTL + Jest (client) | Industry standard; supertest enables in-process HTTP testing |
| Package management | npm workspaces | Single `npm install` at root installs all dependencies for both workspaces |

---

## 3. Project Structure Design

The monorepo layout was planned before scaffolding began so both workspaces could be established cleanly in one pass.

```
salary-management/                  ← workspace root
├── package.json                    ← npm workspaces host; shared scripts
├── .gitignore                      ← single root gitignore
├── .env.example
├── first_names.txt                 ← 200+ first names for seed data
├── last_names.txt                  ← 200+ last names for seed data
├── task.md                         ← incremental build plan
├── README.md
├── docs/                           ← architecture & decision docs
│   ├── planning.md                 ← this document
│   ├── architecture.md
│   ├── ADR.md
│   ├── trade-offs.md
│   └── performance-security.md
│
├── client/                         ← React frontend (Vite)
│   ├── package.json
│   ├── vite.config.js              ← /api proxy to :5000
│   ├── index.html
│   └── src/
│       ├── components/             ← shared UI (EmployeeFormModal, StatusTag, AppLayout)
│       ├── pages/                  ← route-level components
│       ├── redux/
│       │   ├── actions/            ← action type constants + creators
│       │   ├── reducers/           ← pure reducer functions
│       │   ├── sagas/              ← async side effects
│       │   └── store.js
│       ├── services/               ← Axios API layer (authService, employeeService, analyticsService)
│       ├── routes/                 ← ProtectedRoute wrapper
│       ├── utils/                  ← formatters (currency, date)
│       └── tests/
│
└── server/                         ← Node.js + Express backend
    ├── package.json
    ├── .env / .env.example
    ├── app.js                      ← Express app (middleware, routes)
    ├── index.js                    ← HTTP server entry point
    ├── config/
    │   └── database.js             ← Sequelize instance (SQLite in test)
    ├── controllers/                ← Route handler logic
    ├── middlewares/                ← isAuthenticated, isAuthorized, validate
    ├── models/                     ← User, Employee (Sequelize)
    ├── routes/                     ← Express routers
    ├── validators/                 ← express-validator chains
    ├── seeders/                    ← seed.js (10k employees)
    └── tests/
```

### Key Structural Decisions

- **`server/app.js` vs `server/index.js`** — `app.js` exports the Express app (no `listen`) so Supertest can import it without starting a real server. `index.js` calls `listen` and is the real entry point.
- **`client/src/services/`** — All Axios calls live here, separate from sagas, so services can be mocked independently in tests.
- **One `.gitignore` at root** — Simpler than maintaining separate ignore files in each workspace.

---

## 4. Incremental Build Plan — The 10 Subtasks

The work was divided into 10 self-contained subtasks, each building on the previous one. The split was designed so that every subtask:
- Produces working, runnable software
- Has its own tests
- Represents a logical layer or feature boundary
- Could be committed independently

### Subtask Dependency Map

```
Subtask 1 (Scaffolding)
    └── Subtask 2 (Models)
            └── Subtask 3 (Auth API)
                    └── Subtask 4 (Employee API)
                            ├── Subtask 5 (Analytics API)
                            │       └── Subtask 6 (Seed Script)
                            └── Subtask 7 (Auth UI)
                                    └── Subtask 8 (Employee UI)
                                            └── Subtask 9 (Analytics UI)
                                                    └── Subtask 10 (Hardening + Tests + README)
```

---

## 5. Subtask-by-Subtask Plan

### Subtask 1 — Project Scaffolding & Environment Setup

**What:** Establish the full project skeleton before any feature code is written.

**Why first:** Everything else depends on having the correct workspace structure, installed dependencies, and environment configuration. A bad scaffold is expensive to fix later.

**Deliverables:**
- Root `package.json` with npm workspaces (`client`, `server`) and all shared scripts (`dev`, `build`, `test`, `seed`)
- `server/` with Express app skeleton, `/api/health` route, Helmet, CORS, rate limiter, Morgan, cookie-parser, Sequelize config
- `client/` with Vite + React, Redux store, Redux-Saga root saga wired (empty), Ant Design installed
- `first_names.txt` and `last_names.txt` with 200+ names for the seeder
- Single root `.gitignore`

**Testing:** Manual verification — `npm run dev:server` starts on :5000, `npm run dev:client` starts on :5173.

---

### Subtask 2 — Database Models & Sequelize Setup

**What:** Define the two data models that the entire application is built on.

**Why second:** All API controllers depend on models. Defining them early — with validation hooks, virtual fields, and associations — avoids schema drift later.

**Deliverables:**
- `server/models/User.js` — email, password (bcrypt hook), firstName, lastName, role ENUM, isActive, lastLoginAt; `validatePassword()` instance method
- `server/models/Employee.js` — 15 columns including virtual `fullName`, DECIMAL salary, ENUM status, indexed columns
- `server/models/index.js` — imports all models, sets up associations, exports
- `server/config/database.js` — `sequelize.sync({ alter: true })` in development; SQLite `:memory:` when `NODE_ENV=test`
- `server/tests/models.test.js` — virtual field, password hash/compare, required fields

**Key decision — SQLite for tests:** Rather than mocking the ORM, Sequelize's dialect abstraction allows real SQL to run against an in-memory SQLite database during tests. This gives high-fidelity tests with zero configuration.

---

### Subtask 3 — Authentication: JWT, Middleware & Security

**What:** Implement the full auth layer — signup, login, logout, session verification, role-based access control.

**Why third:** Auth is the security perimeter that every subsequent route depends on. Building it before the business API ensures no route is accidentally left unprotected.

**Deliverables:**
- `server/controllers/authController.js` — signup (201/409/422), login (JWT cookie set), logout (cookie cleared), me (protected)
- `server/validators/authValidators.js` — express-validator chains for signup/login
- `server/middlewares/isAuthenticated.js` — reads httpOnly cookie, verifies JWT, attaches `req.user`
- `server/middlewares/isAuthorized.js` — factory `(...roles) => middleware` for RBAC
- `server/middlewares/validate.js` — reads `validationResult`, returns 422 on errors
- `server/routes/authRoutes.js` + mounted in `app.js`
- `server/tests/auth.test.js` — 8 tests covering happy paths and all error branches

**Key decision — httpOnly cookie:** The JWT is never accessible to JavaScript. This eliminates XSS-based token theft (the most common auth attack vector in SPAs). The trade-off (no revocation without a blocklist) was accepted given the internal tool context.

---

### Subtask 4 — Employee CRUD API

**What:** Full REST API for employee data — list with pagination/search/filter, get one, create, update, delete.

**Why fourth:** The core business domain. Auth must be in place first so every route can be protected from day one.

**Deliverables:**
- `server/controllers/employeeController.js` — 5 handlers; `findAndCountAll` with dynamic `where`, `order`, `limit`, `offset`
- `server/validators/employeeValidators.js` — `createEmployeeValidators` and `updateEmployeeValidators`
- `server/routes/employeeRoutes.js` + mounted in `app.js`
- `server/tests/employee.test.js` — 12 tests covering auth protection, validation, pagination, search, CRUD

**Key decisions:**
- Limit capped at 100 to protect server resources
- `sortBy` field whitelisted to prevent SQL injection through the `ORDER BY` clause
- LIKE wildcards escaped to prevent wildcard abuse in search queries

---

### Subtask 5 — Salary Insights & Analytics API

**What:** Aggregation endpoints that power the dashboard — salary stats by country, by job title, distribution brackets, top earners, department payroll.

**Why fifth:** Depends on the Employee model and the auth middleware being in place. Analytics sits above CRUD in the dependency chain.

**Deliverables:**
- `server/controllers/analyticsController.js` — 5 endpoints using Sequelize `findAll` with `attributes`, `group`, `where`, `order`, and JS-computed median
- `server/validators/analyticsValidators.js` — validates `country` (required for job-title endpoint), `limit` range for top-earners
- `server/routes/analyticsRoutes.js` + mounted in `app.js`
- Database indexes added to `Employee.js` model options — `country`, `jobTitle`, `department`, `status`, composite `(country, jobTitle)`
- `server/tests/analytics.test.js` — 7 tests with deterministic seeded data

**Key decision — JS median:** MySQL's `PERCENTILE_CONT` is a window function not supported in all MySQL 8 configurations and not available in SQLite (the test dialect). Median is computed in JavaScript after fetching sorted salaries per group — a clean, portable solution.

---

### Subtask 6 — Seed Script (10,000 Employees)

**What:** A high-performance, idempotent script that populates the database with realistic data for development and demo use.

**Why sixth:** Models and associations must be stable before writing a seeder that depends on them. Analytics endpoints are also done, so seeded data can be verified end-to-end.

**Deliverables:**
- `server/seeders/seed.js` — reads `first_names.txt` / `last_names.txt`, generates 10,000 employees with weighted country distribution (India 25%, USA 25%, UK 10%, …), realistic salary ranges per seniority, chunked `bulkCreate(500)` for performance
- Idempotency check: exits early if `Employee.count() >= 10000`
- Seeds one default HR Manager user: `admin@company.com` / `Admin@123456`
- `server/tests/seed.test.js` — 6 tests: field completeness, salary > 0, hireDate range, email uniqueness, country distribution tolerance

**Performance target:** Full 10,000-row insert completes in under 30 seconds via chunked bulk insert with `validate: false`.

---

### Subtask 7 — Frontend: Auth UI, Redux Store & Client Services

**What:** The complete client-side auth layer — Axios service abstraction, Redux actions/reducers/sagas for auth, Login/Signup pages, protected routing.

**Why seventh:** The backend is fully built. Now the frontend can be built against a stable API contract. Starting auth UI first ensures every subsequent UI component can assume the auth state is available.

**Deliverables:**
- `client/src/services/apiClient.js` — Axios instance with `withCredentials: true`, 401 interceptor fires `auth:unauthorized` custom event
- `client/src/services/authService.js`, `employeeService.js`, `analyticsService.js` — typed API functions
- `client/src/redux/actions/authActions.js`, `reducers/authReducer.js`, `sagas/authSaga.js`
- `client/src/pages/LoginPage.jsx`, `SignupPage.jsx` — Ant Design Form, validation, error Alert, loading state
- `client/src/routes/ProtectedRoute.jsx` — dispatches `AUTH_FETCH_ME_REQUEST` on mount; shows `Spin` while loading; redirects unauthenticated users
- `client/src/tests/authSaga.test.js` — saga tests using mock service + redux-saga `runSaga`

**Key decision — service layer separate from sagas:** Sagas call service functions, not Axios directly. This means tests can mock the service module without touching Axios, and services can be swapped independently.

---

### Subtask 8 — Employee Management UI

**What:** The full employee management interface — paginated table with search/filter, add/edit modal, delete confirmation.

**Why eighth:** Auth UI must be in place first so the employee page can live behind a ProtectedRoute. The employee API contract from Subtask 4 drives the Redux state shape.

**Deliverables:**
- `client/src/redux/actions/employeeActions.js`, `reducers/employeeReducer.js`, `sagas/employeeSaga.js`
- `client/src/pages/EmployeesPage.jsx` — Ant Design Table, server-side pagination, debounced search (400ms), country/department/status filters
- `client/src/components/EmployeeFormModal.jsx` — shared Add/Edit modal with all 14 form fields, Ant Design validation
- `client/src/components/StatusTag.jsx` — colour-coded status Tag
- `client/src/utils/formatters.js` — `formatSalary` (Intl.NumberFormat with currency), `formatDate` (local date parse to avoid UTC off-by-one)
- `client/src/tests/employeeReducer.test.js` — reducer state transitions
- `client/src/tests/employeeSaga.test.js` — async saga flow tests

---

### Subtask 9 — Salary Insights Dashboard UI

**What:** The analytics dashboard — stats row, salary-by-country table, job-title breakdown, distribution chart, top-earners table, department payroll summary.

**Why ninth:** Depends on the analytics API (Subtask 5), the Redux employee patterns established in Subtask 8, and the shared AppLayout component. All prerequisites are stable.

**Deliverables:**
- `client/src/redux/actions/analyticsActions.js`, `reducers/analyticsReducer.js`, `sagas/analyticsSaga.js`
- `client/src/pages/DashboardPage.jsx` — five data panels, country selector that triggers job-title load
- `client/src/components/AppLayout.jsx` — Ant Design Layout with collapsible Sider, nav links to Employees and Dashboard, logout button
- `client/src/tests/analyticsReducer.test.js` — success/failure state transitions for all five data groups

---

### Subtask 10 — Security Hardening, Comprehensive Tests & README

**What:** The final polish pass — additional edge-case tests, security audit and fixes, complete README.

**Why last:** Security hardening and extra tests are most effective after all features exist, because the full attack surface is known only then.

**Deliverables:**

#### Additional Server Tests
- `server/tests/middleware.test.js` — 7 tests for `isAuthenticated` (no cookie, expired JWT, valid JWT) and `isAuthorized` (wrong role, correct role, multi-role)
- Extended `server/tests/employee.test.js` — 4 new tests: case-insensitive search, ASC salary sort, invalid `sortBy` defaults gracefully, `limit=500` capped at 100
- Extended `server/tests/analytics.test.js` — 4 new tests: even/odd median, active-only department summary, undefined department for inactive-only group

#### Additional Frontend Tests
- `client/src/tests/LoginPage.test.jsx` — 5 tests: component renders, error Alert visible on auth failure
- `client/src/tests/formatters.test.js` — 9 tests: USD/GBP formatting, null/undefined guards, timezone-safe date parsing
- `client/src/tests/EmployeeFormModal.test.jsx` — 6 tests: modal renders, validation messages, edit mode pre-fill

#### Security Hardening
- `express.json({ limit: '10kb' })` — prevents large payload DoS
- `sortBy` whitelist in `ALLOWED_SORT_FIELDS` Set — prevents ORDER BY injection
- `escapeLike()` helper escapes `%`, `_`, `\` in search strings — prevents LIKE wildcard abuse
- Auth rate limiter: 10 req/15min on login and signup routes only
- Both rate limiters skip in `NODE_ENV=test` to avoid test flakiness
- `server/src/__mocks__/axios.js` factory mock — prevents `import.meta.env` evaluation during Jest tests

#### README
- Prerequisites, Docker MySQL setup, seed instructions, all npm scripts, API endpoint table, architecture decision bullets

**Final test count:** 128 tests passing — 59 server (models, auth, employee, analytics, seed, middleware) and 69 client (auth saga/reducer, employee saga/reducer, analytics reducer, formatters, LoginPage, EmployeeFormModal).

---

## 6. Completion Summary

| Subtask | Focus Area | Tests Added | Cumulative Tests |
|---|---|---|---|
| 1 | Scaffolding & environment | 0 | 0 |
| 2 | Sequelize models | 3 | 3 |
| 3 | JWT auth API | 8 | 11 |
| 4 | Employee CRUD API | 12 | 23 |
| 5 | Analytics API | 7 | 30 |
| 6 | Seed script | 6 | 36 |
| 7 | Frontend auth (Redux + pages) | 16 | 52 |
| 8 | Employee management UI | 19 | 71 |
| 9 | Analytics dashboard UI | 14 | 85 |
| 10 | Hardening + edge-case tests + README | 43 | 128 |

---

## 7. Risks Identified and Mitigated

| Risk | Mitigation Applied |
|---|---|
| MySQL not available in CI / test environments | Sequelize dialect switch to SQLite `:memory:` when `NODE_ENV=test` |
| XSS token theft | JWT stored in httpOnly cookie — inaccessible to JavaScript |
| SQL injection via `sortBy` parameter | `ALLOWED_SORT_FIELDS` Set whitelist; any unlisted value defaults to `createdAt` |
| LIKE wildcard abuse in search | `escapeLike()` escapes `%`, `_`, `\` before interpolation into LIKE clause |
| Large payload DoS | `express.json({ limit: '10kb' })` rejects oversized bodies |
| Brute-force login attacks | Dedicated auth rate limiter: 10 requests per 15 minutes per IP |
| Seed script failing halfway | Idempotency check at start; chunked inserts isolate failures to individual chunks |
| `import.meta.env` crashing Jest | Manual `__mocks__/axios.js` factory prevents apiClient.js from being evaluated in test environment |
| Ant Design `matchMedia` / `ResizeObserver` missing in jsdom | Global polyfills in `client/src/setupTests.js` via `setupFilesAfterEnv` |
| Test flakiness from rate limiters | Both limiters configured with `skip: () => process.env.NODE_ENV === 'test'` |
