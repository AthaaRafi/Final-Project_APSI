"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { apiClient, ApiClientError } from "@/lib/api/client";

type VerifyState = "loading" | "success" | "error";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerifyState>(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Token verifikasi tidak ditemukan.");

  useEffect(() => {
    if (!token) {
      return;
    }

    apiClient
      .post("/auth/verify", { token })
      .then(() => setState("success"))
      .catch((error) => {
        setState("error");
        setMessage(
          error instanceof ApiClientError ? error.message : "Verifikasi gagal.",
        );
      });
  }, [token]);

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-base font-semibold">Verifikasi Akun</h2>

      {state === "loading" && (
        <p className="text-sm text-muted-foreground">Memverifikasi akun Anda...</p>
      )}

      {state === "success" && (
        <p className="text-sm text-muted-foreground">
          Akun Anda berhasil diverifikasi. Anda sekarang dapat masuk.
        </p>
      )}

      {state === "error" && <p className="text-sm text-destructive">{message}</p>}

      <Link href="/login" className="text-sm text-primary underline-offset-4 hover:underline">
        Kembali ke halaman masuk
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground text-center">Memuat...</p>}>
      <VerifyContent />
    </Suspense>
  );
}
