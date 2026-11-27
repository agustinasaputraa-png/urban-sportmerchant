"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produk", icon: Package },
  { href: "/orders", label: "Pesanan", icon: ShoppingCart },
  { href: "/store", label: "Profil Toko", icon: Store },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export default function MerchantShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [authError, setAuthError] = useState("");

  // Restore sidebar preference
  useEffect(() => {
    const saved = localStorage.getItem("merchant-sidebar-collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("merchant-sidebar-collapsed", String(next));
      return next;
    });
  };

  // Supabase authentication
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      setAuthChecked(true);

      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login");
      }
    });

    async function checkSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!mounted) return;

        setUser(session?.user ?? null);
        setAuthChecked(true);

        if (!session) {
          router.replace("/login");
        }
      } catch {
        if (!mounted) return;

        setUser(null);
        setAuthError("Sesi tidak dapat diperiksa. Silakan login kembali.");
        setAuthChecked(true);
        router.replace("/login");
      }
    }

    void checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setAuthError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Logout gagal. Silakan coba kembali.",
      );
      setLoggingOut(false);
    }
  }, [loggingOut, router]);

  const metadata = user?.user_metadata ?? {};

  const displayName =
    metadata.business_name ||
    metadata.full_name ||
    user?.email?.split("@")[0] ||
    "Merchant";

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase())
      .join("") || "M";

  if (!authChecked || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#151515] px-4 text-white">
        <div className="flex flex-col items-center gap-3 text-center">
          <LoaderCircle
            size={30}
            className="animate-spin text-[var(--accent)]"
          />
          <p className="text-sm text-gray-400">
            {authError || "Memeriksa sesi akun..."}
          </p>
          {authError && (
            <Link
              href="/login"
              className="text-sm font-semibold text-[var(--accent)] hover:underline"
            >
              Kembali ke halaman login
            </Link>
          )}
        </div>
      </main>
    );
  }

  const sidebar = (
    <aside
      className={`flex h-full flex-col border-r border-[var(--border)] bg-[#191919] transition-[width] duration-300 ${
        collapsed ? "w-[76px]" : "w-[248px]"
      }`}
    >
      {/* LOGO */}
      <div
        className={`flex h-[76px] shrink-0 items-center border-b border-[var(--border)] ${
          collapsed ? "justify-center px-2" : "gap-3 px-6"
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-black text-black">
          B
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <p className="whitespace-nowrap font-bold tracking-wide">
              URBANSPORT
            </p>
            <p className="whitespace-nowrap text-xs text-[var(--muted)]">
              MERCHANT CENTER
            </p>
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <div className={`${collapsed ? "px-3" : "px-4"} pt-6`}>
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-gray-500">
            Workspace
          </p>
        )}

        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href === "/products" && pathname.startsWith("/products/"));

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? label : undefined}
                className={`group flex items-center rounded-xl py-3 text-sm transition ${
                  collapsed ? "justify-center px-0" : "gap-3 px-3"
                } ${
                  active
                    ? "bg-[#14e1e6]/10 font-semibold text-[var(--accent)]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={19} strokeWidth={1.8} className="shrink-0" />

                {!collapsed && (
                  <>
                    <span className="flex-1 whitespace-nowrap">{label}</span>

                    {label === "Pesanan" && (
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px]">
                        0
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ACCOUNT */}
      <div className={`mt-auto ${collapsed ? "p-3" : "p-4"}`}>
        {!collapsed && (
          <div className="rounded-2xl border border-[var(--border)] bg-[#202020] p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-gray-200">
                Sesi akun aktif
              </span>
            </div>
            <p className="break-all text-xs leading-5 text-gray-500">
              {user.email}
            </p>
          </div>
        )}

        {collapsed && (
          <div
            className="mb-3 flex justify-center"
            title={user.email || "Akun aktif"}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">
              {initials}
            </div>
          </div>
        )}

        {authError && (
          <p role="alert" className="mt-3 text-xs text-red-300">
            {authError}
          </p>
        )}

        <button
          type="button"
          disabled={loggingOut}
          onClick={() => void handleLogout()}
          title={collapsed ? "Keluar" : undefined}
          className={`mt-4 flex w-full items-center rounded-xl py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50 ${
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
        >
          {loggingOut ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <LogOut size={18} />
          )}

          {!collapsed && <span>{loggingOut ? "Keluar..." : "Keluar"}</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* DESKTOP SIDEBAR */}
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        {sidebar}
      </div>

      {/* MOBILE SIDEBAR */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/70"
          />

          <div className="relative h-full w-[248px]">
            {/* Mobile always expanded */}
            <div className="h-full [&_aside]:!w-[248px] [&_aside>div:first-child]:!justify-start [&_aside>div:first-child]:!gap-3 [&_aside>div:first-child]:!px-6 [&_aside>div:nth-child(2)]:!px-4">
              {sidebar}
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 text-white"
              aria-label="Tutup menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div
        className={`transition-[padding] duration-300 ${
          collapsed ? "lg:pl-[76px]" : "lg:pl-[248px]"
        }`}
      >
        {/* HEADER */}
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[var(--border)] bg-[#151515]/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-4">
            {/* MOBILE MENU */}
            <button
              className="text-gray-300 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={21} />
            </button>

            {/* DESKTOP TOGGLE */}
            <button
              onClick={toggleSidebar}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-gray-400 transition hover:bg-white/5 hover:text-white lg:flex"
              title={collapsed ? "Perbesar sidebar" : "Perkecil sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>

            {/* SEARCH */}
            <div className="hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[#1d1d1d] px-3 py-2 md:flex">
              <Search size={16} className="text-gray-500" />
              <span className="text-sm text-gray-500">Cari sesuatu...</span>
              <span className="ml-8 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-gray-500">
                ⌘ K
              </span>
            </div>

            <span className="text-sm text-gray-500 md:hidden">
              Merchant Center
            </span>
          </div>

          {/* RIGHT HEADER */}
          <div className="flex items-center gap-3">
            <button
              className="relative rounded-xl border border-[var(--border)] p-2.5 text-gray-400 transition hover:text-white"
              aria-label="Notifikasi"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            </button>

            <div className="h-8 w-px bg-[var(--border)]" />

            <div className="flex items-center gap-3 rounded-xl p-1.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-cyan-700 text-sm font-bold text-black">
                {initials}
              </div>

              <div className="hidden max-w-[190px] text-left sm:block">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>

              <ChevronDown
                size={15}
                className="hidden text-gray-500 sm:block"
              />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
