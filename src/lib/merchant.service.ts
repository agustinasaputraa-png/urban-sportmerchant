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

export type MerchantMeResponse = {
  success: boolean;
  data: {
    profile: MerchantProfile;
    venues: MerchantVenue[];
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

export function getMerchantProfile() {
  return apiRequest<MerchantMeResponse>("/merchant/me");
}

export function getMerchantVenues() {
  return apiRequest<{
    success: boolean;
    data: MerchantVenue[];
  }>("/merchant/venues");
}
