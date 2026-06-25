import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

export const overtimeApi = createApi({
  reducerPath: 'overtimeApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Overtime'],
  endpoints: (builder) => ({
    requestOvertime: builder.mutation<any, any>({
      query: (body) => ({
        url: '/overtime/request',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Overtime'],
    }),
    getMyOvertimeRequests: builder.query<any, void>({
      query: () => '/overtime/myrequests',
      providesTags: ['Overtime'],
    }),
    getPendingOvertime: builder.query<any, void>({
      query: () => '/overtime/pending',
      providesTags: ['Overtime'],
    }),
    updateOvertimeStatus: builder.mutation<any, any>({
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
