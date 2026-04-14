import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

// En producción (Vercel/HTTPS) usamos el proxy para evitar el error de Mixed Content
// si el backend es HTTP (IP directa).
const isClient = typeof window !== 'undefined';
const isProd = isClient && window.location.hostname !== 'localhost';

// API principal con prefijo v1
const API_URL = isProd 
  ? '/api_proxy/api/v1' 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://3.142.73.52:3000/api/v1');

// Base URL para peticiones públicas (sin v1)
const PUBLIC_API_URL = isProd
  ? '/api_proxy/api/v1'
  : 'http://3.142.73.52:3000/api/v1';

// ─── Instancia Privada (con JWT - usa /api/v1) ────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ─── Instancia Pública (sin JWT - menú, etc.) ──────────────────────────────────
export const publicApi: AxiosInstance = axios.create({
  baseURL: PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Alias para mantener compatibilidad con refactorizaciones parciales
export const axiosInstance = api;

// ─── Interceptor REQUEST ───────────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Interceptor RESPONSE (Handling 401 & Refresh Token) ────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => {
    // Aquí podrías estandarizar la respuesta si fuera necesario
    return response;
  },
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers)
            originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error("No refresh token available");

        // El endpoint de refresh típicamente está en /auth/refresh (bajo v1)
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        
        const data = res.data?.data || res.data;
        const newAccessToken = data?.accessToken || data?.token;
        const newRefreshToken = data?.refreshToken;

        if (!newAccessToken) {
          throw new Error("Failed to extract new access token");
        }

        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setAuth(currentUser, newAccessToken, newRefreshToken || refreshToken);
        }

        processQueue(null, newAccessToken);

        if (originalRequest.headers)
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith('/menu')) {
          window.location.href = "/login?expired=true";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
