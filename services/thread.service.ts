import axios from 'axios';
import type { UIMessage } from 'ai';

const apiClient = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const threadService = {
    getMessages: async (threadId: string, resourceId: string): Promise<UIMessage[]> => {
        const response = await apiClient.get<UIMessage[]>('/chat', {
            params: { threadId, resourceId },
        });
        return response.data;
    },
};
