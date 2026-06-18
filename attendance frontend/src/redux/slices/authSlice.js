import { createSlice } from '@reduxjs/toolkit';

// Stores the currently logged-in user.
// All async login/logout logic is handled by authApi (RTK Query).
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: (() => {
      try {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
      } catch {
        return null;
      }
    })(),
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      try {
        localStorage.setItem('user', JSON.stringify(action.payload));
      } catch (err) {
        console.error('Failed to save user to localStorage:', err);
      }
    },
    clearUser: (state) => {
      state.user = null;
      try {
        localStorage.removeItem('user');
      } catch (err) {
        console.error('Failed to remove user from localStorage:', err);
      }
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
