import type { ProblemDetails } from "@/lib/api/errors";
import type { PaginatedResult } from "@/lib/api/response";

export class ApiClientError extends Error {
  status: number;
  title: string;
  errors?: Record<string, string>;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.status = problem.status;
    this.title = problem.title;
    this.errors = problem.errors;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const { body, headers, ...rest } = options ?? {};

  const res = await fetch(`/api${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as ProblemDetails | null;
    throw new ApiClientError(
      problem ?? { title: "Terjadi kesalahan", status: res.status },
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};

export async function postFormData<T>(path: string, formData: FormData, method: "POST" | "PUT" = "POST"): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: "include",
    body: formData,
    // Do NOT set Content-Type header — browser sets multipart/form-data with boundary automatically
  });

  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as ProblemDetails | null;
    throw new ApiClientError(
      problem ?? { title: "Terjadi kesalahan", status: res.status },
    );
  }

  return res.json() as Promise<T>;
}

export async function fetchData<T>(path: string, options?: RequestOptions): Promise<T> {
  const res = await apiClient.get<{ data: T }>(path, options);
  return res.data;
}

export async function fetchPaginated<T>(path: string, options?: RequestOptions): Promise<PaginatedResult<T>> {
  return apiClient.get<PaginatedResult<T>>(path, options);
}
