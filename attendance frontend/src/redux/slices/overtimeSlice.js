import { createSlice } from '@reduxjs/toolkit';

const overtimeSlice = createSlice({
  name: 'overtime',
  initialState: {
    requests: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
});

export default overtimeSlice.reducer;
