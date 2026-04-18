import { apiClient } from './client';
import { ENDPOINTS } from './config';

export const dashboardApi = {
  getAdminDashboard() {
    return apiClient.get(ENDPOINTS.DASHBOARD.ADMIN);
  },

  getUserDashboard() {
    return apiClient.get(ENDPOINTS.DASHBOARD.ME);
  },

  getProjectsProgress(limit = 5) {
    return apiClient.get(`${ENDPOINTS.DASHBOARD.PROJECTS_PROGRESS}?limit=${limit}`);
  },

  getUserStats(userId) {
    return apiClient.get(ENDPOINTS.DASHBOARD.USER_STATS(userId));
  },
};
