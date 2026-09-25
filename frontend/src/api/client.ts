import axios, { AxiosError } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL;
export const TOKEN_KEY = 'access_token';
export const USER_ID_KEY = 'user_id';
export const HAS_UPLOADED_KEY = 'has_uploaded_data';

export function getHasUploadedData(): boolean {
  return localStorage.getItem(HAS_UPLOADED_KEY) === 'true';
}

export function setHasUploadedData(hasUploaded: boolean): void {
  localStorage.setItem(HAS_UPLOADED_KEY, String(hasUploaded));
}

export function getCurrentUserId(): string | undefined {
  return localStorage.getItem(USER_ID_KEY) || undefined;
}

export function setCurrentUser(user: { id?: string } | null | undefined): void {
  if (user?.id) {
    localStorage.setItem(USER_ID_KEY, user.id);
    return;
  }
  localStorage.removeItem(USER_ID_KEY);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data) {
      const data = error.response.data as any;
      if (typeof data === 'string') return data;
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) {
        return data.detail
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item && item.msg) {
              const field = Array.isArray(item.loc) ? item.loc.slice(-1)[0] : '';
              return field ? `${field}: ${item.msg}` : item.msg;
            }
            return JSON.stringify(item);
          })
          .join(', ');
      }
      if (typeof data.message === 'string') return data.message;
      if (typeof data.error === 'string') return data.error;
    }
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return `Failed to connect to backend at ${API_BASE_URL}. Ensure your FastAPI server is running.`;
    }
    return error.message || 'An error occurred while contacting the server.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}
