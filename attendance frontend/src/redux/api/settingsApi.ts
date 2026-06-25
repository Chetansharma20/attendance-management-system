import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Settings', 'Shifts'],
  endpoints: (builder) => ({
    getGeofenceSettings: builder.query<any, void>({
      query: () => '/settings/geofence',
      providesTags: ['Settings'],
    }),
    updateGeofenceSettings: builder.mutation<any, any>({
      query: (body) => ({
        url: '/settings/geofence',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Settings'],
    }),
    getShifts: builder.query<any, void>({
      query: () => '/shifts/getallshifts',
      providesTags: ['Shifts'],
    }),
    createShift: builder.mutation<any, any>({
      query: (body) => ({
        url: '/shifts/createShift',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Shifts'],
    }),
    deleteShift: builder.mutation<any, string | number>({
      query: (id) => ({
        url: `/shifts/deleteShift/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Shifts'],
    }),
  }),
});

export const {
  useGetGeofenceSettingsQuery,
  useUpdateGeofenceSettingsMutation,
  useGetShiftsQuery,
  useCreateShiftMutation,
  useDeleteShiftMutation,
} = settingsApi;
