const video = document.getElementById('video');
const overlayCanvas = document.getElementById('overlayCanvas');
const layoutCanvas = document.getElementById('layoutCanvas');
const captureBtn = document.getElementById('captureBtn');
const filterSelect = document.getElementById('filterSelect');
const countdownSelect = document.getElementById('countdownSelect');
const countdownEl = document.getElementById('countdown');
const poseIndicator = document.getElementById('poseIndicator');
const galleryList = document.getElementById('galleryList');
const downloadLast = document.getElementById('downloadLast');
const clearGalleryBtn = document.getElementById('clearGallery');

let stream = null;
let currentFilter = 'none';
let selectedSticker = null;
let lastPhotoDataUrl = null;
const gallery = [];

const layoutMap = {
    'layout-a': {poses:4, cols:2, rows:2},
    'layout-b': {poses:3, cols:1, rows:3},
    'layout-c': {poses:2, cols:1, rows:2},
    'layout-d': {poses:6, cols:3, rows:2}
};
let currentLayout = 'layout-a';

async function startCamera(){
    try{
        stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}, audio:false});
        video.srcObject = stream;
        await video.play();
        resizeOverlay();
        window.addEventListener('resize', resizeOverlay);
    }catch(err){
        alert('Tidak dapat mengakses kamera. Pastikan izin diberikan dan gunakan https atau localhost.\n'+err.message);
        console.error(err);
    }
}

function resizeOverlay(){
    const rect = video.getBoundingClientRect();
    overlayCanvas.width = video.videoWidth || rect.width;
    overlayCanvas.height = video.videoHeight || rect.height;
    overlayCanvas.style.width = `${rect.width}px`;
    overlayCanvas.style.height = `${rect.height}px`;

    if(layoutCanvas){
        layoutCanvas.width = Math.max(240, rect.width * 0.32);
        layoutCanvas.height = Math.max(160, rect.height * 0.48);
        layoutCanvas.style.width = `${Math.max(240, rect.width * 0.32)}px`;
        layoutCanvas.style.height = `${Math.max(160, rect.height * 0.48)}px`;
    }
}

function setFilter(filter){
    currentFilter = filter;
    video.style.filter = filter;
}

function drawStickerOnCtx(ctx, w, h){
    if(!selectedSticker) return;
    ctx.save();
    const size = Math.min(w,h) * 0.20;
    const x = w - size - 16;
    const y = h - size - 16;
    if(selectedSticker === 'heart'){
        ctx.fillStyle = 'rgba(255,60,110,0.95)';
        ctx.beginPath();
        const topX = x + size/2;
        ctx.moveTo(topX, y + size*0.75);
        ctx.bezierCurveTo(topX + size*0.6, y + size*0.2, x + size, y + size*0.2, x + size, y + size*0.5);
        ctx.bezierCurveTo(x + size, y + size*0.85, topX, y + size*1.05, topX, y + size*1.25);
        ctx.bezierCurveTo(topX, y + size*1.05, x, y + size*0.85, x, y + size*0.5);
        ctx.bezierCurveTo(x, y + size*0.2, topX - size*0.6, y + size*0.2, topX, y + size*0.75);
        ctx.fill();
    } else if(selectedSticker === 'sunglasses'){
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(x, y + size*0.3, size*0.9, size*0.25);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(x + 6, y + size*0.35, size*0.35, size*0.12);
        ctx.fillRect(x + size*0.45, y + size*0.35, size*0.35, size*0.12);
    } else if(selectedSticker === 'star'){
        ctx.fillStyle = 'rgba(255,210,0,0.95)';
        const cx = x + size/2, cy = y + size/2, r = size/2;
        ctx.beginPath();
        for(let i=0;i<5;i++){
            const a = (i*2*Math.PI)/5 - Math.PI/2;
            const sx = cx + Math.cos(a)*r;
            const sy = cy + Math.sin(a)*r;
            ctx.lineTo(sx,sy);
            const a2 = a + Math.PI/5;
            const sx2 = cx + Math.cos(a2)*r*0.45;
            const sy2 = cy + Math.sin(a2)*r*0.45;
            ctx.lineTo(sx2,sy2);
        }
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

// capture a single frame from the video
function captureFrame(){
    if(!video.videoWidth) return null;
    const w = video.videoWidth;
    const h = video.videoHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.filter = currentFilter;
    ctx.drawImage(video, 0, 0, w, h);
    drawStickerOnCtx(ctx, w, h);
    return canvas.toDataURL('image/png');
}

async function captureSession(){
    const layout = layoutMap[currentLayout];
    const total = layout.poses;
    const poses = [];
    // Show pose indicator
    poseIndicator.classList.remove('hidden');
    for(let i=1;i<=total;i++){
        poseIndicator.textContent = `${i}/${total}`;
        // countdown per pose
        const secs = parseInt(countdownSelect.value, 10) || 0;
        if(secs > 0){
            countdownEl.classList.remove('hidden');
            let counter = secs;
            countdownEl.textContent = counter;
            await new Promise(res=>{
                const t = setInterval(()=>{
                    counter--;
                    if(counter<=0){
                        clearInterval(t);
                        countdownEl.classList.add('hidden');
                        res();
                    } else {
                        countdownEl.textContent = counter;
                    }
                },1000);
            });
        }
        // capture
        const dataUrl = captureFrame();
        if(dataUrl) poses.push(dataUrl);
        // update layout preview
        updateLayoutPreview(poses, layout);
        // small pause between poses
        await new Promise(r=>setTimeout(r,300));
    }
    poseIndicator.classList.add('hidden');
    // assemble composite
    const composite = await assembleComposite(poses, layout);
    lastPhotoDataUrl = composite;
    downloadLast.disabled = false;
    gallery.unshift(composite);
    renderGallery();
}

function updateLayoutPreview(poses, layout){
    if(!layoutCanvas) return;
    const ctx = layoutCanvas.getContext('2d');
    ctx.clearRect(0,0,layoutCanvas.width, layoutCanvas.height);
    const cols = layout.cols, rows = layout.rows;
    const cellW = layoutCanvas.width / cols;
    const cellH = layoutCanvas.height / rows;
    poses.forEach((d,i)=>{
        const img = new Image();
        img.onload = ()=>{
            const col = i % cols;
            const row = Math.floor(i / cols);
            ctx.drawImage(img, col*cellW, row*cellH, cellW, cellH);
            // white borders
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 2; ctx.strokeRect(col*cellW, row*cellH, cellW, cellH);
        };
        img.src = d;
    });
}

// assemble poses into one final image according to layout
function assembleComposite(posesDataUrls, layout){
    return new Promise((resolve)=>{
        if(posesDataUrls.length === 0) return resolve(null);
        const first = new Image();
        first.onload = ()=>{
            const w = first.width;
            const h = first.height;
            const cols = layout.cols, rows = layout.rows;
            const canvas = document.createElement('canvas');
            // make composite canvas width based on cols * w, height rows * h
            canvas.width = w * cols;
            canvas.height = h * rows;
            const ctx = canvas.getContext('2d');
            // fill white background
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width, canvas.height);
            // draw each pose
            posesDataUrls.forEach((d,i)=>{
                const img = new Image();
                img.onload = ()=>{
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    ctx.drawImage(img, col*w, row*h, w, h);
                    // when last drawn, resolve
                    if(i === posesDataUrls.length - 1) resolve(canvas.toDataURL('image/png'));
                };
                img.src = d;
            });
        };
        first.src = posesDataUrls[0];
    });
}

function renderGallery(){
    galleryList.innerHTML = '';
    gallery.forEach((dataUrl, idx)=>{
        const div = document.createElement('div');
        div.className = 'thumb';
        const img = document.createElement('img'); img.src = dataUrl; img.alt = 'foto';
        const actions = document.createElement('div'); actions.className = 'actions';
        const dl = document.createElement('button'); dl.textContent = 'Download';
        dl.onclick = ()=>downloadDataUrl(dataUrl, `joyframe-${idx+1}.png`);
        const del = document.createElement('button'); del.textContent = 'Hapus';
        del.onclick = ()=>{ gallery.splice(idx,1); renderGallery(); if(gallery.length===0) downloadLast.disabled=true; };
        actions.appendChild(dl); actions.appendChild(del);
        div.appendChild(img); div.appendChild(actions);
        galleryList.appendChild(div);
    });
}

function downloadDataUrl(dataUrl, filename){
    const a = document.createElement('a');
    a.href = dataUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}

// layout selection
document.querySelectorAll('.layout-thumb').forEach(b=>{
    b.addEventListener('click', ()=>{
        document.querySelectorAll('.layout-thumb').forEach(x=>x.classList.remove('selected'));
        b.classList.add('selected');
        currentLayout = b.dataset.layout;
        // clear preview canvas
        if(layoutCanvas) layoutCanvas.getContext('2d').clearRect(0,0,layoutCanvas.width, layoutCanvas.height);
    });
});

captureBtn.addEventListener('click', ()=>{ captureSession(); });
filterSelect.addEventListener('change', (e)=>{ setFilter(e.target.value); });

document.querySelectorAll('.sticker-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
        selectedSticker = b.dataset.sticker;
        const ctx = overlayCanvas.getContext('2d');
        ctx.clearRect(0,0,overlayCanvas.width, overlayCanvas.height);
        drawStickerOnCtx(ctx, overlayCanvas.width, overlayCanvas.height);
        setTimeout(()=>ctx.clearRect(0,0,overlayCanvas.width, overlayCanvas.height),800);
    });
});

document.getElementById('removeSticker').addEventListener('click', ()=>{
    selectedSticker = null; overlayCanvas.getContext('2d').clearRect(0,0,overlayCanvas.width, overlayCanvas.height);
});

downloadLast.addEventListener('click', ()=>{ if(lastPhotoDataUrl) downloadDataUrl(lastPhotoDataUrl, 'joyframe-last.png'); });

clearGalleryBtn.addEventListener('click', ()=>{ gallery.length = 0; renderGallery(); downloadLast.disabled = true; });

window.addEventListener('load', ()=>{ setFilter(currentFilter); startCamera(); });
