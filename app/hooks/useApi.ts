"use client";

import { useCallback, useState } from "react";
import type { AxiosRequestConfig, AxiosError } from "axios";

import { api } from "@/lib/axios/client";

interface UsePostReturn<TResponse, TPayload> {
  postData: (
    payload: TPayload,
    config?: AxiosRequestConfig,
  ) => Promise<TResponse>;
  loading: boolean;
  error: AxiosError | null;
}

export function usePost<TResponse = unknown, TPayload = unknown>(
  endpoint: string,
  defaultConfig?: AxiosRequestConfig,
): UsePostReturn<TResponse, TPayload> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AxiosError | null>(null);

  const postData = useCallback(
    async (
      payload: TPayload,
      config?: AxiosRequestConfig,
    ): Promise<TResponse> => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.post<TResponse>(endpoint, payload, {
          ...defaultConfig,
          ...config,
        });

        return response.data;
      } catch (err) {
        const axiosError = err as AxiosError;
        setError(axiosError);
        throw axiosError;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, defaultConfig],
  );

  return {
    postData,
    loading,
    error,
  };
}

export function useGet<TResponse = unknown>(
  endpoint: string,
  defaultConfig?: AxiosRequestConfig,
): {
  getData: (config?: AxiosRequestConfig) => Promise<TResponse>;
  loading: boolean;
  error: AxiosError | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AxiosError | null>(null);

  const getData = useCallback(
    async (config?: AxiosRequestConfig): Promise<TResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<TResponse>(endpoint, {
          ...defaultConfig,
          ...config,
        });
        return response.data;
      } catch (err) {
        const axiosError = err as AxiosError;
        setError(axiosError);
        throw axiosError;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, defaultConfig],
  );

  return {
    getData,
    loading,
    error,
  };
}

export function usePatch<TResponse = unknown, TPayload = unknown>(
  endpoint: string,
  defaultConfig?: AxiosRequestConfig,
): {
  patchData: (
    payload: TPayload,
    config?: AxiosRequestConfig,
  ) => Promise<TResponse>;
  loading: boolean;
  error: AxiosError | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AxiosError | null>(null);

  const patchData = useCallback(
    async (
      payload: TPayload,
      config?: AxiosRequestConfig,
    ): Promise<TResponse> => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.patch<TResponse>(endpoint, payload, {
          ...defaultConfig,
          ...config,
        });
        return response.data;
      } catch (err) {
        const axiosError = err as AxiosError;
        setError(axiosError);
        throw axiosError;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, defaultConfig],
  );

  return {
    patchData,
    loading,
    error,
  };
}
