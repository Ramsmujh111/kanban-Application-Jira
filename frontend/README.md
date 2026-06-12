# TaskFlow — Frontend

React app for TaskFlow. Built with Vite, styled with vanilla CSS (dark theme), and uses Redux Toolkit for state management.

---

## Quick Start

```bash
npm install
npm run dev    # opens on http://localhost:5173
```

Make sure the backend is running on port 5000 (or update `.env`).

---

## How it's organized

```
src/
├── api/                 # Axios instance + API modules
│   ├── axios.js         # Configured Axios with JWT interceptor & auto-refresh
│   ├── auth.api.js      # Register, login, refresh, getMe
│   ├── project.api.js   # CRUD projects, members, activity
│   ├── task.api.js       # CRUD tasks, move, comments
│   └── user.api.js      # User search (for member autocomplete)
│
├── store/               # Redux Toolkit
│   ├── index.js        # configureStore — combines all reducers
│   ├── authSlice.js    # Auth state, login/register/initialize async thunks
│   ├── projectSlice.js # Projects CRUD, addMember — all via createAsyncThunk
│   └── taskSlice.js    # Tasks fetch thunk + reducers for socket events
│
├── socket/
│   └── socket.js        # Socket.IO client singleton (connect/disconnect)
│
├── hooks/
│   └── useSocket.js     # Hook that wires socket events → Redux dispatch
│
├── components/
│   ├── board/           # The Kanban board
│   │   ├── Board.jsx    # DragDropContext wrapper, optimistic drag handling
│   │   ├── Column.jsx   # Droppable column with inline "add task" form
│   │   ├── TaskCard.jsx # Draggable card (labels, priority, due date, avatar)
│   │   └── TaskDetailModal.jsx # Full task editor with comments
│   ├── layout/
│   │   ├── Layout.jsx   # Main layout with sidebar + content area
│   │   ├── Sidebar.jsx  # Project list, navigation, user info
│   │   └── Header.jsx   # Top bar with title, online users, actions
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   └── RegisterForm.jsx
│   ├── project/
│   │   ├── CreateProjectModal.jsx
│   │   └── AddMemberModal.jsx  # Debounced search autocomplete
│   ├── common/          # Reusable bits
│   │   ├── Avatar.jsx   # User initial with deterministic color
│   │   ├── Badge.jsx
│   │   ├── Modal.jsx    # Generic modal with overlay, ESC handling
│   │   └── Spinner.jsx
│   └── presence/
│       └── OnlineUsers.jsx  # Avatar stack with green dot indicators
│
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx      # Project grid, greeting, empty state
│   ├── ProjectBoardPage.jsx   # The main board page — ties everything together
│   └── NotFoundPage.jsx
│
├── styles/              # All CSS lives here
│   ├── index.css        # Design system — colors, tokens, base styles, buttons
│   ├── auth.css         # Login/register page styles
│   ├── layout.css       # Sidebar, header, main content area
│   ├── board.css        # Kanban columns, task cards, drag states, comments
│   └── components.css   # Avatar, badge, modal, spinner, project cards, search
│
├── utils/
│   └── constants.js     # Colors, date formatters, avatar helpers
│
├── App.jsx              # Router setup, auth guards (ProtectedRoute/PublicRoute)
└── main.jsx             # React entry point
```

---

## How state flows

This is probably the most important thing to understand about the frontend:

```
User does something (e.g., drags a task)
       │
       ▼
Board.jsx handleDragEnd()
       │
       ├──→ Redux dispatch(setTasks(...)): update immediately (optimistic)
       │
       └──→ Socket.IO: emit('task:move', { taskId, toColumn, order })
                │
                ▼
         Server processes, saves to MongoDB
                │
                ▼
         Server broadcasts task:moved to all users in the room
                │
                ▼
         useSocket hook listens → dispatch(fetchTasks()) → store updates → React re-renders
```

The key insight is that the **current user** sees the change instantly (optimistic update), while **other users** see it when the server broadcasts the event back. This gives you snappy UX without sacrificing consistency.

---

## Real-time: how useSocket works

The `useSocket` hook (in `hooks/useSocket.js`) does these things:

1. Connects to the Socket.IO server with the JWT token
2. Joins the project room (`project:join`)
3. Listens for events (`task:created`, `task:moved`, etc.)
4. Dispatches the appropriate Redux action when an event arrives (e.g., `dispatch(addTask(task))`)
5. Cleans up listeners and leaves the room when the component unmounts

Each page that needs real-time features calls `useSocket(projectId)` and gets back emit functions:
```js
const { emitTaskCreate, emitTaskMove, emitTaskDelete, ... } = useSocket(projectId);
```

---

## Styling approach

We're using plain CSS files — no Tailwind, no CSS-in-JS. The design system is in `styles/index.css` with CSS custom properties:

- Dark theme with glassmorphism effects
- Custom color palette (purple/teal accent)
- Responsive layout (sidebar collapses on mobile)
- Micro-animations (fade-in, scale-in, stagger)
- Drag state styles (card rotation, glow shadow)

If you want to change the color scheme, most of it lives in the `:root` section of `index.css`.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API base URL |
| `VITE_SOCKET_URL` | `http://localhost:5000` | Socket.IO server URL |

For production, set these to your deployed backend URL.

---

## Scripts

```bash
npm run dev      # Vite dev server with HMR
npm run build    # Production build → outputs to dist/
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

---

## Things worth knowing

- **No React StrictMode** — We had to remove it because `@hello-pangea/dnd` breaks with React 18/19 StrictMode (it double-mounts components which confuses the drag sensors). This is a known issue across the DnD library ecosystem.

- **Axios interceptor** handles token refresh automatically. If any API call gets a 401, the interceptor tries to refresh the access token using the stored refresh token. If that fails too, the user gets logged out.

- **Debounced member search** — The AddMemberModal waits 300ms after the user stops typing before hitting the search API. This avoids hammering the server on every keystroke.

- **Optimistic drag-and-drop** — When you drag a task, the board dispatches `setTasks()` to Redux immediately. The socket event is sent in parallel. If something goes wrong server-side, the next `fetchTasks` thunk will correct the state.

- **Toast notifications** use `react-hot-toast`, configured in App.jsx with dark theme styling.
