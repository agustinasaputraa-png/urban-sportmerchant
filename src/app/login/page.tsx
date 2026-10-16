"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function MerchantLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const next = searchParams.get("next");

      // Hindari redirect ke URL eksternal.
      const safeNext =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/dashboard";

      router.replace(safeNext);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login gagal. Periksa email dan password Anda.",
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-white/10 bg-[#101619] px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#14E1E6] focus:ring-2 focus:ring-[#14E1E6]/15";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#101416] px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171d20] p-6 shadow-2xl sm:p-8">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Urban<span className="text-[#14E1E6]">Sport</span>
        </Link>

        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.25em] text-[#14E1E6]">
          Merchant Portal
        </p>

        <h1 className="mt-3 text-3xl font-bold">Masuk ke akun</h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Masuk ke UrbanSport Merchant untuk mengelola bisnis, produk, stok, dan
          pesanan Anda.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Email
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@bisnis.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Password
            <input
              className={inputClass}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              className="accent-[#14E1E6]"
            />
            Tampilkan password
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#14E1E6] px-4 py-3 font-semibold text-[#061719] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Belum punya akun merchant?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#14E1E6] hover:underline"
          >
            Buka account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function MerchantLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#101416] text-white">
          <p className="text-sm text-slate-400">Memuat halaman login...</p>
        </main>
      }
    >
      <MerchantLoginForm />
    </Suspense>
  );
}
