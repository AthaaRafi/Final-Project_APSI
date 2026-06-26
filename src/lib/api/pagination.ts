const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;

export interface PaginationParams {
  page: number;
  size: number;
  skip: number;
  take: number;
}

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(0, Number(searchParams.get("page") ?? 0) || 0);
  const size = Math.min(MAX_SIZE, Math.max(1, Number(searchParams.get("size") ?? DEFAULT_SIZE) || DEFAULT_SIZE));

  return { page, size, skip: page * size, take: size };
}
