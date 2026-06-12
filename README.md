# TaskFlow — Internal Project Management System

Hey! This is TaskFlow, an internal project management tool we built for our team. Think of it like a lightweight Trello/Jira with real-time collaboration baked in. If User A drags a task from "Todo" to "In Progress", User B sees it move instantly without refreshing the page. That's the whole point of this project.

---

## What does it do?

- Kanban board with drag-and-drop (Todo → In Progress → Review → Done)
- Real-time sync — changes from one user show up instantly for everyone else in the project
- JWT-based auth with access + refresh tokens
- Team collaboration — invite members by searching their name/email
- Task management — priority levels, due dates, labels, comments
- Live presence — see who's currently online in your project

---

## Architecture Overview

Here's how the pieces fit together at a high level:

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  React (Vite) + Redux Toolkit + Socket.IO Client         │
│                                                         │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────────┐ │
│  │  Pages   │  │   Redux    │  │  Socket.IO Client    │ │
│  │ (Board,  │→ │  Store     │← │  (real-time events)  │ │
│  │Dashboard)│  │ (slices)   │  │                      │ │
│  └──────────┘  └─────┬──────┘  └──────────┬───────────┘ │
│                      │ Axios               │ WebSocket   │
└──────────────────────┼─────────────────────┼─────────────┘
                       │ HTTP (REST)         │ ws://
┌──────────────────────┼─────────────────────┼─────────────┐
│                      ▼                     ▼  BACKEND    │
│            ┌──────────────────┐  ┌────────────────────┐  │
│            │  Express REST    │  │  Socket.IO Server   │  │
│            │  API (routes,    │  │  (project rooms,    │  │
│            │  controllers,    │  │   task handlers,    │  │
│            │  validation)     │  │   presence)         │  │
│            └────────┬─────────┘  └────────┬───────────┘  │
│                     │                     │              │
│            ┌────────▼─────────────────────▼───────────┐  │
│            │         Service Layer                     │  │
│            │  (auth, project, task, activity)          │  │
│            └────────┬─────────────────────────────────┘  │
│                     │                                    │
│         ┌───────────┼──────────────┐                     │
│         ▼                          ▼                     │
│  ┌─────────────┐          ┌──────────────┐               │
│  │  MongoDB    │          │  Redis       │               │
│  │  (data)     │          │  (pub/sub    │               │
│  │             │          │   adapter)   │               │
│  └─────────────┘          └──────────────┘               │
└──────────────────────────────────────────────────────────┘
```

**The real-time flow works like this:**

1. User A drags a task from "Todo" to "In Progress"
2. Frontend optimistically updates the board (instant feedback)
3. Socket.IO client emits `task:move` event to the server
4. Server validates, saves to MongoDB, logs the activity
5. Server broadcasts `task:moved` to all users in that project room
6. User B's frontend receives the event → Redux store dispatches action → React re-renders the board

If you run multiple server instances, Redis acts as a pub/sub bridge between them so events reach all connected clients regardless of which server they're connected to. Without Redis, everything still works fine — you just can't horizontally scale the WebSocket layer.

---

## Design Decisions & Trade-offs

### Why Redux Toolkit?
We went with Redux Toolkit for state management. It's the industry standard and gives us:
- `createAsyncThunk` for clean async API calls with loading/error states built in
- `createSlice` to reduce boilerplate — no manual action types or switch statements
- Redux DevTools for time-travel debugging (super useful during development)
- Predictable state flow — actions go through reducers, easy to trace what happened
- Socket events dispatch actions directly, keeping real-time updates in the same flow as API calls

The trade-off is a slightly bigger bundle than something like Zustand, but the debugging tools and structured patterns are worth it for a collaborative app where state gets complex fast.

### Why Socket.IO instead of raw WebSockets?
Socket.IO handles reconnection, fallback to polling, and room-based broadcasting out of the box. We'd have had to build all of that ourselves with raw WebSockets. The downside is a slightly bigger client bundle, but the DX improvement is worth it.

### Why @hello-pangea/dnd?
It's the maintained fork of react-beautiful-dnd (which Atlassian stopped maintaining). Gives us accessible drag-and-drop with nice animations. The catch is it doesn't play nice with React 18's StrictMode — we had to remove StrictMode to make it work. Not ideal, but it's a known issue in the ecosystem.

### JWT: Access + Refresh Token Strategy
Access tokens expire in 15 minutes, refresh tokens in 7 days. The Axios interceptor automatically refreshes the access token on 401 responses. This way users stay logged in without us storing long-lived tokens. Trade-off: slightly more complex auth flow, but much better security than a single long-lived token.

### Optimistic Updates for Drag-and-Drop
When you drag a task, we dispatch a `setTasks` action to Redux immediately (before the server confirms). This makes the UI feel snappy. If the server rejects the move, we dispatch `fetchTasks` to correct the state. The risk is a brief inconsistency if the server fails, but it's worth it for the UX.

### Redis is Optional
The app works perfectly without Redis. Redis is only needed if you want to scale to multiple server instances — it bridges Socket.IO events across instances via pub/sub. For local dev or a single production server, you don't need it at all. We catch Redis connection failures gracefully and fall back to in-memory mode.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19 (Vite) | Fast dev server, modern JSX |
| State | Redux Toolkit | createAsyncThunk, DevTools, predictable |
| Drag & Drop | @hello-pangea/dnd | Accessible, smooth animations |
| HTTP Client | Axios | Interceptors for JWT refresh |
| Styling | Vanilla CSS | Full control, dark theme |
| Backend | Node.js + Express | Simple, well-documented |
| Database | MongoDB + Mongoose | Flexible schema for tasks |
| Auth | JWT (jsonwebtoken) | Stateless, scalable |
| Validation | Joi | Declarative schema validation |
| WebSockets | Socket.IO | Rooms, reconnection, fallbacks |
| Scaling | Redis (ioredis) | Pub/sub for multi-instance |
| Logging | Winston | Structured, leveled logs |

---

## API Endpoints

All endpoints return JSON. Protected routes require `Authorization: Bearer <token>` header.

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create a new account. Body: `{ name, email, password }` |
| POST | `/api/auth/login` | No | Login. Body: `{ email, password }`. Returns access + refresh tokens |
| POST | `/api/auth/refresh` | No | Refresh access token. Body: `{ refreshToken }` |
| GET | `/api/auth/me` | Yes | Get current user profile |

### Projects (`/api/projects`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/projects` | Yes | Create project. Body: `{ name, description }` |
| GET | `/api/projects` | Yes | List all projects you're a member of |
| GET | `/api/projects/:id` | Yes | Get single project with members & columns |
| PUT | `/api/projects/:id` | Yes | Update project. Body: `{ name, description }` |
| DELETE | `/api/projects/:id` | Yes | Delete project (owner only) |
| POST | `/api/projects/:id/members` | Yes | Add member. Body: `{ email, role }` |
| DELETE | `/api/projects/:id/members/:userId` | Yes | Remove a member (owner only) |
| GET | `/api/projects/:id/activity` | Yes | Get activity log for a project |

### Tasks (`/api`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/projects/:projectId/tasks` | Yes | Create task. Body: `{ title, column, priority, ... }` |
| GET | `/api/projects/:projectId/tasks` | Yes | List all tasks in a project |
| GET | `/api/tasks/:id` | Yes | Get single task with comments |
| PUT | `/api/tasks/:id` | Yes | Update task fields |
| PUT | `/api/tasks/:id/move` | Yes | Move task to different column. Body: `{ toColumn, order }` |
| DELETE | `/api/tasks/:id` | Yes | Delete a task |
| POST | `/api/tasks/:id/comments` | Yes | Add comment. Body: `{ text }` |

### Users (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/search?q=...` | Yes | Search users by name/email (for member autocomplete) |

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Server health check |

---

## Socket Events

Socket.IO connects on the same port as the backend (default 5000). Authentication is done via the `auth.token` field in the handshake.

### Client → Server (Emit)

| Event | Payload | What it does |
|-------|---------|-------------|
| `project:join` | `{ projectId }` | Join a project room to receive real-time updates |
| `project:leave` | `{ projectId }` | Leave the project room |
| `task:create` | `{ projectId, title, column, priority, ... }` | Create a new task |
| `task:update` | `{ taskId, changes }` | Update task fields (title, description, priority, etc.) |
| `task:move` | `{ taskId, toColumn, order }` | Move task between columns (drag-and-drop) |
| `task:delete` | `{ taskId, projectId }` | Delete a task |
| `comment:add` | `{ taskId, text }` | Add a comment to a task |

### Server → Client (On)

| Event | Payload | When it fires |
|-------|---------|--------------|
| `task:created` | `{ task }` | Someone created a task in your project |
| `task:updated` | `{ task }` | Someone updated a task |
| `task:moved` | `{ task, fromColumn, toColumn }` | Someone moved a task between columns |
| `task:deleted` | `{ taskId }` | Someone deleted a task |
| `comment:added` | `{ taskId, comment }` | Someone added a comment |
| `presence:update` | `{ users }` | User joined/left — updated online users list |
| `member:joined` | `{ user }` | A team member came online |
| `member:left` | `{ userId }` | A team member went offline |
| `error` | `{ message }` | Something went wrong with a socket operation |

---

## Project Structure

```
ProjectTaskManagment/
├── backend/
│   ├── server.js                  # Entry point — HTTP + Socket.IO
│   ├── src/
│   │   ├── app.js                 # Express app (middleware, routes)
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB connection
│   │   │   ├── redis.js           # Redis connection (optional)
│   │   │   └── env.js             # Environment variables
│   │   ├── models/
│   │   │   ├── User.js            # User schema (bcrypt hashing)
│   │   │   ├── Project.js         # Project with members & columns
│   │   │   ├── Task.js            # Task with comments
│   │   │   └── Activity.js        # Activity audit log
│   │   ├── services/              # Business logic layer
│   │   ├── controllers/           # HTTP request handlers
│   │   ├── routes/                # Express route definitions
│   │   ├── middleware/            # Auth, validation, error handling
│   │   ├── sockets/
│   │   │   ├── index.js           # Socket.IO setup + Redis adapter
│   │   │   ├── auth.js            # Socket authentication middleware
│   │   │   └── handlers/          # Event handlers (project, task)
│   │   └── utils/                 # ApiError, Winston logger
│   └── .env
│
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx                # Routes, auth guards
│   │   ├── main.jsx               # React entry point
│   │   ├── api/                   # Axios instance + API modules
│   │   ├── store/                 # Redux Toolkit slices + store config
│   │   ├── socket/                # Socket.IO client singleton
│   │   ├── hooks/                 # useSocket hook
│   │   ├── components/
│   │   │   ├── board/             # Board, Column, TaskCard, TaskDetailModal
│   │   │   ├── layout/            # Sidebar, Header, Layout
│   │   │   ├── auth/              # LoginForm, RegisterForm
│   │   │   ├── project/           # CreateProjectModal, AddMemberModal
│   │   │   ├── common/            # Avatar, Badge, Modal, Spinner
│   │   │   └── presence/          # OnlineUsers
│   │   ├── pages/                 # LoginPage, DashboardPage, ProjectBoardPage
│   │   ├── styles/                # CSS design system (dark theme)
│   │   └── utils/                 # Constants, helpers
│   └── .env
│
└── README.md                      # You're reading it
```

---

## Local Setup

### Prerequisites

You need these installed on your machine:

- **Node.js** v18+ (we're using v24, anything 18+ works)
- **MongoDB** — either running locally on `mongodb://localhost:27017` or a MongoDB Atlas URI
- **Redis** — optional! The app works without it. Only needed for multi-instance scaling.

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ProjectTaskManagment

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure environment

Copy the example env file and edit it:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/project_management
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Frontend `.env` (optional, defaults are fine for local dev):

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Start MongoDB

If you're using local MongoDB:

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Windows
net start MongoDB

# Or just run mongod directly
mongod --dbpath /data/db
```

### 4. Run the app

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Server starts on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# App opens on http://localhost:5173
```

### 5. Try it out

1. Open http://localhost:5173
2. Register an account
3. Create a project
4. Open a second browser (incognito), register another account
5. Add the second user as a member
6. Both users open the same project — drag tasks around and watch them sync in real-time!

---

## Deployment Steps

### Option 1: Traditional VPS (DigitalOcean, AWS EC2, etc.)

**Backend:**

```bash
# SSH into your server
ssh user@your-server-ip

# Clone the repo
git clone <repo-url>
cd ProjectTaskManagment/backend

# Install production dependencies
npm install --production

# Set up environment
cp .env.example .env
nano .env
# Set NODE_ENV=production
# Set your MongoDB Atlas URI
# Set proper JWT secrets (use strong random strings!)
# Set CLIENT_URL to your frontend domain

# Run with PM2 (process manager)
npm install -g pm2
pm2 start server.js --name taskflow-api
pm2 save
pm2 startup
```

**Frontend:**

```bash
cd ProjectTaskManagment/frontend

# Set production env
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env
echo "VITE_SOCKET_URL=https://api.yourdomain.com" >> .env

# Build for production
npm run build

# The 'dist' folder is your static build.
# Serve it with Nginx, Caddy, or any static file server.
```

**Nginx config example:**

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/taskflow/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend API + WebSocket
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 2: Docker (if you prefer containers)

You'd want to create Dockerfiles for both backend and frontend and a docker-compose.yml that also spins up MongoDB and Redis. We haven't included those yet, but the basic idea:

- Backend Dockerfile: Node 18 Alpine, copy code, `npm ci --production`, expose 5000
- Frontend Dockerfile: Node 18 to build, then Nginx Alpine to serve the dist
- docker-compose: backend + frontend + mongo + redis

### Option 3: Cloud platforms

- **Backend** → Railway, Render, Fly.io (any Node.js host, make sure WebSocket support is enabled)
- **Frontend** → Vercel, Netlify, Cloudflare Pages (static hosting for the Vite build)
- **MongoDB** → MongoDB Atlas (free tier works fine for small teams)
- **Redis** → Upstash, Redis Cloud (free tier available, but remember Redis is optional)

---

## URLs

### Local Development

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| WebSocket | ws://localhost:5000 (Socket.IO) |
| Health Check | http://localhost:5000/api/health |

### Production (example)

| Service | URL |
|---------|-----|
| Frontend | https://taskflow.yourdomain.com |
| Backend API | https://api.taskflow.yourdomain.com/api |
| WebSocket | wss://api.taskflow.yourdomain.com |
| MongoDB | mongodb+srv://... (Atlas) |
| Redis | redis://... (Upstash/Redis Cloud, optional) |

---

## Data Models (quick reference)

**User**: `{ name, email, password (hashed), avatar, role (admin/manager/member) }`

**Project**: `{ name, description, owner, members[{user, role}], columns[{id, title, order}] }`
- New projects get 4 default columns: Todo, In Progress, Review, Done
- Owner is auto-added to members list

**Task**: `{ title, description, project, column, order, assignee, priority, labels[], dueDate, comments[{user, text}] }`

**Activity**: `{ project, user, action, entity, entityId, details, timestamp }`

---

## Permissions

| Action | Owner | Editor | Viewer |
|--------|-------|--------|--------|
| Create/edit/delete project | ✅ | ❌ | ❌ |
| Add/remove members | ✅ | ❌ | ❌ |
| Create/edit/move/delete tasks | ✅ | ✅ | ❌ |
| Add comments | ✅ | ✅ | ❌ |
| View project & tasks | ✅ | ✅ | ✅ |

---

## Known Limitations

- No email verification on registration (anyone with a valid email format can register)
- No file attachments on tasks yet
- No notification system (push/email) — only real-time socket events
- No password reset flow
- Search uses regex which isn't ideal for large datasets (would switch to MongoDB Atlas Search or Elasticsearch)

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

For bugs, open an issue with steps to reproduce.

---

Built with ☕ and late nights.
