import { apiClient } from './client';
import { ENDPOINTS } from './config';

export const notificationsApi = {
  list() {
    return apiClient.get(ENDPOINTS.NOTIFICATIONS.LIST);
  },

  markAsRead(id) {
    return apiClient.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  markAllAsRead() {
    return apiClient.patch(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },
};
