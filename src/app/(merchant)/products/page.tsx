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
  Store as StoreIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageHeading } from "@/components/ui";

type Store = {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
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
  category?: { id: string; name: string } | null;
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
    const message = Array.isArray(result?.message)
      ? result.message.join(", ")
      : result?.message;

    throw new Error(
      message || `Permintaan gagal dengan status ${response.status}`,
    );
  }

  return (result?.data ?? result) as T;
}

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;

  if (!session?.access_token) {
    throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
  }

  return session.access_token;
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
  const [creatingStore, setCreatingStore] = useState(false);

  const [storeForm, setStoreForm] = useState({
    name: "",
    description: "",
    logo_url: "",
    phone: "",
    whatsapp: "",
    address: "",
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const token = await getAccessToken();

      const response = await fetch(`${API_URL}/proshop/merchant/stores`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const result = await readResponse<Store[]>(response);
      const stores = Array.isArray(result) ? result : [];

      if (stores.length === 0) {
        setStore(null);
        setProducts([]);
        return;
      }

      const selectedStore = stores[0];
      setStore(selectedStore);

      const productsResponse = await fetch(
        `${API_URL}/proshop/merchant/stores/${selectedStore.id}/products`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      const productsResult = await readResponse<
        ApiProduct[] | { products?: ApiProduct[]; data?: ApiProduct[] }
      >(productsResponse);

      const rows = Array.isArray(productsResult)
        ? productsResult
        : (productsResult.products ?? productsResult.data ?? []);

      setProducts(
        rows.map((product) => ({
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

  async function createStore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creatingStore) return;

    setCreatingStore(true);
    setError("");
    setNotice("");

    try {
      const token = await getAccessToken();

      const response = await fetch(`${API_URL}/proshop/merchant/stores`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: storeForm.name.trim(),
          description: storeForm.description.trim() || undefined,
          logo_url: storeForm.logo_url.trim() || undefined,
          phone: storeForm.phone.trim() || undefined,
          whatsapp: storeForm.whatsapp.trim() || undefined,
          address: storeForm.address.trim() || undefined,
        }),
      });

      await readResponse<Store>(response);
      setStoreForm({
        name: "",
        description: "",
        logo_url: "",
        phone: "",
        whatsapp: "",
        address: "",
      });
      setNotice("Toko berhasil dibuat.");
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat toko.");
    } finally {
      setCreatingStore(false);
    }
  }

  async function updateStatus(product: Product) {
    if (!store || busyId) return;

    setBusyId(product.id);
    setError("");
    setNotice("");

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${API_URL}/proshop/merchant/stores/${store.id}/products/${product.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_active: !product.is_active }),
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

    if (
      !window.confirm(
        `Nonaktifkan produk "${product.name}"? Produk tidak dihapus permanen.`,
      )
    ) {
      return;
    }

    setBusyId(product.id);
    setError("");
    setNotice("");

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${API_URL}/proshop/merchant/stores/${store.id}/products/${product.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
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
        description="Kelola toko, katalog, harga, dan ketersediaan produk Anda."
        action={
          store ? (
            <Link
              href="/products/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-black hover:bg-[#63f0f2]"
            >
              <Plus size={17} />
              Tambah Produk
            </Link>
          ) : undefined
        }
      />

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

      {!loading && !store && !error && (
        <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <StoreIcon size={28} />
          </div>

          <h2 className="text-xl font-bold">Buat toko Proshop Anda</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Lengkapi informasi toko. Satu akun merchant hanya dapat memiliki
            satu toko.
          </p>

          <form onSubmit={createStore} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Nama toko *
              </label>
              <input
                required
                maxLength={120}
                value={storeForm.name}
                onChange={(event) =>
                  setStoreForm({ ...storeForm, name: event.target.value })
                }
                placeholder="Contoh: Garasi Golf"
                className="h-12 w-full rounded-xl border border-[var(--border)] bg-[#202020] px-4 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Deskripsi
              </label>
              <textarea
                maxLength={2000}
                rows={3}
                value={storeForm.description}
                onChange={(event) =>
                  setStoreForm({
                    ...storeForm,
                    description: event.target.value,
                  })
                }
                placeholder="Ceritakan tentang toko Anda"
                className="w-full rounded-xl border border-[var(--border)] bg-[#202020] p-4 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">URL logo</label>
              <input
                type="url"
                value={storeForm.logo_url}
                onChange={(event) =>
                  setStoreForm({ ...storeForm, logo_url: event.target.value })
                }
                placeholder="https://..."
                className="h-12 w-full rounded-xl border border-[var(--border)] bg-[#202020] px-4 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nomor telepon
                </label>
                <input
                  type="tel"
                  maxLength={30}
                  value={storeForm.phone}
                  onChange={(event) =>
                    setStoreForm({ ...storeForm, phone: event.target.value })
                  }
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-[#202020] px-4 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  maxLength={30}
                  value={storeForm.whatsapp}
                  onChange={(event) =>
                    setStoreForm({
                      ...storeForm,
                      whatsapp: event.target.value,
                    })
                  }
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-[#202020] px-4 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Alamat</label>
              <textarea
                maxLength={500}
                rows={2}
                value={storeForm.address}
                onChange={(event) =>
                  setStoreForm({ ...storeForm, address: event.target.value })
                }
                className="w-full rounded-xl border border-[var(--border)] bg-[#202020] p-4 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>

            <button
              type="submit"
              disabled={creatingStore || !storeForm.name.trim()}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-black hover:bg-[#63f0f2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingStore ? "Membuat toko..." : "Buat Toko"}
            </button>
          </form>
        </section>
      )}

      {store && (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-400">
              Toko Anda:{" "}
              <span className="font-semibold text-white">{store.name}</span>
            </p>

            <button
              type="button"
              onClick={() => void loadProducts()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-gray-300 disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Muat ulang
            </button>
          </div>

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
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">
                Semua Produk{" "}
                <span className="ml-1 text-gray-500">({filtered.length})</span>
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Data langsung dari backend BigApps.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#202020] text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Produk</th>
                    <th className="px-4 py-4">Kategori</th>
                    <th className="px-4 py-4">Harga</th>
                    <th className="px-4 py-4">Stok</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4 text-right">Aksi</th>
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
                              disabled={
                                busyId === product.id || !product.is_active
                              }
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
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="py-8 text-center text-sm text-gray-400">
          Memuat data toko...
        </div>
      )}
    </div>
  );
}
