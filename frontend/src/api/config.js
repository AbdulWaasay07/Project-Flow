export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  USERS: {
    LIST: '/users',
    GET: (id) => `/users/${id}`,
    UPDATE: (id) => `/users/${id}`,
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    BLOCK: (id) => `/users/${id}/block`,
    UNBLOCK: (id) => `/users/${id}/unblock`,
    CHANGE_ROLE: (id) => `/users/${id}/role`,
  },
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: (id) => `/projects/${id}`,
    UPDATE: (id) => `/projects/${id}`,
    DELETE: (id) => `/projects/${id}`,
    MEMBERS: (projectId) => `/projects/${projectId}/members`,
    ASSIGN_MANAGER: (projectId, userId) => `/projects/${projectId}/assign-manager/${userId}`,
    ADD_MEMBER: (projectId, userId) => `/projects/${projectId}/members/${userId}`,
    REMOVE_MEMBER: (projectId, userId) => `/projects/${projectId}/members/${userId}`,
  },
  TASKS: {
    LIST: '/tasks',
    CREATE: '/tasks',
    GET: (id) => `/tasks/${id}`,
    UPDATE: (id) => `/tasks/${id}`,
    DELETE: (id) => `/tasks/${id}`,
    BY_PROJECT: (projectId) => `/tasks/project/${projectId}`,
    CHANGE_STATUS: (id) => `/tasks/${id}/status`,
    ASSIGN: (taskId) => `/tasks/${taskId}/assign`,
    UNASSIGN: (taskId, userId) => `/tasks/${taskId}/assign/${userId}`,
    OVERDUE: '/tasks/overdue',
    MY_TASKS: '/tasks/my',
  },
  COMMENTS: {
    LIST: (taskId) => `/tasks/${taskId}/comments`,
    ADD: (taskId) => `/tasks/${taskId}/comments`,
    DELETE: (taskId, commentId) => `/tasks/${taskId}/comments/${commentId}`,
  },
  DASHBOARD: {
    ADMIN: '/dashboard/admin',
    ME: '/dashboard/me',
    PROJECTS_PROGRESS: '/dashboard/projects-progress',
    USER_STATS: (id) => `/dashboard/user/${id}`,
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
  ACTIVITY_LOGS: {
    LIST: '/activity-logs',
    BY_PROJECT: (projectId) => `/activity-logs/project/${projectId}`,
    BY_USER: (userId) => `/activity-logs/user/${userId}`,
  },
  ATTACHMENTS: {
    UPLOAD: '/attachments',
    BY_PROJECT: (projectId) => `/attachments/project/${projectId}`,
    BY_TASK: (taskId) => `/attachments/task/${taskId}`,
    DELETE: (id) => `/attachments/${id}`,
  },
};
