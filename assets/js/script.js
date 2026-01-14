document.addEventListener('DOMContentLoaded', function(){
	const menuToggle = document.getElementById('menu-toggle');
	const nav = document.getElementById('nav');
	menuToggle && menuToggle.addEventListener('click', () => {
		const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
		menuToggle.setAttribute('aria-expanded', String(!expanded));
		nav.style.display = expanded ? '' : 'block';
	});

	const form = document.getElementById('booking-form');
	const msg = document.getElementById('form-msg');
	form && form.addEventListener('submit', function(e){
		e.preventDefault();
		// Demo: hanya tunjukkan pesan; integrasi backend terserah Anda
		msg.textContent = 'Permintaan booking terkirim. Kami akan menghubungi Anda segera.';
		form.reset();
	});
});
