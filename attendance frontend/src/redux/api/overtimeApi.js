import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery.js';

export const overtimeApi = createApi({
  reducerPath: 'overtimeApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Overtime'],
  endpoints: (builder) => ({

    // POST /api/v1/overtime/request
    requestOvertime: builder.mutation({
      query: (body) => ({
        url: '/overtime/request',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Overtime'],
    }),

    // GET /api/v1/overtime/myrequests
    getMyOvertimeRequests: builder.query({
      query: () => '/overtime/myrequests',
      providesTags: ['Overtime'],
    }),

    // GET /api/v1/overtime/pending  (manager / admin)
    getPendingOvertime: builder.query({
      query: () => '/overtime/pending',
      providesTags: ['Overtime'],
    }),

    // PATCH /api/v1/overtime/status  (manager / admin)
    updateOvertimeStatus: builder.mutation({
      query: (body) => ({
        url: '/overtime/status',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Overtime'],
    }),

  }),
});

export const {
  useRequestOvertimeMutation,
  useGetMyOvertimeRequestsQuery,
  useGetPendingOvertimeQuery,
  useUpdateOvertimeStatusMutation,
} = overtimeApi;
