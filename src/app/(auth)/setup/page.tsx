"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { setupSchema, type SetupInput } from "@/lib/validation/auth";

type CheckState = "checking" | "available" | "unavailable";

export default function SetupPage() {
  const router = useRouter();
  const [checkState, setCheckState] = useState<CheckState>("checking");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ data: { available: boolean } }>("/setup")
      .then((res) => {
        if (res.data.available) {
          setCheckState("available");
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const form = useForm<SetupInput>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      nama: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SetupInput) {
    setSubmitting(true);
    try {
      await apiClient.post("/setup", values);
      toast.success("Akun Inventaris berhasil dibuat. Silakan masuk.");
      router.push("/login");
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (checkState !== "available") {
    return (
      <div className="text-center text-sm text-muted-foreground">Memeriksa status setup...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-base font-semibold">Setup Akun Inventaris</h2>
        <p className="text-sm text-muted-foreground">
          Buat akun pertama dengan peran Inventaris untuk mengelola sistem
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama</FormLabel>
                <FormControl>
                  <Input placeholder="Nama lengkap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="nama@staff.uns.ac.id" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Minimal 8 karakter" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Memproses..." : "Buat Akun"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
