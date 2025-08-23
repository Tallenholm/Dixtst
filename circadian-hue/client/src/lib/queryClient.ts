import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { ApiError, fetchJson } from "./api";

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      return await fetchJson<T>(queryKey.join("/") as string);
    } catch (err) {
      if (
        err instanceof ApiError &&
        unauthorizedBehavior === "returnNull" &&
        err.status === 401
      ) {
        return null as T;
      }
      throw err;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
