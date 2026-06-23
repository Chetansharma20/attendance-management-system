import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery.js';

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Settings', 'Shifts'],
  endpoints: (builder) => ({
    getGeofenceSettings: builder.query({
      query: () => '/settings/geofence',
      providesTags: ['Settings'],
    }),
    updateGeofenceSettings: builder.mutation({
      query: (body) => ({
        url: '/settings/geofence',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Settings'],
    }),
    getShifts: builder.query({
      query: () => '/shifts/getallshifts',
      providesTags: ['Shifts'],
    }),
    createShift: builder.mutation({
      query: (body) => ({
        url: '/shifts/createShift',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Shifts'],
    }),
    deleteShift: builder.mutation({
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
