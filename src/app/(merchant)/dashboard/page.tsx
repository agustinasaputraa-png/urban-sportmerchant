"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  Package,
  ShoppingBag,
  Wallet,
  Building2,
  RefreshCw,
} from "lucide-react";

import { PageHeading } from "@/components/ui";
import { demoProducts, discountedPrice, rupiah } from "@/lib/demo-products";
import {
  getMerchantProfile,
  type MerchantMeResponse,
} from "@/lib/merchant.service";

const stats = [
  {
    label: "Total Produk",
    value: "24",
    note: "Data demo",
    icon: Package,
    color: "text-cyan-300",
    bg: "bg-cyan-300/10",
    up: true,
  },
  {
    label: "Pesanan Baru",
    value: "0",
    note: "Integrasi pesanan menyusul",
    icon: ShoppingBag,
    color: "text-violet-300",
    bg: "bg-violet-300/10",
    up: true,
  },
  {
    label: "Pendapatan",
    value: "Rp 0",
    note: "Integrasi pembayaran menyusul",
    icon: Wallet,
    color: "text-emerald-300",
    bg: "bg-emerald-300/10",
    up: true,
  },
  {
    label: "Stok Menipis",
    value: String(demoProducts.filter((product) => product.stock <= 5).length),
    note: "Data demo",
    icon: CircleAlert,
    color: "text-amber-300",
    bg: "bg-amber-300/10",
    up: false,
  },
];

export default function DashboardPage() {
  const [merchantData, setMerchantData] = useState<
    MerchantMeResponse["data"] | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const lowStock = demoProducts.filter((product) => product.stock <= 5);

  async function loadMerchant() {
    setLoading(true);
    setError("");

    try {
      const response = await getMerchantProfile();
      setMerchantData(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil data merchant.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMerchant();
  }, []);

  const profile = merchantData?.profile;
  const venues = merchantData?.venues ?? [];

  return (
    <div>
      <PageHeading
        eyebrow="Overview"
        title="Dashboard"
        description="Selamat datang kembali. Berikut ringkasan toko Anda hari ini."
        action={
          <Link
            href="/products/new"
            className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-black hover:bg-[#63f0f2]"
          >
            + Tambah Produk
          </Link>
        }
      />

      {/* Profil merchant dari backend */}
      <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
              <Building2 size={23} />
            </div>

            <div>
              <p className="text-xs text-gray-500">Akun Merchant</p>

              <h2 className="mt-1 text-lg font-bold">
                {loading
                  ? "Memuat profil..."
                  : profile?.full_name || "Nama belum tersedia"}
              </h2>

              {profile?.phone && (
                <p className="mt-1 text-sm text-gray-400">{profile.phone}</p>
              )}

              <p className="mt-2 text-xs text-gray-500">
                {venues.length} venue terhubung
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadMerchant()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
            <p className="text-sm font-semibold text-red-300">
              Gagal memuat data merchant
            </p>
            <p className="mt-1 break-words text-xs leading-5 text-red-200/80">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void loadMerchant()}
              className="mt-3 text-sm font-semibold text-red-300 underline"
            >
              Coba lagi
            </button>
          </div>
        )}
      </section>

      {/* Statistik */}
      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon, color, bg, up }) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-gray-400">{label}</p>
              <span className={`rounded-xl p-2.5 ${bg} ${color}`}>
                <Icon size={19} />
              </span>
            </div>

            <p className="text-2xl font-bold tracking-tight">{value}</p>

            <p
              className={`mt-2 flex items-center gap-1 text-xs ${
                up ? "text-gray-500" : "text-amber-300"
              }`}
            >
              {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {note}
            </p>
          </div>
        ))}
      </div>

      {/* Venue dari backend */}
      <section className="mb-7 rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="font-semibold">Venue Saya</h2>
            <p className="mt-1 text-xs text-gray-500">
              Data venue dari backend UrbanSport
            </p>
          </div>

          <Building2 size={19} className="text-cyan-300" />
        </div>

        <div className="p-5">
          {loading ? (
            <p className="text-sm text-gray-400">Memuat daftar venue...</p>
          ) : error ? (
            <p className="text-sm text-gray-400">
              Venue belum dapat dimuat. Periksa koneksi API dan sesi login.
            </p>
          ) : venues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
              <Building2 size={28} className="mx-auto text-gray-500" />
              <p className="mt-3 text-sm font-semibold">
                Belum ada venue terhubung
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Pastikan akun merchant sudah memiliki relasi venue pada tabel
                merchant_venues di database.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {venues.map((venue) => (
                <article
                  key={venue.id}
                  className="rounded-xl border border-[var(--border)] bg-[#202020] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                      <Building2 size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-semibold">
                        {venue.name || "Venue tanpa nama"}
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        {venue.type || "Jenis venue belum tersedia"}
                      </p>
                    </div>
                  </div>

                  {venue.address && (
                    <p className="mt-3 text-xs leading-5 text-gray-500">
                      {venue.address}
                    </p>
                  )}

                  <div className="mt-4 border-t border-[var(--border)] pt-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs ${
                        venue.status === true
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-gray-500/15 text-gray-400"
                      }`}
                    >
                      {venue.status === true
                        ? "Aktif"
                        : "Status tidak aktif / belum diketahui"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Produk demo yang sudah ada tetap dipertahankan */}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div>
              <h2 className="font-semibold">Produk Terbaru</h2>
              <p className="mt-1 text-xs text-gray-500">
                Ringkasan produk demo
              </p>
            </div>

            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-semibold text-[var(--accent)]"
            >
              Lihat semua <ArrowRight size={15} />
            </Link>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {demoProducts.slice(0, 4).map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 px-5 py-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#292929] text-xl">
                  {product.sport === "GOLF"
                    ? "⛳"
                    : product.sport === "PADEL"
                      ? "🎾"
                      : "🏃"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {product.sku} · Stok {product.stock}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {rupiah(
                      discountedPrice(product.price, product.discountPercent),
                    )}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-gray-500/15 px-2 py-1 text-[10px] text-gray-400">
                    {product.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="font-semibold">Perlu Perhatian</h2>
            <p className="mt-1 text-xs text-gray-500">
              Stok produk demo yang perlu dicek
            </p>
          </div>

          <div className="space-y-3 p-5">
            {lowStock.length ? (
              lowStock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[#202020] p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-300/10 text-lg">
                    {product.sport === "GOLF"
                      ? "⛳"
                      : product.sport === "PADEL"
                        ? "🎾"
                        : "🏃"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {product.stock === 0
                        ? "Stok habis"
                        : `Sisa ${product.stock} item`}
                    </p>
                  </div>

                  <span className="rounded-lg bg-amber-300/10 px-2 py-1 text-xs text-amber-300">
                    {product.stock === 0 ? "Habis" : "Rendah"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Tidak ada stok menipis.</p>
            )}
          </div>

          <div className="mx-5 mb-5 rounded-xl border border-dashed border-[var(--border)] p-4">
            <p className="text-sm font-semibold">Tips untuk merchant</p>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Gunakan foto yang jelas, nama produk yang spesifik, dan stok yang
              akurat agar katalog UrbanSport selalu terbarui.
            </p>
          </div>
        </section>
      </div>

      <p className="mt-6 text-xs text-gray-600">
        Profil dan venue berasal dari backend. Statistik transaksi dan produk
        masih menggunakan data demo.
      </p>
    </div>
  );
}
