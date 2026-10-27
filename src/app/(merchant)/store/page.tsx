"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImagePlus, LoaderCircle, Store, Trash2 } from "lucide-react";
import { PageHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "merchant-store-photos";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const inputClass =
  "mt-2 w-full rounded-xl border border-[var(--border)] bg-[#202020] px-3.5 py-3 outline-none focus:border-[var(--accent)]";

export default function StorePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("Golf Pro Shop");
  const [slug, setSlug] = useState("golf-pro-shop");
  const [description, setDescription] = useState(
    "Perlengkapan dan aksesori golf pilihan.",
  );
  const [photoUrl, setPhotoUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const supabase: any = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("Silakan login kembali.");

        const { data, error } = await supabase
          .from("profiles")
          .select("avatar")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (active && data?.avatar) {
          setPhotoUrl(data.avatar);
        }
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Gagal memuat foto profil toko.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const previewUrl = selectedFile
    ? URL.createObjectURL(selectedFile)
    : photoUrl;

  useEffect(() => {
    if (!selectedFile) return;

    const objectUrl = URL.createObjectURL(selectedFile);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  function handlePhotoChange(file?: File) {
    setMessage("");

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Gunakan gambar JPG, PNG, atau WEBP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage("Ukuran foto maksimal 2 MB.");
      return;
    }

    setSelectedFile(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Silakan login kembali.");

      let finalPhotoUrl = photoUrl;

      if (selectedFile) {
        const extension = selectedFile.name.split(".").pop()?.toLowerCase();
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

        finalPhotoUrl = data.publicUrl;

        const { error: profileError } = await supabase
          .from("profiles")
          .update({ avatar: finalPhotoUrl } as never)
          .eq("id", user.id);

        if (profileError) throw profileError;

        setPhotoUrl(finalPhotoUrl);
        setSelectedFile(null);
      }

      setMessage(
        "Foto profil berhasil disimpan. Nama, slug, dan deskripsi belum disimpan ke database.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan foto profil toko.",
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
                alt="Foto toko"
                className="h-full w-full object-cover"
              />
            ) : (
              <Store size={30} className="text-gray-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold">{name || "Nama Toko"}</p>
            <p className="mt-1 text-sm text-gray-500">Foto profil toko</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-white/5"
              >
                <ImagePlus size={16} />
                Pilih foto
              </button>

              {(photoUrl || selectedFile) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPhotoUrl("");
                    setMessage(
                      "Foto belum dihapus dari database. Pilih foto baru untuk menggantinya.",
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                  Batalkan pilihan
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
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="mb-5 block text-sm text-gray-300">
          Slug toko
          <input
            required
            value={slug}
            onChange={(event) =>
              setSlug(
                event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
              )
            }
            className={inputClass}
          />
          <span className="mt-2 block text-xs text-gray-500">
            ID URL toko; harus unik.
          </span>
        </label>

        <label className="mb-6 block text-sm text-gray-300">
          Deskripsi
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={inputClass}
          />
        </label>

        {message && (
          <p role="status" className="mb-4 break-words text-sm text-amber-300">
            {message}
          </p>
        )}

        <button
          disabled={saving || loading}
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <LoaderCircle size={16} className="animate-spin" />}
          {saving ? "Menyimpan..." : "Simpan Foto Toko"}
        </button>
      </form>
    </div>
  );
}
