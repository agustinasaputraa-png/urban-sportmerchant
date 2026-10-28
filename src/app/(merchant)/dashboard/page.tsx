"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CircleAlert,
  Package,
  RefreshCw,
  ShoppingBag,
  Wallet,
  MapPin,
  Phone,
} from "lucide-react";

import { PageHeading } from "@/components/ui";
import { getMerchantStores, type MerchantStore } from "@/lib/merchant.service";

type StatItem = {
  label: string;
  value: string;
  note: string;
  icon: typeof Package;
  color: string;
  bg: string;
};

function createStats(storeCount: number): StatItem[] {
  return [
    {
      label: "Toko Terdaftar",
      value: String(storeCount),
      note: "Toko milik akun Anda",
      icon: Building2,
      color: "text-cyan-300",
      bg: "bg-cyan-300/10",
    },
    {
      label: "Total Produk",
      value: "—",
      note: "Data produk belum dimuat",
      icon: Package,
      color: "text-violet-300",
      bg: "bg-violet-300/10",
    },
    {
      label: "Pesanan Baru",
      value: "—",
      note: "Data pesanan belum dimuat",
      icon: ShoppingBag,
      color: "text-emerald-300",
      bg: "bg-emerald-300/10",
    },
    {
      label: "Stok Menipis",
      value: "—",
      note: "Data stok belum dimuat",
      icon: CircleAlert,
      color: "text-amber-300",
      bg: "bg-amber-300/10",
    },
  ];
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StoreCard({ store }: { store: MerchantStore }) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-black/10 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
          <Building2 size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-words font-semibold">{store.name}</h3>

          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              store.is_active
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-gray-400/10 text-gray-400"
            }`}
          >
            {store.is_active ? "Aktif" : "Nonaktif"}
          </span>
        </div>
      </div>

      {store.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-400">
          {store.description}
        </p>
      )}

      {store.address && (
        <div className="mt-4 flex items-start gap-2 text-sm text-gray-400">
          <MapPin size={15} className="mt-0.5 shrink-0" />
          <span className="break-words">{store.address}</span>
        </div>
      )}

      {store.phone && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
          <Phone size={15} className="shrink-0" />
          <span>{store.phone}</span>
        </div>
      )}

      <div className="mt-4 border-t border-[var(--border)] pt-3 text-xs text-gray-500">
        Terdaftar {formatDate(store.created_at)}
      </div>

      <Link
        href="/products"
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
      >
        Kelola produk
        <ArrowRight size={15} />
      </Link>
    </article>
  );
}

export default function DashboardPage() {
  const [stores, setStores] = useState<MerchantStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMerchantStores = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getMerchantStores();

      if (!response || !Array.isArray(response.data)) {
        throw new Error("Format data toko dari backend tidak sesuai.");
      }

      // Hanya tampilkan toko aktif pada dashboard merchant.
      // Backend tetap bertanggung jawab memverifikasi kepemilikan toko.
      setStores(response.data.filter((store) => store.is_active));
    } catch (err) {
      setStores([]);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data toko merchant.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMerchantStores();
  }, [loadMerchantStores]);

  const stats = createStats(stores.length);

  return (
    <div>
      <PageHeading
        eyebrow="Overview"
        title="Dashboard"
        description="Kelola toko dan pantau aktivitas merchant Anda."
        action={
          <Link
            href="/products/new"
            className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-black hover:bg-[#63f0f2]"
          >
            + Tambah Produk
          </Link>
        }
      />

      {/* Ringkasan toko */}
      <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
              <Building2 size={23} />
            </div>

            <div>
              <p className="text-xs text-gray-500">Akun Merchant</p>
              <h2 className="mt-1 text-lg font-bold">Toko Saya</h2>

              <p className="mt-2 text-xs text-gray-500">
                {loading
                  ? "Mengambil data dari backend..."
                  : error
                    ? "Data toko belum berhasil dimuat"
                    : `${stores.length} toko aktif`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadMerchantStores()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
            <p className="text-sm font-semibold text-red-300">
              Gagal memuat data toko
            </p>

            <p className="mt-1 break-words text-xs leading-5 text-red-200/80">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadMerchantStores()}
              className="mt-3 text-sm font-semibold text-red-300 underline"
            >
              Coba lagi
            </button>
          </div>
        )}
      </section>

      {/* Statistik tanpa data demo */}
      <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon, color, bg }) => (
          <article
            key={label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-400">{label}</p>

              <span className={`rounded-xl p-2.5 ${bg} ${color}`}>
                <Icon size={19} />
              </span>
            </div>

            <p className="text-2xl font-bold tracking-tight">
              {loading && label === "Toko Terdaftar" ? "..." : value}
            </p>

            <p className="mt-2 text-xs text-gray-500">{note}</p>
          </article>
        ))}
      </section>

      {/* Daftar toko aktual dari backend */}
      <section className="mb-7 rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="font-semibold">Toko Saya</h2>
            <p className="mt-1 text-xs text-gray-500">
              Data toko dari backend UrbanSport
            </p>
          </div>

          <Building2 size={19} className="text-cyan-300" />
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <RefreshCw size={16} className="animate-spin" />
              Memuat daftar toko...
            </div>
          ) : error ? (
            <p className="text-sm text-gray-400">
              Daftar toko tidak dapat dimuat. Periksa koneksi API dan sesi login
              merchant.
            </p>
          ) : stores.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
              <Building2 size={28} className="mx-auto text-gray-500" />

              <p className="mt-3 text-sm font-semibold">Belum ada toko aktif</p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-gray-500">
                Akun ini belum memiliki toko aktif yang dikembalikan oleh
                backend. Pastikan pendaftaran toko selesai dan kepemilikan toko
                sesuai dengan akun Supabase yang sedang login.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Akses cepat */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <h2 className="font-semibold">Akses Cepat</h2>

        <p className="mt-1 text-sm text-gray-500">Kelola katalog toko Anda.</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold hover:bg-white/5"
          >
            <Package size={17} />
            Daftar Produk
            <ArrowRight size={15} />
          </Link>

          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-black hover:bg-[#63f0f2]"
          >
            <Package size={17} />
            Tambah Produk
          </Link>
        </div>
      </section>
    </div>
  );
}
