import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { clearUser, setAccessToken } from './slices/authSlice';

interface RootState {
  auth: {
    accessToken: string | null;
    user: any;
  };
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000/api/v1';

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: 'include',
  // Attach token from Redux state as Authorization header on every request
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Mutex-like variable to track active refresh requests and avoid duplicate refreshes
let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

const subscribeTokenRefresh = (cb: () => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = () => {
  refreshSubscribers.map((cb) => cb());
  refreshSubscribers = [];
};

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Avoid refreshing if the request is already trying to refresh or login/logout
    const requestUrl = typeof args === 'string' ? args : args.url;
    if (requestUrl.includes('/auth/refresh') || requestUrl.includes('/auth/login')) {
      return result;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResult = await rawBaseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          // Save the new access token into Redux store
          const resData = refreshResult.data as { data?: { accessToken?: string } };
          const newToken = resData?.data?.accessToken;
          if (newToken) {
            api.dispatch(setAccessToken(newToken));
          }
          isRefreshing = false;
          onTokenRefreshed();
          // Retry the original request
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          isRefreshing = false;
          refreshSubscribers = [];
          api.dispatch(clearUser());
        }
      } catch (err) {
        isRefreshing = false;
        refreshSubscribers = [];
        api.dispatch(clearUser());
      }
    } else {
      // If a refresh is already in progress, wait for it to complete before retrying
      const retryRequest = new Promise<any>((resolve) => {
        subscribeTokenRefresh(() => {
          resolve(rawBaseQuery(args, api, extraOptions));
        });
      });
      result = await retryRequest;
    }
  }

  return result;
};
