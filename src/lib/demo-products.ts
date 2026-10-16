/**
 * Bentuk data produk yang disiapkan untuk katalog Pro Shop UrbanSport.
 * Sesuaikan nama field/DTO dengan API NestJS saat endpoint produk dibuat.
 */
export type Product = {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  sku: string;
  category: string;
  sport: "GOLF" | "PADEL" | "GENERAL";
  brand: string;
  price: number;
  discountPercent: number;
  stock: number;
  status: "Aktif" | "Nonaktif";
  description: string;
  imageUrl: string;
};

export const PRODUCT_CATEGORIES = [
  "Apparel", "Shoes", "Equipment", "Accessories", "Balls", "Bags", "Lifestyle", "Other"
] as const;

export const SPORT_OPTIONS = [
  { value: "GOLF", label: "Golf" },
  { value: "PADEL", label: "Padel" },
  { value: "GENERAL", label: "Umum / Semua olahraga" }
] as const;

// Data demo untuk preview UI, bukan data database produksi.
export const demoProducts: Product[] = [
  { id: "prd-001", tenantId: "tenant-golf-demo", tenantName: "Golf Pro Shop", name: "Golf Polo Shirt", sku: "GOLF-APP-001", category: "Apparel", sport: "GOLF", brand: "UrbanSport", price: 350000, discountPercent: 10, stock: 20, status: "Aktif", description: "Polo shirt nyaman untuk latihan dan bermain golf.", imageUrl: "" },
  { id: "prd-002", tenantId: "tenant-golf-demo", tenantName: "Golf Pro Shop", name: "Golf Glove", sku: "GOLF-ACC-002", category: "Accessories", sport: "GOLF", brand: "UrbanSport", price: 125000, discountPercent: 0, stock: 8, status: "Aktif", description: "Sarung tangan golf dengan grip nyaman.", imageUrl: "" },
  { id: "prd-003", tenantId: "tenant-golf-demo", tenantName: "Golf Pro Shop", name: "Golf Ball Set", sku: "GOLF-BAL-003", category: "Balls", sport: "GOLF", brand: "Practice Pro", price: 180000, discountPercent: 5, stock: 4, status: "Aktif", description: "Set bola golf untuk latihan.", imageUrl: "" },
  { id: "prd-004", tenantId: "tenant-golf-demo", tenantName: "Golf Pro Shop", name: "Sports Water Bottle", sku: "GEN-LIF-004", category: "Lifestyle", sport: "GENERAL", brand: "UrbanSport", price: 95000, discountPercent: 0, stock: 0, status: "Nonaktif", description: "Botol minum untuk aktivitas olahraga.", imageUrl: "" }
];

export const rupiah = (value: number) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0
}).format(value);

export const discountedPrice = (price: number, discountPercent: number) =>
  Math.round(price * (1 - Math.min(100, Math.max(0, discountPercent)) / 100));
