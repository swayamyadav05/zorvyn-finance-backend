# Zorvyn Finance Backend

A RESTful backend API for finance data processing and role-based access control, built with Node.js, TypeScript, Express, and MongoDB.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Setup Instructions](#setup-instructions)
5. [Environment Variables](#environment-variables)
6. [API Documentation](#api-documentation)
7. [RBAC Matrix](#rbac-matrix)
8. [Seed Data](#seed-data)
9. [Testing](#testing)
10. [Assumptions & Tradeoffs](#assumptions--tradeoffs)
11. [Scalability Considerations](#scalability-considerations)

---

## Project Overview

Zorvyn Finance Backend is a secure, role-driven API that manages financial records and exposes analytical dashboard endpoints. It supports three user roles — `viewer`, `analyst`, and `admin` — each with clearly defined access boundaries. Admins manage users and records, analysts read and filter financial data, and viewers access high-level dashboard summaries only.

All endpoints are versioned under `/api/v1`. Interactive API documentation is available via Swagger UI at `/api/v1/docs`.

---

## Tech Stack

**Runtime:** Node.js 22+ with TypeScript

TypeScript catches type mismatches, incorrect function signatures, and missing null checks at compile time rather than at runtime in production. Paired with Zod for runtime validation, there is end-to-end type safety from the HTTP layer through to the database query.

**Framework:** Express

Express is lightweight and well-understood. Its middleware-based architecture maps cleanly to cross-cutting concerns like authentication, validation, and error handling — each implemented as a focused, reusable middleware rather than duplicated inside controllers.

**Database:** MongoDB with Mongoose

MongoDB's flexible document schema accommodates financial records with varying optional fields without requiring schema migrations. Its aggregation pipeline is used directly for all dashboard computations — category breakdowns, monthly trends, and net balance summaries are computed inside the database and returned as final values, avoiding unnecessary data transfer to Node.js.

**Auth:** JSON Web Tokens with bcrypt

Short-lived access tokens (15 minutes) limit the exposure window if a token is intercepted. Long-lived refresh tokens (7 days) are used to issue new access tokens without requiring the user to re-authenticate. Passwords are hashed with bcrypt at salt rounds of 10 before storage and are never returned in any API response.

**Validation:** Zod

Zod schemas define the exact shape of every incoming request body and query parameter. A single generic `validate` middleware runs these schemas before any controller executes, so invalid requests are rejected at the boundary with structured field-level error messages.

**API Docs:** Swagger (swagger-jsdoc + swagger-ui-express)

JSDoc `@swagger` annotations live directly above each route definition, so documentation stays co-located with the code it describes. The Swagger UI serves as a live, testable reference for all endpoints.

**Testing:** Vitest + Supertest + mongodb-memory-server

Integration tests fire real HTTP requests against the full Express application stack. `mongodb-memory-server` runs a real MongoDB process in memory for the duration of the test suite, meaning tests exercise actual query behaviour including aggregation pipelines and Mongoose hooks, without touching the development database.

---

## Architecture

```
src/
├── config/        # Environment validation, DB connection, constants
├── middleware/    # Auth, RBAC, validation, rate limiting, error handling
├── modules/       # Feature modules — each owns its model, service, controller, routes
│   ├── auth/
│   ├── user/
│   ├── record/
│   └── dashboard/
└── utils/         # ApiError, ApiResponse, asyncHandler, logger
```

The project follows a **modular layered architecture**. Each feature module contains four layers: the Mongoose model (data shape and hooks), the service (pure business logic with no HTTP awareness), the controller (thin HTTP adapter that calls the service), and the routes file (wires middleware and controller together).

This separation means the service layer is independently testable and reusable. If the transport layer changed from HTTP to gRPC or a message queue, only the controller would change — the service and model remain identical.

**Key design decisions:**

_Soft delete for financial records._ Instead of removing records from the database, a `DELETE` request sets `isDeleted: true`. Records are excluded from all queries via a Mongoose pre-find hook that automatically appends `{ isDeleted: false }` to every `find`, `findOne`, and `findOneAndUpdate` call. This preserves audit trails and prevents orphaned references.

_Password field excluded by default._ The `password` field on the User schema is defined with `select: false`, meaning it is never included in query results unless explicitly requested with `.select('+password')`. The login service is the only place in the codebase that ever requests this field.

_Aggregation pipelines over JS-level processing._ All dashboard computations happen inside MongoDB via `$group`, `$project`, and `$match` stages. This is more efficient than fetching all records into Node.js and running JavaScript `.reduce()` calls, and scales correctly as the dataset grows.

_Global error handler._ All route handlers are wrapped with `asyncHandler`, which catches any thrown error and forwards it to Express's error pipeline. A single `errorHandler` middleware handles all error types — `ApiError` for expected failures, Mongoose errors, JWT errors, and unhandled exceptions — ensuring every error response has the same JSON shape.

---

## Setup Instructions

**Live deployment:** The API is live at `https://zorvyn-finance-backend.up.railway.app`. The database is pre-seeded — you can test all endpoints immediately using the credentials in the [Seed Data](#seed-data) section without running anything locally.

**Local setup** (if you want to run it yourself):

**Prerequisites:** Node.js 22+, a MongoDB connection string (local or Atlas)

**1. Clone the repository**

```bash
git clone https://github.com/swayamyadav05/zorvyn-finance-backend.git
cd zorvyn-finance-backend
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env
```

Open `.env` and fill in your MongoDB URI and JWT secrets. See [Environment Variables](#environment-variables) for details.

**4. Seed the database**

```bash
npm run seed
```

This creates 4 users across all roles and 25 financial records spread across the last 6 months.

**5. Start the development server**

```bash
npm run dev
```

The server starts at `http://localhost:5000`. Swagger docs are at `http://localhost:5000/api/v1/docs`.

---

## Environment Variables

| Variable                 | Required | Description                                                                                      |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------------ |
| `NODE_ENV`               | No       | `development`, `production`, or `test`. Defaults to `development`.                               |
| `PORT`                   | No       | HTTP server port. Defaults to `5000`.                                                            |
| `MONGODB_URI`            | Yes      | Full MongoDB connection string including database name.                                          |
| `JWT_ACCESS_SECRET`      | Yes      | Secret for signing access tokens. Minimum 16 characters. Use `openssl rand -hex 32` to generate. |
| `JWT_REFRESH_SECRET`     | Yes      | Secret for signing refresh tokens. Should differ from the access secret.                         |
| `JWT_ACCESS_EXPIRES_IN`  | No       | Access token lifetime. Defaults to `15m`.                                                        |
| `JWT_REFRESH_EXPIRES_IN` | No       | Refresh token lifetime. Defaults to `7d`.                                                        |
| `CLIENT_ORIGIN`          | No       | Allowed CORS origin. Defaults to `http://localhost:3000`.                                        |

All variables are validated with Zod at startup. The server exits immediately with a descriptive error if any required variable is missing or malformed.

---

## API Documentation

Interactive Swagger UI (live): https://zorvyn-finance-backend.up.railway.app/api/v1/docs

The API is deployed and live. All endpoints can be tested interactively directly from the browser. Click the **Authorize** button in the Swagger UI and paste a Bearer token obtained from `POST /auth/login` using the seeded credentials below.

All endpoints are versioned under `/api/v1`. Protected endpoints require an `Authorization: Bearer <accessToken>` header.

**Auth** — public endpoints for registration, login, token refresh, and profile access.

| Method | Path                  | Auth     | Description                                 |
| ------ | --------------------- | -------- | ------------------------------------------- |
| POST   | `/auth/register`      | None     | Register a new user (always viewer role)    |
| POST   | `/auth/login`         | None     | Login and receive access + refresh tokens   |
| POST   | `/auth/refresh-token` | None     | Exchange refresh token for new access token |
| POST   | `/auth/logout`        | None     | Client-side token invalidation signal       |
| GET    | `/auth/me`            | Any role | Get current user profile                    |

**Users** — admin-only user management.

| Method | Path         | Auth  | Description                                            |
| ------ | ------------ | ----- | ------------------------------------------------------ |
| GET    | `/users`     | Admin | List all users with pagination and role/status filters |
| GET    | `/users/:id` | Admin | Get a single user by ID                                |
| POST   | `/users`     | Admin | Create a user with an explicit role                    |
| PATCH  | `/users/:id` | Admin | Update a user's role or status                         |
| DELETE | `/users/:id` | Admin | Deactivate a user (sets status to inactive)            |

**Records** — financial record management with filtering and pagination.

| Method | Path           | Auth           | Description                                                                                               |
| ------ | -------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| POST   | `/records`     | Admin          | Create a financial record                                                                                 |
| GET    | `/records`     | Analyst, Admin | List records with filters: `type`, `category`, `startDate`, `endDate`, `page`, `limit`, `sortBy`, `order` |
| GET    | `/records/:id` | Analyst, Admin | Get a single record                                                                                       |
| PATCH  | `/records/:id` | Admin          | Update a record                                                                                           |
| DELETE | `/records/:id` | Admin          | Soft delete a record                                                                                      |

**Dashboard** — aggregated analytics, accessible to all authenticated users.

| Method | Path                         | Description                                               |
| ------ | ---------------------------- | --------------------------------------------------------- |
| GET    | `/dashboard/summary`         | Total income, expenses, net balance, and record count     |
| GET    | `/dashboard/category-totals` | Income and expense breakdown by category, sorted by total |
| GET    | `/dashboard/recent`          | Last 10 transactions with creator details                 |
| GET    | `/dashboard/trends`          | Monthly income vs expense for the last 6 months           |

**Standard response format:**

```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Success with pagination
{ "success": true, "message": "...", "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }

// Error
{ "success": false, "message": "...", "errors": { "email": ["Invalid email"] } }
```

---

## RBAC Matrix

| Action                          | Viewer | Analyst | Admin |
| ------------------------------- | ------ | ------- | ----- |
| View own profile (`/auth/me`)   | ✓      | ✓       | ✓     |
| View dashboard summaries        | ✓      | ✓       | ✓     |
| View financial records          | ✗      | ✓       | ✓     |
| Filter and search records       | ✗      | ✓       | ✓     |
| Create financial records        | ✗      | ✗       | ✓     |
| Update financial records        | ✗      | ✗       | ✓     |
| Delete financial records        | ✗      | ✗       | ✓     |
| View all users                  | ✗      | ✗       | ✓     |
| Create users with explicit role | ✗      | ✗       | ✓     |
| Update user roles and status    | ✗      | ✗       | ✓     |
| Deactivate users                | ✗      | ✗       | ✓     |

Roles are enforced by the `authorize(...roles)` middleware factory, applied at the route level. The `authenticate` middleware always runs first to verify the JWT and attach the decoded user payload to `req.user`. Inactive users are blocked from logging in entirely — they receive a `403` before a token is ever issued.

---

## Seed Data

Run the seed script to populate the database with sample data:

```bash
npm run seed
```

The script is idempotent — it clears all existing users and records before inserting fresh data, so it is safe to run multiple times.

**Seeded users:**

| Role            | Email               | Password    |
| --------------- | ------------------- | ----------- |
| Admin           | admin@zorvyn.com    | admin123    |
| Analyst         | analyst@zorvyn.com  | analyst123  |
| Viewer          | viewer@zorvyn.com   | viewer123   |
| Inactive Viewer | inactive@zorvyn.com | inactive123 |

25 financial records are created spanning the last 6 months, with a mix of income categories (salary, freelance, investment) and expense categories (rent, food, utilities, entertainment, transport). This gives the dashboard endpoints meaningful aggregation data across multiple months and categories.

---

## Testing

The test suite uses Vitest for the test runner and Supertest for HTTP assertions. All tests are integration tests — they send real HTTP requests through the full Express stack and assert on the HTTP response. `mongodb-memory-server` provides a real MongoDB instance in memory so tests exercise actual query and aggregation behaviour without touching the development database.

**Run all tests:**

```bash
npm test
```

**Run with coverage:**

```bash
npm run test:coverage
```

**Test files:**

`auth.test.ts` covers registration (valid input, duplicate email, invalid data), login (correct credentials, wrong password, inactive account), and the protected `/me` endpoint.

`access-control.test.ts` verifies the full RBAC permission matrix — every role against every route category. This is the most security-critical test file.

`record.test.ts` covers the full record lifecycle: creation with valid and invalid data, list filtering by type and date range, pagination, and soft delete with verification that deleted records no longer appear in queries.

`dashboard.test.ts` verifies all four aggregation endpoints against a known seed of records, asserting that the computed totals, net balance, category breakdown ordering, and monthly trend structure are correct.

Tests run sequentially (not in parallel) and each file starts with a clean database, so no test can be affected by data from another test file.

---

## Assumptions & Tradeoffs

**Stateless JWT logout.** The `POST /auth/logout` endpoint signals intent but cannot server-side invalidate the access token because JWTs are stateless — the server issues them but does not track them. The client is responsible for discarding both tokens. A production system would maintain a Redis-backed token denylist keyed by JWT `jti` (JWT ID) with an expiry matching the token's remaining lifetime.

**Refresh token stored client-side.** Refresh tokens are returned in the response body rather than set as an `HttpOnly` cookie. Cookie-based storage would prevent JavaScript access and be more resilient to XSS, but requires CORS and `SameSite` configuration that is out of scope for a backend-only assignment.

**All records attributed to the authenticated admin.** The `createdBy` field is set from `req.user.userId` — the token payload — rather than accepted as a request body field. This prevents privilege escalation where an admin could falsely attribute a record to another user.

**Soft delete is permanent via the API.** There is no `restore` endpoint. Deleted records can only be recovered by directly updating `isDeleted` in the database. This is intentional — financial record restoration is a sensitive operation that would require a separate admin workflow and audit log in production.

**No email verification.** Registration immediately creates an active account. A production system would send a verification email and hold the account in a `pending` state until confirmed.

---

## Scalability Considerations

**Database indexing.** The User model indexes `email` (unique), `role`, and `status`. The Record model indexes `date`, `type`, `category`, `createdBy`, and a compound index on `{ isDeleted, date }` which is the most common query pattern. These indexes make the most frequent read paths efficient without over-indexing write paths.

**Pagination.** All list endpoints (`/users`, `/records`) use cursor-style `skip`/`limit` pagination with a configurable `limit` capped at 100. For very large datasets (millions of records), keyset pagination based on `_id` or `date` would be more efficient since `skip` still scans the skipped documents internally.

**Dashboard caching.** The four dashboard endpoints run MongoDB aggregation pipelines on every request. For a dataset of tens of thousands of records with high read traffic, these results are strong candidates for Redis caching with a short TTL (60–300 seconds). The data is not real-time — a brief staleness window is acceptable for an analytics dashboard.

**Rate limiting.** Auth endpoints are rate-limited to 10 requests per 15 minutes per IP to mitigate brute-force attacks. In a horizontally scaled deployment behind a load balancer, the in-memory rate limiter state would not be shared across instances. The solution is to move rate limiter state to Redis using `rate-limit-redis`, making the limit consistent regardless of which instance handles the request.

**Horizontal scaling.** The application is stateless — no session data, no in-memory state beyond the rate limiter. Every request is independently handled using only the JWT payload and the database. Adding more instances behind a load balancer requires only the Redis rate limiter fix above; everything else scales horizontally without changes.

**Microservice extraction.** As the system grows, the dashboard module is the most natural candidate for extraction into a separate service. It has no write operations, reads from a single collection, and its aggregation workload is independent of the transactional auth and record modules. Extracting it would allow independent scaling of analytical read traffic without affecting the write-path services.
