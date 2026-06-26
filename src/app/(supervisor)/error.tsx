"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
        <AlertCircle className="size-7 text-red-600 dark:text-red-400" />
      </div>
      <div className="space-y-1">
        <h2 className="font-display font-semibold text-lg">Terjadi kesalahan</h2>
        <p className="text-sm text-muted-foreground max-w-md">{error.message}</p>
      </div>
      <Button variant="outline" onClick={reset}>
        <RotateCcw className="size-3.5" />
        Coba Lagi
      </Button>
    </div>
  );
}
