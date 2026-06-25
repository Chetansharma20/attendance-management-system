import { configureStore, Middleware } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { authApi } from './api/authApi';
import { attendanceApi } from './api/attendanceApi';
import { overtimeApi } from './api/overtimeApi';
import { settingsApi } from './api/settingsApi';
import { leaveApi } from './api/leaveApi';
import { notificationApi } from './api/notificationApi';
import { departmentApi } from './api/departmentApi';

const logoutMiddleware: Middleware = (store) => (next) => (action: any) => {
  if (action.type === 'auth/clearUser') {
    store.dispatch(authApi.util.resetApiState());
    store.dispatch(attendanceApi.util.resetApiState());
    store.dispatch(overtimeApi.util.resetApiState());
    store.dispatch(settingsApi.util.resetApiState());
    store.dispatch(leaveApi.util.resetApiState());
    store.dispatch(notificationApi.util.resetApiState());
    store.dispatch(departmentApi.util.resetApiState());
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
    [notificationApi.reducerPath]: notificationApi.reducer,
    [departmentApi.reducerPath]: departmentApi.reducer,
  },

  // RTK Query middleware handles caching, invalidation, polling
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      logoutMiddleware,
      authApi.middleware,
      attendanceApi.middleware,
      overtimeApi.middleware,
      settingsApi.middleware,
      leaveApi.middleware,
      notificationApi.middleware,
      departmentApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
