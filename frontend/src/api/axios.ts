import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, LS_ACCESS_TOKEN } from '../constants';

// ─── Instance ───────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send httpOnly refresh_token cookie
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach access token ────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(LS_ACCESS_TOKEN);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: auto refresh on 401 ───────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => {
    // Unwrap the backend's standard response format { success: true, data: ... }
    if (res.data && typeof res.data === 'object' && res.data.success === true) {
      res.data = res.data.data;
    }
    return res;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh-token');
        const newToken: string = data.access_token;
        localStorage.setItem(LS_ACCESS_TOKEN, newToken);

        // Flush queue
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch {
        // Refresh failed — clear auth and redirect to login
        localStorage.removeItem(LS_ACCESS_TOKEN);
        refreshQueue = [];
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
