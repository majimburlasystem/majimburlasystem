const cards = document.querySelectorAll('.card');
const toast = document.getElementById('toast');

cards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -10;
    const rotateY = ((x / rect.width) - 0.5) * 12;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

document.querySelectorAll('.buy').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const name = e.target.closest('.card').dataset.item;
    toast.textContent = `${name} reservado. Confirme o trade no hub.`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  });
});

document.getElementById('flashPrices').addEventListener('click', () => {
  document.querySelectorAll('.card').forEach(card => {
    const base = Number(card.dataset.price);
    const factor = 1 + ((Math.random() * 1.8 - 0.9) / 100);
    const next = Math.max(1, Math.round(base * factor));
    card.querySelector('.price').textContent = `R$ ${next.toLocaleString('en-US')}`;
  });
  toast.textContent = 'Preços atualizados com base na volatilidade do mercado.';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
});

document.getElementById('openMarket').addEventListener('click', () => {
  document.getElementById('itemGrid').scrollIntoView({ behavior: 'smooth' });
});

const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initParticles() {
  const count = Math.min(80, Math.floor(window.innerWidth / 18));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.8 + 0.4,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
  }));
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(98, 219, 255, 0.75)';
    ctx.fill();
  });

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 110) {
        ctx.strokeStyle = `rgba(98, 219, 255, ${(1 - dist / 110) * 0.22})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  initParticles();
});

resizeCanvas();
initParticles();
drawParticles();
