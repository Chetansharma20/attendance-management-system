import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import { authApi } from './api/authApi.js';
import { attendanceApi } from './api/attendanceApi.js';
import { overtimeApi } from './api/overtimeApi.js';
import { settingsApi } from './api/settingsApi.js';
import { leaveApi } from './api/leaveApi.js';

const logoutMiddleware = (store) => (next) => (action) => {
  if (action.type === 'auth/clearUser') {
    store.dispatch(authApi.util.resetApiState());
    store.dispatch(attendanceApi.util.resetApiState());
    store.dispatch(overtimeApi.util.resetApiState());
    store.dispatch(settingsApi.util.resetApiState());
    store.dispatch(leaveApi.util.resetApiState());
  }
  return next(action);
};

const store = configureStore({
  reducer: {
    // Global state slices
    auth: authReducer,

    // RTK Query API reducers
    [authApi.reducerPath]: authApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [overtimeApi.reducerPath]: overtimeApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [leaveApi.reducerPath]: leaveApi.reducer,
  },

  // RTK Query middleware handles caching, invalidation, polling
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      logoutMiddleware,
      authApi.middleware,
      attendanceApi.middleware,
      overtimeApi.middleware,
      settingsApi.middleware,
      leaveApi.middleware
    ),
});

export default store;
