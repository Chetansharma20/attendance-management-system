import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery.js';

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Settings'],
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
  }),
});

export const {
  useGetGeofenceSettingsQuery,
  useUpdateGeofenceSettingsMutation,
} = settingsApi;
