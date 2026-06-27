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
    getAllOvertime: builder.query<any, { page?: number; limit?: number; status?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.status) queryParams.append('status', params.status);
        return `/overtime/all?${queryParams.toString()}`;
      },
      providesTags: ['Overtime'],
    }),
    deleteOvertime: builder.mutation<any, string>({
      query: (id) => ({
        url: `/overtime/${id}`,
        method: 'DELETE',
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
  useGetAllOvertimeQuery,
  useDeleteOvertimeMutation,
} = overtimeApi;
