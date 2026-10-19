"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ImagePlus, LoaderCircle, Save } from "lucide-react";
import { PageHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import {
  SPORT_OPTIONS,
  discountedPrice,
  rupiah,
} from "@/lib/demo-products";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const BUCKET = "merchant-store-photos";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const input =
  "mt-2 w-full rounded-xl border border-[var(--border)] bg-[#202020] px-3.5 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[var(--accent)]";

type Store = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
  store_id?: string;
  is_active?: boolean;
};

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

export default function NewProductPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [sport, setSport] = useState("GOLF");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState("Aktif");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  const loadFormData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.access_token) {
        throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
      }

      const headers = {
        Authorization: `Bearer ${session.access_token}`,
      };

      const storesResponse = await fetch(
        `${API_URL}/proshop/merchant/stores`,
        {
          headers,
          cache: "no-store",
        },
      );

      const storesResult = await readResponse<Store[]>(storesResponse);
      const stores = Array.isArray(storesResult) ? storesResult : [];

      if (stores.length === 0) {
        throw new Error(
          "Toko merchant belum ditemukan. Pastikan akun kamu sudah memiliki toko aktif.",
        );
      }

      const activeStore = stores[0];
      setStore(activeStore);

      const categoriesResponse = await fetch(
        `${API_URL}/proshop/categories?storeId=${encodeURIComponent(activeStore.id)}`,
        {
          cache: "no-store",
        },
      );

      const categoriesResult =
        await readResponse<Category[]>(categoriesResponse);

      const categoryList = Array.isArray(categoriesResult)
        ? categoriesResult
        : [];

      setCategories(categoryList);
      setCategoryId((current) => {
        if (current && categoryList.some((item) => item.id === current)) {
          return current;
        }

        return categoryList[0]?.id ?? "";
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data toko dan kategori.",
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFormData();
  }, [loadFormData]);

  function handleFileChange(file: File | null) {
    setMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Format gambar harus PNG, JPG, atau WEBP.");
      setMessageType("error");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage("Ukuran gambar maksimal 2 MB.");
      setMessageType("error");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  async function uploadProductImage(
    supabase: ReturnType<typeof createClient>,
    file: File,
    storeId: string,
  ): Promise<string> {
    const extensionByType: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    };

    const extension = extensionByType[file.type];

    if (!extension) {
      throw new Error("Format gambar tidak didukung.");
    }

    const filePath = `${storeId}/products/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload gambar gagal: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("URL publik gambar tidak berhasil dibuat.");
    }

    return data.publicUrl;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!store) {
      setMessage("Data toko belum tersedia. Muat ulang halaman terlebih dahulu.");
      setMessageType("error");
      return;
    }

    if (!categoryId) {
      setMessage(
        categories.length === 0
          ? "Belum ada kategori aktif untuk toko ini. Tambahkan kategori terlebih dahulu."
          : "Silakan pilih kategori produk.",
      );
      setMessageType("error");
      return;
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);
    const numericDiscount = Number(discount);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setMessage("Harga harus berupa angka nol atau lebih.");
      setMessageType("error");
      return;
    }

    if (
      !Number.isInteger(numericStock) ||
      numericStock < 0
    ) {
      setMessage("Stok harus berupa bilangan bulat nol atau lebih.");
      setMessageType("error");
      return;
    }

    if (
      !Number.isInteger(numericDiscount) ||
      numericDiscount < 0 ||
      numericDiscount > 100
    ) {
      setMessage("Diskon harus berupa bilangan bulat antara 0–100.");
      setMessageType("error");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.access_token) {
        throw new Error("Sesi login berakhir. Silakan login kembali.");
      }

      let finalImageUrl = imageUrl.trim();

      if (selectedFile) {
        finalImageUrl = await uploadProductImage(
          supabase,
          selectedFile,
          store.id,
        );
      }

      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        sport,
        category_id: categoryId,
        brand: brand.trim() || null,
        price: numericPrice,
        discount_percent: numericDiscount,
        stock: numericStock,
        description: description.trim() || null,
        image_url: finalImageUrl || null,
        is_active: status === "Aktif",
      };

      const response = await fetch(
        `${API_URL}/proshop/merchant/stores/${store.id}/products`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      await readResponse(response);

      setMessage(`Produk "${name.trim()}" berhasil disimpan.`);
      setMessageType("success");

      window.setTimeout(() => {
        window.location.assign("/products");
      }, 900);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan produk.",
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory =
    categories.find((item) => item.id === categoryId)?.name || "Belum dipilih";

  return (
    <div>
      <Link
        href="/products"
        className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[var(--accent)]"
      >
        <ArrowLeft size={16} /> Kembali ke Produk
      </Link>

      <PageHeading
        eyebrow="Katalog / Produk baru"
        title="Tambah Produk"
        description="Isi data yang akan digunakan katalog Pro Shop UrbanSport. Toko ditentukan dari akun merchant yang login."
      />

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 text-sm text-gray-400">
          <LoaderCircle size={18} className="animate-spin" />
          Mengambil data toko dan kategori...
        </div>
      ) : (
        <>
          {store && (
            <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-gray-400">
              Toko: <span className="font-semibold text-white">{store.name}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 xl:grid-cols-[1fr_320px]"
          >
            <div className="space-y-5">
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 md:p-6">
                <h2 className="mb-5 font-semibold">Informasi Produk</h2>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Nama produk *">
                    <input
                      required
                      maxLength={120}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Golf Polo Shirt"
                      className={input}
                    />
                  </Field>

                  <Field label="SKU / Kode produk *">
                    <input
                      required
                      maxLength={64}
                      value={sku}
                      onChange={(e) => setSku(e.target.value.trimStart())}
                      placeholder="Contoh: GOLF-APP-001"
                      className={input}
                    />
                  </Field>

                  <Field label="Olahraga *">
                    <select
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      className={input}
                    >
                      {SPORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Kategori *">
                    <select
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className={input}
                      disabled={categories.length === 0}
                    >
                      <option value="">
                        {categories.length === 0
                          ? "Belum ada kategori aktif"
                          : "Pilih kategori"}
                      </option>

                      {categories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Merek / Brand">
                    <input
                      maxLength={80}
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Contoh: Adidas, Wilson, UrbanSport"
                      className={input}
                    />
                  </Field>

                  <Field label="Status produk">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className={input}
                    >
                      <option>Aktif</option>
                      <option>Nonaktif</option>
                    </select>
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Deskripsi produk">
                      <textarea
                        maxLength={2000}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Detail bahan, ukuran, warna, spesifikasi, atau manfaat produk..."
                        className={`${input} resize-y`}
                      />
                    </Field>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 md:p-6">
                <h2 className="mb-5 font-semibold">Harga & Persediaan</h2>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Harga jual (IDR) *">
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="350000"
                      className={input}
                    />
                  </Field>

                  <Field label="Diskon (%)">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className={input}
                    />
                  </Field>

                  <Field label="Stok tersedia *">
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="20"
                      className={input}
                    />
                  </Field>

                  <div className="rounded-xl border border-[var(--border)] bg-[#202020] p-3">
                    <p className="text-xs text-gray-500">Harga setelah diskon</p>
                    <p className="mt-2 text-lg font-bold text-[var(--accent)]">
                      {price !== "" && Number(price) >= 0
                        ? rupiah(
                            discountedPrice(
                              Number(price),
                              Number(discount) || 0,
                            ),
                          )
                        : "Rp 0"}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Harga promo perkiraan
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                <h2 className="mb-4 font-semibold">Foto Produk</h2>

                <label className="flex min-h-[175px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-600 bg-[#202020] p-5 text-center transition hover:border-[var(--accent)]">
                  <span className="mb-3 rounded-xl bg-[var(--accent)]/10 p-3 text-[var(--accent)]">
                    <ImagePlus size={25} />
                  </span>
                  <span className="text-sm font-semibold">Pilih file gambar</span>
                  <span className="mt-2 text-xs leading-5 text-gray-500">
                    PNG, JPG, atau WEBP · Maksimal 2 MB
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) =>
                      handleFileChange(e.target.files?.[0] ?? null)
                    }
                  />
                </label>

                {selectedFile && (
                  <p className="mt-2 break-all text-xs text-gray-400">
                    File dipilih: {selectedFile.name}
                  </p>
                )}

                <Field label="Atau URL gambar">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className={input}
                  />
                </Field>

                <p className="mt-3 text-xs leading-5 text-gray-500">
                  Gambar yang dipilih akan di-upload ke Supabase Storage.
                  Jika tidak memilih file, URL gambar di atas akan digunakan.
                </p>
              </section>

              <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                <h2 className="mb-3 font-semibold">Ringkasan untuk katalog app</h2>

                <div className="space-y-3 text-sm">
                  <Summary label="Nama" value={name || "Belum diisi"} />
                  <Summary
                    label="Olahraga"
                    value={
                      SPORT_OPTIONS.find((option) => option.value === sport)
                        ?.label || sport
                    }
                  />
                  <Summary label="Kategori" value={selectedCategory} />
                  <Summary label="Merek" value={brand || "—"} />
                  <Summary label="Stok" value={stock || "0"} />
                  <Summary label="Status" value={status} />
                </div>
              </section>

              <button
                type="submit"
                disabled={saving || !store || categories.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-black hover:bg-[#63f0f2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Menyimpan Produk...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Simpan Produk
                  </>
                )}
              </button>

              {message && (
                <div
                  role="status"
                  className={`rounded-xl border p-4 text-sm leading-6 ${
                    messageType === "success"
                      ? "border-emerald-400/20 bg-emerald-300/10 text-emerald-200"
                      : "border-red-400/20 bg-red-300/10 text-red-200"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={() => void loadFormData()}
                disabled={loading || saving}
                className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-gray-300 hover:border-[var(--accent)] disabled:opacity-50"
              >
                Muat Ulang Toko & Kategori
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-gray-300">
      {label}
      {children}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
      <span className="text-gray-500">{label}</span>
      <span className="max-w-[65%] break-words text-right font-medium text-gray-200">
        {value}
      </span>
    </div>
  );
}
