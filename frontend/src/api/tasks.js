import { apiClient } from './client';
import { ENDPOINTS } from './config';

export const tasksApi = {
  list() {
    return apiClient.get(ENDPOINTS.TASKS.LIST);
  },

  getById(id) {
    return apiClient.get(ENDPOINTS.TASKS.GET(id));
  },

  getByProject(projectId) {
    return apiClient.get(ENDPOINTS.TASKS.BY_PROJECT(projectId));
  },

  create(data) {
    return apiClient.post(ENDPOINTS.TASKS.CREATE, data);
  },

  update(id, data) {
    return apiClient.put(ENDPOINTS.TASKS.UPDATE(id), data);
  },

  delete(id) {
    return apiClient.delete(ENDPOINTS.TASKS.DELETE(id));
  },

  changeStatus(id, status) {
    return apiClient.patch(ENDPOINTS.TASKS.CHANGE_STATUS(id), { status });
  },

  assignUsers(taskId, userIds) {
    return apiClient.post(ENDPOINTS.TASKS.ASSIGN(taskId), { userIds });
  },

  unassignUser(taskId, userId) {
    return apiClient.delete(ENDPOINTS.TASKS.UNASSIGN(taskId, userId));
  },

  getOverdue() {
    return apiClient.get(ENDPOINTS.TASKS.OVERDUE);
  },
};
