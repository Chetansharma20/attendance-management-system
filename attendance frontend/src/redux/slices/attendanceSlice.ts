import { createSlice } from '@reduxjs/toolkit';

export interface AttendanceState {
  records: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AttendanceState = {
  records: [],
  isLoading: false,
  error: null,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {},
});

export default attendanceSlice.reducer;
