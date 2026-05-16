/* ===== Confetti Canvas Effect ===== */
class ConfettiSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.running = false;
    this.raf = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawn(count = 6) {
    const colors = ['#ff6b9d','#ffd700','#a78bfa','#60efff','#ff8c00','#ff4d8d','#7fff00','#ff69b4'];
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 6 + Math.random() * 8;
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -10 - Math.random() * 40,
        w: size,
        h: size * 0.4,
        color,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.15,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        opacity: 1,
        life: 1,
      });
    }
  }

  update() {
    this.particles = this.particles.filter(p => p.opacity > 0.05);
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.vx += (Math.random() - 0.5) * 0.05;
      p.angle += p.spin;
      if (p.y > this.canvas.height - 60) {
        p.opacity -= 0.04;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.angle);
      this.ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      this.ctx.restore();
    }
  }

  start() {
    this.running = true;
    this.spawnInterval = setInterval(() => this.spawn(8), 150);
    const loop = () => {
      if (!this.running) return;
      this.update();
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    this.running = false;
    clearInterval(this.spawnInterval);
    cancelAnimationFrame(this.raf);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = [];
  }
}
