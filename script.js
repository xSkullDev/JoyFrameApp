const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const overlaySelect = document.getElementById('overlaySelect');
const captureBtn = document.getElementById('capture');
const downloadBtn = document.getElementById('download');
const photoPreview = document.getElementById('photoPreview');
const switchMirrorBtn = document.getElementById('switchMirror');
const uploadSticker = document.getElementById('uploadSticker');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const pipBtn = document.getElementById('pipBtn');

let mirror = true;
let stickerImg = null;

async function startCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280}, height:{ideal:720}}, audio:false});
    video.srcObject = stream;
    await video.play();
    // Ensure canvas is sized after metadata is available
    if (video.readyState >= 1) {
      resizeCanvas();
    } else {
      video.addEventListener('loadedmetadata', resizeCanvas, { once: true });
    }
    requestAnimationFrame(drawLoop);
  }catch(e){
    console.error('Kamera error', e);
    alert('Gagal mengakses kamera. Buka lewat HTTPS atau localhost.');
  }
}

function resizeCanvas(){
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 480;
  canvas.width = vw;
  canvas.height = vh;
}

function drawLoop(){
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.save();
  if(mirror){ ctx.translate(w,0); ctx.scale(-1,1); }
  try{ ctx.drawImage(video,0,0,w,h); }catch(e){}
  ctx.restore();
  drawOverlay(ctx,w,h);
  requestAnimationFrame(drawLoop);
}

function drawOverlay(ctx,w,h){
  const val = overlaySelect.value;
  if(val === 'frame'){
    ctx.strokeStyle = '#8B5E3C';
    ctx.lineWidth = Math.max(8, w * 0.02);
    ctx.strokeRect(ctx.lineWidth/2, ctx.lineWidth/2, w - ctx.lineWidth, h - ctx.lineWidth);
  }else if(val === 'hearts'){
    ctx.fillStyle = 'rgba(255,0,100,0.9)';
    ctx.font = `${Math.floor(w/10)}px serif`;
    ctx.fillText('❤️', w*0.06, h*0.2);
    ctx.fillText('💖', w*0.7, h*0.8);
  }else if(val === 'vintage'){
    ctx.fillStyle = 'rgba(255,240,200,0.12)';
    ctx.fillRect(0,0,w,h);
  }else if(val === 'text'){
    ctx.fillStyle = 'white'; ctx.strokeStyle = 'black'; ctx.lineWidth = 6;
    ctx.font = `${Math.floor(w/12)}px sans-serif`;
    const text = 'Smile :)';
    const tw = ctx.measureText(text).width; const x = (w - tw)/2; const y = h*0.12;
    ctx.strokeText(text,x,y); ctx.fillText(text,x,y);
  }

  if(stickerImg){
    const maxW = w * 0.28;
    const scale = Math.min(1, maxW / stickerImg.width);
    const iw = stickerImg.width * scale;
    const ih = stickerImg.height * scale;
    ctx.drawImage(stickerImg, w - iw - 16, h - ih - 16, iw, ih);
  }
}

captureBtn.addEventListener('click', ()=>{
  resizeCanvas();
  const dataUrl = canvas.toDataURL('image/png');
  photoPreview.src = dataUrl;
  downloadBtn.disabled = false;
  downloadBtn.onclick = ()=>{
    const a = document.createElement('a'); a.href = dataUrl; a.download = `joyframe-${Date.now()}.png`; a.click();
  };
});

switchMirrorBtn.addEventListener('click', ()=>{ mirror = !mirror; });

// Fullscreen (only if button exists)
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', async ()=>{
    const camEl = document.getElementById('cameraArea');
    try{
      if(!document.fullscreenElement){ await camEl.requestFullscreen(); fullscreenBtn.textContent = 'Keluar Penuh'; }
      else{ await document.exitFullscreen(); fullscreenBtn.textContent = 'Layar Penuh'; }
      setTimeout(resizeCanvas,300);
    }catch(e){ console.warn('Fullscreen error',e); }
  });
}

// Picture-in-Picture (safe-check button)
if (pipBtn) {
  if('pictureInPictureEnabled' in document){
    pipBtn.disabled = false;
    pipBtn.addEventListener('click', async ()=>{
      try{
        if(document.pictureInPictureElement) await document.exitPictureInPicture();
        else if(video.readyState >= 2) await video.requestPictureInPicture();
      }catch(e){ console.warn('PiP error', e); }
    });
  }else{
    pipBtn.disabled = true;
  }
}

uploadSticker.addEventListener('change',(e)=>{
  const f = e.target.files[0]; if(!f) return; const img = new Image(); img.onload = ()=>{ stickerImg = img; URL.revokeObjectURL(img.src); };
  img.src = URL.createObjectURL(f);
});

window.addEventListener('resize', ()=>{ try{ resizeCanvas(); }catch(e){} });
startCamera();
