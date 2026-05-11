import api from './axios';
import { AuthResponse, User } from '../types';

export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post<{ message: string }>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  logout: () =>
    api.post('/auth/logout').then((r) => r.data),

  refreshToken: () =>
    api.post<AuthResponse>('/auth/refresh-token').then((r) => r.data),

  requestOtp: (email: string, type: string) =>
    api.post('/auth/request-otp', { email, type }).then((r) => r.data),

  verifyOtp: (email: string, otp: string, type: string) =>
    api.post<{ reset_token?: string; message: string }>('/auth/verify-otp', { email, otp, type }).then((r) => r.data),

  requestPasswordReset: (resetToken: string, newPassword: string) =>
    api.post('/auth/request-password-reset', { resetToken, newPassword }).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),

  googleAuth: () => {
    window.location.href = `${api.defaults.baseURL}/auth/google`;
  },
};
