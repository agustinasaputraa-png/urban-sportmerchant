 "use client";
import { useState, type FormEvent } from "react";
import { PageHeading } from "@/components/ui";
export default function StorePage() {
  const [name, setName] = useState("Golf Pro Shop");
  const [slug, setSlug] = useState("golf-pro-shop");
  const [description, setDescription] = useState("Perlengkapan dan aksesori golf pilihan.");
  const [message, setMessage] = useState("");
  function submit(e: FormEvent) { e.preventDefault(); setMessage("Profil berhasil divalidasi. Penyimpanan permanen menunggu integrasi API."); }
  return <div><PageHeading eyebrow="Merchant" title="Profil Toko" description="Atur informasi toko yang ditampilkan kepada pelanggan UrbanSport."/>
    <form onSubmit={submit} className="max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 md:p-7">
      <div className="mb-6 flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-xl font-black text-black">GP</div><div><p className="font-semibold">{name || "Nama Toko"}</p><p className="mt-1 text-sm text-gray-500">Profil merchant</p></div></div>
      <label className="mb-5 block text-sm text-gray-300">Nama toko<input required value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[#202020] px-3.5 py-3 outline-none focus:border-[var(--accent)]"/></label>
      <label className="mb-5 block text-sm text-gray-300">Slug toko<input required value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-"))} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[#202020] px-3.5 py-3 outline-none focus:border-[var(--accent)]"/><span className="mt-2 block text-xs text-gray-500">ID URL toko; harus unik.</span></label>
      <label className="mb-6 block text-sm text-gray-300">Deskripsi<textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[#202020] px-3.5 py-3 outline-none focus:border-[var(--accent)]"/></label>
      <button className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-black" type="submit">Validasi Profil</button>
      {message && <p role="status" className="mt-4 text-sm text-amber-300">{message}</p>}
    </form>
  </div>;
}
