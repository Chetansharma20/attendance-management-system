import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

export interface Department {
  _id: string;
  name: string;
  description?: string;
  managerId?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  managerId?: string | null;
}

export interface UpdateDepartmentPayload {
  id: string;
  name?: string;
  description?: string;
  managerId?: string | null;
}

export const departmentApi = createApi({
  reducerPath: 'departmentApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Department'],
  endpoints: (builder) => ({
    getAllDepartments: builder.query<any, void>({
      query: () => '/departments/all',
      providesTags: ['Department'],
    }),
    createDepartment: builder.mutation<any, CreateDepartmentPayload>({
      query: (body) => ({
        url: '/departments/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: builder.mutation<any, UpdateDepartmentPayload>({
      query: ({ id, ...body }) => ({
        url: `/departments/update/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Department'],
    }),
    deleteDepartment: builder.mutation<any, string>({
      query: (id) => ({
        url: `/departments/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Department'],
    }),
  }),
});

export const {
  useGetAllDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApi;
