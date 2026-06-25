import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: any;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
}

const getInitialUser = (): User | null => {
  try {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: getInitialUser(),
  accessToken: localStorage.getItem('accessToken') || null,
};

// Stores the currently logged-in user.
// All async login/logout logic is handled by authApi (RTK Query).
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User; accessToken?: string }>) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken || null;
      try {
        localStorage.setItem('user', JSON.stringify(user));
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
      } catch (err) {
        console.error('Failed to save user to localStorage:', err);
      }
    },
    clearUser: (state) => {
      state.user = null;
      state.accessToken = null;
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      } catch (err) {
        console.error('Failed to remove user from localStorage:', err);
      }
    },
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
      try {
        if (action.payload) {
          localStorage.setItem('accessToken', action.payload);
        } else {
          localStorage.removeItem('accessToken');
        }
      } catch (err) {
        console.error('Failed to save accessToken to localStorage:', err);
      }
    },
  },
});

export const { setUser, clearUser, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
