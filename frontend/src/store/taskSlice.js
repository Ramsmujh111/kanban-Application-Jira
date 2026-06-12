import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../api/task.api';

// ─── Async Thunks ────────────────────────────────────────────

export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (projectId, { rejectWithValue }) => {
    try {
      const { data } = await taskApi.getAll(projectId);
      return data.data.tasks;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    selectedTask: null,
    loading: false,
    error: null,
    onlineUsers: [],
  },
  reducers: {
    // Real-time socket actions (called from useSocket hook)
    addTask: (state, action) => {
      state.tasks.push(action.payload);
    },
    updateTaskInStore: (state, action) => {
      const updated = action.payload;
      state.tasks = state.tasks.map((t) =>
        t._id === updated._id ? updated : t
      );
      if (state.selectedTask?._id === updated._id) {
        state.selectedTask = updated;
      }
    },
    moveTaskInStore: (state, action) => {
      const moved = action.payload;
      state.tasks = state.tasks.map((t) =>
        t._id === moved._id ? moved : t
      );
    },
    removeTaskFromStore: (state, action) => {
      const taskId = action.payload;
      state.tasks = state.tasks.filter((t) => t._id !== taskId);
      if (state.selectedTask?._id === taskId) {
        state.selectedTask = null;
      }
    },
    addCommentToStore: (state, action) => {
      const { taskId, comment } = action.payload;
      state.tasks = state.tasks.map((t) =>
        t._id === taskId
          ? { ...t, comments: [...(t.comments || []), comment] }
          : t
      );
      if (state.selectedTask?._id === taskId) {
        state.selectedTask = {
          ...state.selectedTask,
          comments: [...(state.selectedTask.comments || []), comment],
        };
      }
    },

    // Optimistic drag-and-drop update
    setTasks: (state, action) => {
      state.tasks = action.payload;
    },

    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    clearTasks: (state) => {
      state.tasks = [];
      state.selectedTask = null;
      state.onlineUsers = [];
    },
    clearTaskError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addTask,
  updateTaskInStore,
  moveTaskInStore,
  removeTaskFromStore,
  addCommentToStore,
  setTasks,
  setSelectedTask,
  setOnlineUsers,
  clearTasks,
  clearTaskError,
} = taskSlice.actions;

export default taskSlice.reducer;
