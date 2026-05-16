/* ===== Fireworks Canvas Effect ===== */
class FireworksSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rockets = [];
    this.sparks = [];
    this.running = false;
    this.raf = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  launchRocket() {
    const x = 0.15 * this.canvas.width + Math.random() * this.canvas.width * 0.7;
    const targetY = 0.1 * this.canvas.height + Math.random() * this.canvas.height * 0.45;
    this.rockets.push({
      x,
      y: this.canvas.height,
      targetY,
      speed: 8 + Math.random() * 6,
      color: this.randomColor(),
      trail: [],
    });
  }

  explode(x, y, color) {
    const count = 60 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = 1.5 + Math.random() * 4;
      this.sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        radius: 1.5 + Math.random() * 2,
        gravity: 0.08,
      });
    }
    /* Star burst extras */
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.sparks.push({
        x, y,
        vx: Math.cos(angle) * (6 + Math.random() * 3),
        vy: Math.sin(angle) * (6 + Math.random() * 3),
        alpha: 1,
        color: '#ffffff',
        radius: 2,
        gravity: 0.12,
      });
    }
  }

  randomColor() {
    const colors = ['#ff6b9d','#ffd700','#a78bfa','#60efff','#ff4500','#00ff99','#ff69b4','#ffb347'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    /* Rockets */
    this.rockets = this.rockets.filter(r => {
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 8) r.trail.shift();
      r.y -= r.speed;
      if (r.y <= r.targetY) {
        this.explode(r.x, r.y, r.color);
        return false;
      }
      return true;
    });

    /* Sparks */
    this.sparks = this.sparks.filter(s => s.alpha > 0.02);
    for (const s of this.sparks) {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += s.gravity;
      s.vx *= 0.98;
      s.alpha -= 0.015;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    /* Rockets + trails */
    for (const r of this.rockets) {
      for (let i = 0; i < r.trail.length; i++) {
        const t = r.trail[i];
        const ratio = i / r.trail.length;
        this.ctx.globalAlpha = ratio * 0.8;
        this.ctx.fillStyle = r.color;
        const sz = 2 + ratio * 3;
        this.ctx.beginPath();
        this.ctx.arc(t.x, t.y, sz, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    /* Sparks */
    for (const s of this.sparks) {
      this.ctx.globalAlpha = s.alpha;
      this.ctx.fillStyle = s.color;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  start() {
    this.running = true;
    this.launchRocket();
    this.launchInterval = setInterval(() => {
      if (this.running) this.launchRocket();
    }, 1200 + Math.random() * 800);

    const loop = () => {
      if (!this.running) return;
      if (!document.hidden) {
        this.update();
        this.draw();
      }
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    this.running = false;
    clearInterval(this.launchInterval);
    cancelAnimationFrame(this.raf);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.rockets = [];
    this.sparks = [];
  }
}
