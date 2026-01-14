let currentFilter = "none";

// 1. Logika Klik Tombol Filter
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = () => {
        // Update UI tombol
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Simpan filter yang dipilih
        currentFilter = btn.getAttribute('data-filter');
        
        // Terapkan ke Video Preview
        video.style.filter = currentFilter === "none" ? "none" : currentFilter;
        // Ingat: ScaleX(-1) untuk mirroring harus tetap ada jika diatur via CSS tunggal, 
        // tapi karena kita pakai inline style filter, CSS transform di style awal akan tetap jalan.
    };
});

// 2. Perbarui Fungsi takePhoto()
function takePhoto() {
    flashEl.style.opacity = '1';
    setTimeout(() => flashEl.style.opacity = '0', 100);

    const ctx = canvas.getContext('2d');
    
    // PENTING: Terapkan filter ke Canvas sebelum menggambar
    ctx.filter = currentFilter;

    // Gambar Video (Mirroring)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Gambar Frame (Tanpa filter jika ingin frame tetap berwarna asli)
    // Jika ingin frame ikut terfilter, biarkan ctx.filter di atas. 
    // Jika ingin frame tetap berwarna asli, reset filter di sini:
    // ctx.filter = "none"; 
    
    ctx.drawImage(frameOverlay, 0, 0, canvas.width, canvas.height);

    const data = canvas.toDataURL('image/png');
    const img = document.createElement('img');
    img.src = data;
    gallery.prepend(img);

    const a = document.createElement('a');
    a.href = data;
    a.download = `JoyFrame_${Date.now()}.png`;
    a.click();

    captureBtn.disabled = false;
}

// Menambahkan stiker ke dalam list
const addSticker = (stickerUrl) => {
  const newSticker = {
    id: Date.now(),
    url: stickerUrl,
    x: 50, // posisi awal
    y: 50,
    size: 100
  };
  setStickers([...stickers, newSticker]);
};

// Mengupdate posisi saat di-drag
const handleDrag = (id, newX, newY) => {
  updateStickerPosition(id, { x: newX, y: newY });
};