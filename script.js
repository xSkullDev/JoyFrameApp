/**
 * PHOTO STRIP & STICKER ENGINE
 * Fitur: Multi-upload, Drag & Drop Stickers, Export Image
 */

// 1. Inisialisasi Variabel Utama
const photoStrip = document.getElementById('photo-strip');
const uploadInput = document.getElementById('upload-photo');

// 2. Fungsi Logika Upload Foto (Multi-Layout)
uploadInput.addEventListener('change', function(e) {
    const files = e.target.files;
    
    // Validasi jumlah foto
    if (files.length > 4) {
        alert("Maksimal pilih 4 foto untuk hasil terbaik!");
        return;
    }

    // Bersihkan kontainer sebelum merender ulang foto
    // Namun tetap pertahankan stiker yang sudah ada jika diinginkan, 
    // atau bersihkan semua dengan: photoStrip.innerHTML = '';
    const existingStickers = document.querySelectorAll('.sticker');
    photoStrip.innerHTML = ''; 

    Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return; // Validasi tipe file

        const reader = new FileReader();
        reader.onload = (event) => {
            const frame = document.createElement('div');
            frame.className = 'photo-frame';
            
            const img = document.createElement('img');
            img.src = event.target.result;
            img.alt = "Uploaded Photo";
            
            frame.appendChild(img);
            photoStrip.appendChild(frame);
        };
        reader.readAsDataURL(file);
    });

    // Kembalikan stiker ke kontainer jika tadi tidak ingin menghapusnya
    existingStickers.forEach(s => photoStrip.appendChild(s));
});

// 3. Fungsi Menambahkan Stiker Baru
function addSticker(imgUrl) {
    const sticker = document.createElement('div');
    sticker.className = 'sticker';
    
    // Set posisi awal di tengah agar mudah terlihat
    sticker.style.left = '20px';
    sticker.style.top = '20px';
    
    const img = document.createElement('img');
    img.src = imgUrl;
    img.setAttribute('draggable', 'false'); // Mencegah drag bawaan browser
    
    sticker.appendChild(img);
    photoStrip.appendChild(sticker);

    // Aktifkan fungsi drag untuk stiker ini
    initDraggable(sticker);
}

// 4. Inisialisasi Interact.js untuk Drag & Drop
function initDraggable(element) {
    // Inisialisasi koordinat internal untuk elemen ini
    let x = 0;
    let y = 0;

    interact(element).draggable({
        // Mengaktifkan inertia untuk pergerakan halus
        inertia: true,
        // Memastikan stiker tidak keluar dari area photo-strip
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
            })
        ],
        listeners: {
            move(event) {
                // Kalkulasi posisi baru berdasarkan pergerakan mouse/jari
                x += event.dx;
                y += event.dy;

                // Terapkan transformasi CSS
                event.target.style.transform = `translate(${x}px, ${y}px)`;
            }
        }
    });
}

// 5. Fungsi Export/Download Hasil Akhir
async function downloadStrip() {
    const btn = document.querySelector('.btn-download');
    const originalText = btn.innerText;
    
    try {
        btn.innerText = "Processing...";
        btn.disabled = true;

        // Gunakan html2canvas untuk mengambil snapshot elemen #photo-strip
        const canvas = await html2canvas(photoStrip, {
            useCORS: true,       // Mendukung gambar dari domain luar
            scale: 3,            // Meningkatkan resolusi hasil (3x lipat)
            backgroundColor: null // Background transparan jika perlu
        });

        // Konversi canvas ke URL Gambar
        const imageData = canvas.toDataURL("image/png");
        
        // Buat elemen link sementara untuk memicu download
        const link = document.createElement('a');
        link.download = `photostrip-${Date.now()}.png`;
        link.href = imageData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error("Gagal menyimpan gambar:", error);
        alert("Maaf, terjadi kesalahan saat menyimpan gambar.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}