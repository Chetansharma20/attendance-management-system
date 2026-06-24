import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery.js';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    // GET /api/v1/notifications/my
    getMyNotifications: builder.query({
      query: () => '/notifications/my',
      providesTags: ['Notification'],
    }),

    // PATCH /api/v1/notifications/:id/read
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
} = notificationApi;
