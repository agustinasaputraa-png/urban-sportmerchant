"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ImagePlus, Save } from "lucide-react";
import { PageHeading } from "@/components/ui";
import { PRODUCT_CATEGORIES, SPORT_OPTIONS, discountedPrice, rupiah } from "@/lib/demo-products";

const input = "mt-2 w-full rounded-xl border border-[var(--border)] bg-[#202020] px-3.5 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[var(--accent)]";

export default function NewProductPage() {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [sport, setSport] = useState("GOLF");
  const [category, setCategory] = useState("Accessories");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [status, setStatus] = useState("Aktif");
  const [message, setMessage] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payloadPreview = {
      name: name.trim(), sku: sku.trim(), sport, category, brand: brand.trim(),
      price: Number(price), discountPercent: Number(discount), stock: Number(stock),
      description: description.trim(), imageUrl, status,
      // tenantId nantinya diambil dari sesi merchant yang terautentikasi oleh backend.
    };
    console.log("UrbanSport product payload preview:", payloadPreview);
    setMessage(`Data "${name}" sudah lolos validasi form. Belum disimpan ke database karena API NestJS belum dihubungkan.`);
  }

  return <div>
    <Link href="/products" className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[var(--accent)]"><ArrowLeft size={16}/> Kembali ke Produk</Link>
    <PageHeading eyebrow="Katalog / Produk baru" title="Tambah Produk" description="Isi data yang akan digunakan katalog Pro Shop UrbanSport. Tenant toko akan ditentukan dari akun merchant yang login."/>
    <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 md:p-6">
          <h2 className="mb-5 font-semibold">Informasi Produk</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nama produk *"><input required maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Contoh: Golf Polo Shirt" className={input}/></Field>
            <Field label="SKU / Kode produk *"><input required maxLength={64} value={sku} onChange={e=>setSku(e.target.value.trimStart())} placeholder="Contoh: GOLF-APP-001" className={input}/></Field>
            <Field label="Olahraga *"><select value={sport} onChange={e=>setSport(e.target.value)} className={input}>{SPORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
            <Field label="Kategori *"><select value={category} onChange={e=>setCategory(e.target.value)} className={input}>{PRODUCT_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field>
            <Field label="Merek / Brand"><input maxLength={80} value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Contoh: Adidas, Wilson, UrbanSport" className={input}/></Field>
            <Field label="Status produk"><select value={status} onChange={e=>setStatus(e.target.value)} className={input}><option>Aktif</option><option>Nonaktif</option></select></Field>
            <div className="md:col-span-2"><Field label="Deskripsi produk"><textarea maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)} rows={4} placeholder="Detail bahan, ukuran, warna, spesifikasi, atau manfaat produk..." className={`${input} resize-y`}/></Field></div>
          </div>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 md:p-6">
          <h2 className="mb-5 font-semibold">Harga & Persediaan</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Harga jual (IDR) *"><input required type="number" min="0" step="1" value={price} onChange={e=>setPrice(e.target.value)} placeholder="350000" className={input}/></Field>
            <Field label="Diskon (%)"><input type="number" min="0" max="100" step="1" value={discount} onChange={e=>setDiscount(e.target.value)} className={input}/></Field>
            <Field label="Stok tersedia *"><input required type="number" min="0" step="1" value={stock} onChange={e=>setStock(e.target.value)} placeholder="20" className={input}/></Field>
            <div className="rounded-xl border border-[var(--border)] bg-[#202020] p-3"><p className="text-xs text-gray-500">Harga setelah diskon</p><p className="mt-2 text-lg font-bold text-[var(--accent)]">{price && Number(price) >= 0 ? rupiah(discountedPrice(Number(price), Number(discount)||0)) : "Rp 0"}</p><p className="mt-1 text-xs text-gray-600">Harga promo perkiraan</p></div>
          </div>
        </section>
      </div>
      <div className="space-y-5">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="mb-4 font-semibold">Foto Produk</h2>
          <label className="flex min-h-[175px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-600 bg-[#202020] p-5 text-center transition hover:border-[var(--accent)]">
            <span className="mb-3 rounded-xl bg-[var(--accent)]/10 p-3 text-[var(--accent)]"><ImagePlus size={25}/></span>
            <span className="text-sm font-semibold">Pilih file gambar</span><span className="mt-2 text-xs leading-5 text-gray-500">PNG, JPG, atau WEBP</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={e=>setImageName(e.target.files?.[0]?.name || "")}/>
          </label>
          {imageName && <p className="mt-2 break-all text-xs text-gray-400">File dipilih: {imageName}</p>}
          <Field label="Atau URL gambar"><input type="url" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://..." className={input}/></Field>
          <p className="mt-3 text-xs leading-5 text-gray-500">File yang dipilih belum di-upload. Saat integrasi backend, gambar akan dikirim ke Supabase Storage atau ImageKit dan URL-nya disimpan ke produk.</p>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h2 className="mb-3 font-semibold">Ringkasan untuk katalog app</h2>
          <div className="space-y-3 text-sm">
            <Summary label="Nama" value={name || "Belum diisi"}/><Summary label="Olahraga" value={SPORT_OPTIONS.find(o=>o.value===sport)?.label || sport}/><Summary label="Kategori" value={category}/><Summary label="Merek" value={brand || "—"}/><Summary label="Stok" value={stock || "0"}/><Summary label="Status" value={status}/>
          </div>
        </section>
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-black hover:bg-[#63f0f2]"><Save size={17}/> Validasi Data Produk</button>
        {message && <div role="status" className="rounded-xl border border-amber-400/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-200">{message}</div>}
      </div>
    </form>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-gray-300">{label}{children}</label>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3"><span className="text-gray-500">{label}</span><span className="max-w-[170px] truncate text-right font-medium">{value}</span></div>; }
