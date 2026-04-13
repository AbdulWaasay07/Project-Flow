import { apiClient } from './client';
import { ENDPOINTS } from './config';

export const activityLogsApi = {
  list(page = 0, size = 20, sortBy = 'createdAt', direction = 'desc') {
    return apiClient.get(
      `${ENDPOINTS.ACTIVITY_LOGS.LIST}?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`
    );
  },

  getByProject(projectId, page = 0, size = 20) {
    return apiClient.get(
      `${ENDPOINTS.ACTIVITY_LOGS.BY_PROJECT(projectId)}?page=${page}&size=${size}`
    );
  },

  getByUser(userId, page = 0, size = 20) {
    return apiClient.get(
      `${ENDPOINTS.ACTIVITY_LOGS.BY_USER(userId)}?page=${page}&size=${size}`
    );
  },
};
