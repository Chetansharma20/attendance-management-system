import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery.js';

export const leaveApi = createApi({
  reducerPath: 'leaveApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Leave', 'LeaveBalance', 'LeavePolicy'],
  endpoints: (builder) => ({

    // ── Employee ────────────────────────────────────────────────────────────

    // POST /api/v1/leave/apply
    applyLeave: builder.mutation({
      query: (body) => ({ url: '/leave/apply', method: 'POST', body }),
      invalidatesTags: ['Leave', 'LeaveBalance'],
    }),

    // GET /api/v1/leave/my-leaves
    getMyLeaves: builder.query({
      query: () => '/leave/my-leaves',
      providesTags: ['Leave'],
    }),

    // GET /api/v1/leave/my-balance
    getMyLeaveBalance: builder.query({
      query: () => '/leave/my-balance',
      providesTags: ['LeaveBalance'],
    }),

    // ── Manager + Admin ──────────────────────────────────────────────────────

    // GET /api/v1/leave/team-leaves?status=pending
    getTeamLeaves: builder.query({
      query: (status = 'all') => `/leave/team-leaves?status=${status}`,
      providesTags: ['Leave'],
    }),

    // PATCH /api/v1/leave/status/:leaveId
    updateLeaveStatus: builder.mutation({
      query: ({ leaveId, ...body }) => ({
        url: `/leave/status/${leaveId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Leave', 'LeaveBalance'],
    }),

    // ── Admin ─────────────────────────────────────────────────────────────────

    // GET /api/v1/leave/all-leaves?page=1&limit=15&status=all
    getAllLeaves: builder.query({
      query: ({ page = 1, limit = 15, status = 'all' } = {}) =>
        `/leave/all-leaves?page=${page}&limit=${limit}&status=${status}`,
      providesTags: ['Leave'],
    }),

    // GET /api/v1/leave/all-balances
    getAllLeaveBalances: builder.query({
      query: () => '/leave/all-balances',
      providesTags: ['LeaveBalance'],
    }),

    // GET /api/v1/leave/balance/:employeeId
    getLeaveBalanceById: builder.query({
      query: (employeeId) => `/leave/balance/${employeeId}`,
      providesTags: ['LeaveBalance'],
    }),

    // PATCH /api/v1/leave/balance/:employeeId
    updateLeaveBalance: builder.mutation({
      query: ({ employeeId, ...body }) => ({
        url: `/leave/balance/${employeeId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['LeaveBalance'],
    }),

    // GET /api/v1/leave/policy
    getLeavePolicy: builder.query({
      query: () => '/leave/policy',
      providesTags: ['LeavePolicy'],
    }),

    // PATCH /api/v1/leave/policy
    updateLeavePolicy: builder.mutation({
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
