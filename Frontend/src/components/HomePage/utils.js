// Canvas animation utility
export function initCanvasAnimation(canvasElementId) {
  const canvas = document.getElementById(canvasElementId);
  if (!canvas) return () => {};
  
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  let t = 0;
  let animationId = null;

  function draw() {
    ctx.clearRect(0, 0, w, h);
    t += 0.01;

    // Curve 1
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < w; x += 5) {
      const y = h / 2 + Math.sin(x * 0.01 + t) * 50;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Curve 2
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
    ctx.beginPath();
    for (let x = 0; x < w; x += 5) {
      const y = h / 2 + Math.cos(x * 0.02 - t) * 50 + 20;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Floating Box
    const boxX = Math.sin(t) * 100 + w / 2;
    const boxY = Math.cos(t * 1.5) * 50 + h / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(boxX - 30, boxY - 30, 60, 60);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(boxX - 30, boxY - 30, 60, 60);

    animationId = requestAnimationFrame(draw);
  }

  draw();

  // Return cleanup function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}

// Particle system initialization
export function initParticles(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const particleCount = 20;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 3;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.background = 'rgba(255,255,255,' + (Math.random() * 0.3 + 0.1) + ')';
    p.style.position = 'absolute';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.borderRadius = '50%';
    p.style.pointerEvents = 'none';

    const duration = Math.random() * 10 + 10;
    p.style.transition = `top ${duration}s linear, left ${duration}s linear`;

    container.appendChild(p);

    const intervalId = setInterval(() => {
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
    }, duration * 1000);

    particles.push({ element: p, intervalId });
  }

  // Return cleanup function
  return () => {
    particles.forEach(({ element, intervalId }) => {
      clearInterval(intervalId);
      element.remove();
    });
  };
}
