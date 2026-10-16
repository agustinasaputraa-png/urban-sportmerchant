# UrbanSport Merchant Center

Starter dashboard Next.js untuk merchant/tenant yang mengisi katalog produk UrbanSport.

## Jalankan
```bash
npm install
npm run dev
```
Buka http://localhost:3002

## Data produk yang disiapkan
Form produk disiapkan dengan field:
- `name`: nama produk
- `sku`: kode unik produk (idealnya unik per tenant)
- `sport`: `GOLF`, `PADEL`, atau `GENERAL`
- `category`: kategori katalog seperti Apparel, Shoes, Equipment, Accessories, Balls, Bags, Lifestyle, Other
- `brand`: merek produk
- `description`: deskripsi produk
- `price`: harga sebelum diskon dalam Rupiah
- `discountPercent`: diskon persen (0-100)
- `stock`: stok unit
- `status`: Aktif / Nonaktif
- `imageUrl`: URL gambar produk
- `tenantId` / `tenantName`: identitas toko/tenant; **jangan diambil dari input bebas browser saat menyimpan**, backend harus menentukan dari sesi merchant terautentikasi.

Harga promo dihitung sebagai `price * (1 - discountPercent / 100)` dan idealnya dihitung ulang/validasi di backend.

## Penting untuk integrasi aplikasi Expo
Field di atas adalah rancangan kontrak awal berdasarkan kebutuhan katalog Pro Shop. Nama field belum tentu sama dengan model Prisma/API yang sudah ada; sebelum integrasi, cocokkan dengan schema Prisma, endpoint NestJS, dan tipe `Product` yang dipakai screen Pro Shop Expo.

## Batasan versi sekarang
- Data contoh, belum tersimpan permanen.
- Tombol validasi form hanya memeriksa input di browser.
- Pemilihan file gambar belum meng-upload file.
- Belum ada login/authentication merchant.
- Belum ada isolasi tenant yang ditegakkan server.

## Checklist sebelum produksi
1. Cocokkan/definisikan model Prisma untuk tenant/store dan product.
2. Implementasikan CRUD API NestJS dan DTO validation.
3. Validasi Supabase JWT di backend.
4. Ambil tenantId dari identitas merchant terverifikasi; filter semua operasi produk berdasarkan tenant itu.
5. Upload gambar ke Supabase Storage/ImageKit lalu simpan URL-nya.
6. Implementasikan login dan proteksi route dashboard.
7. Jangan pernah expose `SUPABASE_SERVICE_ROLE_KEY` melalui `NEXT_PUBLIC_*`.
