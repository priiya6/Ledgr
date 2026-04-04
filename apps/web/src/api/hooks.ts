import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse } from './client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'VIEWER' | 'ANALYST' | 'ADMIN';
  isActive?: boolean;
}

export interface RecordItem {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  description?: string | null;
  date: string;
  createdBy: string;
}

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  recordCount: number;
}

export const useLoginMutation = () =>
  useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await api.post<ApiResponse<{ accessToken: string; user: AuthUser }>>('/auth/login', payload);
      return response.data.data;
    },
  });

export const useMeQuery = (enabled: boolean) =>
  useQuery({
    queryKey: ['me'],
    enabled,
    queryFn: async () => {
      const response = await api.get<ApiResponse<AuthUser>>('/users/me');
      return response.data.data;
    },
  });

export const useRecordsQuery = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: ['records', params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RecordItem[]>>('/records', { params });
      return response.data;
    },
  });

export const useSummaryQuery = () =>
  useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AnalyticsSummary>>('/analytics/summary');
      return response.data.data;
    },
  });

export const useCategoryAnalyticsQuery = (enabled = true) =>
  useQuery({
    queryKey: ['analytics', 'by-category'],
    enabled,
    queryFn: async () => {
      const response = await api.get<ApiResponse<Array<{ category: string; type: string; total: number }>>>('/analytics/by-category');
      return response.data.data;
    },
  });

export const useTimeSeriesQuery = (params: Record<string, string | undefined>, enabled = true) =>
  useQuery({
    queryKey: ['analytics', 'time-series', params],
    enabled,
    queryFn: async () => {
      const response = await api.get<ApiResponse<Array<{ bucket: string; type: string; total: number }>>>('/analytics/time-series', { params });
      return response.data.data;
    },
  });

export const useTopCategoriesQuery = (limit = 5) =>
  useQuery({
    queryKey: ['analytics', 'top-categories', limit],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Array<{ category: string; total: number }>>>('/analytics/top-categories', { params: { limit } });
      return response.data.data;
    },
  });

export const useUsersQuery = (params: Record<string, string | number | undefined>, enabled: boolean) =>
  useQuery({
    queryKey: ['users', params],
    enabled,
    queryFn: async () => {
      const response = await api.get<ApiResponse<AuthUser[]>>('/users', { params });
      return response.data;
    },
  });

export const useSaveRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<RecordItem> & { id?: string }) => {
      if (payload.id) {
        const response = await api.put<ApiResponse<RecordItem>>(`/records/${payload.id}`, payload);
        return response.data.data;
      }

      const response = await api.post<ApiResponse<RecordItem>>('/records', payload);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['records'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useDeleteRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/records/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['records'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useSaveUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<AuthUser> & { id?: string; password?: string }) => {
      if (payload.id) {
        const response = await api.put<ApiResponse<AuthUser>>(`/users/${payload.id}`, payload);
        return response.data.data;
      }

      const response = await api.post<ApiResponse<AuthUser>>('/users', payload);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
