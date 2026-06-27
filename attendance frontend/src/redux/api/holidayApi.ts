import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

export const holidayApi = createApi({
  reducerPath: 'holidayApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Holiday'],
  endpoints: (builder) => ({
    fetchHolidays: builder.query<any, void>({
      query: () => '/holiday/all',
      providesTags: ['Holiday'],
    }),
    createHoliday: builder.mutation<any, { name: string; date: string; type?: string; description?: string }>({
      query: (body) => ({
        url: '/holiday/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Holiday'],
    }),
    deleteHoliday: builder.mutation<any, string>({
      query: (id) => ({
        url: `/holiday/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Holiday'],
    }),
    syncHolidays: builder.mutation<any, { country: string; year: number }>({
      query: (body) => ({
        url: '/holiday/sync',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Holiday'],
    }),
  }),
});

export const {
  useFetchHolidaysQuery,
  useCreateHolidayMutation,
  useDeleteHolidayMutation,
  useSyncHolidaysMutation,
} = holidayApi;
