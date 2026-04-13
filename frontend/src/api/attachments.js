import { apiClient } from './client';
import { ENDPOINTS } from './config';

export const attachmentsApi = {
  upload(formData) {
    return apiClient.upload(ENDPOINTS.ATTACHMENTS.UPLOAD, formData);
  },

  getByProject(projectId) {
    return apiClient.get(ENDPOINTS.ATTACHMENTS.BY_PROJECT(projectId));
  },

  getByTask(taskId) {
    return apiClient.get(ENDPOINTS.ATTACHMENTS.BY_TASK(taskId));
  },

  delete(id) {
    return apiClient.delete(ENDPOINTS.ATTACHMENTS.DELETE(id));
  },


  fileUrl(filename) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    return `${base}/attachments/files/${filename}`;
  },
};
