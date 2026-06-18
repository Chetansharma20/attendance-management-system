import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery.js';

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Attendance'],
  endpoints: (builder) => ({

    // POST /api/v1/attendance/punchin
    punchIn: builder.mutation({
      query: (body) => ({
        url: '/attendance/punchin',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),

    // POST /api/v1/attendance/punchout
    punchOut: builder.mutation({
      query: (body) => ({
        url: '/attendance/punchout',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),

    // GET /api/v1/attendance/my-attendance
    getMyAttendance: builder.query({
      query: () => '/attendance/my-attendance',
      providesTags: ['Attendance'],
    }),

    // GET /api/v1/attendance/getattendancebyid/:employeeId
    getAttendanceById: builder.query({
      query: (employeeId) => `/attendance/getattendancebyid/${employeeId}`,
      providesTags: ['Attendance'],
    }),

    // GET /api/v1/attendance/team-attendance  (manager)
    getTeamAttendance: builder.query({
      query: () => '/attendance/team-attendance',
      providesTags: ['Attendance'],
    }),

    // GET /api/v1/attendance/all-attendance  (admin / manager)
    getAllAttendance: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => 
        `/attendance/all-attendance?page=${page}&limit=${limit}`,
      providesTags: ['Attendance'],
    }),

    // POST /api/v1/validate/validateattendance/:attendanceId  (manager)
    validateAttendance: builder.mutation({
      query: ({ attendanceId, status, remarks }) => ({
        url: `/validate/validateattendance/${attendanceId}`,
        method: 'POST',
        body: { status, remarks },
      }),
      invalidatesTags: ['Attendance'],
    }),

    // GET /api/v1/reports/daily-pdf
    downloadDailyReport: builder.mutation({
      query: (date) => ({
        url: '/reports/daily-pdf',
        params: { date },
        responseHandler: (response) => response.blob(),
      }),
    }),

  }),
});

export const {
  usePunchInMutation,
  usePunchOutMutation,
  useGetMyAttendanceQuery,
  useGetAttendanceByIdQuery,
  useGetTeamAttendanceQuery,
  useGetAllAttendanceQuery,
  useValidateAttendanceMutation,
  useDownloadDailyReportMutation,
} = attendanceApi;
