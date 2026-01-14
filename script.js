const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const overlayCtx = overlay.getContext('2d');
const captureBtn = document.getElementById('capture');
const downloadBtn = document.getElementById('download');
const gallery = document.getElementById('gallery');
const layoutButtons = Array.from(document.querySelectorAll('.layout-thumb'));
const stickerBtns = Array.from(document.querySelectorAll('.sticker-btn'));
const uploadSticker = document.getElementById('uploadSticker');
const countdownEl = document.getElementById('countdown');
const flipBtn = document.getElementById('flipBtn');

let currentOverlay = 'none';
let stickerImage = null; // Image object for uploaded sticker
let emojiSticker = null; // string for emoji sticker
let mirrored = false;

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = stream;
    await video.play();
    if (video.readyState >= 1) setCanvasSize();
    else video.addEventListener('loadedmetadata', setCanvasSize, { once: true });
    requestAnimationFrame(loop);
  } catch (err) {
    console.error('Camera error', err);
    alert('Tidak dapat mengakses kamera. Pastikan Anda membuka lewat HTTPS atau localhost dan izinkan kamera.');
  }
}

function setCanvasSize() {
  // size drawing buffer to video's intrinsic size
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 480;
  overlay.width = vw;
  overlay.height = vh;
  // size CSS box to fit inside preview padding (14px each side)
  overlay.style.width = `calc(100% - 28px)`;
  overlay.style.height = `calc(100% - 28px)`;
}

function loop() {
  drawOverlay(overlayCtx, overlay.width, overlay.height);
  requestAnimationFrame(loop);
}

function drawOverlay(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  if (currentOverlay === 'frame') {
    ctx.strokeStyle = '#8B5E3C';
    ctx.lineWidth = Math.max(8, w * 0.02);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  } else if (currentOverlay === 'hearts') {
    ctx.fillStyle = 'rgba(255,0,100,0.95)';
    ctx.font = `${Math.floor(w / 8)}px serif`;
    ctx.fillText('❤️', w * 0.05, h * 0.22);
    ctx.fillText('💖', w * 0.72, h * 0.82);
  } else if (currentOverlay === 'vintage') {
    ctx.fillStyle = 'rgba(255,240,200,0.12)';
    ctx.fillRect(0, 0, w, h);
  } else if (currentOverlay === 'text') {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = Math.max(4, w * 0.004);
    ctx.font = `${Math.floor(w / 12)}px sans-serif`;
    const text = 'Smile :)';
    const tw = ctx.measureText(text).width;
    const x = (w - tw) / 2;
    const y = h * 0.12;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  // draw emoji sticker if set
  if (emojiSticker) {
    ctx.font = `${Math.floor(w / 6)}px serif`;
    ctx.fillText(emojiSticker, w * 0.78, h * 0.78);
  }

  // draw uploaded sticker
  if (stickerImage) {
    const maxW = w * 0.28;
    const scale = Math.min(1, maxW / stickerImage.width);
    const iw = stickerImage.width * scale;
    const ih = stickerImage.height * scale;
    ctx.drawImage(stickerImage, w - iw - 16, h - ih - 16, iw, ih);
  }

  ctx.restore();
}

function capturePhoto() {
  if (!video.videoWidth) return;
  // create temp canvas with real size
  const tmp = document.createElement('canvas');
  tmp.width = video.videoWidth;
  tmp.height = video.videoHeight;
  const tctx = tmp.getContext('2d');
  // draw video
  tctx.drawImage(video, 0, 0, tmp.width, tmp.height);
  // draw overlays using same logic but scaled
  // reuse drawOverlay by drawing existing overlay canvas onto tmp
  tctx.drawImage(overlay, 0, 0, tmp.width, tmp.height);

  const dataUrl = tmp.toDataURL('image/png');
  addToGallery(dataUrl);
  downloadBtn.disabled = false;
  downloadBtn.onclick = () => downloadDataUrl(dataUrl);
}

function downloadDataUrl(dataUrl) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `joyframe-${Date.now()}.png`;
  a.click();
}

function addToGallery(dataUrl) {
  const item = document.createElement('div');
  item.className = 'thumb';
  const img = document.createElement('img');
  img.src = dataUrl;
  const actions = document.createElement('div');
  actions.className = 'actions';
  const dl = document.createElement('button'); dl.textContent = 'Download';
  dl.onclick = () => downloadDataUrl(dataUrl);
  const del = document.createElement('button'); del.textContent = 'Hapus';
  del.onclick = () => item.remove();
  actions.appendChild(dl); actions.appendChild(del);
  item.appendChild(img); item.appendChild(actions);
  gallery.prepend(item);
}

// layout selection
layoutButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    layoutButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    currentOverlay = btn.dataset.val || 'none';
  });
});

// stickers
stickerBtns.forEach(b => b.addEventListener('click', ()=>{
  emojiSticker = b.dataset.emoji || null;
  stickerImage = null;
}));

// Flip/mirror toggle
if (flipBtn) {
  flipBtn.addEventListener('click', () => {
    mirrored = !mirrored;
    if (mirrored) {
      video.classList.add('mirror');
      flipBtn.textContent = 'Unflip';
    } else {
      video.classList.remove('mirror');
      flipBtn.textContent = 'Flip';
    }
  });
}

uploadSticker.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const img = new Image();
  img.onload = () => { stickerImage = img; emojiSticker = null; }
  img.src = URL.createObjectURL(f);
});

captureBtn.addEventListener('click', ()=>{
  // simple 3-second countdown
  let t = 3;
  countdownEl.classList.remove('hidden');
  countdownEl.textContent = t;
  const iv = setInterval(()=>{
    t -= 1;
    if (t <= 0) {
      clearInterval(iv);
      countdownEl.classList.add('hidden');
      capturePhoto();
    } else {
      countdownEl.textContent = t;
    }
  }, 700);
});

// start
startCamera();
