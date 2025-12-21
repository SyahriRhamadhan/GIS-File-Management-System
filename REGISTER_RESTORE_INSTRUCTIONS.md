# Cara Mengaktifkan Kembali Fitur Register

Secara default, route **register** dinonaktifkan. Jika ingin mengaktifkan kembali fitur registrasi user, lakukan langkah berikut:

1. Buka `routes/auth.php` dan hapus komentar (`//`) pada route register:
   - `Route::get('register', [RegisteredUserController::class, 'create'])`
   - `Route::post('register', [RegisteredUserController::class, 'store'])`
2. Buka `resources/js/pages/landing/navbar.tsx` dan aktifkan tautan ke route `register` (bagian desktop dan mobile).
3. Buka `resources/js/pages/auth/register.tsx` dan aktifkan kembali konten halaman register (jika saat ini dikomentari).
4. Pastikan `App\\Http\\Controllers\\Auth\\RegisteredUserController` masih ada dan tidak dihapus.
5. Jalankan ulang bundler frontend bila diperlukan:
   - `npm run dev` (development) atau `npm run build` (production)

