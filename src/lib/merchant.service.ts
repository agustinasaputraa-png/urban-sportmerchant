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

export type UpdateMerchantStoreInput = {
  name: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
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

async function apiRequest<T>(
  path: string,
  options: {
    method?: "GET" | "PATCH";
    body?: unknown;
  } = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL belum diatur di .env.local");
  }

  const token = await getAccessToken();
  const method = options.method ?? "GET";

  const response = await fetch(`${API_URL.replace(/\/+$/, "")}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
    cache: "no-store",
  });

  if (!response.ok) {
    const responseText = await response.text();
    let message = responseText;

    try {
      const parsed = JSON.parse(responseText);
      if (typeof parsed.message === "string") {
        message = parsed.message;
      } else if (Array.isArray(parsed.message)) {
        message = parsed.message.join(", ");
      }
    } catch {
      // Respons bukan JSON; gunakan teks asli.
    }

    throw new Error(`API ${response.status}: ${message}`);
  }

  return (await response.json()) as T;
}

export function getMerchantStores() {
  return apiRequest<MerchantStoresResponse>("/proshop/merchant/stores");
}

export function updateMerchantStore(
  storeId: string,
  input: UpdateMerchantStoreInput,
) {
  return apiRequest<{
    success: boolean;
    data: MerchantStore;
  }>(`/proshop/merchant/stores/${encodeURIComponent(storeId)}`, {
    method: "PATCH",
    body: input,
  });
}

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

export function getMerchantVenues() {
  return getMerchantStores();
}
