"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import type { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import type { z } from "zod";

type LoginFormValues = z.input<typeof loginSchema>;

const ROLE_REDIRECT: Record<Role, string> = {
  PENGGUNA: "/dashboard",
  PJ_RUANG: "/area",
  LABORAN: "/area",
  INVENTARIS: "/inventaris",
  PIMPINAN: "/supervisor",
};

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true);
    try {
      const payload: LoginInput = { ...values, rememberMe: values.rememberMe ?? false };
      const res = await apiClient.post<{ data: { role: Role } }>("/auth/login", payload);
      router.push(ROLE_REDIRECT[res.data.role]);
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1.5 text-center">
        <h2 className="font-display text-xl font-bold tracking-tight">Masuk ke akun Anda</h2>
        <p className="text-sm text-muted-foreground">Gunakan email kampus UNS untuk masuk</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                    <Input
                      type="email"
                      placeholder="nama@student.uns.ac.id"
                      className="pl-9"
                      {...field}
                    />
                  </div>
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
                <FormLabel className="text-sm font-medium">Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="Masukkan password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <Label className="text-sm font-normal text-muted-foreground cursor-pointer">
                    Ingat saya
                  </Label>
                </FormItem>
              )}
            />
            <Link
              href="/forgot"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Lupa password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-150"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Masuk
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="flex items-center gap-3 my-2">
        <span className="flex-1 h-px bg-border/60" />
        <span className="text-xs text-muted-foreground/70">atau</span>
        <span className="flex-1 h-px bg-border/60" />
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
