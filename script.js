const video = document.getElementById('video');
const overlayCanvas = document.getElementById('overlayCanvas');
const captureBtn = document.getElementById('captureBtn');
const filterSelect = document.getElementById('filterSelect');
const countdownSelect = document.getElementById('countdownSelect');
const countdownEl = document.getElementById('countdown');
const galleryList = document.getElementById('galleryList');
const downloadLast = document.getElementById('downloadLast');
const clearGalleryBtn = document.getElementById('clearGallery');

let stream = null;
let currentFilter = 'none';
let selectedSticker = null;
let lastPhotoDataUrl = null;
const gallery = [];

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
}

function setFilter(filter){
	currentFilter = filter;
	video.style.filter = filter;
}

function drawStickerOnCtx(ctx, w, h){
	if(!selectedSticker) return;
	ctx.save();
	const size = Math.min(w,h) * 0.28;
	const x = w - size - 16;
	const y = h - size - 16;
	if(selectedSticker === 'heart'){
		ctx.fillStyle = 'rgba(255,60,110,0.9)';
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

function capture(){
	if(!video.videoWidth) return;
	const w = video.videoWidth;
	const h = video.videoHeight;
	const canvas = document.createElement('canvas');
	canvas.width = w; canvas.height = h;
	const ctx = canvas.getContext('2d');
	ctx.filter = currentFilter;
	ctx.drawImage(video, 0, 0, w, h);
	drawStickerOnCtx(ctx, w, h);
	const dataUrl = canvas.toDataURL('image/png');
	lastPhotoDataUrl = dataUrl;
	downloadLast.disabled = false;
	gallery.unshift(dataUrl);
	renderGallery();
}

function startCountdownThenCapture(){
	const secs = parseInt(countdownSelect.value,10) || 0;
	if(secs <= 0){ capture(); return; }
	countdownEl.classList.remove('hidden');
	let counter = secs;
	countdownEl.textContent = counter;
	const t = setInterval(()=>{
		counter--;
		if(counter <= 0){
			clearInterval(t);
			countdownEl.classList.add('hidden');
			capture();
		} else {
			countdownEl.textContent = counter;
		}
	},1000);
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
	const a = document.createElement('a'); a.href = dataUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}

// UI wiring
captureBtn.addEventListener('click', ()=>{ startCountdownThenCapture(); });
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
document.getElementById('removeSticker').addEventListener('click', ()=>{ selectedSticker = null; overlayCanvas.getContext('2d').clearRect(0,0,overlayCanvas.width, overlayCanvas.height);} );

downloadLast.addEventListener('click', ()=>{ if(lastPhotoDataUrl) downloadDataUrl(lastPhotoDataUrl, 'joyframe-last.png'); });
clearGalleryBtn.addEventListener('click', ()=>{ gallery.length = 0; renderGallery(); downloadLast.disabled = true; });

window.addEventListener('load', ()=>{ setFilter(currentFilter); startCamera(); });
