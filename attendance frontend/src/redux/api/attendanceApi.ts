import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Attendance'],
  endpoints: (builder) => ({
    // POST /api/v1/attendance/punchin
    punchIn: builder.mutation<any, any>({
      query: (body) => ({
        url: '/attendance/punchin',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),

    // POST /api/v1/attendance/punchout
    punchOut: builder.mutation<any, any>({
      query: (body) => ({
        url: '/attendance/punchout',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),

    // GET /api/v1/attendance/my-attendance
    getMyAttendance: builder.query<any, void>({
      query: () => '/attendance/my-attendance',
      providesTags: ['Attendance'],
    }),

    // GET /api/v1/attendance/getattendancebyid/:employeeId
    getAttendanceById: builder.query<any, string | number>({
      query: (employeeId) => `/attendance/getattendancebyid/${employeeId}`,
      providesTags: ['Attendance'],
    }),

    // GET /api/v1/attendance/team-attendance  (manager)
    getTeamAttendance: builder.query<any, void>({
      query: () => '/attendance/team-attendance',
      providesTags: ['Attendance'],
    }),

    // GET /api/v1/attendance/all-attendance  (admin / manager)
    getAllAttendance: builder.query<any, { page?: number; limit?: number } | void>({
      query: (params) => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 10;
        return `/attendance/all-attendance?page=${page}&limit=${limit}`;
      },
      providesTags: ['Attendance'],
    }),

    // POST /api/v1/validate/validateattendance/:attendanceId  (manager)
    validateAttendance: builder.mutation<any, { attendanceId: string | number; status: string; remarks?: string }>({
      query: ({ attendanceId, status, remarks }) => ({
        url: `/validate/validateattendance/${attendanceId}`,
        method: 'POST',
        body: { status, remarks },
      }),
      invalidatesTags: ['Attendance'],
    }),

    // GET /api/v1/reports/daily-pdf
    downloadDailyReport: builder.mutation<Blob, string>({
      query: (date) => ({
        url: '/reports/daily-pdf',
        params: { date },
        responseHandler: (response) => response.blob(),
      }),
    }),

    // POST /api/v1/attendance/manager-punch  (manager / admin)
    managerPunch: builder.mutation<any, { employeeId: string | number; type: string }>({
      query: ({ employeeId, type }) => ({
        url: '/attendance/manager-punch',
        method: 'POST',
        body: { employeeId, type },
      }),
      invalidatesTags: ['Attendance'],
    }),

    // POST /api/v1/attendance/break/start
    startBreak: builder.mutation<any, any>({
      query: (body) => ({
        url: '/attendance/break/start',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),

    // POST /api/v1/attendance/break/end
    endBreak: builder.mutation<any, void>({
      query: () => ({
        url: '/attendance/break/end',
        method: 'POST',
      }),
      invalidatesTags: ['Attendance'],
    }),

    // GET /api/v1/reports/monthly (json format)
    getMonthlyReportData: builder.query<any, { month: string; departmentId?: string }>({
      query: ({ month, departmentId }) => ({
        url: '/reports/monthly',
        params: { month, format: 'json', ...(departmentId ? { departmentId } : {}) },
      }),
      providesTags: ['Attendance'],
    }),

    // GET /api/v1/reports/today-stats
    getTodayStats: builder.query<any, { date?: string } | void>({
      query: (params) => ({
        url: '/reports/today-stats',
        params: params?.date ? { date: params.date } : {},
      }),
      providesTags: ['Attendance'],
    }),

    // GET /api/v1/reports/monthly (pdf / csv download format)
    downloadMonthlyReport: builder.mutation<Blob, { month: string; format: string; departmentId?: string }>({
      query: ({ month, format, departmentId }) => ({
        url: '/reports/monthly',
        params: { month, format, ...(departmentId ? { departmentId } : {}) },
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
  useManagerPunchMutation,
  useStartBreakMutation,
  useEndBreakMutation,
  useGetMonthlyReportDataQuery,
  useGetTodayStatsQuery,
  useDownloadMonthlyReportMutation,
} = attendanceApi;
