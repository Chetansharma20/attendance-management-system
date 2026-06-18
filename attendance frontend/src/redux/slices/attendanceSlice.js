import { createSlice } from '@reduxjs/toolkit';

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    records: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
});

export default attendanceSlice.reducer;
