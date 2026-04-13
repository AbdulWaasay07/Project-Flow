import { apiClient } from './client';
import { ENDPOINTS } from './config';

export const commentsApi = {
  getByTask(taskId) {
    return apiClient.get(ENDPOINTS.COMMENTS.LIST(taskId));
  },

  add(taskId, content) {
    return apiClient.post(ENDPOINTS.COMMENTS.ADD(taskId), { content });
  },

  delete(taskId, commentId) {
    return apiClient.delete(ENDPOINTS.COMMENTS.DELETE(taskId, commentId));
  },
};
