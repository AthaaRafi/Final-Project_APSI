import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return ok(data, { status: 201 });
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export function paginated<T>(
  data: T[],
  page: number,
  size: number,
  total: number,
): NextResponse<PaginatedResult<T>> {
  return NextResponse.json({
    data,
    page,
    size,
    total,
    totalPages: size > 0 ? Math.ceil(total / size) : 0,
  });
}
