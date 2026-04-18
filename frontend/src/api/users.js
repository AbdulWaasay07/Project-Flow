import { apiClient } from './client';
import { ENDPOINTS } from './config';

export const usersApi = {
  list() {
    return apiClient.get(ENDPOINTS.USERS.LIST);
  },

  getById(id) {
    return apiClient.get(ENDPOINTS.USERS.GET(id));
  },

  update(id, data) {
    return apiClient.put(ENDPOINTS.USERS.UPDATE(id), data);
  },

  getProfile() {
    return apiClient.get(ENDPOINTS.USERS.PROFILE);
  },

  updateProfile(data) {
    return apiClient.put(ENDPOINTS.USERS.UPDATE_PROFILE, data);
  },

  block(id) {
    return apiClient.patch(ENDPOINTS.USERS.BLOCK(id));
  },

  unblock(id) {
    return apiClient.patch(ENDPOINTS.USERS.UNBLOCK(id));
  },

  changeRole(id, role) {
    return apiClient.patch(`${ENDPOINTS.USERS.CHANGE_ROLE(id)}?role=${role}`);
  },
};
