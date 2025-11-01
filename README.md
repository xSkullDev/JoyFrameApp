# JoyFrame PhotoBooth (Web)

Aplikasi photobooth sederhana berbasis browser dibuat dengan HTML, CSS, dan JavaScript.

Fitur
- Pratinjau kamera langsung (getUserMedia)
- Pilihan filter (grayscale, sepia, invert, dll.)
- Stiker sederhana (heart, sunglasses, star)
- Countdown sebelum mengambil foto
- Galeri internal + download foto

Menjalankan secara lokal
getUserMedia biasanya memerlukan context yang aman (HTTPS) atau `localhost`. Jika Anda membuka `index.html` langsung dari file system, beberapa browser modern akan menolak akses kamera. Cara mudah menjalankan server lokal:

PowerShell (Windows) dengan Python (jika terpasang):

```powershell
# dari folder proyek
python -m http.server 8000
# lalu buka http://localhost:8000 di browser
```

Atau dengan Node (http-server):

```powershell
npm install -g http-server
http-server -p 8000
```

Cara pakai
1. Buka halaman di browser yang mendukung kamera (Chrome/Edge/Firefox).
2. Beri izin akses kamera.
3. Pilih filter dan stiker jika mau.
4. Tekan "Ambil Foto" (opsional pilih countdown).
5. Foto akan muncul di galeri; klik Download untuk menyimpan.

Catatan
- Jika kamera tidak muncul, periksa izin, koneksi perangkat, atau jalankan dari `localhost`/HTTPS.
- Stiker versi ini digambar di canvas sebagai contoh; untuk stiker berformat PNG/SVG atau drag/resize, saya dapat tambahkan fitur tersebut.

---

Dibuat oleh JoyFrame.
