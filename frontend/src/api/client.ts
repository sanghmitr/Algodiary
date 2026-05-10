import axios, { AxiosError, type AxiosInstance } from "axios";
import { API_BASE_URL } from "../utils/constants";
import { useAuthStore } from "../store/authStore";

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  },
);

export async function getData<T>(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
}
