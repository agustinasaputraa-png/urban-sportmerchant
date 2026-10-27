import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type MerchantVenue = {
  id: string;
  name: string | null;
  type: string | null;
  address: string | null;
  image: string | null;
  status: boolean | null;
};

export type MerchantProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar: string | null;
  created_at: string | null;
};

export type MerchantStore = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
};

export type MerchantStoresResponse = {
  success: boolean;
  data: MerchantStore[];
};

export type MerchantMeResponse = {
  success: boolean;
  data: {
    profile: MerchantProfile | null;
    venues: MerchantVenue[];
    stores: MerchantStore[];
  };
};

async function getAccessToken(): Promise<string> {
  const supabase = createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Gagal membaca sesi login: ${error.message}`);
  }

  if (!session?.access_token) {
    throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
  }

  return session.access_token;
}

async function apiRequest<T>(path: string): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL belum diatur di .env.local");
  }

  const token = await getAccessToken();

  const response = await fetch(`${API_URL.replace(/\/+$/, "")}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`API ${response.status}: ${message}`);
  }

  return (await response.json()) as T;
}

/**
 * Mengambil toko milik akun merchant dari backend Proshop.
 * Backend mengembalikan { success: true, data: MerchantStore[] }.
 */
export function getMerchantStores() {
  return apiRequest<MerchantStoresResponse>("/proshop/merchant/stores");
}

/**
 * Alias untuk kompatibilitas dengan kode lama.
 * Respons sekarang menggunakan toko Proshop, bukan profil/venue.
 */
export async function getMerchantProfile(): Promise<MerchantMeResponse> {
  const response = await getMerchantStores();

  return {
    success: response.success,
    data: {
      profile: null,
      venues: [],
      stores: response.data ?? [],
    },
  };
}

/**
 * Alias kompatibilitas: sebelumnya fungsi ini memanggil
 * /merchant/venues. Sekarang mengambil toko Proshop merchant.
 */
export function getMerchantVenues() {
  return getMerchantStores();
}
