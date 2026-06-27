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
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // GET /api/v1/users/fetchusers
    fetchUsers: builder.query<any, { role?: string; page?: number; limit?: number; search?: string } | void>({
      query: (params) => {
        const role = params?.role ?? 'all';
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 10;
        const search = params?.search ?? '';
        return `/users/fetchusers?role=${role}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      },
      providesTags: (result) =>
        result?.data?.users
          ? [
              ...result.data.users.map(({ _id }: any) => ({ type: 'User' as const, id: _id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    // GET /api/v1/users/my-team  (manager only)
    getMyTeam: builder.query<any, void>({
      query: () => '/users/my-team',
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // GET /api/v1/users/profile/:id
    getUserProfile: builder.query<any, string>({
      query: (id) => `/users/profile/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // PATCH /api/v1/users/:id
    updateUser: builder.mutation<any, { id: string; name?: string; email?: string; role?: string; departmentId?: string | null; shiftId?: string | null; managerId?: string | null }>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),

    // DELETE /api/v1/users/:id
    deleteUser: builder.mutation<any, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
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

