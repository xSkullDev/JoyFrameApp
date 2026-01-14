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
    const stream = await navigator.mediaDevices.getUserMedia({video:{width:1280, height:720}, audio:false});
    video.srcObject = stream;
    await video.play();
    resizeCanvas();
    requestAnimationFrame(drawLoop);
  }catch(e){
    alert('Gagal mengakses kamera: ' + (e.message || e));
  }
}

function resizeCanvas(){
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.style.width = '100%';
}

function drawLoop(){
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.save();
  if(mirror){
    ctx.translate(w,0);
    ctx.scale(-1,1);
  }
  ctx.drawImage(video,0,0,w,h);
  ctx.restore();
  drawOverlay(ctx,w,h);
  requestAnimationFrame(drawLoop);
}

function drawOverlay(ctx,w,h){
  const val = overlaySelect.value;
  if(val === 'frame'){
    ctx.strokeStyle = '#8B5E3C';
    ctx.lineWidth = Math.max(10, w * 0.03);
    ctx.strokeRect(ctx.lineWidth/2, ctx.lineWidth/2, w - ctx.lineWidth, h - ctx.lineWidth);
  }else if(val === 'hearts'){
    ctx.fillStyle = 'rgba(255,0,100,0.9)';
    ctx.font = `${Math.floor(w/6)}px serif`;
    ctx.fillText('❤️', w*0.05, h*0.25);
    ctx.fillText('💖', w*0.72, h*0.82);
  }else if(val === 'vintage'){
    ctx.fillStyle = 'rgba(255,240,200,0.18)';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0,0,w, h*0.06);
    ctx.fillRect(0,h*0.94,w, h*0.06);
  }else if(val === 'text'){
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 6;
    ctx.font = `${Math.floor(w/12)}px sans-serif`;
    const text = 'Smile :)';
    const tw = ctx.measureText(text).width;
    const x = (w - tw)/2;
    const y = h*0.12;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  if(stickerImg){
    const maxW = w * 0.35;
    const scale = Math.min(1, maxW / stickerImg.width);
    const iw = stickerImg.width * scale;
    const ih = stickerImg.height * scale;
    ctx.drawImage(stickerImg, w - iw - 20, h - ih - 20, iw, ih);
  }
}

captureBtn.addEventListener('click', ()=>{
  const dataUrl = canvas.toDataURL('image/png');
  photoPreview.src = dataUrl;
  downloadBtn.disabled = false;
  downloadBtn.onclick = () => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `joyframe-${Date.now()}.png`;
    a.click();
  };
});

switchMirrorBtn.addEventListener('click', ()=>{ mirror = !mirror; });

// Fullscreen toggle for the camera element
fullscreenBtn.addEventListener('click', async ()=>{
  const camEl = document.querySelector('.camera');
  try{
    if(!document.fullscreenElement){
      await camEl.requestFullscreen();
      fullscreenBtn.textContent = 'Keluar Layar Penuh';
    }else{
      await document.exitFullscreen();
      fullscreenBtn.textContent = 'Tampilan Layar Penuh';
    }
  }catch(e){
    console.warn('Fullscreen error', e);
  }
});

// Picture-in-Picture (PiP) support
if('pictureInPictureEnabled' in document){
  pipBtn.disabled = false;
  pipBtn.addEventListener('click', async ()=>{
    try{
      if(document.pictureInPictureElement){
        await document.exitPictureInPicture();
      }else{
        if(video.readyState >= 2){
          await video.requestPictureInPicture();
        }
      }
    }catch(e){
      console.warn('PiP error', e);
    }
  });
}else{
  pipBtn.disabled = true;
}

uploadSticker.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const img = new Image();
  img.onload = ()=>{ stickerImg = img; };
  img.src = URL.createObjectURL(f);
});

window.addEventListener('resize', ()=>{ try{ resizeCanvas(); }catch(e){} });
startCamera();
