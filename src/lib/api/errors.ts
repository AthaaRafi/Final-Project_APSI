import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ProblemDetails {
  title: string;
  status: number;
  detail?: string;
  errors?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  title: string;
  errors?: Record<string, string>;

  constructor(status: number, title: string, detail?: string, errors?: Record<string, string>) {
    super(detail ?? title);
    this.status = status;
    this.title = title;
    this.errors = errors;
  }

  static badRequest(detail?: string, errors?: Record<string, string>) {
    return new ApiError(400, "Permintaan tidak valid", detail, errors);
  }

  static unauthorized(detail = "Anda harus login untuk mengakses resource ini") {
    return new ApiError(401, "Tidak terautentikasi", detail);
  }

  static forbidden(detail = "Anda tidak memiliki izin untuk mengakses resource ini") {
    return new ApiError(403, "Akses ditolak", detail);
  }

  static notFound(detail = "Data tidak ditemukan") {
    return new ApiError(404, "Tidak ditemukan", detail);
  }

  static conflict(detail?: string, errors?: Record<string, string>) {
    return new ApiError(409, "Konflik data", detail, errors);
  }

  static unprocessable(detail?: string, errors?: Record<string, string>) {
    return new ApiError(422, "Validasi gagal", detail, errors);
  }
}

function zodErrorToErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_";
    if (!(path in errors)) {
      errors[path] = issue.message;
    }
  }
  return errors;
}

export function toProblemResponse(error: unknown): NextResponse<ProblemDetails> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { title: error.title, status: error.status, detail: error.message, errors: error.errors },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        title: "Validasi gagal",
        status: 422,
        detail: "Periksa kembali data yang Anda masukkan",
        errors: zodErrorToErrors(error),
      },
      { status: 422 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { title: "Terjadi kesalahan pada server", status: 500, detail: "Silakan coba lagi nanti" },
    { status: 500 },
  );
}
