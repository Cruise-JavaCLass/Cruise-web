import axios from 'axios';

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
