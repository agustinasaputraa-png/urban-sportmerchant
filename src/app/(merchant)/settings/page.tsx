import { ShieldCheck } from "lucide-react";
import { PageHeading } from "@/components/ui";
export default function SettingsPage() {
  return <div><PageHeading eyebrow="Preferensi" title="Pengaturan" description="Pengaturan akun dan akses merchant."/><div className="max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6"><div className="flex gap-4"><span className="rounded-xl bg-cyan-300/10 p-3 text-[var(--accent)]"><ShieldCheck size={22}/></span><div><h2 className="font-semibold">Keamanan akun</h2><p className="mt-2 text-sm leading-6 text-gray-500">Autentikasi dan role-based access akan dihubungkan dengan Supabase Auth. Jangan gunakan dashboard produksi sebelum kontrol akses tenant diterapkan di backend.</p><span className="mt-4 inline-block rounded-full bg-amber-300/10 px-3 py-1.5 text-xs text-amber-300">Belum dikonfigurasi</span></div></div></div></div>;
}
