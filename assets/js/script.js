document.addEventListener('DOMContentLoaded', function(){
	// ...existing code for menu toggle...
	const menuToggle = document.getElementById('menu-toggle');
	const nav = document.getElementById('nav');
	menuToggle && menuToggle.addEventListener('click', () => {
		const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
		menuToggle.setAttribute('aria-expanded', String(!expanded));
		nav.style.display = expanded ? '' : 'block';
	});

	// Booking form
	const form = document.getElementById('booking-form');
	const msg = document.getElementById('form-msg');
	form && form.addEventListener('submit', function(e){
		e.preventDefault();
		msg.textContent = 'Permintaan booking terkirim. Kami akan menghubungi Anda segera.';
		msg.classList.add('success');
		form.reset();
		setTimeout(()=> msg.classList.remove('success'), 4000);
	});

	// Lightbox gallery
	const images = Array.from(document.querySelectorAll('.gallery-grid img'));
	const lightbox = document.getElementById('lightbox');
	const lbImg = lightbox.querySelector('.lightbox-img');
	const lbClose = lightbox.querySelector('.lightbox-close');
	const lbPrev = lightbox.querySelector('.lightbox-prev');
	const lbNext = lightbox.querySelector('.lightbox-next');
	let current = -1;

	function openLightbox(idx){
		current = idx;
		const src = images[current].getAttribute('data-large') || images[current].src;
		lbImg.src = src;
		lbImg.alt = images[current].alt || '';
		lightbox.setAttribute('aria-hidden', 'false');
	}
	function closeLightbox(){ lightbox.setAttribute('aria-hidden','true'); lbImg.src=''; current = -1; }

	images.forEach((img, i) => img.addEventListener('click', () => openLightbox(i)));
	lbClose.addEventListener('click', closeLightbox);
	lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
	lbPrev.addEventListener('click', (e) => { e.stopPropagation(); if (current > 0) openLightbox(current - 1); });
	lbNext.addEventListener('click', (e) => { e.stopPropagation(); if (current < images.length - 1) openLightbox(current + 1); });
	document.addEventListener('keydown', (e) => {
		if (lightbox.getAttribute('aria-hidden') === 'false') {
			if (e.key === 'Escape') closeLightbox();
			if (e.key === 'ArrowLeft' && current > 0) openLightbox(current - 1);
			if (e.key === 'ArrowRight' && current < images.length -1) openLightbox(current + 1);
		}
	});
});
