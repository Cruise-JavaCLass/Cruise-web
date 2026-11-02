import axios from 'axios';

export const ACCESS_DENIED_EVENT = 'cruise:access-denied';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Domain services may have offline/demo fallbacks. A server denial must still
// leave the staff screen instead of appearing to be a successful local edit.
apiClient.interceptors.response.use(response => response, error => {
  const status = error.response?.status;
  const url = error.config?.url || '';
  if ((status === 401 || status === 403) && !url.startsWith('/auth/login') && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ACCESS_DENIED_EVENT, { detail: { status } }));
  }
  return Promise.reject(error);
});

export interface SystemHealth {
  status: string;
  serverTime: string;
  uptimeSeconds: number;
  memory: {
    totalMB: number;
    usedMB: number;
    freeMB: number;
  };
}

export interface SystemInfo {
  projectName: string;
  module: string;
  version: string;
  javaVersion: string;
  jiraStory: string;
  jiraTask: string;
}

export const checkBackendHealth = async (): Promise<SystemHealth | null> => {
  try {
    const res = await apiClient.get<{ success: boolean; data: SystemHealth }>('/health');
    return res.data.data;
  } catch {
    return null;
  }
};

export const getBackendInfo = async (): Promise<SystemInfo | null> => {
  try {
    const res = await apiClient.get<{ success: boolean; data: SystemInfo }>('/info');
    return res.data.data;
  } catch {
    return null;
  }
};
