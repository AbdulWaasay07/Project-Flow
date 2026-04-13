import { apiClient } from './client';
import { ENDPOINTS } from './config';

export const projectsApi = {
  list() {
    return apiClient.get(ENDPOINTS.PROJECTS.LIST);
  },

  getById(id) {
    return apiClient.get(ENDPOINTS.PROJECTS.GET(id));
  },

  create(data) {
    return apiClient.post(ENDPOINTS.PROJECTS.CREATE, data);
  },

  update(id, data) {
    return apiClient.put(ENDPOINTS.PROJECTS.UPDATE(id), data);
  },

  delete(id) {
    return apiClient.delete(ENDPOINTS.PROJECTS.DELETE(id));
  },

  getMembers(projectId) {
    return apiClient.get(ENDPOINTS.PROJECTS.MEMBERS(projectId));
  },

  assignManager(projectId, userId) {
    return apiClient.patch(ENDPOINTS.PROJECTS.ASSIGN_MANAGER(projectId, userId));
  },

  addMember(projectId, userId) {
    return apiClient.post(ENDPOINTS.PROJECTS.ADD_MEMBER(projectId, userId));
  },

  removeMember(projectId, userId) {
    return apiClient.delete(ENDPOINTS.PROJECTS.REMOVE_MEMBER(projectId, userId));
  },
};
