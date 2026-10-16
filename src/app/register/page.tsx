"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const businessTypes = [
  "Golf",
  "Padel",
  "Gym",
  "Billiard",
  "Proshop",
  "Lainnya",
];

export default function MerchantRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== confirmPassword)
      return setError("Konfirmasi password tidak sama.");
    if (!accepted) return setError("Centang persetujuan sebelum mendaftar.");

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: name.trim(),
            business_name: businessName.trim(),
            business_type: businessType,
            phone: phone.trim(),
            account_role: "merchant",
          },
        },
      });
      if (signUpError) throw signUpError;

      if (!data.session) {
        setSuccess(true);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Pendaftaran gagal. Silakan coba kembali.",
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-white/10 bg-[#101619] px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#14E1E6] focus:ring-2 focus:ring-[#14E1E6]/15";
  const labelClass = "block text-sm font-medium text-slate-200";

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#101416] px-4 py-10 text-white">
        <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171d20] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#14E1E6]/15 text-3xl text-[#14E1E6]">
            ✓
          </div>
          <h1 className="mt-5 text-2xl font-bold">Pendaftaran Berhasil</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Periksa email <span className="text-white">{email}</span> untuk
            konfirmasi akun jika diminta oleh Supabase.
          </p>
          <Link
            href="/login"
            className="mt-7 block w-full rounded-lg bg-[#14E1E6] px-4 py-3 font-semibold text-[#061719] hover:brightness-110"
          >
            Masuk ke Akun
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#101416] px-4 py-10 text-white">
      <div className="mx-auto grid min-h-[80vh] max-w-5xl items-center gap-10 md:grid-cols-2">
        <section className="hidden md:block">
          <Link href="/" className="text-3xl font-bold tracking-tight">
            Urban<span className="text-[#14E1E6]">Sport</span>
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-[#14E1E6]">
            Merchant Portal
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-tight">
            Bergabung sebagai <span className="text-[#14E1E6]">Merchant</span>
          </h1>
          <p className="mt-5 max-w-md leading-7 text-slate-400">
            Daftarkan bisnis Anda dan kelola produk, pesanan, serta operasional
            melalui dashboard UrbanSport Merchant.
          </p>
          <div className="mt-8 space-y-5 text-sm text-slate-300">
            <p>✓ Kelola produk dan stok</p>
            <p>✓ Pantau pesanan</p>
            <p>✓ Kelola informasi bisnis</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#171d20] p-6 shadow-2xl sm:p-8">
          <Link href="/" className="text-2xl font-bold md:hidden">
            Urban<span className="text-[#14E1E6]">Sport</span>
          </Link>
          <h2 className="mt-2 text-2xl font-bold">Buka Account Merchant</h2>
          <p className="mt-2 text-sm text-slate-400">
            Daftarkan bisnis Anda ke platform UrbanSport.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className={labelClass}>
              Nama lengkap
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama pemilik akun"
                autoComplete="name"
                required
              />
            </label>
            <label className={labelClass}>
              Nama bisnis / venue
              <input
                className={inputClass}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Nama bisnis Anda"
                required
              />
            </label>
            <label className={labelClass}>
              Jenis bisnis
              <select
                className={inputClass}
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                required
              >
                <option value="">Pilih jenis bisnis</option>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Nomor telepon / WhatsApp
              <input
                className={inputClass}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                autoComplete="tel"
                required
              />
            </label>
            <label className={labelClass}>
              Email
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@bisnis.com"
                autoComplete="email"
                required
              />
            </label>
            <label className={labelClass}>
              Password
              <input
                className={inputClass}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label className={labelClass}>
              Konfirmasi password
              <input
                className={inputClass}
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan ulang password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="accent-[#14E1E6]"
              />{" "}
              Tampilkan password
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm leading-5 text-slate-400">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 accent-[#14E1E6]"
              />
              Saya menyatakan bahwa informasi yang diberikan benar dan dapat
              dipertanggungjawabkan.
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
              {loading ? "Mendaftarkan..." : "Buat Account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#14E1E6] hover:underline"
            >
              Masuk
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
