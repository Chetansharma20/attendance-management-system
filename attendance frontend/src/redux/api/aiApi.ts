import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const aiApi = createApi({
  reducerPath: 'aiApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    askAiAssistant: builder.mutation<{ data: { response: string } }, { history: ChatMessage[] }>({
      query: (body) => ({
        url: '/ai/chat',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useAskAiAssistantMutation } = aiApi;
