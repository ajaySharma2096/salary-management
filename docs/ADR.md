# Architecture Decision Records

---

## ADR-001 — Use JWT Stored in httpOnly Cookies for Session Management

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2025 |
| **Deciders** | Engineering team |
| **Domain** | Authentication & Session Management |

---

### Context

The application is a multi-user HR platform where authenticated employees (HR managers and admins) perform sensitive CRUD operations on salary data. A session mechanism is required that:

- Persists across page refreshes without re-login
- Is resistant to common web-based attacks (XSS, CSRF)
- Does not require server-side session storage
- Works cleanly with a SPA frontend and a separate API backend

Three session strategies were considered:

| Option | Description |
|--------|-------------|
| **A — JWT in localStorage** | Token stored in browser localStorage, sent as `Authorization: Bearer` header |
| **B — JWT in httpOnly cookie** | Token stored in a server-set httpOnly, SameSite cookie |
| **C — Server-side sessions** | Session ID in cookie, session data in Redis / DB |

---

### Decision

**Option B — JWT in httpOnly cookie** was selected.

The JWT is signed with `HS256` and set by the Express server via `res.cookie()` with the following attributes:

```js
res.cookie('token', token, {
  httpOnly: true,     // inaccessible to JavaScript
  sameSite: 'strict', // blocks cross-site request forgery
  secure: process.env.NODE_ENV === 'production', // HTTPS-only in prod
  maxAge: /* JWT_EXPIRES_IN converted to ms */,
});
```

The client never reads or stores the token — the browser sends it automatically on every same-origin request because `axios` is configured with `withCredentials: true`.

---

### Consequences

#### Positive

**XSS resistance**
: The `httpOnly` flag prevents any JavaScript — including injected malicious scripts — from reading the token via `document.cookie`. This eliminates the most common JWT theft vector that affects `localStorage`-based schemes.

**CSRF resistance**
: `sameSite: 'strict'` instructs the browser not to send the cookie with cross-site navigations or form submissions, neutralising classic CSRF attacks without the need for CSRF tokens.

**Stateless scalability**
: The server holds no session state. Any horizontally scaled API instance can verify the JWT using only the shared `JWT_SECRET`, requiring no shared cache or sticky sessions.

**Simple client code**
: The frontend does not manage token storage, expiry tracking, or header injection. Axios sends the cookie automatically; the saga just calls the service and interprets the response.

**Automatic expiry**
: Both the JWT `exp` claim and the cookie `maxAge` are set from `JWT_EXPIRES_IN`. When the token expires the server returns `401`, the client dispatches `auth:unauthorized`, and the user is redirected to the login page.

#### Negative / Trade-offs

**Token revocation is hard**
: JWTs are stateless — once issued, they are valid until expiry. There is no built-in mechanism to invalidate a specific token before its `exp` (e.g., on forced logout from all devices, or after a password change). Mitigation options include short-lived tokens, a server-side revocation list (undermines statelessness), or refresh-token rotation.

**Cookie size limit**
: Cookies have a 4 KB size limit per domain. The signed JWT payload must remain small (currently: `{ userId, email, role, iat, exp }`). Adding many claims could exceed this limit.

**Cross-domain complexity**
: If the API and SPA are ever hosted on different top-level domains, `sameSite: 'strict'` would prevent the cookie from being sent. This would require `sameSite: 'none'` + `secure: true`, shifting the CSRF mitigation burden to explicit tokens.

**No built-in refresh**
: The current implementation uses a single long-lived token (configurable via `JWT_EXPIRES_IN`). A full production system should implement a short-lived access token + long-lived httpOnly refresh token pattern to bound the blast radius of a compromised token.

---

### Alternatives Considered

#### Option A — JWT in localStorage

| | Detail |
|-|--------|
| **Rejected because** | `localStorage` is readable by any JavaScript on the page. A single XSS vulnerability allows an attacker to exfiltrate the token and impersonate the user from any origin. For an application dealing with salary data, this risk is unacceptable. |

#### Option C — Server-side sessions (Redis)

| | Detail |
|-|--------|
| **Rejected because** | Requires additional infrastructure (Redis or a DB session table), adds operational complexity, and introduces a single point of failure. For this application's scale and team size, the added complexity does not justify the benefits over a well-implemented JWT scheme. |

---

### Compliance & Security Notes

- `JWT_SECRET` must be a cryptographically random string of at least 32 bytes. It must never be committed to version control.
- The signing algorithm is `HS256`. If key rotation is required in future, migrate to `RS256` with a public/private key pair so that verification can be decoupled from signing.
- The `exp` claim is verified on every request by `jsonwebtoken`'s `jwt.verify()`. An expired token causes the `token` cookie to be cleared server-side and the client to receive a `401`.
- Auth endpoints (`/api/auth/login`, `/api/auth/signup`) are protected by a dedicated rate limiter (10 requests / 15 minutes per IP) to mitigate brute-force attacks.

---

## ADR-002 — Use Role-Based Access Control with a Middleware Factory

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2025 |
| **Deciders** | Engineering team |
| **Domain** | Authorisation |

### Context

After authentication, the system needs to restrict certain operations (e.g., employee deletion) to specific roles.

### Decision

A composable `isAuthorized(...roles)` middleware factory is used:

```js
// isAuthorized.js
function isAuthorized(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}
```

Routes declare their requirements declaratively:

```js
router.delete('/:id', isAuthenticated, isAuthorized('admin', 'hr_manager'), deleteEmployee);
```

### Consequences

**Positive:** Zero duplication, easy to extend with new roles. Role requirements are visible at the route definition level.  
**Negative:** Coarse-grained — access is role-level, not resource-level (no per-record ownership check). Acceptable for this use case where all authenticated HR staff manage the same employee pool.
