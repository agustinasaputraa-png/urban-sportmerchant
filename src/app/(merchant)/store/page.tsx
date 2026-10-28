"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImagePlus, LoaderCircle, Store, Trash2 } from "lucide-react";

import { PageHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import {
  getMerchantStores,
  updateMerchantStore,
  type MerchantStore,
} from "@/lib/merchant.service";

const BUCKET = "merchant-store-photos";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const inputClass =
  "mt-2 w-full rounded-xl border border-[var(--border)] bg-[#202020] px-3.5 py-3 outline-none focus:border-[var(--accent)] disabled:opacity-50";

export default function StorePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [store, setStore] = useState<MerchantStore | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");

  const [photoUrl, setPhotoUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStore() {
      try {
        const response = await getMerchantStores();

        if (!active) return;

        const currentStore = response.data?.[0];

        if (!currentStore) {
          setMessage("Toko belum tersedia untuk akun ini.");
          setMessageType("error");
          return;
        }

        setStore(currentStore);
        setName(currentStore.name ?? "");
        setDescription(currentStore.description ?? "");
        setPhone(currentStore.phone ?? "");
        setWhatsapp(currentStore.whatsapp ?? "");
        setAddress(currentStore.address ?? "");
        setPhotoUrl(currentStore.logo_url ?? "");
      } catch (error) {
        if (!active) return;

        setMessage(
          error instanceof Error ? error.message : "Gagal memuat profil toko.",
        );
        setMessageType("error");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadStore();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(removePhoto ? "" : photoUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile, photoUrl, removePhoto]);

  function handlePhotoChange(file?: File) {
    setMessage("");

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessageType("error");
      setMessage("Gunakan gambar JPG, PNG, atau WEBP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessageType("error");
      setMessage("Ukuran foto maksimal 2 MB.");
      return;
    }

    setSelectedFile(file);
    setRemovePhoto(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!store) {
      setMessageType("error");
      setMessage("Toko tidak ditemukan. Muat ulang halaman.");
      return;
    }

    if (!name.trim()) {
      setMessageType("error");
      setMessage("Nama toko wajib diisi.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      let finalLogoUrl: string | null = photoUrl || null;

      if (selectedFile) {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("Silakan login kembali.");

        const extension =
          selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";

        const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            contentType: selectedFile.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

        finalLogoUrl = data.publicUrl;
      } else if (removePhoto) {
        finalLogoUrl = null;
      }

      const response = await updateMerchantStore(store.id, {
        name: name.trim(),
        description: description.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        address: address.trim() || null,
        logo_url: finalLogoUrl,
      });

      const updatedStore = response.data;

      setStore(updatedStore);
      setName(updatedStore.name ?? "");
      setDescription(updatedStore.description ?? "");
      setPhone(updatedStore.phone ?? "");
      setWhatsapp(updatedStore.whatsapp ?? "");
      setAddress(updatedStore.address ?? "");
      setPhotoUrl(updatedStore.logo_url ?? "");
      setSelectedFile(null);
      setRemovePhoto(false);

      setMessageType("success");
      setMessage("Profil toko berhasil disimpan.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Gagal menyimpan profil toko.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="Merchant"
        title="Profil Toko"
        description="Atur informasi toko yang ditampilkan kepada pelanggan UrbanSport."
      />

      <form
        onSubmit={submit}
        className="max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 md:p-7"
      >
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[#202020]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Logo toko"
                className="h-full w-full object-cover"
              />
            ) : (
              <Store size={30} className="text-gray-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold">{name || "Nama Toko"}</p>
            <p className="mt-1 text-sm text-gray-500">Logo profil toko</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                <ImagePlus size={16} />
                Pilih foto
              </button>

              {(photoUrl || selectedFile) && !removePhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setRemovePhoto(true);
                    setMessage("");
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Hapus logo
                </button>
              )}

              {removePhoto && (
                <button
                  type="button"
                  onClick={() => setRemovePhoto(false)}
                  disabled={saving}
                  className="rounded-lg px-3 py-2 text-sm hover:bg-white/5"
                >
                  Batalkan hapus
                </button>
              )}
            </div>

            <p className="mt-2 text-xs text-gray-500">
              JPG, PNG, atau WEBP. Maksimal 2 MB.
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => handlePhotoChange(event.target.files?.[0])}
        />

        <label className="mb-5 block text-sm text-gray-300">
          Nama toko
          <input
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={loading || saving}
            className={inputClass}
            placeholder="Nama toko"
          />
        </label>

        <label className="mb-5 block text-sm text-gray-300">
          Deskripsi toko
          <textarea
            rows={4}
            maxLength={2000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={loading || saving}
            className={inputClass}
            placeholder="Jelaskan produk atau layanan toko"
          />
        </label>

        <label className="mb-5 block text-sm text-gray-300">
          Nomor telepon
          <input
            type="tel"
            maxLength={30}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={loading || saving}
            className={inputClass}
            placeholder="Nomor telepon toko"
          />
        </label>

        <label className="mb-5 block text-sm text-gray-300">
          WhatsApp
          <input
            type="tel"
            maxLength={30}
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            disabled={loading || saving}
            className={inputClass}
            placeholder="Nomor WhatsApp toko"
          />
        </label>

        <label className="mb-6 block text-sm text-gray-300">
          Alamat toko
          <textarea
            rows={3}
            maxLength={500}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            disabled={loading || saving}
            className={inputClass}
            placeholder="Alamat lengkap toko"
          />
        </label>

        {message && (
          <p
            role="status"
            className={`mb-4 break-words text-sm ${
              messageType === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        <button
          disabled={saving || loading || !store}
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <LoaderCircle size={16} className="animate-spin" />}
          {loading
            ? "Memuat profil..."
            : saving
              ? "Menyimpan..."
              : "Simpan Profil Toko"}
        </button>
      </form>
    </div>
  );
}
