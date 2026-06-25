import { createSlice } from '@reduxjs/toolkit';

export interface OvertimeState {
  requests: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: OvertimeState = {
  requests: [],
  isLoading: false,
  error: null,
};

const overtimeSlice = createSlice({
  name: 'overtime',
  initialState,
  reducers: {},
});

export default overtimeSlice.reducer;
