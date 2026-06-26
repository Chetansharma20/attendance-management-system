import { createApi } from '@reduxjs/toolkit/query/react';
import { setUser, clearUser } from '../slices/authSlice';
import { baseQueryWithReauth } from '../baseQuery';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    // POST /api/v1/auth/login
    login: builder.mutation<any, any>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      // On success → store user in authSlice
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser({ user: data.data.user, accessToken: data.data.accessToken }));
        } catch {
          
        }
      },
    }),

    // POST /api/v1/auth/logout
    logout: builder.mutation<any, void>({
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
    register: builder.mutation<any, any>({
      query: (userData) => ({
        url: '/users/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // GET /api/v1/users/fetchusers
    fetchUsers: builder.query<any, { role?: string; page?: number; limit?: number } | void>({
      query: (params) => {
        const role = params?.role ?? 'all';
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 10;
        return `/users/fetchusers?role=${role}&page=${page}&limit=${limit}`;
      },
      providesTags: ['User'],
    }),

    // GET /api/v1/users/my-team  (manager only)
    getMyTeam: builder.query<any, void>({
      query: () => '/users/my-team',
      providesTags: ['User'],
    }),

    // GET /api/v1/users/profile/:id
    getUserProfile: builder.query<any, string>({
      query: (id) => `/users/profile/${id}`,
      providesTags: ['User'],
    }),

    // PATCH /api/v1/users/:id
    updateUser: builder.mutation<any, { id: string; name?: string; email?: string; role?: string; departmentId?: string | null; shiftId?: string | null; managerId?: string | null }>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    // DELETE /api/v1/users/:id
    deleteUser: builder.mutation<any, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // POST /api/v1/users/upload-profile-pic
    uploadProfilePic: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/users/upload-profile-pic',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useFetchUsersQuery,
  useGetMyTeamQuery,
  useGetUserProfileQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUploadProfilePicMutation,
} = authApi;

