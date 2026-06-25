import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

export const leaveApi = createApi({
  reducerPath: 'leaveApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Leave', 'LeaveBalance', 'LeavePolicy'],
  endpoints: (builder) => ({
    // ── Employee ────────────────────────────────────────────────────────────
    applyLeave: builder.mutation<any, any>({
      query: (body) => ({ url: '/leave/apply', method: 'POST', body }),
      invalidatesTags: ['Leave', 'LeaveBalance'],
    }),
    getMyLeaves: builder.query<any, void>({
      query: () => '/leave/my-leaves',
      providesTags: ['Leave'],
    }),
    getMyLeaveBalance: builder.query<any, void>({
      query: () => '/leave/my-balance',
      providesTags: ['LeaveBalance'],
    }),

    // ── Manager + Admin ──────────────────────────────────────────────────────
    getTeamLeaves: builder.query<any, string | undefined>({
      query: (status = 'all') => `/leave/team-leaves?status=${status}`,
      providesTags: ['Leave'],
    }),
    updateLeaveStatus: builder.mutation<any, { leaveId: string | number; [key: string]: any }>({
      query: ({ leaveId, ...body }) => ({
        url: `/leave/status/${leaveId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Leave', 'LeaveBalance'],
    }),

    // ── Admin ─────────────────────────────────────────────────────────────────
    getAllLeaves: builder.query<any, { page?: number; limit?: number; status?: string } | void>({
      query: (params) => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 15;
        const status = params?.status ?? 'all';
        return `/leave/all-leaves?page=${page}&limit=${limit}&status=${status}`;
      },
      providesTags: ['Leave'],
    }),
    getAllLeaveBalances: builder.query<any, void>({
      query: () => '/leave/all-balances',
      providesTags: ['LeaveBalance'],
    }),
    getLeaveBalanceById: builder.query<any, string | number>({
      query: (employeeId) => `/leave/balance/${employeeId}`,
      providesTags: ['LeaveBalance'],
    }),
    updateLeaveBalance: builder.mutation<any, { employeeId: string | number; [key: string]: any }>({
      query: ({ employeeId, ...body }) => ({
        url: `/leave/balance/${employeeId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['LeaveBalance'],
    }),
    getLeavePolicy: builder.query<any, void>({
      query: () => '/leave/policy',
      providesTags: ['LeavePolicy'],
    }),
    updateLeavePolicy: builder.mutation<any, any>({
      query: (body) => ({ url: '/leave/policy', method: 'PATCH', body }),
      invalidatesTags: ['LeavePolicy'],
    }),
  }),
});

export const {
  useApplyLeaveMutation,
  useGetMyLeavesQuery,
  useGetMyLeaveBalanceQuery,
  useGetTeamLeavesQuery,
  useUpdateLeaveStatusMutation,
  useGetAllLeavesQuery,
  useGetAllLeaveBalancesQuery,
  useGetLeaveBalanceByIdQuery,
  useUpdateLeaveBalanceMutation,
  useGetLeavePolicyQuery,
  useUpdateLeavePolicyMutation,
} = leaveApi;
