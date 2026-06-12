import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import projectReducer from './projectSlice';
import taskReducer from './taskSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    tasks: taskReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in these paths (dates, etc.)
        ignoredPaths: ['tasks.tasks', 'tasks.selectedTask', 'projects.currentProject'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export default store;
