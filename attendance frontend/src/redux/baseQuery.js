import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clearUser } from './slices/authSlice.js';

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: 'include',
});

// Mutex-like variable to track active refresh requests and avoid duplicate refreshes
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = () => {
  refreshSubscribers.map((cb) => cb());
  refreshSubscribers = [];
};

export const baseQueryWithReauth = async (args, api, extraOptions) => {
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
      const retryRequest = new Promise((resolve) => {
        subscribeTokenRefresh(() => {
          resolve(rawBaseQuery(args, api, extraOptions));
        });
      });
      result = await retryRequest;
    }
  }

  return result;
};
