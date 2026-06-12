import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../api/project.api';

// ─── Async Thunks ────────────────────────────────────────────

export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await projectApi.getAll();
      return data.data.projects;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
    }
  }
);

export const fetchProject = createAsyncThunk(
  'projects/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await projectApi.getOne(id);
      return data.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/create',
  async (projectData, { rejectWithValue }) => {
    try {
      const { data } = await projectApi.create(projectData);
      return data.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await projectApi.update(id, updates);
      return data.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id, { rejectWithValue }) => {
    try {
      await projectApi.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete project');
    }
  }
);

export const addMember = createAsyncThunk(
  'projects/addMember',
  async ({ projectId, memberData }, { rejectWithValue }) => {
    try {
      const { data } = await projectApi.addMember(projectId, memberData);
      return data.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add member');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    clearProjectError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch single project
    builder
      .addCase(fetchProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create project
    builder
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
      });

    // Update project
    builder
      .addCase(updateProject.fulfilled, (state, action) => {
        const updated = action.payload;
        state.projects = state.projects.map((p) =>
          p._id === updated._id ? updated : p
        );
        if (state.currentProject?._id === updated._id) {
          state.currentProject = updated;
        }
      });

    // Delete project
    builder
      .addCase(deleteProject.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.projects = state.projects.filter((p) => p._id !== deletedId);
        if (state.currentProject?._id === deletedId) {
          state.currentProject = null;
        }
      });

    // Add member
    builder
      .addCase(addMember.fulfilled, (state, action) => {
        const updated = action.payload;
        if (state.currentProject?._id === updated._id) {
          state.currentProject = updated;
        }
      });
  },
});

export const { setCurrentProject, clearProjectError } = projectSlice.actions;
export default projectSlice.reducer;
