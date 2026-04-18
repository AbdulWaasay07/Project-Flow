import { apiClient } from './client';
import { ENDPOINTS } from './config';

export const authApi = {

  async login(email, password) {
    const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, { email, password });

    const user = {
      id: response.userId,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
    };
    return { user, token: response.token };
  },


  async register(data) {
    const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      role: data.role || 'TEAM_MEMBER',
    });
    const user = {
      id: response.userId,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
    };
    return { user, token: response.token };
  },


  async logout() {
    return { success: true };
  },
};
