import { ShoppingCart } from "lucide-react";
import { PageHeading } from "@/components/ui";
export default function OrdersPage() {
  return <div><PageHeading eyebrow="Transaksi" title="Pesanan" description="Pantau pesanan dan proses pemenuhan pesanan pelanggan."/>
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-6 py-16 text-center"><span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-300/10 text-violet-300"><ShoppingCart size={25}/></span><h2 className="font-semibold">Belum ada data pesanan</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Halaman ini siap dikembangkan setelah checkout dan API pesanan UrbanSport terhubung.</p></div>
  </div>;
}
