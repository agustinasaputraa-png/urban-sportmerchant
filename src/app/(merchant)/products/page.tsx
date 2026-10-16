"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  SlidersHorizontal,
  Pencil,
  MoreHorizontal,
  PackageOpen,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageHeading } from "@/components/ui";

type Store = {
  id: string;
  name: string;
};

type ApiProduct = {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  price: number | string;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  category?: {
    id: string;
    name: string;
  } | null;
};

type Product = ApiProduct & {
  priceNumber: number;
  categoryName: string;
  status: "Aktif" | "Nonaktif";
};

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message || `Permintaan gagal dengan status ${response.status}`,
    );
  }

  // Mendukung respons API berbentuk { success, data } maupun data langsung.
  return (result?.data ?? result) as T;
}

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const supabase = createClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.access_token) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      const headers = {
        Authorization: `Bearer ${session.access_token}`,
      };

      const storesResponse = await fetch(`${API_URL}/proshop/merchant/stores`, {
        headers,
        cache: "no-store",
      });

      const storesResult = await readResponse<Store[] | { data: Store[] }>(
        storesResponse,
      );

      const stores = Array.isArray(storesResult)
        ? storesResult
        : storesResult.data;

      if (!stores?.length) {
        setStore(null);
        setProducts([]);
        setError(
          "Akun ini belum memiliki toko Proshop. Toko harus terhubung dengan profil akun yang sedang login.",
        );
        return;
      }

      // Untuk tahap awal, gunakan toko pertama milik akun.
      const selectedStore = stores[0];
      setStore(selectedStore);

      const productsResponse = await fetch(
        `${API_URL}/proshop/merchant/stores/${selectedStore.id}/products`,
        { headers, cache: "no-store" },
      );

      const productsResult = await readResponse<
        ApiProduct[] | { data: ApiProduct[] }
      >(productsResponse);

      const rows = Array.isArray(productsResult)
        ? productsResult
        : productsResult.data;

      setProducts(
        (rows ?? []).map((product) => ({
          ...product,
          priceNumber: Number(product.price),
          categoryName: product.category?.name || "Tanpa kategori",
          status: product.is_active ? "Aktif" : "Nonaktif",
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil data produk.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery = [
        product.name,
        product.sku ?? "",
        product.categoryName,
        store?.name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);

      const matchesFilter = filter === "Semua" || product.status === filter;

      return matchesQuery && matchesFilter;
    });
  }, [products, query, filter, store]);

  async function updateStatus(product: Product) {
    if (!store || busyId) return;

    setBusyId(product.id);
    setError("");
    setNotice("");

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Sesi login berakhir. Silakan login ulang.");
      }

      const response = await fetch(
        `${API_URL}/proshop/merchant/stores/${store.id}/products/${product.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !product.is_active,
          }),
        },
      );

      await readResponse(response);

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                is_active: !product.is_active,
                status: product.is_active ? "Nonaktif" : "Aktif",
              }
            : item,
        ),
      );

      setNotice(`Status produk "${product.name}" berhasil diperbarui.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengubah status produk.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteProduct(product: Product) {
    if (!store || busyId) return;

    const confirmed = window.confirm(
      `Nonaktifkan produk "${product.name}"? Produk tidak dihapus permanen.`,
    );

    if (!confirmed) return;

    setBusyId(product.id);
    setError("");
    setNotice("");

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Sesi login berakhir. Silakan login ulang.");
      }

      const response = await fetch(
        `${API_URL}/proshop/merchant/stores/${store.id}/products/${product.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      await readResponse(response);

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, is_active: false, status: "Nonaktif" }
            : item,
        ),
      );

      setNotice(`Produk "${product.name}" berhasil dinonaktifkan.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menonaktifkan produk.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="Katalog"
        title="Produk"
        description="Kelola katalog, harga, dan ketersediaan produk di toko Anda."
        action={
          <Link
            href="/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-black hover:bg-[#63f0f2]"
          >
            <Plus size={17} />
            Tambah Produk
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3.5">
          <Search size={17} className="text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama produk, SKU, kategori..."
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-gray-600"
          />
        </label>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={17} className="text-gray-500" />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-11 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 text-sm outline-none"
          >
            <option>Semua</option>
            <option>Aktif</option>
            <option>Nonaktif</option>
          </select>

          <button
            type="button"
            onClick={() => void loadProducts()}
            disabled={loading}
            title="Muat ulang produk"
            className="rounded-xl border border-[var(--border)] p-3 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {store && (
        <p className="mb-4 text-sm text-gray-400">
          Toko aktif:{" "}
          <span className="font-semibold text-white">{store.name}</span>
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="font-semibold">
              Semua Produk{" "}
              <span className="ml-1 text-gray-500">({filtered.length})</span>
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Data dari backend BigApps.
            </p>
          </div>
          <span className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-gray-400">
            Terbaru dulu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#202020] text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Produk</th>
                <th className="px-4 py-4 font-semibold">Kategori</th>
                <th className="px-4 py-4 font-semibold">Harga</th>
                <th className="px-4 py-4 font-semibold">Stok</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {!loading &&
                filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-white/[.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#292929] text-[10px] font-bold text-[var(--accent)]">
                          {product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            "PRODUK"
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-100">
                            {product.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            SKU: {product.sku || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-400">
                      {product.categoryName}
                    </td>

                    <td className="px-4 py-4 font-semibold">
                      {rupiah(product.priceNumber)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={
                          product.stock <= 5
                            ? "text-amber-300"
                            : "text-gray-300"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          product.is_active
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-gray-500/15 text-gray-400"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          title="Edit produk"
                          href={`/products/new?edit=${product.id}`}
                          className="rounded-lg border border-[var(--border)] p-2 text-gray-400 hover:text-[var(--accent)]"
                        >
                          <Pencil size={16} />
                        </Link>

                        <button
                          type="button"
                          title="Ubah status"
                          disabled={busyId === product.id}
                          onClick={() => void updateStatus(product)}
                          className="rounded-lg border border-[var(--border)] p-2 text-gray-400 hover:text-white disabled:opacity-50"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        <button
                          type="button"
                          title="Nonaktifkan produk"
                          disabled={busyId === product.id || !product.is_active}
                          onClick={() => void deleteProduct(product)}
                          className="rounded-lg border border-[var(--border)] p-2 text-gray-400 hover:text-red-400 disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-12 text-center text-sm text-gray-400">
            Memuat produk dari server...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center">
            <PackageOpen className="mx-auto mb-3 text-gray-600" size={30} />
            <p className="font-semibold">Produk tidak ditemukan</p>
            <p className="mt-1 text-sm text-gray-500">
              Coba ubah pencarian atau filter, atau tambahkan produk baru.
            </p>
          </div>
        )}

        <div className="border-t border-[var(--border)] px-5 py-4 text-xs text-gray-500">
          Menampilkan {filtered.length} dari {products.length} produk
          {loading ? " — memuat data..." : ""}
        </div>
      </div>
    </div>
  );
}
