"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ShoppingCart,
  RefreshCw,
  Package,
  UserRound,
  MapPin,
  Phone,
  CalendarDays,
  CreditCard,
  Truck,
  AlertCircle,
  LoaderCircle,
  Store,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { PageHeading } from "@/components/ui";

// ============================================================
// CONFIG
// ============================================================

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

// ============================================================
// TYPES
// ============================================================

type StoreData = {
  id: string;
  name: string;
};

type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number | string;
  discount_percent: number;
  subtotal: number | string;
};

type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  store_id: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number | string;
  shipping_cost: number | string;
  total_amount: number | string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
};

// ============================================================
// HELPERS
// ============================================================

function rupiah(value: number | string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function dateFormat(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(result?.message)
      ? result.message.join(", ")
      : result?.message;

    throw new Error(message || `Request gagal (${response.status})`);
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

function paymentLabel(method: string | null) {
  if (method === "QRIS") return "QRIS (Simulasi)";
  if (method === "VIRTUAL_ACCOUNT") return "Virtual Account (Simulasi)";
  return "Belum dipilih";
}

function orderStatus(status: string) {
  switch (status) {
    case "PENDING":
      return {
        label: "Menunggu Pembayaran",
        className: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      };
    case "PROCESSING":
      return {
        label: "Sedang Diproses",
        className: "border-blue-400/20 bg-blue-400/10 text-blue-300",
      };
    case "SHIPPED":
      return {
        label: "Dalam Pengiriman",
        className: "border-violet-400/20 bg-violet-400/10 text-violet-300",
      };
    case "COMPLETED":
      return {
        label: "Selesai",
        className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      };
    case "CANCELLED":
      return {
        label: "Dibatalkan",
        className: "border-red-400/20 bg-red-400/10 text-red-300",
      };
    default:
      return {
        label: status || "Tidak diketahui",
        className: "border-gray-400/20 bg-gray-400/10 text-gray-300",
      };
  }
}

function paymentStatus(status: string) {
  if (status === "PAID") {
    return {
      label: "Sudah Dibayar",
      className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    };
  }

  if (status === "UNPAID") {
    return {
      label: "Belum Dibayar",
      className: "border-red-400/20 bg-red-400/10 text-red-300",
    };
  }

  return {
    label: status || "Tidak diketahui",
    className: "border-gray-400/20 bg-gray-400/10 text-gray-300",
  };
}

// ============================================================
// PAGE
// ============================================================

export default function OrdersPage() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token = await getAccessToken();

      // 1. Ambil toko milik merchant yang sedang login
      const storeResponse = await fetch(`${API_URL}/proshop/merchant/stores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const storeResult = await readResponse<StoreData[]>(storeResponse);

      const stores = Array.isArray(storeResult) ? storeResult : [];

      if (stores.length === 0) {
        setStore(null);
        setOrders([]);
        return;
      }

      const selectedStore = stores[0];

      setStore(selectedStore);

      // 2. Ambil pesanan toko tersebut
      const orderResponse = await fetch(
        `${API_URL}/proshop/merchant/stores/${selectedStore.id}/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

      const orderResult = await readResponse<Order[]>(orderResponse);

      setOrders(Array.isArray(orderResult) ? orderResult : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil data pesanan.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const totalOrders = orders.length;

  const unpaidOrders = orders.filter(
    (order) => order.payment_status === "UNPAID",
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "COMPLETED",
  ).length;

  const totalSales = orders.reduce(
    (sum, order) =>
      sum +
      (order.payment_status === "PAID" ? Number(order.total_amount) || 0 : 0),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Transaksi"
        title="Pesanan"
        description="Pantau pesanan pelanggan dan status pemenuhan dari toko kamu."
      />

      {/* STORE INFO */}
      {store && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-300/10 text-violet-300">
              <Store size={21} />
            </div>

            <div>
              <p className="text-xs text-gray-500">Toko aktif</p>
              <p className="font-semibold">{store.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-gray-300 hover:border-violet-300/50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Gagal mengambil pesanan</p>
            <p className="mt-1 leading-6">{error}</p>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="mt-2 font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Pesanan"
          value={String(totalOrders)}
          icon={<ShoppingCart size={20} />}
        />

        <StatCard
          title="Belum Dibayar"
          value={String(unpaidOrders)}
          icon={<CreditCard size={20} />}
        />

        <StatCard
          title="Pesanan Selesai"
          value={String(completedOrders)}
          icon={<Package size={20} />}
        />

        <StatCard
          title="Total Pembayaran Lunas"
          value={rupiah(totalSales)}
          icon={<Truck size={20} />}
        />
      </div>

      {/* ORDER LIST */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Daftar Pesanan Masuk</h2>

          <span className="text-xs text-gray-500">{orders.length} pesanan</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-6 py-16 text-sm text-gray-400">
            <LoaderCircle size={19} className="animate-spin" />
            Mengambil data pesanan...
          </div>
        ) : !error && !store ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-6 py-16 text-center">
            <Store className="mx-auto mb-4 text-gray-500" size={30} />
            <h3 className="font-semibold">Toko belum tersedia</h3>
            <p className="mt-2 text-sm text-gray-500">
              Buat atau aktifkan toko merchant terlebih dahulu.
            </p>
          </div>
        ) : !error && orders.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-6 py-16 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-300/10 text-violet-300">
              <ShoppingCart size={25} />
            </span>

            <h2 className="font-semibold">Belum ada pesanan masuk</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Pesanan pelanggan akan tampil di sini setelah checkout berhasil
              disimpan ke backend BigApps.
            </p>

            <button
              type="button"
              onClick={() => void loadOrders(true)}
              className="mt-5 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-gray-300 hover:border-violet-300/50"
            >
              Periksa Pesanan
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const orderState = orderStatus(order.status);
            const paymentState = paymentStatus(order.payment_status);

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]"
              >
                {/* HEADER */}
                <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{order.order_number}</p>

                    <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDays size={13} />
                      {dateFormat(order.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${orderState.className}`}
                    >
                      {orderState.label}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${paymentState.className}`}
                    >
                      {paymentState.label}
                    </span>
                  </div>
                </div>

                {/* BODY */}
                <div className="grid gap-5 p-4 lg:grid-cols-[1fr_300px]">
                  <div className="space-y-5">
                    {/* CUSTOMER */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">
                        Informasi Pelanggan
                      </h3>

                      <div className="space-y-2.5 text-sm">
                        <div className="flex items-start gap-2 text-gray-300">
                          <UserRound
                            size={16}
                            className="mt-0.5 shrink-0 text-gray-500"
                          />
                          {order.shipping_name}
                        </div>

                        <div className="flex items-start gap-2 text-gray-300">
                          <Phone
                            size={16}
                            className="mt-0.5 shrink-0 text-gray-500"
                          />
                          {order.shipping_phone}
                        </div>

                        <div className="flex items-start gap-2 text-gray-300">
                          <MapPin
                            size={16}
                            className="mt-0.5 shrink-0 text-gray-500"
                          />
                          <span className="leading-6">
                            {order.shipping_address}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ITEMS */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">
                        Produk Dipesan
                      </h3>

                      <div className="space-y-3">
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col justify-between gap-2 rounded-xl border border-[var(--border)] bg-[#202020] p-3 sm:flex-row sm:items-center"
                          >
                            <div>
                              <p className="text-sm font-medium text-white">
                                {item.product_name}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                SKU: {item.product_sku || "-"}
                                {" · "}
                                {item.quantity} unit
                              </p>
                            </div>

                            <p className="text-sm font-semibold">
                              {rupiah(item.subtotal)}
                            </p>
                          </div>
                        ))}

                        {(!order.items || order.items.length === 0) && (
                          <p className="text-sm text-gray-500">
                            Detail produk tidak tersedia.
                          </p>
                        )}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="rounded-xl border border-[var(--border)] p-3">
                        <p className="text-xs text-gray-500">
                          Catatan pelanggan
                        </p>
                        <p className="mt-1 text-sm text-gray-300">
                          {order.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* PAYMENT SUMMARY */}
                  <div className="h-fit rounded-xl border border-[var(--border)] bg-[#202020] p-4">
                    <h3 className="mb-4 font-semibold">Ringkasan Pembayaran</h3>

                    <div className="space-y-3 text-sm">
                      <Row label="Subtotal" value={rupiah(order.subtotal)} />

                      <Row label="Ongkir" value={rupiah(order.shipping_cost)} />

                      <div className="border-t border-[var(--border)] pt-3">
                        <Row
                          label="Total"
                          value={rupiah(order.total_amount)}
                          strong
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-[var(--border)] p-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CreditCard size={14} />
                        Metode pembayaran
                      </div>

                      <p className="mt-2 text-sm font-medium text-white">
                        {paymentLabel(order.payment_method)}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-amber-300">
                        Simulasi: pembayaran belum diverifikasi oleh payment
                        gateway.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-300/10 text-violet-300">
        {icon}
      </div>

      <p className="text-xs text-gray-500">{title}</p>

      <p className="mt-2 break-words text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className={strong ? "font-semibold text-white" : "text-gray-500"}>
        {label}
      </span>

      <span
        className={
          strong
            ? "text-right font-bold text-[var(--accent)]"
            : "text-right font-medium text-gray-200"
        }
      >
        {value}
      </span>
    </div>
  );
}
