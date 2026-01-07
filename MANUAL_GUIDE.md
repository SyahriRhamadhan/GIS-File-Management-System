# Manual Guide -  GIS Report Management System (Laravel + React/Inertia)

Dokumen ini menjelaskan cara instalasi singkat dan penggunaan fitur utama aplikasi **GIS Report Management System**.

## 0) Peta Dokumentasi (Tambahan)

Selain manual ini, repo sudah punya dokumentasi teknis spesifik:

- `README.MD` -  instalasi & perintah development
- `UPLOAD_LIMIT_GUIDE.md` -  batas upload GeoJSON 100MB (frontend + backend)
- `GEOJSON_CONVERTER_FEATURES.md` -  aturan file konversi >10MB (hanya download)
- `PERFORMANCE_SUMMARY.md` -  ringkasan optimasi performa dashboard
- `ARCGIS_STYLE_CONVERSION.md` -  dokumentasi lengkap konversi file ArcGIS `.style`
- `STYLE_USAGE_GUIDE.md` -  cara memakai simbol hasil konversi di React/TypeScript
- `COLOR_EXTRACTION_GUIDE.md` -  ekstraksi warna dari tags style
- `QUICK_REFERENCE.md` -  ringkas perintah converter style
- `scripts/README.md` -  detail script konversi `.style`

## 1) Gambaran Umum

Aplikasi ini digunakan untuk:

- Menampilkan data spasial (GeoJSON) pada peta dan dashboard statistik.
- Mengelola data pendukung: **Region**, **Kategori**, **Pewarnaan RDTR**.
- Mengelola **Laporan PDF** yang dapat dikaitkan ke GeoJSON.
- Mengelola akun melalui **User Management**.
- Mengonversi **SHP (ZIP)** menjadi **GeoJSON**.
- (Opsional) Memakai **simbol ArcGIS `.style`** yang dikonversi menjadi JSON untuk kebutuhan simbolisasi/legenda.

## 2) Persyaratan Sistem (Lokal/Server)

- PHP >= 8.1
- Composer
- Node.js >= 16 + NPM
- Database MySQL/PostgreSQL

## 3) Instalasi Singkat (Developer/IT)

1. Install dependency:
    - `composer install`
    - `npm install`
2. Setup environment:
    - Salin `.env.example` menjadi `.env`
    - `php artisan key:generate`
3. Konfigurasi database di `.env`, lalu jalankan:
    - `php artisan migrate --seed`
4. Jalankan aplikasi:
    - Backend: `php artisan serve`
    - Frontend: `npm run dev`

Catatan:

- Route register default **dinonaktifkan** (lihat `routes/auth.php`). Petunjuk mengaktifkannya ada di `REGISTER_RESTORE_INSTRUCTIONS.md`.

## 4) Akses & Role

### Role yang digunakan

- `superadmin`
- `admin`

### Catatan implementasi saat ini

- Modul **User Management** menerapkan kebijakan proteksi untuk akun `superadmin` (lihat bagian 9).
- Pembatasan menu berbasis role belum terlihat di navigasi frontend (menu tampil untuk semua user yang login). Jika diperlukan, pembatasan akses sebaiknya ditambahkan di middleware/policy.

## 5) URL & Navigasi

### Halaman publik

- Landing + peta publik: `/`
- API peta publik: `/api/public/geojsons`

### Halaman setelah login

Semua fitur dashboard berada di bawah middleware `auth` (dan `verified`, yang efektif jika verifikasi email diaktifkan).

#### Flow login (lengkap)

**A. Prekondisi**

1. User sudah terdaftar di tabel `users`.
2. User punya `email` dan `password` yang diberikan admin.

**B. Langkah login**

1. Buka halaman login:
    - Akses langsung `/login`, atau
    - Buka URL dashboard (mis. `/dashboard`) -> sistem otomatis redirect ke `/login` jika belum login.
2. Isi form:
    - `Email address`: masukkan email.
    - `Password`: masukkan password.
    - `Remember me` (opsional): centang jika ingin sesi login lebih lama.
3. Klik tombol `Log in`.
4. Hasil:
    - Jika sukses, sistem membuat sesi baru (regenerate session) lalu redirect ke halaman _intended_.
    - Jika tidak ada _intended_, redirect ke `/dashboard`.

**C. Validasi & pesan error yang umum**

1. Email/password salah:
    - Sistem menampilkan error autentikasi (mengacu `auth.failed`).
2. Rate limit percobaan login:
    - Setelah 5 percobaan gagal untuk kombinasi `email + IP`, login ditolak sementara (mengacu `auth.throttle`).
3. User belum verifikasi email (hanya jika verifikasi email diaktifkan):
    - Route yang memakai middleware `verified` akan redirect ke `/verify-email` sampai `email_verified_at` terisi.

**D. Flow logout**

1. Klik `Log out` (menu user).
2. Sistem melakukan POST `/logout`:
    - Logout guard `web`.
    - Invalidate session.
    - Regenerate CSRF token.
3. Sistem redirect ke `/`.

**E. Flow lupa password**

1. Di halaman login klik `Forgot password?` -> `/forgot-password`.
2. Masukkan email, submit permintaan reset.
3. User menerima link reset (butuh konfigurasi email).
4. Buka link `/reset-password/{token}` -> set password baru.

Menu utama (sidebar) mengarah ke:

- Dashboard: `/dashboard`
- PDF (Laporan): `/dashboard/tambah-pdf`
- Region: `/dashboard/region`
- Tambah Map (GeoJSON): `/dashboard/geojson`
- Tambah Kategori / Pewarnaan RTRW: `/dashboard/kategori`
- Pewarnaan RDTR: `/dashboard/pewarnaan-rdtr`
- User Management: `/dashboard/users`
- SHP to GeoJSON: `/convert-shp`

## 6) Modul Dashboard (Statistik & Peta)

Lokasi: `/dashboard`

Fungsi utama:

- Ringkasan statistik: total GeoJSON, kategori, region, laporan, owner, user.
- Grafik distribusi (kategori, region, owner type, sifat laporan) dan timeline.
- Peta interaktif (Leaflet) dengan filter.

Catatan performa:

- Metadata GeoJSON dapat di-_lazy-load_ melalui endpoint `GET /api/dashboard/geojsons`.
- Detail optimasi: `PERFORMANCE_SUMMARY.md`.

### Step-by-step penggunaan Dashboard

**A. Membuka Dashboard**

1. Login.
2. Klik menu `Dashboard` di sidebar, atau buka `/dashboard`.
3. Pastikan halaman memuat kartu statistik dan tab dashboard (statistik/peta).

**B. Melihat statistik**

1. Perhatikan kartu ringkasan (total GeoJSON, kategori, region, laporan, owner, user).
2. Scroll ke bagian grafik untuk melihat distribusi data (kategori/region/owner/sifat) dan tren.
3. Jika ada daftar data terbaru (recent), klik item untuk melanjutkan (jika tersedia pada UI).

**C. Menggunakan peta**

1. Buka tab peta (jika tersedia).
2. Interaksi umum:
    - Zoom in/out menggunakan kontrol zoom atau scroll.
    - Drag peta untuk menggeser area.
    - Klik layer/polygon untuk melihat popup (jika ada).
3. Jika peta terasa berat, kurangi jumlah data yang ditampilkan (gunakan filter/pagination metadata bila tersedia).

## 7) Modul Tambah Map / GeoJSON

### 7.1 Daftar GeoJSON

Lokasi: `/dashboard/geojson`

Fitur umum:

- Pencarian & filter: user, region, owner, kategori, source_name, main_category.
- Sorting & pagination (termasuk opsi `per_page=all`).
- Preview GeoJSON (modal) yang mengambil data dari API: `GET /dashboard/api/geojson/{id}/data`.
- Hapus data dan bulk delete.

#### Step-by-step: cari, filter, sort, dan pagination

1. Buka `/dashboard/geojson`.
2. Cari data:
    - Isi kolom pencarian (mis. nama source/user/region/owner/kategori) lalu tunggu debounce atau tekan aksi cari (tergantung UI).
3. Filter data:
    - Pilih `User`, `Region`, `Owner`, `Kategori`, `Source Name`, atau `Main Category` (jika tersedia).
4. Sorting:
    - Klik judul kolom/aksi sort (mis. `source_name`, `created_at`) untuk mengubah urutan asc/desc.
5. Pagination:
    - Gunakan tombol halaman (1,2,3, dst) atau tombol next/prev jika ada.
    - Ubah `Per Page` bila tersedia; opsi `all` akan memuat semua data (bisa berat).

#### Step-by-step: preview GeoJSON

1. Di tabel/list, klik aksi `View/Preview` pada item GeoJSON.
2. Sistem memuat data melalui `GET /dashboard/api/geojson/{id}/data`.
3. Pastikan peta/preview tampil dan polygon ter-_center_.
4. Tutup modal/preview setelah selesai.

#### Step-by-step: hapus GeoJSON (single)

1. Klik tombol `Hapus/Delete` pada item.
2. Konfirmasi penghapusan.
3. Sistem menghapus data dan menampilkan notifikasi sukses/gagal.

#### Step-by-step: bulk delete GeoJSON

1. Centang checkbox beberapa item.
2. Klik aksi `Bulk Delete` (jika tersedia).
3. Konfirmasi.
4. Sistem menghapus semua item terpilih yang valid dan menampilkan ringkasan hasil.

### 7.2 Tambah GeoJSON

Lokasi: `/dashboard/geojson/create`

Alur umum:

1. Pilih **Region**, **Owner**, **Kategori**, dan **Main Category** (opsional, nilai valid: `RDTR`, `RTRW`, `KKPR`, `GANTI RUGI`).
2. Upload GeoJSON:
    - Bisa multi-file `.geojson` (drag & drop tersedia).
    - Validasi server membatasi total upload **maks 100MB** (lihat `app/Http/Requests/StoreGeojsonRequest.php`).
    - Detail limit & contoh error: `UPLOAD_LIMIT_GUIDE.md`.
3. (Opsional) Konversi SHP/KML/KMZ -> GeoJSON di halaman create:
    - File hasil konversi > **10MB** hanya dapat di-_download_ (tidak disarankan dipakai langsung di form).
    - Detail aturan >10MB: `GEOJSON_CONVERTER_FEATURES.md`.

#### Step-by-step: tambah GeoJSON dari file `.geojson`

1. Buka `/dashboard/geojson/create`.
2. Isi metadata:
    - Pilih `Region` (wajib/opsional sesuai kebutuhan).
    - Pilih `Owner`.
    - Pilih `Kategori`.
    - Pilih `Main Category` (opsional).
3. Upload file:
    - Klik area upload dan pilih satu/lebih file `.geojson`, atau drag & drop file ke area upload.
    - Pastikan total ukuran file tidak melebihi 100MB.
4. Submit:
    - Klik tombol submit/simpan.
5. Hasil:
    - Jika valid, data GeoJSON tersimpan dan muncul notifikasi sukses.
    - Jika gagal, periksa pesan error (format JSON, FeatureCollection, ukuran file, atau field relasi).

#### Step-by-step: konversi SHP/KML/KMZ lalu gunakan hasilnya

1. Di halaman create GeoJSON, pilih fitur konversi (upload `.zip` SHP atau file KML/KMZ bila ada).
2. Tunggu proses konversi hingga preview muncul.
3. Jika file hasil <= 10MB:
    - Klik `Gunakan` (atau `Gunakan Semua`) untuk memasukkan ke form.
4. Jika file hasil > 10MB:
    - Klik `Download` / `Download Semua`, lalu olah/pecah file terlebih dahulu sebelum diupload kembali.

### 7.3 Edit/Update GeoJSON

Lokasi: `/dashboard/geojson/{id}/edit`

Catatan:

- Validasi ukuran file update **maks 100MB** (lihat `app/Http/Requests/UpdateGeojsonRequest.php`).

#### Step-by-step: edit/update

1. Dari list `/dashboard/geojson`, klik `Edit` pada item.
2. Ubah field yang diperlukan (metadata dan/atau file GeoJSON).
3. Jika mengupload file baru:
    - Pastikan file valid dan ukuran <= 100MB.
4. Klik `Update/Simpan`.
5. Pastikan notifikasi sukses muncul dan data berubah di list.

## 8) Modul PDF / Laporan

Lokasi menu: `/dashboard/tambah-pdf`

Fitur utama:

- Menambah laporan PDF dan mengaitkannya ke GeoJSON yang sudah ada, atau (opsional) membuat GeoJSON dari input file/text saat menambah laporan.
- Filter list laporan berdasarkan `sifat`, `region`, dan `kategori`.

Validasi penting:

- Upload PDF dibatasi `max:2048` (+/-2MB) dan `mimes:pdf` (lihat `app/Http/Controllers/ReportController.php`).
- Field `nomor` bersifat unik.

### Step-by-step: membuat laporan PDF

1. Buka `/dashboard/tambah-pdf`.
2. Klik aksi tambah (jika tersedia) atau masuk ke halaman create laporan.
3. Isi field laporan:
    - `Nomor` (unik), `Sifat`, `Hal`, `Kepada`, dan `Description` (opsional).
4. Pilih sumber GeoJSON:
    - Pilih `GeoJSON` yang sudah ada, atau
    - Upload/isi GeoJSON (jika fitur ini digunakan pada UI create).
5. Upload file PDF:
    - Pastikan format PDF dan ukuran <= 2MB.
6. Klik `Simpan`.
7. Verifikasi:
    - Laporan muncul pada list.
    - Filter `Sifat/Region/Kategori` dapat digunakan untuk mencari laporan.

### Step-by-step: edit & hapus laporan

1. Edit:
    - Dari list laporan, klik `Edit`.
    - Perbarui data dan (opsional) ganti file PDF.
    - Klik `Update`.
2. Hapus:
    - Klik `Hapus/Delete`.
    - Konfirmasi.

## 9) Modul User Management

Lokasi: `/dashboard/users`

Fitur utama:

- List user dengan pencarian (nama/email), filter role, sorting, pagination.
- Tambah user, edit user, lihat detail user.
- Bulk delete.

Kebijakan keamanan yang diterapkan (backend):

- User tidak dapat menghapus akunnya sendiri.
- Penghapusan `superadmin` ditolak jika menyebabkan total `superadmin` menjadi < 3.
- Role user `superadmin` tidak bisa diubah menjadi non-`superadmin`.
- Delete menggunakan **soft delete** (audit/recovery backend tersedia).

Catatan UI:

- Form tambah user saat ini hanya menampilkan opsi role `superadmin` (lihat `resources/js/pages/user/create.tsx`). Edit user menyediakan pilihan `admin` dan `superadmin`.

### Step-by-step: list, cari, filter, sort, pagination

1. Buka `/dashboard/users`.
2. Cari user:
    - Isi `Cari nama atau email...` lalu klik `Terapkan Filter` (atau tekan Enter jika didukung).
3. Filter role:
    - Pilih role di dropdown `Semua Role`.
4. Atur jumlah data:
    - Pilih `10/25/50/100 per halaman`.
5. Sorting:
    - Klik header kolom yang memiliki ikon sort untuk mengubah urutan.
6. Pagination:
    - Klik tombol halaman di bagian bawah tabel.

### Step-by-step: tambah user

1. Klik `Tambah User`.
2. Isi form:
    - Nama, Email, Password, Konfirmasi Password, Role.
3. Klik `Simpan User`.
4. Pastikan notifikasi sukses muncul.

### Step-by-step: lihat detail user

1. Dari list, klik aksi `Detail/Lihat` pada user.
2. Pastikan informasi user tampil.
3. Klik `Edit User` jika perlu mengubah data.

### Step-by-step: edit user

1. Klik `Edit` pada user.
2. Ubah nama/email/role.
3. Password:
    - Kosongkan jika tidak ingin mengganti password.
4. Klik `Simpan Perubahan`.

### Step-by-step: hapus user (single) & bulk delete

1. Single delete:
    - Klik `Hapus` pada user -> konfirmasi.
2. Bulk delete:
    - Centang beberapa user -> klik `Hapus Terpilih` -> konfirmasi.
3. Catatan kebijakan:
    - Tidak bisa hapus akun sendiri.
    - Tidak bisa menghapus `superadmin` jika akan menyisakan < 3 akun `superadmin`.

## 10) Modul Region

Lokasi: `/dashboard/region`

Fitur:

- CRUD region dengan pencarian, sort, filter `kecamatan` dan `desa`.
- Validasi anti duplikasi kombinasi (provinsi/kabupaten/kecamatan/desa).

### Step-by-step: kelola region

1. Buka `/dashboard/region`.
2. Cari/filter:
    - Isi pencarian.
    - Pilih filter `Kecamatan` dan/atau `Desa`.
3. Tambah region:
    - Klik `+ Tambah Wilayah`.
    - Isi: nama, provinsi, kabupaten, kecamatan, desa, detail (opsional), link (opsional).
    - Klik simpan.
4. Edit region:
    - Klik `Edit`.
    - Ubah data -> simpan.
5. Hapus region:
    - Klik `Hapus` -> konfirmasi.
6. Jika muncul error duplikasi:
    - Kombinasi provinsi/kabupaten/kecamatan/desa sudah ada; gunakan kombinasi lain atau edit data yang sudah ada.

## 11) Modul Kategori

Lokasi: `/dashboard/kategori`

Fitur:

- List kategori dengan filter per-orde dan pagination (client-side).
- CRUD kategori.

Validasi penting:

- `kode_warna` wajib format hex `#RRGGBB`.
- `kode` unik (jika diisi).
- `layer_order` integer 0-65535.

### Step-by-step: kelola kategori

1. Buka `/dashboard/kategori`.
2. Cari/filter:
    - Gunakan kolom pencarian dan filter orde (Nama/Orde1/Orde2/Orde3) dan `layer_order` bila tersedia.
3. Tambah Kategori / Pewarnaan RTRW:
    - Klik `+ Tambah Kategori / Pewarnaan RTRW`.
    - Isi `orde0` (wajib), orde lainnya (opsional), `kode` (opsional, unik), `kode_warna` (wajib), `ket_warna` (opsional), `layer_order` (wajib).
    - Simpan.
4. Edit kategori:
    - Klik `Edit` pada item -> ubah field -> simpan.
5. Hapus kategori:
    - Klik `Hapus` -> konfirmasi.

## 12) Modul Pewarnaan RDTR

Lokasi: `/dashboard/pewarnaan-rdtr`

Fitur:

- CRUD data warna RDTR (kode/sub_zona/CMYK/RGB/HSV/hex).
- Pencarian dan pagination.
- Jika `kode_warna` kosong tetapi `rgb` terisi (format "R G B"), sistem akan membentuk hex otomatis.

### Step-by-step: kelola Pewarnaan RDTR

1. Buka `/dashboard/pewarnaan-rdtr`.
2. Cari data:
    - Isi kotak pencarian (kode/sub zona) lalu klik `Cari` jika ada tombol.
3. Ubah jumlah tampil:
    - Pilih `Per Page` (10/25/50/100).
4. Tambah data:
    - Klik `+ Tambah`.
    - Isi `kode` (unik), `sub_zona` (opsional), `rgb` (opsional), dan/atau `kode_warna` (hex).
    - Simpan.
5. Edit data:
    - Klik `Edit` -> ubah -> simpan.
6. Hapus data:
    - Klik `Hapus` -> konfirmasi.
7. Catatan:
    - Jika `kode_warna` kosong dan `rgb` berformat "R G B", sistem akan mengisi `kode_warna` otomatis.

## 13) SHP to GeoJSON (Converter)

Lokasi: `/convert-shp`

Fitur:

- Upload file `.zip` berisi minimal `.shp`, `.shx`, `.dbf` (opsional `.prj`, `.cpg`).
- Preview hasil konversi di peta.
- Download hasil `.geojson` (single/multi-part).

### Step-by-step: konversi SHP (ZIP) ke GeoJSON

1. Login lalu buka `/convert-shp`.
2. Upload file `.zip`:
    - Klik input upload dan pilih file ZIP yang berisi `.shp/.shx/.dbf`.
3. Tunggu proses konversi:
    - Jika hasil terdiri dari banyak part, sistem menampilkan daftar preview.
4. Preview:
    - Peta akan men-_zoom_ ke bounds data.
    - Klik feature untuk melihat properti (popup).
5. Download:
    - Klik `Download GeoJSON` untuk satu file, atau `Download All GeoJSON` untuk banyak file.

## 14) ArcGIS Style (.style) -> JSON (Simbolisasi)

Repo ini menyediakan tool untuk mengonversi file ArcGIS `.style` menjadi JSON dan menggunakannya di aplikasi web.

Ringkas:

- Script berada di folder `scripts/`
- Output berada di `style-output/`
- Dokumentasi lengkap dan cara pakai:
    - `ARCGIS_STYLE_CONVERSION.md`
    - `STYLE_USAGE_GUIDE.md`
    - `COLOR_EXTRACTION_GUIDE.md`
    - `QUICK_REFERENCE.md`
    - `scripts/README.md`

Workflow yang umum dipakai:

1. Jalankan konversi metadata simbol (recommended).
2. (Opsional) ekstrak warna dari tags.
3. Salin `style-output/` ke `public/` jika ingin diakses lewat browser.

### Step-by-step: konversi file `.style`

1. Pastikan dependency tersedia:
    - Jalankan `npm install` (sekali).
2. Jalankan konversi:
    - Metadata simbol: `npm run convert:style`
    - Ekstrak warna: `npm run convert:colors`
3. Cek output di folder `style-output/`.
4. Jika ingin dipakai oleh aplikasi via browser:
    - Copy `style-output/` ke `public/style-output/` (lihat `STYLE_USAGE_GUIDE.md`).

## 15) Troubleshooting Cepat

- Tidak ada menu Register: memang dinonaktifkan default. Ikuti `REGISTER_RESTORE_INSTRUCTIONS.md` jika perlu mengaktifkannya.
- Upload GeoJSON gagal: pastikan total ukuran file <= 100MB dan file valid FeatureCollection.
- Hapus user gagal: cek kebijakan minimal 3 `superadmin` dan larangan hapus akun sendiri.
- Upload PDF gagal: pastikan file PDF dan ukuran <= 2MB.
- Simbol ArcGIS tidak muncul: pastikan `style-output/` sudah tersedia dan (jika dipakai via web) sudah dicopy ke `public/style-output/` sesuai `STYLE_USAGE_GUIDE.md`.
