import axios, { AxiosError } from 'axios';

type TokenGetter = () => string | null;
type RefreshHandler = () => Promise<string | null>;
type LogoutHandler = () => void;

let getToken: TokenGetter = () => null;
let refreshAccessToken: RefreshHandler = async () => null;
let handleLogout: LogoutHandler = () => undefined;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return api(originalRequest);
      }

      handleLogout();
    }

    return Promise.reject(error);
  }
);

export const bindAuthHandlers = (handlers: {
  getToken: TokenGetter;
  refreshAccessToken: RefreshHandler;
  handleLogout: LogoutHandler;
}) => {
  getToken = handlers.getToken;
  refreshAccessToken = handlers.refreshAccessToken;
  handleLogout = handlers.handleLogout;
};

export type ApiResponse<T> = {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};
