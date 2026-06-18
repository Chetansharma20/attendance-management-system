import { createApi } from '@reduxjs/toolkit/query/react';
import { setUser, clearUser } from '../slices/authSlice.js';
import { baseQueryWithReauth } from '../baseQuery.js';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: (builder) => ({

    // POST /api/v1/auth/login
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      // On success → store user in authSlice
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data.data.user));
        } catch {
          // error handled by component via isError
        }
      },
    }),

    // POST /api/v1/auth/logout
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      // On success → clear user from authSlice
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearUser());
        } catch {
          // still clear user on the client even if request fails
          dispatch(clearUser());
        }
      },
    }),

    // POST /api/v1/users/register  (admin only)
    register: builder.mutation({
      query: (userData) => ({
        url: '/users/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // GET /api/v1/users/fetchusers
    fetchUsers: builder.query({
      query: ({ role = 'all', page = 1, limit = 10 } = {}) => 
        `/users/fetchusers?role=${role}&page=${page}&limit=${limit}`,
      providesTags: ['User'],
    }),

    // GET /api/v1/users/my-team  (manager only)
    getMyTeam: builder.query({
      query: () => '/users/my-team',
      providesTags: ['User'],
    }),

  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useFetchUsersQuery,
  useGetMyTeamQuery,
} = authApi;
