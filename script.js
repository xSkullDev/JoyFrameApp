document.addEventListener('DOMContentLoaded', () => {
    // Elemen
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('capture-btn');
    const frameOverlay = document.getElementById('frame-overlay');
    const countdownEl = document.getElementById('countdown');
    const flashEl = document.getElementById('flash');
    const gallery = document.getElementById('gallery');

    let currentFilter = 'none';

    // Daftar Frame (ganti URL ke frame PNG Anda atau file lokal)
    const frames = [
        'https://raw.githubusercontent.com/xskulldev/JoyFrameApp/main/assets/frames/frame1.png',
        'https://raw.githubusercontent.com/xskulldev/JoyFrameApp/main/assets/frames/frame2.png',
        'https://raw.githubusercontent.com/xskulldev/JoyFrameApp/main/assets/frames/frame3.png'
    ];

    // Inisialisasi frame selector
    function initFrames() {
        const list = document.getElementById('frame-list');
        frames.forEach((url, index) => {
            const img = document.createElement('img');
            img.src = url;
            img.className = `frame-option ${index === 0 ? 'active' : ''}`;
            img.alt = `frame-${index+1}`;
            img.width = 100;
            img.height = 75;
            if (index === 0) frameOverlay.src = url;
            img.addEventListener('click', () => {
                document.querySelectorAll('.frame-option').forEach(el => el.classList.remove('active'));
                img.classList.add('active');
                frameOverlay.src = url;
            });
            list.appendChild(img);
        });
    }

    // Setup kamera
    async function setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            video.srcObject = stream;
        } catch (err) {
            alert("Izin kamera ditolak atau tidak tersedia.");
            console.error(err);
        }
    }

    // Filter buttons handling
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter') || 'none';
            video.style.filter = currentFilter === 'none' ? 'none' : currentFilter;
        });
    });

    // Countdown + capture
    captureBtn.addEventListener('click', () => {
        let count = 3;
        captureBtn.disabled = true;
        countdownEl.style.display = 'block';
        countdownEl.innerText = count;
        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.innerText = count;
            } else {
                clearInterval(timer);
                countdownEl.style.display = 'none';
                takePhoto();
            }
        }, 1000);
    });

    // Ambil foto ke canvas, terapkan filter, gambar frame, simpan & unduh
    function takePhoto() {
        // Flash effect
        flashEl.style.opacity = '1';
        setTimeout(() => flashEl.style.opacity = '0', 120);

        const ctx = canvas.getContext('2d');

        // Terapkan filter ke canvas (CSS filter string langsung didukung oleh ctx.filter)
        ctx.filter = currentFilter === 'none' ? 'none' : currentFilter;

        // Mirror draw video
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        // Gambar frame (biasanya frame PNG dengan transparansi)
        // Jika ingin frame tidak terkena filter, simpan filter, reset, lalu gambar frame
        const prevFilter = ctx.filter;
        // pastikan frame sudah termuat
        if (frameOverlay.complete && frameOverlay.naturalWidth !== 0) {
            // gambar frame tanpa filter agar warna aslinya tetap
            ctx.filter = 'none';
            ctx.drawImage(frameOverlay, 0, 0, canvas.width, canvas.height);
            ctx.filter = prevFilter;
        }

        // Simpan hasil
        const data = canvas.toDataURL('image/png');
        const img = document.createElement('img');
        img.src = data;
        img.alt = 'joyframe-photo';
        gallery.prepend(img);

        // Auto-download
        const a = document.createElement('a');
        a.href = data;
        a.download = `JoyFrame_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        captureBtn.disabled = false;
    }

    // Inisialisasi
    initFrames();
    setupCamera();
});