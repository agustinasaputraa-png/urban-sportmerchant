"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { PageHeading } from "@/components/ui";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET || "merchant-store-photos";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const input =
  "mt-2 w-full rounded-xl border border-[var(--border)] bg-[#202020] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[var(--accent)] disabled:opacity-50";

const SPORT_OPTIONS = [
  { value: "GOLF", label: "Golf" },
  { value: "PADEL", label: "Padel" },
  { value: "GYM", label: "Gym" },
  { value: "BILLIARD", label: "Billiard" },
];

type Store = {
  id: string;
  name: string;
};

type CategoryAttribute = {
  id: string;
  name: string;
  options: string[];
  is_required: boolean;
  sort_order?: number;
};

type Category = {
  id: string;
  name: string;
  attributes?: CategoryAttribute[];
};

type ApiVariant = {
  id: string;
  sku: string | null;
  attributes: Record<string, string> | null;
  price: number | string;
  discount_percent?: number | null;
  stock: number;
  image_url: string | null;
  is_active: boolean;
};

type ApiProduct = {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  sport?: string | null;
  brand?: string | null;
  price: number | string;
  discount_percent?: number | null;
  stock: number;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  image_url: string | null;
  is_active: boolean;
  variants?: ApiVariant[];
};

type VariantForm = {
  id?: string;
  sku: string;
  attributes: Record<string, string>;
  price: string;
  discount: string;
  stock: string;
  imageUrl: string;
  imageFile: File | null;
  isActive: boolean;
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function discountedPrice(price: number, discount: number) {
  return price - (price * discount) / 100;
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

function newVariant(attributes: CategoryAttribute[] = []): VariantForm {
  return {
    sku: "",
    attributes: Object.fromEntries(attributes.map((item) => [item.name, ""])),
    price: "",
    discount: "0",
    stock: "0",
    imageUrl: "",
    imageFile: null,
    isActive: true,
  };
}

function normalizeVariants(rows?: ApiVariant[]): VariantForm[] {
  return (rows ?? []).map((variant) => ({
    id: variant.id,
    sku: variant.sku ?? "",
    attributes: variant.attributes ?? {},
    price: String(variant.price ?? ""),
    discount: String(variant.discount_percent ?? 0),
    stock: String(variant.stock ?? 0),
    imageUrl: variant.image_url ?? "",
    imageFile: null,
    isActive: variant.is_active,
  }));
}

export default function NewProductPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [sport, setSport] = useState("GOLF");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");

  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [stock, setStock] = useState("");

  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string>("");

  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [selectedPreviewVariant, setSelectedPreviewVariant] = useState(0);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);

  const [status, setStatus] = useState("Draft");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  useEffect(() => {
    if (!selectedFile) {
      setSelectedFilePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setSelectedFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === categoryId),
    [categories, categoryId],
  );

  const categoryAttributes = selectedCategory?.attributes ?? [];

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

      const headers = { Authorization: `Bearer ${session.access_token}` };
      const productId = new URLSearchParams(window.location.search).get("edit");
      setEditId(productId);

      const storesResponse = await fetch(`${API_URL}/proshop/merchant/stores`, {
        headers,
        cache: "no-store",
      });
      const storesResult = await readResponse<Store[]>(storesResponse);
      const stores = Array.isArray(storesResult) ? storesResult : [];

      if (!stores.length) {
        throw new Error(
          "Toko merchant belum ditemukan. Pastikan akun kamu sudah memiliki toko aktif.",
        );
      }

      const activeStore = stores[0];
      setStore(activeStore);

      const categoriesResponse = await fetch(
        `${API_URL}/proshop/categories?storeId=${encodeURIComponent(activeStore.id)}`,
        { cache: "no-store" },
      );
      const categoriesResult =
        await readResponse<Category[]>(categoriesResponse);
      const categoryList = Array.isArray(categoriesResult)
        ? categoriesResult
        : [];
      setCategories(categoryList);

      if (productId) {
        const productsResponse = await fetch(
          `${API_URL}/proshop/merchant/stores/${activeStore.id}/products`,
          { headers, cache: "no-store" },
        );
        const productsResult =
          await readResponse<ApiProduct[]>(productsResponse);
        const productRows = Array.isArray(productsResult) ? productsResult : [];
        const product = productRows.find((item) => item.id === productId);

        if (!product) {
          throw new Error("Produk tidak ditemukan atau bukan milik toko ini.");
        }

        setName(product.name ?? "");
        setSku(product.sku ?? "");
        setSport(product.sport || "GOLF");
        setCategoryId(product.category_id ?? "");
        setBrand(product.brand ?? "");
        setPrice(String(product.price ?? ""));
        setDiscount(String(product.discount_percent ?? 0));
        setStock(String(product.stock ?? 0));
        setDescription(product.description ?? "");
        setImageUrl(product.image_url ?? "");
        setWeight(String(product.weight ?? ""));
        setLength(String(product.length ?? ""));
        setWidth(String(product.width ?? ""));
        setHeight(String(product.height ?? ""));
        setStatus(product.is_active ? "Aktif" : "Draft");
        setVariants(normalizeVariants(product.variants));
      } else {
        setCategoryId(categoryList[0]?.id ?? "");
        setVariants([]);
      }
      setDeletedVariantIds([]);
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

  function validateImage(file: File) {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Format gambar harus PNG, JPG, atau WEBP.");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Ukuran gambar maksimal 2 MB.");
    }
  }

  async function uploadImage(
    supabase: ReturnType<typeof createClient>,
    file: File,
    storeId: string,
    folder: string,
  ): Promise<string> {
    validateImage(file);

    const extensionByType: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    };
    const extension = extensionByType[file.type];
    const filePath = `${storeId}/${folder}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) throw new Error(`Upload gambar gagal: ${error.message}`);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    if (!data?.publicUrl) {
      throw new Error("URL publik gambar tidak berhasil dibuat.");
    }
    return data.publicUrl;
  }

  function handleProductFile(file: File | null) {
    setMessage("");
    if (!file) {
      setSelectedFile(null);
      return;
    }
    try {
      validateImage(file);
      setSelectedFile(file);
    } catch (error) {
      setSelectedFile(null);
      setMessage(error instanceof Error ? error.message : "File tidak valid.");
      setMessageType("error");
    }
  }

  function updateVariant(index: number, patch: Partial<VariantForm>) {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index ? { ...variant, ...patch } : variant,
      ),
    );
  }

  function addVariant() {
    setVariants((current) => [...current, newVariant(categoryAttributes)]);
  }

  function removeVariant(index: number) {
    const target = variants[index];
    if (target?.id) {
      setDeletedVariantIds((current) =>
        current.includes(target.id!) ? current : [...current, target.id!],
      );
    }
    setVariants((current) => current.filter((_, i) => i !== index));
  }

  function changeCategory(nextCategoryId: string) {
    if (nextCategoryId !== categoryId && variants.length > 0) {
      const confirmed = window.confirm(
        "Mengganti kategori dapat mengubah attribute variant. Lanjutkan? Attribute variant yang tidak sesuai perlu diperbarui.",
      );
      if (!confirmed) return;
    }
    const nextCategory = categories.find((item) => item.id === nextCategoryId);
    const allowedNames = new Set(
      (nextCategory?.attributes ?? []).map((attribute) => attribute.name),
    );
    setVariants((current) =>
      current.map((variant) => ({
        ...variant,
        attributes: Object.fromEntries(
          Object.entries(variant.attributes).filter(([key]) =>
            allowedNames.has(key),
          ),
        ),
      })),
    );
    setCategoryId(nextCategoryId);
  }

  function validateForm() {
    if (!name.trim()) throw new Error("Nama produk wajib diisi.");
    if (!sku.trim()) throw new Error("SKU / kode produk wajib diisi.");
    if (!categoryId) throw new Error("Silakan pilih kategori produk.");

    const numericPrice = Number(price);
    const numericStock = Number(stock);
    const numericDiscount = Number(discount);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      throw new Error("Harga harus berupa angka nol atau lebih.");
    }
    if (!Number.isInteger(numericStock) || numericStock < 0) {
      throw new Error("Stok harus berupa bilangan bulat nol atau lebih.");
    }
    if (
      !Number.isInteger(numericDiscount) ||
      numericDiscount < 0 ||
      numericDiscount > 100
    ) {
      throw new Error("Diskon harus berupa bilangan bulat antara 0–100.");
    }

    const dimensions = {
      numericWeight: Number(weight),
      numericLength: Number(length),
      numericWidth: Number(width),
      numericHeight: Number(height),
    };

    if (
      !weight.trim() ||
      !Number.isInteger(dimensions.numericWeight) ||
      dimensions.numericWeight <= 0
    ) {
      throw new Error(
        "Berat produk wajib diisi dalam gram dan harus lebih dari 0.",
      );
    }
    if (
      !length.trim() ||
      !Number.isInteger(dimensions.numericLength) ||
      dimensions.numericLength <= 0
    ) {
      throw new Error(
        "Panjang produk wajib diisi dalam cm dan harus lebih dari 0.",
      );
    }
    if (
      !width.trim() ||
      !Number.isInteger(dimensions.numericWidth) ||
      dimensions.numericWidth <= 0
    ) {
      throw new Error(
        "Lebar produk wajib diisi dalam cm dan harus lebih dari 0.",
      );
    }
    if (
      !height.trim() ||
      !Number.isInteger(dimensions.numericHeight) ||
      dimensions.numericHeight <= 0
    ) {
      throw new Error(
        "Tinggi produk wajib diisi dalam cm dan harus lebih dari 0.",
      );
    }

    variants.forEach((variant, index) => {
      if (!variant.sku.trim()) {
        throw new Error(`SKU variant nomor ${index + 1} wajib diisi.`);
      }
      const variantPrice = Number(variant.price);
      const variantDiscount = Number(variant.discount);
      const variantStock = Number(variant.stock);

      if (
        variant.price.trim() === "" ||
        !Number.isFinite(variantPrice) ||
        variantPrice < 0
      ) {
        throw new Error(`Harga variant nomor ${index + 1} tidak valid.`);
      }
      if (
        !Number.isInteger(variantDiscount) ||
        variantDiscount < 0 ||
        variantDiscount > 100
      ) {
        throw new Error(`Diskon variant nomor ${index + 1} harus 0–100.`);
      }
      if (!Number.isInteger(variantStock) || variantStock < 0) {
        throw new Error(
          `Stok variant nomor ${index + 1} harus bilangan bulat nol atau lebih.`,
        );
      }

      for (const attribute of categoryAttributes) {
        const value = variant.attributes[attribute.name]?.trim() ?? "";
        if (attribute.is_required && !value) {
          throw new Error(
            `Variant nomor ${index + 1}: attribute ${attribute.name} wajib dipilih.`,
          );
        }
        if (value && attribute.options?.length) {
          const exists = attribute.options.some(
            (option) => option.toLowerCase() === value.toLowerCase(),
          );
          if (!exists) {
            throw new Error(
              `Variant nomor ${index + 1}: pilihan ${value} tidak valid untuk ${attribute.name}.`,
            );
          }
        }
      }
    });

    return {
      numericPrice,
      numericStock,
      numericDiscount,
      ...dimensions,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !store) return;
    setMessage("");

    let validated: ReturnType<typeof validateForm>;
    try {
      validated = validateForm();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Periksa kembali data produk.",
      );
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

      const headers = {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      };

      let finalImageUrl = imageUrl.trim();
      if (selectedFile) {
        finalImageUrl = await uploadImage(
          supabase,
          selectedFile,
          store.id,
          "products",
        );
      }

      const productPayload = {
        name: name.trim(),
        sku: sku.trim(),
        sport,
        category_id: categoryId,
        brand: brand.trim() || null,
        price: validated.numericPrice,
        discount_percent: validated.numericDiscount,
        stock: validated.numericStock,
        description: description.trim() || null,
        image_url: finalImageUrl || null,
        is_active: status === "Aktif",
        weight: validated.numericWeight,
        length: validated.numericLength,
        width: validated.numericWidth,
        height: validated.numericHeight,
      };

      const productResponse = await fetch(
        `${API_URL}/proshop/merchant/stores/${store.id}/products${editId ? `/${editId}` : ""}`,
        {
          method: editId ? "PATCH" : "POST",
          headers,
          body: JSON.stringify(productPayload),
        },
      );

      const savedProduct = await readResponse<ApiProduct>(productResponse);
      const productId = editId || savedProduct?.id;

      if (!productId) {
        throw new Error(
          "Produk berhasil diproses, tetapi ID produk tidak ditemukan dari respons API.",
        );
      }

      // Simpan ID agar jika penyimpanan variant gagal, merchant dapat melanjutkan lewat mode edit.
      if (!editId) setEditId(productId);

      // Hapus variant yang ditandai merchant.
      for (const variantId of deletedVariantIds) {
        const response = await fetch(
          `${API_URL}/proshop/merchant/stores/${store.id}/products/${productId}/variants/${variantId}`,
          { method: "DELETE", headers },
        );
        await readResponse(response);
        setDeletedVariantIds((current) =>
          current.filter((id) => id !== variantId),
        );
      }

      // Sinkronisasi variant secara manual: PATCH untuk yang sudah ada, POST untuk yang baru.
      for (let index = 0; index < variants.length; index += 1) {
        const variant = variants[index];
        let variantImageUrl = variant.imageUrl.trim();

        if (variant.imageFile) {
          variantImageUrl = await uploadImage(
            supabase,
            variant.imageFile,
            store.id,
            "product-variants",
          );
        }

        const attributes = Object.fromEntries(
          Object.entries(variant.attributes)
            .map(([key, value]) => [key, value.trim()])
            .filter(([, value]) => Boolean(value)),
        );

        const variantPayload = {
          sku: variant.sku.trim(),
          attributes,
          price: Number(variant.price),
          discount_percent: Number(variant.discount),
          stock: Number(variant.stock),
          image_url: variantImageUrl || null,
          is_active: variant.isActive,
        };

        const variantUrl =
          `${API_URL}/proshop/merchant/stores/${store.id}/products/${productId}/variants` +
          (variant.id ? `/${variant.id}` : "");

        const response = await fetch(variantUrl, {
          method: variant.id ? "PATCH" : "POST",
          headers,
          body: JSON.stringify(variantPayload),
        });

        const savedVariant = await readResponse<ApiVariant>(response);

        if (!variant.id && savedVariant?.id) {
          setVariants((current) =>
            current.map((item, currentIndex) =>
              currentIndex === index
                ? {
                    ...item,
                    id: savedVariant.id,
                    imageUrl: variantImageUrl,
                    imageFile: null,
                  }
                : item,
            ),
          );
        } else if (variant.imageFile) {
          setVariants((current) =>
            current.map((item, currentIndex) =>
              currentIndex === index
                ? { ...item, imageUrl: variantImageUrl, imageFile: null }
                : item,
            ),
          );
        }
      }

      setDeletedVariantIds([]);
      setSelectedFile(null);
      setImageUrl(finalImageUrl);
      setMessage(
        status === "Aktif"
          ? `Produk "${name.trim()}" dan ${variants.length} variant berhasil disimpan dan diaktifkan.`
          : `Produk "${name.trim()}" berhasil disimpan sebagai draft bersama ${variants.length} variant.`,
      );
      setMessageType("success");

      window.setTimeout(() => {
        window.location.assign("/products");
      }, 1000);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan produk dan variant.",
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  const selectedCategoryName = selectedCategory?.name || "Belum dipilih";
  const previewVariant = variants[selectedPreviewVariant] ?? variants[0];
  const previewImage =
    previewVariant?.imageUrl || selectedFilePreview || imageUrl;
  const previewPrice = previewVariant?.price
    ? Number(previewVariant.price)
    : Number(price || 0);
  const previewDiscount = previewVariant?.discount
    ? Number(previewVariant.discount)
    : Number(discount || 0);
  const previewFinalPrice = discountedPrice(previewPrice, previewDiscount);
  const previewAttributes = categoryAttributes
    .map((attribute) => ({
      name: attribute.name,
      values: Array.from(
        new Set(
          variants
            .map((item) => item.attributes[attribute.name]?.trim())
            .filter(Boolean),
        ),
      ),
    }))
    .filter((attribute) => attribute.values.length > 0);

  return (
    <div>
      <Link
        href="/products"
        className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[var(--accent)]"
      >
        <ArrowLeft size={16} />
        Kembali ke Produk
      </Link>

      <PageHeading
        eyebrow={editId ? "Katalog / Edit produk" : "Katalog / Produk baru"}
        title={editId ? "Edit Produk" : "Tambah Produk"}
        description={
          editId
            ? "Perbarui informasi produk dan variant di katalog Pro Shop UrbanSport."
            : "Lengkapi informasi, variasi, harga, dan pengiriman sebelum menyimpan produk sebagai draft."
        }
      />

      {!loading && (
        <nav className="sticky top-3 z-20 mb-5 rounded-2xl border border-[var(--border)] bg-[#191919]/95 p-3 shadow-xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Alur input produk
            </span>
            <span className="rounded-full border border-amber-400/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
              Draft dahulu
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["#product-info", "01", "Informasi Produk"],
              ["#product-variants", "02", "Variasi & SKU"],
              ["#product-pricing", "03", "Harga & Stok"],
              ["#product-shipping", "04", "Pengiriman"],
            ].map(([href, number, label]) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[#222222] px-3 py-2.5 text-xs text-gray-300 transition hover:border-[var(--accent)] hover:text-white"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[10px] font-bold text-[var(--accent)]">
                  {number}
                </span>
                <span>{label}</span>
              </a>
            ))}
          </div>
        </nav>
      )}

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 text-sm text-gray-400">
          <LoaderCircle size={18} className="animate-spin" />
          Mengambil data toko dan kategori...
        </div>
      ) : (
        <>
          {store && (
            <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-gray-400">
              Toko:{" "}
              <span className="font-semibold text-white">{store.name}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 xl:grid-cols-[1fr_320px]"
          >
            <div className="space-y-5">
              <section
                id="product-info"
                className="scroll-mt-32 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 md:p-6"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                      01 · Informasi dasar
                    </p>
                    <h2 className="font-semibold">Informasi Produk</h2>
                  </div>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] text-gray-400">
                    Detail katalog
                  </span>
                </div>
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
                      onChange={(e) => changeCategory(e.target.value)}
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
                      <option>Draft</option>
                      <option>Aktif</option>
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

              {/* PRODUCT VARIANTS */}
              <section
                id="product-variants"
                className="scroll-mt-32 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 md:p-6"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                      02 · Variasi produk
                    </p>
                    <h2 className="font-semibold">Variasi & SKU Produk</h2>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Tambahkan setiap variasi secara manual seperti pengelolaan
                      SKU di Seller Centre. Attribute mengikuti kategori yang
                      dipilih.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    disabled={!categoryId || saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-bold text-black hover:opacity-90 disabled:opacity-50"
                  >
                    <Plus size={15} /> Tambah Variant
                  </button>
                </div>

                {!categoryId ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-5 text-center text-sm text-gray-500">
                    Pilih kategori produk terlebih dahulu untuk melihat
                    attribute variant.
                  </div>
                ) : (
                  <>
                    {categoryAttributes.length > 0 ? (
                      <div className="mb-4 rounded-xl border border-[var(--border)] bg-[#202020] p-4">
                        <p className="mb-2 text-xs font-semibold text-gray-300">
                          Attribute kategori: {selectedCategoryName}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {categoryAttributes.map((attribute) => (
                            <span
                              key={attribute.id}
                              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-gray-300"
                            >
                              {attribute.name}
                              {attribute.is_required ? " *" : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-300/5 p-3 text-xs text-amber-200">
                        Kategori ini belum memiliki attribute. Tambahkan
                        attribute di pengaturan kategori jika variant
                        membutuhkan pilihan seperti ukuran atau warna.
                      </div>
                    )}

                    {variants.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
                        <p className="text-sm text-gray-400">
                          Belum ada variant.
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          Klik “Tambah Variant” untuk membuat SKU variant
                          pertama.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="hidden overflow-x-auto lg:block">
                          <table className="w-full min-w-[760px] text-left text-xs">
                            <thead className="border-b border-[var(--border)] text-gray-500">
                              <tr>
                                <th className="px-2 py-3 font-medium">SKU</th>
                                {categoryAttributes.map((attribute) => (
                                  <th
                                    key={attribute.id}
                                    className="px-2 py-3 font-medium"
                                  >
                                    {attribute.name}
                                  </th>
                                ))}
                                <th className="px-2 py-3 font-medium">Harga</th>
                                <th className="px-2 py-3 font-medium">
                                  Diskon
                                </th>
                                <th className="px-2 py-3 font-medium">Stok</th>
                                <th className="px-2 py-3 font-medium">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                              {variants.map((variant, index) => (
                                <tr
                                  key={variant.id ?? `new-${index}`}
                                  className="align-top"
                                >
                                  <td className="px-2 py-3">
                                    <input
                                      value={variant.sku}
                                      onChange={(e) =>
                                        updateVariant(index, {
                                          sku: e.target.value,
                                        })
                                      }
                                      placeholder="SKU variant"
                                      className="w-32 rounded-lg border border-[var(--border)] bg-[#202020] px-2 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                                    />
                                  </td>
                                  {categoryAttributes.map((attribute) => (
                                    <td
                                      key={attribute.id}
                                      className="px-2 py-3"
                                    >
                                      {attribute.options?.length ? (
                                        <select
                                          value={
                                            variant.attributes[
                                              attribute.name
                                            ] ?? ""
                                          }
                                          onChange={(e) =>
                                            updateVariant(index, {
                                              attributes: {
                                                ...variant.attributes,
                                                [attribute.name]:
                                                  e.target.value,
                                              },
                                            })
                                          }
                                          className="w-28 rounded-lg border border-[var(--border)] bg-[#202020] px-2 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                                        >
                                          <option value="">Pilih</option>
                                          {attribute.options.map((option) => (
                                            <option key={option} value={option}>
                                              {option}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          value={
                                            variant.attributes[
                                              attribute.name
                                            ] ?? ""
                                          }
                                          onChange={(e) =>
                                            updateVariant(index, {
                                              attributes: {
                                                ...variant.attributes,
                                                [attribute.name]:
                                                  e.target.value,
                                              },
                                            })
                                          }
                                          placeholder={attribute.name}
                                          className="w-28 rounded-lg border border-[var(--border)] bg-[#202020] px-2 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                                        />
                                      )}
                                    </td>
                                  ))}
                                  <td className="px-2 py-3">
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={variant.price}
                                      onChange={(e) =>
                                        updateVariant(index, {
                                          price: e.target.value,
                                        })
                                      }
                                      placeholder="Harga"
                                      className="w-24 rounded-lg border border-[var(--border)] bg-[#202020] px-2 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                                    />
                                  </td>
                                  <td className="px-2 py-3">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="1"
                                      value={variant.discount}
                                      onChange={(e) =>
                                        updateVariant(index, {
                                          discount: e.target.value,
                                        })
                                      }
                                      className="w-16 rounded-lg border border-[var(--border)] bg-[#202020] px-2 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                                    />
                                  </td>
                                  <td className="px-2 py-3">
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={variant.stock}
                                      onChange={(e) =>
                                        updateVariant(index, {
                                          stock: e.target.value,
                                        })
                                      }
                                      className="w-16 rounded-lg border border-[var(--border)] bg-[#202020] px-2 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                                    />
                                  </td>
                                  <td className="px-2 py-3">
                                    <button
                                      type="button"
                                      onClick={() => removeVariant(index)}
                                      title="Hapus variant"
                                      className="rounded-lg p-2 text-red-300 hover:bg-red-400/10"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile / tablet variant editor */}
                        <div className="space-y-4 lg:hidden">
                          {variants.map((variant, index) => (
                            <VariantEditor
                              key={variant.id ?? `mobile-new-${index}`}
                              variant={variant}
                              index={index}
                              attributes={categoryAttributes}
                              onChange={(patch) => updateVariant(index, patch)}
                              onRemove={() => removeVariant(index)}
                              inputClass={input}
                            />
                          ))}
                        </div>

                        <div className="rounded-lg bg-[#202020] px-3 py-2 text-xs text-gray-500">
                          {variants.length} variant ·{" "}
                          {variants.filter((item) => item.id).length} tersimpan
                          · {variants.filter((item) => !item.id).length} baru
                          {deletedVariantIds.length > 0
                            ? ` · ${deletedVariantIds.length} akan dihapus saat disimpan`
                            : ""}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section
                id="product-pricing"
                className="scroll-mt-32 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 md:p-6"
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                  03 · Harga dan persediaan
                </p>
                <h2 className="mb-5 font-semibold">
                  Harga & Persediaan Produk Default
                </h2>
                <p className="mb-4 text-xs text-gray-500">
                  Harga dan stok utama produk tetap digunakan sebagai nilai
                  default katalog. Variant dapat memiliki harga dan stok
                  masing-masing.
                </p>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Harga jual default (IDR) *">
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
                  <Field label="Diskon default (%)">
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
                  <Field label="Stok default *">
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
                    <p className="text-xs text-gray-500">
                      Harga setelah diskon
                    </p>
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

              <section
                id="product-shipping"
                className="scroll-mt-32 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 md:p-6"
              >
                <div className="mb-5">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                    04 · Logistik
                  </p>
                  <h2 className="font-semibold">Informasi Pengiriman</h2>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Informasi ini digunakan Biteship untuk menghitung ongkos
                    kirim produk.
                  </p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Berat produk (gram) *">
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Contoh: 500"
                      className={input}
                    />
                  </Field>
                  <Field label="Panjang (cm) *">
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="Contoh: 20"
                      className={input}
                    />
                  </Field>
                  <Field label="Lebar (cm) *">
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="Contoh: 15"
                      className={input}
                    />
                  </Field>
                  <Field label="Tinggi (cm) *">
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Contoh: 10"
                      className={input}
                    />
                  </Field>
                </div>
                <div className="mt-5 rounded-xl border border-[var(--border)] bg-[#202020] p-4">
                  <p className="text-xs font-semibold text-gray-300">
                    Contoh informasi paket
                  </p>
                  <p className="mt-2 text-sm text-gray-400">Berat: 500 gram</p>
                  <p className="text-sm text-gray-400">
                    Dimensi: 20 × 15 × 10 cm
                  </p>
                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Gunakan berat dan ukuran kemasan sebenarnya setelah produk
                    siap dikirim.
                  </p>
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Preview Produk</h2>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Tampilan simulasi di aplikasi
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--accent)]">
                    LIVE
                  </span>
                </div>
                <div className="mx-auto max-w-[310px] overflow-hidden rounded-[24px] border border-white/10 bg-[#101010] shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 text-[10px] text-gray-500">
                    <span>UrbanSport Proshop</span>
                    <span>● ● ●</span>
                  </div>
                  <div className="flex aspect-square items-center justify-center bg-[#1b1b1b]">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview produk"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-600">
                        <ImagePlus size={38} />
                        <span className="text-xs">
                          Foto produk akan tampil di sini
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--accent)]">
                        {brand ||
                          SPORT_OPTIONS.find((item) => item.value === sport)
                            ?.label ||
                          "UrbanSport"}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-white">
                        {name || "Nama produk Anda"}
                      </h3>
                      <p className="mt-1 text-[10px] text-gray-500">
                        {selectedCategoryName} · {sport}
                      </p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-[var(--accent)]">
                        {previewPrice > 0
                          ? rupiah(previewFinalPrice)
                          : "Harga produk"}
                      </p>
                      {previewDiscount > 0 && previewPrice > 0 && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 line-through">
                            {rupiah(previewPrice)}
                          </span>
                          <span className="rounded bg-red-400/10 px-1.5 py-0.5 text-[9px] text-red-300">
                            -{previewDiscount}%
                          </span>
                        </div>
                      )}
                    </div>
                    {previewAttributes.length > 0 && (
                      <div className="space-y-2">
                        {previewAttributes.map((attribute) => (
                          <div key={attribute.name}>
                            <p className="mb-1.5 text-[10px] text-gray-400">
                              Pilih {attribute.name}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {attribute.values.map((value, index) => (
                                <span
                                  key={`${attribute.name}-${value}`}
                                  className={`rounded-md border px-2 py-1 text-[10px] ${previewVariant?.attributes[attribute.name] === value ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-white/10 bg-white/5 text-gray-300"}`}
                                >
                                  {value}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {variants.length > 0 && (
                      <div className="border-t border-white/10 pt-2">
                        <p className="mb-1 text-[10px] text-gray-500">
                          Contoh pilihan SKU
                        </p>
                        <select
                          value={Math.min(
                            selectedPreviewVariant,
                            variants.length - 1,
                          )}
                          onChange={(e) =>
                            setSelectedPreviewVariant(Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-white/10 bg-[#202020] px-2 py-2 text-xs text-white"
                        >
                          <option value={0}>Pilih variant untuk preview</option>
                          {variants.map((item, index) => (
                            <option key={item.id ?? index} value={index}>
                              {Object.values(item.attributes)
                                .filter(Boolean)
                                .join(" / ") ||
                                item.sku ||
                                `Variant ${index + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-lg bg-[#14E1E6]/15 py-2 text-center text-[10px] font-semibold text-[#14E1E6]">
                        Tambah Keranjang
                      </div>
                      <div className="rounded-lg bg-[#14E1E6] py-2 text-center text-[10px] font-bold text-black">
                        Beli Sekarang
                      </div>
                    </div>
                    <p className="text-center text-[9px] text-gray-600">
                      Preview ilustrasi, tampilan final mengikuti aplikasi
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                <h2 className="mb-4 font-semibold">Foto Produk</h2>
                <label className="flex min-h-[175px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-600 bg-[#202020] p-5 text-center transition hover:border-[var(--accent)]">
                  <span className="mb-3 rounded-xl bg-[var(--accent)]/10 p-3 text-[var(--accent)]">
                    <ImagePlus size={25} />
                  </span>
                  <span className="text-sm font-semibold">
                    Pilih file gambar
                  </span>
                  <span className="mt-2 text-xs leading-5 text-gray-500">
                    PNG, JPG, atau WEBP · Maksimal 2 MB
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) =>
                      handleProductFile(e.target.files?.[0] ?? null)
                    }
                  />
                </label>
                {selectedFile && (
                  <p className="mt-2 break-all text-xs text-gray-400">
                    File dipilih: {selectedFile.name}
                  </p>
                )}
                <div className="mt-4">
                  <Field label="Atau URL gambar">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className={input}
                    />
                  </Field>
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-500">
                  Gambar yang dipilih akan di-upload ke Supabase Storage. Jika
                  tidak memilih file, URL gambar di atas akan digunakan.
                </p>
                {(selectedFilePreview || imageUrl) && (
                  <div className="mt-4 rounded-xl border border-[var(--border)] bg-[#171717] p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-gray-300">
                        Preview gambar produk
                      </p>
                      {selectedFile && (
                        <span className="rounded-full bg-[var(--accent)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--accent)]">
                          Gambar baru
                        </span>
                      )}
                    </div>
                    <img
                      src={selectedFilePreview || imageUrl}
                      alt="Preview foto produk"
                      className="h-48 w-full rounded-lg border border-[var(--border)] object-contain bg-[#101010]"
                    />
                    {selectedFile && (
                      <p className="mt-2 truncate text-xs text-gray-500">
                        {selectedFile.name} ·{" "}
                        {(selectedFile.size / 1024).toFixed(0)} KB
                      </p>
                    )}
                  </div>
                )}
                {selectedFile && (
                  <p className="mt-2 text-xs text-[var(--accent)]">
                    Gambar akan di-upload ke Supabase Storage saat produk
                    disimpan.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                <h2 className="mb-3 font-semibold">
                  Ringkasan untuk katalog app
                </h2>
                <div className="space-y-3 text-sm">
                  <Summary label="Nama" value={name || "Belum diisi"} />
                  <Summary
                    label="Olahraga"
                    value={
                      SPORT_OPTIONS.find((option) => option.value === sport)
                        ?.label || sport
                    }
                  />
                  <Summary label="Kategori" value={selectedCategoryName} />
                  <Summary label="Merek" value={brand || "—"} />
                  <Summary label="Variant" value={String(variants.length)} />
                  <Summary label="Stok default" value={stock || "0"} />
                  <Summary
                    label="Berat"
                    value={weight ? `${weight} gram` : "—"}
                  />
                  <Summary
                    label="Dimensi"
                    value={
                      length && width && height
                        ? `${length} × ${width} × ${height} cm`
                        : "—"
                    }
                  />
                  <Summary label="Status publikasi" value={status} />
                </div>
              </section>

              <div className="rounded-xl border border-amber-400/20 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/80">
                Produk baru disimpan sebagai draft secara default. Produk draft
                tidak ditampilkan sebagai produk aktif di katalog sampai
                statusnya diubah menjadi Aktif.
              </div>
              <button
                type="submit"
                disabled={saving || !store || categories.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-black hover:bg-[#63f0f2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />{" "}
                    Menyimpan Produk & Variant...
                  </>
                ) : (
                  <>
                    <Save size={17} />{" "}
                    {editId
                      ? "Simpan Perubahan"
                      : status === "Aktif"
                        ? "Simpan & Aktifkan Produk"
                        : "Simpan sebagai Draft"}
                  </>
                )}
              </button>

              {message && (
                <div
                  role="status"
                  className={`rounded-xl border p-4 text-sm leading-6 ${messageType === "success" ? "border-emerald-400/20 bg-emerald-300/10 text-emerald-200" : "border-red-400/20 bg-red-300/10 text-red-200"}`}
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

function VariantEditor({
  variant,
  index,
  attributes,
  onChange,
  onRemove,
  inputClass,
}: {
  variant: VariantForm;
  index: number;
  attributes: CategoryAttribute[];
  onChange: (patch: Partial<VariantForm>) => void;
  onRemove: () => void;
  inputClass: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[#202020] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Variant #{index + 1}</p>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-2 text-red-300 hover:bg-red-400/10"
          title="Hapus variant"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="SKU variant *">
          <input
            value={variant.sku}
            onChange={(e) => onChange({ sku: e.target.value })}
            placeholder="Contoh: POLO-BLK-XL"
            className={inputClass}
          />
        </Field>
        {attributes.map((attribute) => (
          <Field
            key={attribute.id}
            label={`${attribute.name}${attribute.is_required ? " *" : ""}`}
          >
            {attribute.options?.length ? (
              <select
                value={variant.attributes[attribute.name] ?? ""}
                onChange={(e) =>
                  onChange({
                    attributes: {
                      ...variant.attributes,
                      [attribute.name]: e.target.value,
                    },
                  })
                }
                className={inputClass}
              >
                <option value="">Pilih {attribute.name}</option>
                {attribute.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={variant.attributes[attribute.name] ?? ""}
                onChange={(e) =>
                  onChange({
                    attributes: {
                      ...variant.attributes,
                      [attribute.name]: e.target.value,
                    },
                  })
                }
                placeholder={`Masukkan ${attribute.name}`}
                className={inputClass}
              />
            )}
          </Field>
        ))}
        <Field label="Harga (IDR) *">
          <input
            type="number"
            min="0"
            step="1"
            value={variant.price}
            onChange={(e) => onChange({ price: e.target.value })}
            placeholder="350000"
            className={inputClass}
          />
        </Field>
        <Field label="Diskon (%)">
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={variant.discount}
            onChange={(e) => onChange({ discount: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Stok *">
          <input
            type="number"
            min="0"
            step="1"
            value={variant.stock}
            onChange={(e) => onChange({ stock: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Foto variant">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (!file) return;
              try {
                validateVariantImage(file);
                onChange({ imageFile: file });
              } catch (error) {
                window.alert(
                  error instanceof Error ? error.message : "File tidak valid.",
                );
                e.currentTarget.value = "";
              }
            }}
            className="mt-2 block w-full text-xs text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-[#343434] file:px-3 file:py-2 file:text-xs file:text-white"
          />
          {(variant.imageFile || variant.imageUrl) && (
            <span className="mt-1 block truncate text-xs text-gray-500">
              {variant.imageFile?.name ?? "Gambar tersimpan tersedia"}
            </span>
          )}
        </Field>
        <Field label="URL gambar variant">
          <input
            type="url"
            value={variant.imageUrl}
            onChange={(e) =>
              onChange({ imageUrl: e.target.value, imageFile: null })
            }
            placeholder="https://..."
            className={inputClass}
          />
        </Field>
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-xs text-gray-400">
        <input
          type="checkbox"
          checked={variant.isActive}
          onChange={(e) => onChange({ isActive: e.target.checked })}
        />
        Variant aktif
      </label>
    </div>
  );
}

function validateVariantImage(file: File) {
  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Format gambar harus PNG, JPG, atau WEBP.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran gambar maksimal 2 MB.");
  }
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
