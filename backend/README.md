# TaskFlow — Backend

This is the backend for TaskFlow. It handles authentication, project/task management, and real-time collaboration via Socket.IO.

---

## Quick Start

```bash
npm install
cp .env.example .env   # edit with your MongoDB URI, secrets, etc.
npm run dev             # starts on http://localhost:5000
```

You need MongoDB running. Redis is optional (only needed for scaling to multiple instances).

---

## How it's organized

```
src/
├── config/          # db.js, redis.js, env.js — connection setup
├── models/          # Mongoose schemas (User, Project, Task, Activity)
├── services/        # Business logic — this is where the actual work happens
├── controllers/     # HTTP request handlers — thin layer over services
├── routes/          # Express route definitions
├── middleware/      # auth (JWT verify), errorHandler, validate (Joi)
├── sockets/
│   ├── index.js     # Socket.IO server setup, Redis adapter
│   ├── auth.js      # Socket authentication (JWT from handshake)
│   └── handlers/    # project.handler.js, task.handler.js
├── utils/           # ApiError class, Winston logger
└── app.js           # Express app (middleware stack, route mounting)

server.js            # Entry point — creates HTTP server, connects DB, starts Socket.IO
```

The pattern is: **Route → Controller → Service → Model**. Controllers handle HTTP stuff (parsing body, sending responses), services contain the actual logic, models define the data structure.

Socket handlers follow a similar pattern but skip controllers — they go directly to services.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 5000 | Server port |
| `NODE_ENV` | No | development | Environment |
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `REDIS_URL` | No | redis://localhost:6379 | Redis URL (optional) |
| `JWT_SECRET` | Yes | — | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | — | Secret for signing refresh tokens |
| `JWT_EXPIRES_IN` | No | 15m | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | No | 7d | Refresh token expiry |
| `CLIENT_URL` | No | http://localhost:5173 | Frontend URL (for CORS) |

---

## API Endpoints

### Auth — `/api/auth`

```
POST   /register          — Create account { name, email, password }
POST   /login             — Login { email, password } → returns tokens
POST   /refresh           — Refresh access token { refreshToken }
GET    /me                — Get current user (requires auth)
```

### Projects — `/api/projects`

All routes require authentication.

```
POST   /                  — Create project { name, description }
GET    /                  — List your projects
GET    /:id               — Get project details
PUT    /:id               — Update project
DELETE /:id               — Delete project (owner only)
POST   /:id/members       — Add member { email, role }
DELETE /:id/members/:uid  — Remove member (owner only)
GET    /:id/activity      — Get activity log
```

### Tasks — `/api`

All routes require authentication.

```
POST   /projects/:pid/tasks  — Create task in project
GET    /projects/:pid/tasks  — List tasks in project
GET    /tasks/:id            — Get task details
PUT    /tasks/:id            — Update task
PUT    /tasks/:id/move       — Move task { toColumn, order }
DELETE /tasks/:id            — Delete task
POST   /tasks/:id/comments   — Add comment { text }
```

### Users — `/api/users`

```
GET    /search?q=...      — Search registered users by name/email
```

---

## Socket Events

Connection uses JWT from `socket.handshake.auth.token`.

**Client emits:**
- `project:join` / `project:leave` — join/leave a project room
- `task:create`, `task:update`, `task:move`, `task:delete` — task operations
- `comment:add` — add a comment

**Server emits:**
- `task:created`, `task:updated`, `task:moved`, `task:deleted` — broadcasted to the project room
- `comment:added` — new comment notification
- `presence:update` — who's online
- `member:joined` / `member:left` — user came/went
- `error` — something failed

---

## Scripts

```bash
npm run dev    # Start with nodemon (auto-restart on file changes)
npm start      # Production start (no auto-restart)
npm test       # Run tests (Jest, not implemented yet)
```

---

## Error Handling

All errors go through a global error handler middleware. Custom errors use the `ApiError` class:

```js
throw ApiError.badRequest('Email already in use');   // 400
throw ApiError.unauthorized('Invalid token');         // 401
throw ApiError.forbidden('Only the owner can do that'); // 403
throw ApiError.notFound('Project not found');          // 404
```

API responses always follow this shape:
```json
{
  "success": true/false,
  "data": { ... },
  "message": "error message (only on failure)"
}
```

---

## Notes

- Passwords are hashed with bcrypt (12 salt rounds)
- JWT tokens use separate secrets for access vs. refresh
- MongoDB indexes are set up on frequently queried fields (project+column+order, assignee, member lookup)
- The Redis adapter is wrapped in a try-catch — if Redis isn't available, Socket.IO runs in single-instance mode and everything still works
- Winston logs go to console in dev, you could add file transports for production
