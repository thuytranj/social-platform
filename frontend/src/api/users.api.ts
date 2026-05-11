import api from './axios';
import { User, CursorPage } from '../types';

export const usersApi = {
  getMe: () =>
    api.get<User>('/users/me').then((r) => r.data),

  getUserById: (id: string) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  getAllUsers: (limit = 10, cursor?: string) =>
    api.get<CursorPage<User>>('/users', { params: { limit, cursor } }).then((r) => r.data),

  searchByUsername: (username: string, limit = 10, cursor?: string) =>
    api.get<CursorPage<User>>('/users/by-username', { params: { username, limit, cursor } }).then((r) => r.data),

  getUserPosts: (id: string, limit = 10, cursor?: string) =>
    api.get(`/users/${id}/posts`, { params: { limit, cursor } }).then((r) => r.data),

  updateProfile: (data: FormData) =>
    api.patch<User>('/users/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  updateUser: (id: string, data: Partial<User>) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),

  deleteUser: (id: string) =>
    api.delete(`/users/${id}`).then((r) => r.data),
};
