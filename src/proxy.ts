import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { verifySessionToken } from "@/lib/auth/jwt";

const PUBLIC_PATHS = ["/login", "/register", "/setup", "/verify", "/forgot", "/reset"];

const ROLE_REDIRECT: Record<Role, string> = {
  PENGGUNA: "/dashboard",
  PJ_RUANG: "/area",
  LABORAN: "/area",
  INVENTARIS: "/inventaris",
  PIMPINAN: "/supervisor",
};

const ROUTE_ROLES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/dashboard", roles: ["PENGGUNA"] },
  { prefix: "/pelapor", roles: ["PENGGUNA"] },
  { prefix: "/area", roles: ["PJ_RUANG", "LABORAN"] },
  { prefix: "/approval", roles: ["PJ_RUANG", "LABORAN"] },
  { prefix: "/scan", roles: ["PJ_RUANG", "LABORAN", "INVENTARIS"] },
  { prefix: "/inventaris", roles: ["INVENTARIS"] },
  { prefix: "/master", roles: ["INVENTARIS"] },
  { prefix: "/kategori-approval", roles: ["INVENTARIS"] },
  { prefix: "/konfigurasi-label", roles: ["INVENTARIS"] },
  { prefix: "/users", roles: ["INVENTARIS"] },
  { prefix: "/supervisor", roles: ["PIMPINAN"] },
  { prefix: "/maintenance", roles: ["PJ_RUANG", "LABORAN", "INVENTARIS"] },
  { prefix: "/export", roles: ["INVENTARIS", "PIMPINAN"] },
  { prefix: "/panduan", roles: ["INVENTARIS"] },
  { prefix: "/laporan", roles: ["INVENTARIS", "PIMPINAN"] },
  { prefix: "/penghapusan", roles: ["INVENTARIS"] },
  { prefix: "/barang", roles: ["INVENTARIS", "PIMPINAN"] },
  { prefix: "/lapor", roles: ["PENGGUNA", "PIMPINAN"] },
  { prefix: "/notifikasi", roles: ["PENGGUNA", "PJ_RUANG", "LABORAN", "INVENTARIS"] },
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  let session;
  try {
    session = await verifySessionToken(token);
  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(ROLE_REDIRECT[session.role], req.url));
  }

  const matched = ROUTE_ROLES.find((r) => pathname.startsWith(r.prefix));
  if (matched && !matched.roles.includes(session.role)) {
    return NextResponse.redirect(new URL(ROLE_REDIRECT[session.role], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
