# Performance & Security Considerations

This document covers the performance optimisations and security controls applied in the Salary Management Application, the rationale behind each, and known limitations with suggested mitigations.

---

## Performance Considerations

### 1. Server-Side Pagination

**What it does**

The `GET /api/employees` endpoint never returns the full employee table. All filtering, sorting, and pagination is performed in the database using SQL `LIMIT` / `OFFSET` / `WHERE`:

```js
const { rows: data, count } = await Employee.findAndCountAll({
  where,
  order: [[sortBy, sortOrder]],
  limit,
  offset: (page - 1) * limit,
});
```

**Why it matters**

With 10 000+ employees, returning the full result set on every request would:
- Consume 10–100× more database I/O per request
- Transfer megabytes of JSON per response
- Force the browser to render thousands of DOM nodes

By paginating server-side, each list response returns at most 100 rows and a total count. The client uses this to render the correct page controls without ever holding the full dataset in memory.

**Limit cap**

`limit` is capped at 100 server-side regardless of the client's request:

```js
if (limit > 100) limit = 100;
```

This prevents a single request from accidentally (or maliciously) loading the entire table.

---

### 2. Database Indexes

Columns that appear in `WHERE` clauses or `ORDER BY` expressions are indexed:

```js
// Employee model
indexes: [
  { fields: ['country'] },
  { fields: ['department'] },
  { fields: ['status'] },
  { fields: ['salary'] },
],
```

**Impact**

Without indexes, a `WHERE country = 'USA'` on 10 000 rows requires a full table scan (O(n)). With a B-tree index, MySQL locates matching rows in O(log n). For analytics queries that group and aggregate by country or department, composite or covering indexes reduce sort and scan cost significantly.

**Known gap:** The `createdAt` column (default sort) is not explicitly indexed because MySQL automatically indexes the primary key. If `createdAt` queries become a bottleneck, an explicit index should be added.

---

### 3. Debounced Search (Frontend)

The employee search field in `EmployeesPage.jsx` waits 400 ms after the user stops typing before dispatching the API call:

```js
useEffect(() => {
  const timer = setTimeout(() => {
    dispatch(setFilters({ search: searchValue }));
    dispatch(fetchEmployeesRequest({ ...filters, search: searchValue, page: 1 }));
  }, 400);
  return () => clearTimeout(timer);
}, [searchValue]);
```

**Why it matters**

Without debouncing, typing "Alice Smith" fires 11 API requests ("A", "Al", "Ali", …). With a 400 ms debounce, only one request fires — after the user pauses. This reduces unnecessary server load and avoids race conditions where slow responses from early keystrokes overwrite results from later ones.

---

### 4. LIKE Wildcard Escaping

Search terms are sanitised before use in SQL `LIKE` patterns:

```js
function escapeLike(str) {
  return str.replace(/[%_\\]/g, '\\$&');
}

const escaped = escapeLike(search);
where[Op.or] = [
  { firstName: { [Op.like]: `%${escaped}%` } },
  ...
];
```

**Why it matters**

Without escaping, a user searching for `100%` would match every record (because `%` is the SQL wildcard). Escaping converts it to `100\%`, which matches the literal string "100%". This also prevents the accidental performance impact of a wildcard-heavy search term causing a full table scan instead of an index seek.

---

### 5. Chunked Bulk Seeding

The seed script inserts 10 000 employees in chunks of 500 rather than a single `bulkCreate` of 10 000 rows:

```js
const CHUNK_SIZE = 500;
for (let i = 0; i < employees.length; i += CHUNK_SIZE) {
  await Employee.bulkCreate(employees.slice(i, i + CHUNK_SIZE));
}
```

**Why it matters**

A single `INSERT` with 10 000 rows exceeds MySQL's default `max_allowed_packet` and can cause OOM pressure in the Node.js process when constructing the value string. Chunking keeps both memory usage and SQL statement size bounded.

---

### 6. Median Calculated in JavaScript (Analytics)

The salary median is not computed using MySQL's `PERCENTILE_CONT` (unavailable in MySQL 8.0 without stored procedures) but is instead calculated in JavaScript after fetching sorted salary values:

```js
function calculateMedian(sortedValues) {
  const mid = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 === 0
    ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
    : sortedValues[mid];
}
```

**Trade-off**

Fetching all salary values for a country into Node.js memory is acceptable at the current dataset size (< 10 000 rows, < 100 per country). At hundreds of thousands of rows, this approach would become a memory and latency bottleneck. The correct long-term solution is a window function–based approach or a pre-computed analytics table updated on a schedule.

---

### 7. Request Body Size Limit

Incoming JSON bodies are capped at 10 KB:

```js
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
```

This prevents large-body denial-of-service attacks where an attacker sends a multi-megabyte payload to exhaust server memory during JSON parsing.

---

## Security Considerations

### 1. Authentication — JWT in httpOnly Cookie

Covered in depth in [ADR-001](./ADR.md). Summary:

- Token is stored in an `httpOnly`, `SameSite=strict` cookie — unreachable by JavaScript.
- `jwt.verify()` is called on every protected request; expired tokens are rejected and the cookie is cleared.
- Auth endpoints are rate-limited separately (10 req / 15 min per IP) to slow brute-force attacks.

**Known gap:** No token revocation mechanism. A compromised token remains valid until `JWT_EXPIRES_IN` elapses. Mitigate by keeping `JWT_EXPIRES_IN` short (e.g., 1–8 h) and implementing a refresh-token flow for production.

---

### 2. Password Hashing

User passwords are hashed with `bcryptjs` at a cost factor of 10 before storage:

```js
User.addHook('beforeCreate', async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});
```

**Why bcrypt**

- bcrypt is intentionally slow (work factor is tunable). This makes offline dictionary attacks expensive.
- The salt is embedded in the hash, so identical passwords produce different hash values.
- Cost factor 10 produces a hash in ~100 ms on modern hardware — imperceptible to users, but 10× slower than factor 7 for an attacker.

**Production recommendation:** Increase cost factor to 12 as hardware improves, or migrate to Argon2id (winner of the Password Hashing Competition) using the `argon2` npm package.

---

### 3. SQL Injection Prevention

Sequelize uses parameterised queries for all ORM operations. User-supplied values are never interpolated into SQL strings. For raw queries (used in analytics), Sequelize's `replacements` or `bind` API is used:

```js
await sequelize.query(
  `SELECT country, salary FROM employees WHERE country = :country`,
  { replacements: { country: req.query.country }, type: QueryTypes.SELECT }
);
```

Additionally, the `sortBy` column name (which cannot be parameterised in a `ORDER BY` clause) is validated against a whitelist:

```js
const ALLOWED_SORT_FIELDS = new Set([
  'id', 'firstName', 'lastName', 'email', 'jobTitle',
  'department', 'country', 'salary', 'hireDate',
  'createdAt', 'updatedAt', 'status',
]);
if (!ALLOWED_SORT_FIELDS.has(sortBy)) sortBy = 'createdAt';
```

This whitelist prevents an attacker from injecting arbitrary SQL via the `sortBy` query parameter.

---

### 4. Input Validation

All request bodies pass through `express-validator` rule arrays before reaching controllers:

```
POST /signup  → authValidators.signup   (email format, password strength, name length)
POST /login   → authValidators.login    (email format, password required)
POST /employees → employeeValidators    (salary > 0, valid enum values, optional email format)
```

Invalid requests are rejected at the middleware layer with `422 Unprocessable Entity` before any database operation occurs. This is the primary system boundary where untrusted data is normalised and rejected.

---

### 5. Security Headers (Helmet)

`helmet` is applied to every response:

```js
app.use(helmet({ contentSecurityPolicy: false }));
```

Headers applied include:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking protection |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing prevention |
| `Strict-Transport-Security` | `max-age=15552000` | Forces HTTPS in browser |
| `X-DNS-Prefetch-Control` | `off` | Limits information leakage |
| `Referrer-Policy` | `no-referrer` | Prevents referrer leakage |
| `X-Permitted-Cross-Domain-Policies` | `none` | Blocks Flash/PDF cross-domain |

`contentSecurityPolicy` is disabled because the API serves JSON, not HTML. CSP should be configured on the CDN / nginx layer that serves the React SPA.

---

### 6. CORS Configuration

CORS is scoped to a single allowed origin:

```js
cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
})
```

`credentials: true` is required for the browser to send the httpOnly cookie on cross-origin requests. By explicitly whitelisting a single origin, responses will not carry `Access-Control-Allow-Origin: *`, which would prevent credentials from being sent anyway (browsers block `*` with `credentials: true`).

**Production requirement:** `CLIENT_URL` must be set to the exact production SPA URL (e.g., `https://salary.company.com`). Multiple origins require an explicit origin validation function rather than a static string.

---

### 7. Rate Limiting

Two rate limiters are applied via `express-rate-limit`:

| Limiter | Scope | Limit | Purpose |
|---------|-------|-------|---------|
| `limiter` | All routes | 100 req / 15 min / IP | General DoS mitigation |
| `authLimiter` | `/api/auth/login`, `/api/auth/signup` | 10 req / 15 min / IP | Brute-force / credential stuffing mitigation |

Both limiters return `standardHeaders: true` (RFC 6585 `RateLimit-*` headers) and are skipped in `NODE_ENV=test` to avoid breaking test suites.

**Known gap:** `express-rate-limit`'s default store is in-memory. In a multi-process or horizontally scaled deployment, each process has its own counter — a client could exceed the limit by routing through different processes. Mitigate by using the `rate-limit-redis` store backed by a shared Redis instance.

---

### 8. Role-Based Access Control

Sensitive operations are protected by the `isAuthorized` middleware (see ADR-002). The current role enum is `{ admin, hr_manager }`. All current destructive operations (DELETE) require at least `hr_manager`.

**Current role assignments:**

| Operation | Required role |
|-----------|--------------|
| List / view employees | Any authenticated user |
| Create / update employees | Any authenticated user |
| Delete employees | `admin` or `hr_manager` |
| View analytics | Any authenticated user |

**Recommendation for production:** Apply the principle of least privilege more strictly. Read-only analyst roles should not have create/update access. Consider adding an `analyst` role that can only access GET endpoints and analytics.

---

### 9. Dependency Security

**Recommendations:**

- Run `npm audit` in CI on every pull request. Treat high-severity findings as blocking.
- Pin exact dependency versions in production (`package-lock.json` is committed).
- Enable Dependabot or Renovate Bot for automated dependency update PRs.
- Remove `devDependencies` from production Docker images using a multi-stage build (`npm ci --omit=dev`).

---

### 10. Environment Variable Hygiene

- `.env` files are listed in `.gitignore` and must never be committed.
- `.env.example` is committed with placeholder values only.
- In production, secrets (`JWT_SECRET`, `DB_PASSWORD`) must be injected via the platform's secrets manager (AWS Secrets Manager, Vault, GitHub Actions secrets, etc.) — not via `.env` files on disk.
- `JWT_SECRET` must be a cryptographically random string. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

---

## Summary Matrix

| Control | Category | Implemented | Gap / Future Work |
|---------|----------|-------------|-------------------|
| httpOnly JWT cookie | Auth | ✓ | Add refresh-token rotation |
| bcrypt password hashing | Auth | ✓ | Consider Argon2id |
| JWT expiry + server-side rejection | Auth | ✓ | Add revocation list for forced logout |
| express-validator input validation | Input | ✓ | — |
| Sequelize parameterised queries | SQLi | ✓ | — |
| sortBy whitelist | SQLi | ✓ | — |
| LIKE wildcard escaping | SQLi | ✓ | — |
| Helmet security headers | HTTP | ✓ | Add CSP at nginx/CDN layer |
| CORS origin whitelist | HTTP | ✓ | Multi-origin validation for staging |
| Global rate limiter | DoS | ✓ | Redis store for multi-process |
| Auth endpoint rate limiter | Brute force | ✓ | Redis store for multi-process |
| Request body size limit (10 KB) | DoS | ✓ | — |
| Role-based access control | Authz | ✓ | Add read-only analyst role |
| npm audit in CI | Supply chain | Recommended | Automate with Dependabot |
| Secrets via secrets manager | Config | Recommended | Configure per deployment platform |
| Server-side pagination (limit 100) | Perf | ✓ | — |
| Database indexes on filter cols | Perf | ✓ | Index createdAt if sort bottleneck |
| Debounced search (400 ms) | Perf | ✓ | — |
| Chunked bulk insert | Perf | ✓ | — |
| JS median calculation | Perf | ✓ (acceptable scale) | Move to SQL window fn at large scale |
