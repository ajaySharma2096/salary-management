# Technology Trade-Off Analysis

This document explains the reasoning behind the major technology choices in the Salary Management Application and the alternatives that were evaluated.

---

## 1. React vs Next.js (Frontend Framework)

### Decision: React + Vite (SPA)

---

### What We Need

The application is an **internal HR dashboard** — a tool used by authenticated employees to manage and analyse salary data. It is not a public-facing marketing site. With that framing, the evaluation criteria are:

| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| Developer velocity | High | Small team, incremental delivery |
| Client interactivity | High | Rich filtering, live tables, form flows |
| SEO | **None** | Gated behind login; crawlers never reach it |
| Server-side rendering | Low | No benefit for a fully authenticated app |
| Build complexity | Low | Simpler pipeline is lower operational risk |
| Bundle / hosting cost | Low | Single CDN-hostable static bundle |

---

### Option A — React + Vite (SPA) ✅ Chosen

#### What it is
React is a declarative UI library. Vite is a next-generation build tool that uses native ES modules for sub-second hot-module replacement. The SPA is built into a static bundle (`client/dist/`) that can be served from a CDN or nginx.

#### Why it fits
- **All routes are authenticated.** There is no public page that benefits from server-rendered HTML. SEO is irrelevant.
- **Rich interactivity is the primary concern.** Client-side state (debounced search, pagination, real-time filters, modals) is managed entirely in the browser with Redux. React's reconciliation is well suited to frequent, localised re-renders.
- **Vite's developer experience is exceptional.** HMR takes < 100 ms, cold starts are measured in milliseconds, and there is no server process to restart after every code change.
- **Deployment is simple.** The output is a static folder — deployable to S3, Cloudflare Pages, GitHub Pages, or any nginx `root`.
- **Redux + Redux-Saga decouples side effects cleanly.** The saga pattern makes async API calls, error handling, and side-effect sequencing explicit and independently testable without mounting components.
- **Ant Design 5 integrates natively.** Ant Design is a React component library. No adapter layer or compatibility shim is needed.

#### Costs accepted
- **No SSR/ISR.** If the product ever needed a public, search-engine-indexed page (e.g., a public salary benchmarking tool), this choice would need revisiting.
- **Initial bundle load.** The SPA ships its JavaScript upfront. Mitigated by Vite's automatic code-splitting and React's lazy loading — routes are loaded on demand.
- **Client-side routing requires server fallback.** The nginx / Caddy config must serve `index.html` for all non-asset paths (standard SPA setup).

---

### Option B — Next.js (App Router or Pages Router)

#### What it offers
Next.js provides file-based routing, React Server Components (RSC), Server-Side Rendering (SSR), Incremental Static Regeneration (ISR), API routes, and automatic image optimisation.

#### Why it was not chosen

| Concern | Detail |
|---------|--------|
| **SSR is wasted** | Every page is behind an authentication wall. The server renders HTML that the browser immediately discards in favour of the hydrated React tree. There is no first-contentful-paint benefit for authenticated users that already have the app cached. |
| **API routes duplicate the backend** | The application has a dedicated Express API. Next.js API routes would create a parallel server layer, fragmenting business logic and complicating deployment. |
| **RSC + Redux is an active tension** | React Server Components cannot use client-side state (hooks, Context, Redux). Mixing RSC and client components in a heavily stateful dashboard creates an architectural seam that requires constant discipline to manage. |
| **Deployment is more complex** | Next.js requires a Node.js server (or a platform like Vercel). A static export is possible but loses SSR, ISR, and image optimisation — collapsing it to a feature-equivalent SPA with more overhead. |
| **Overkill for the use case** | The primary Next.js value propositions (SEO, TTFB, ISR) provide zero benefit for a private, fully-authenticated internal tool. |

#### When Next.js would be the right choice
- A public salary benchmarking or career page that requires SEO.
- A marketing site that shares UI components with the internal dashboard.
- A team already running Vercel with strong opinions on file-based routing.

---

### Summary

| Dimension | React + Vite | Next.js |
|-----------|-------------|---------|
| SEO | Not needed | ✓ SSR/ISR |
| Dev experience | ✓ Instant HMR | Good, slower |
| Deployment | ✓ Static CDN | Node server required |
| Redux + Sagas | ✓ Native fit | Friction with RSC |
| API layer | Separate Express | Duplicate or shared |
| Auth dashboard fit | ✓ Ideal | Overkill |

**Verdict:** React + Vite is the right tool for an authenticated internal dashboard. Next.js would add complexity with no measurable user-facing benefit.

---

## 2. Node.js vs Alternative Runtimes

### Decision: Node.js 18 (LTS)

---

### Why Node.js

#### JavaScript end-to-end
The frontend is React (JavaScript/JSX). Using Node.js on the server means one language, one toolchain, one mental model. Developers can move between client and server code without a context switch. Shared validation logic (e.g., field constraints) can be extracted to a common module without a build step.

#### Non-blocking I/O for a read-heavy API
The application is predominantly read-heavy: the employee list, analytics queries, and dashboard data all involve database reads. Node.js's event-loop architecture handles concurrent I/O efficiently without the thread-per-request overhead of a synchronous server (e.g., Java Servlet / Spring without WebFlux, PHP-FPM). For a dataset of 10 000 employees, the bottleneck is always the SQL query, not CPU — Node.js does not penalise for this.

#### Ecosystem maturity
`express`, `sequelize`, `jsonwebtoken`, `bcryptjs`, `helmet`, `express-rate-limit`, `express-validator`, `supertest` — all battle-tested packages with active maintenance, extensive documentation, and predictable update cadences.

#### Operational simplicity
A single `node index.js` process. No JVM warm-up, no GC tuning, no application server (Tomcat/Jetty). Docker image size is small. `nodemon` provides fast restarts in development.

#### Alternatives considered

| Runtime / Framework | Reason not chosen |
|--------------------|-------------------|
| **Python / FastAPI** | Strong ecosystem, but adds a second language. Team is JS-first; cross-language context switching slows delivery. |
| **Go / Gin** | Excellent performance, but compiled language requires a different mental model. No ORM as mature as Sequelize. Overkill for the load profile. |
| **Java / Spring Boot** | Enterprise-grade, but heavyweight for a prototype. Verbose, slower iteration, larger Docker images. |
| **Deno** | Interesting ESM-native runtime, but ecosystem is smaller and Sequelize does not have first-class Deno support. |

---

## 3. MySQL vs Alternative Databases

### Decision: MySQL 8

---

### Data characteristics

Employee salary data is **highly relational and structured**:

- Fixed, well-known schema: `firstName`, `lastName`, `salary`, `department`, `country`, `status`, etc.
- Analytical queries (aggregation, grouping, ordering) are central to the product.
- ACID compliance is required — a partial write of employee data must never be committed.
- The dataset is bounded (~10 000–100 000 rows), not petabyte-scale.

These characteristics map cleanly to a **relational database with strong SQL support**.

#### Why MySQL 8 specifically

| Feature | Relevance |
|---------|-----------|
| **Window functions** | Median salary calculation uses `ROW_NUMBER()` over ordered partitions |
| **CTEs** | Analytics queries use Common Table Expressions for readability |
| **JSON support** | Available if schema evolves to semi-structured data |
| **Wide hosting support** | Every major cloud provider (RDS, Cloud SQL, PlanetScale, Aiven) offers MySQL 8 managed clusters |
| **UTF-8 full support** | `utf8mb4` handles all Unicode characters, including emoji, in names and notes |
| **Docker image** | `mysql:8` is official, well-maintained, single command to spin up |

#### Alternatives considered

| Database | Reason not chosen |
|----------|-------------------|
| **PostgreSQL** | Equally capable — would also have been a valid choice. MySQL was selected for familiarity and hosting ubiquity in the assessment context. For production at scale, Postgres's superior full-text search, JSONB, and range types would tip the balance. |
| **MongoDB** | Salary data has a fixed, relational schema with complex aggregations. A document database adds no value and removes JOIN capabilities, strong typing, and foreign-key enforcement. Analytics queries (group by dept, median per country) are complex and inefficient without SQL. |
| **SQLite** | Used in test environments only (in-memory, zero configuration). Not suitable for production: no concurrent write support, no network access. |
| **Redis** | Appropriate as a cache layer, not as a primary data store for this workload. Could be added later to cache analytics results (e.g., dept summary with a 5-minute TTL). |

---

## 4. Sequelize vs Alternative ORMs / Query Builders

### Decision: Sequelize 6

---

### Why an ORM

Raw SQL in JavaScript string templates is error-prone (SQL injection via string concatenation, no type safety, no schema awareness). An ORM or query builder provides:

- Parameterised queries by default (injection prevention)
- Schema-as-code (model definitions serve as documentation)
- Dialect abstraction (MySQL in production, SQLite in tests — zero code change)
- Lifecycle hooks (bcrypt password hashing on `beforeCreate`/`beforeUpdate`)

### Why Sequelize specifically

| Feature | Value |
|---------|-------|
| **Dialect switching** | `new Sequelize({ dialect: 'sqlite', storage: ':memory:' })` in test, `new Sequelize({ dialect: 'mysql' })` in production — identical model definitions, identical queries |
| **Virtual fields** | `fullName` computed from `firstName + lastName` without storing a redundant column |
| **Hooks** | `beforeCreate` / `beforeUpdate` for bcrypt hashing — the model owns its invariants |
| **findAndCountAll** | Single query returns both the page data and total count for pagination |
| **Mature ecosystem** | Sequelize has been production-stable for over a decade. Documentation is extensive. |

#### Alternatives considered

| Library | Reason not chosen |
|---------|-------------------|
| **Knex.js** | Excellent query builder, but no model layer, no hooks, no virtual fields. More boilerplate for standard CRUD. |
| **Prisma** | Modern, type-safe, excellent DX. However, Prisma uses its own migration engine and does not support SQLite-in-memory as seamlessly as Sequelize for in-process testing. Also, Prisma's generated client is TypeScript-first — using it in a JS-only project loses most of its value. |
| **TypeORM** | TypeScript-first; decorators are the primary API. Awkward in plain JavaScript. |
| **Drizzle ORM** | Newer, type-safe, lightweight. Ecosystem is still maturing; fewer examples for complex analytics queries. |
| **Raw SQL (mysql2)** | Maximum control and performance, but sacrifices the dialect-switching that makes SQLite-in-memory testing possible with zero code changes. |

### Accepted trade-offs with Sequelize

- **Performance ceiling:** For extremely complex analytical queries (e.g., salary percentile calculations across millions of rows), Sequelize's generated SQL may not be optimal. The median calculation already bypasses the ORM and uses a raw SQL CTE via `sequelize.query()`.
- **Migration management:** Sequelize's built-in migrations (`sequelize-cli`) are used for schema evolution. `sync({ alter: true })` is used in development only — never in production.
- **N+1 risk:** Eager loading (`include`) must be used deliberately. The current models have no associations, so this risk is low.
