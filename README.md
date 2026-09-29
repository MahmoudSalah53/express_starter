# Express Starter

A small Express.js API starter in TypeScript. It is ready to run in production, and it stays small on purpose.

The `User` routes are a sample resource. They show how a request moves through the project. They are not an authentication system.

## Stack

| Piece | Role |
| --- | --- |
| Express.js | HTTP server and routing |
| TypeScript | Typed source, compiled to `dist/` |
| PostgreSQL | Database |
| Prisma | Schema, migrations, and database queries |
| dotenv | Loads `.env` into `process.env` |
| Zod | Checks environment variables and request input |
| Helmet | Sets secure HTTP headers |
| CORS | Allows a configured browser origin |
| Pino | Structured logs. Pretty-printed in development |

Authentication, rate limiting, Swagger, tests, and Docker are left out until you need them.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file and set your Postgres URL:

```bash
cp .env.example .env
```

3. Create the database, then apply the migration:

```bash
npx prisma migrate dev
```

4. Start the API:

```bash
npm run dev
```

The server listens on `http://localhost:3000`.

Check that it is up:

```bash
curl http://localhost:3000/api/health
```

Create a user (Postgres must be running):

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"ada@example.com\",\"name\":\"Ada\"}"
```

Production:

```bash
npm run build
npm start
```

Apply migrations in production with `npx prisma migrate deploy`.

## How a request moves

```text
HTTP request
  → Helmet, CORS, JSON parser, request logger
  → Route
  → Validation middleware
  → Controller
  → Service
  → Prisma
  → JSON response

Any thrown error
  → error middleware
  → JSON error response
```

## Project layout

```text
src/
  server.ts                 starts the process and shuts it down cleanly
  app.ts                    builds the Express app
  config/
    env.ts                  loads and checks environment variables
    logger.ts               application logger
    database.ts             shared Prisma client
  routes/                   maps URLs to controllers
  controllers/              reads the request and sends the response
  services/                 business logic and database calls
  validators/               Zod schemas for request input
  middlewares/              validation, 404s, and errors
  utils/
    AppError.ts             expected errors, such as "not found"
    asyncHandler.ts         sends async failures to the error middleware
prisma/
  schema.prisma             database models
  migrations/               SQL applied to PostgreSQL
```

### `src/server.ts`

Starts listening and disconnects Prisma on `SIGINT` or `SIGTERM`. The HTTP app itself lives in `app.ts`, so the server process stays separate from route setup.

### `src/app.ts`

Registers global middleware in this order:

1. **Helmet** sets headers such as `X-Content-Type-Options` so browsers handle responses more safely.
2. **CORS** allows the origin in `CORS_ORIGIN`.
3. **JSON body parser** reads `Content-Type: application/json`, limited to 1 MB.
4. **Pino HTTP** writes one log line per request.

Routes are mounted at `/api`. Unknown paths fall through to the 404 middleware, then the error middleware.

### `src/config/env.ts`

Loads `.env` with dotenv and checks the values with Zod before the app starts. A missing `DATABASE_URL` stops the process immediately instead of failing on the first query.

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `production`, or `test` |
| `PORT` | Port the server listens on |
| `DATABASE_URL` | PostgreSQL connection string for Prisma |
| `CORS_ORIGIN` | Browser origin allowed to call the API |
| `LOG_LEVEL` | Pino level: `fatal` through `trace` |

### `src/config/logger.ts`

Creates one Pino logger. Development logs are colorized with `pino-pretty`. Production logs are JSON, which is easier to collect. Authorization and cookie headers are redacted.

### `src/config/database.ts`

Creates one `PrismaClient` and reuses it. In development, `tsx watch` reloads the process, so the client is stored on `globalThis` to avoid opening a new connection pool on every reload.

### Routes

Routes only declare the URL, the validation schema, and the controller. `src/routes/index.ts` mounts each router under `/api`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Process is running. Does not query the database |
| `GET` | `/api/users` | List users |
| `GET` | `/api/users/:id` | Get one user |
| `POST` | `/api/users` | Create a user |

### Controllers

Controllers take the HTTP request and return JSON. They do not talk to Prisma directly. A successful response looks like:

```json
{ "status": "success", "data": {} }
```

### Services

Services hold the work: queries, checks, and expected failures. `userService.getById` throws `AppError` with status `404` when the id does not exist. A duplicate email is left for Prisma and mapped to `409` in the error middleware.

### Validation

`validate({ body, query, params })` runs a Zod schema and replaces the matching request field with the parsed value. Invalid input throws `ZodError`.

Example body for `POST /api/users`:

```json
{ "email": "ada@example.com", "name": "Ada" }
```

A bad body returns `400`:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": { "email": ["Invalid email"] }
}
```

### Error handling

Express 4 does not catch a rejected promise from an `async` route. `asyncHandler` forwards that rejection to the error middleware.

`AppError` is for failures you expect, such as a missing user. Anything else is treated as an unexpected `500`. The client receives `Internal server error`. The real error is logged. In development, the JSON body also includes `stack`.

| Case | Status |
| --- | --- |
| Invalid JSON body | `400` |
| Zod validation error | `400` |
| Body larger than 1 MB | `413` |
| `AppError` | the status you set, usually `404` |
| Prisma unique constraint (`P2002`) | `409` |
| Unknown route | `404` |
| Anything else | `500` |

## Add a resource

1. Add a model to `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name add_thing`.
3. Add a Zod schema in `src/validators`.
4. Add a service in `src/services`.
5. Add a controller in `src/controllers`.
6. Add a router in `src/routes` and mount it in `src/routes/index.ts`.

Throw `new AppError("Message", 404)` from a service when the caller should see that message and status.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Generate the Prisma client and restart on file changes |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled app |
| `npm run typecheck` | Type-check without writing files |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create and apply a development migration |
