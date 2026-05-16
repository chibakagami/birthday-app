/* ===== Birthday Cake SVG + Candle Interaction ===== */

function buildCakeSVG(candleCount = 5) {
  const W = 220, H = 200;
  const cakeColors = {
    base1: '#e91e8c', base2: '#c2185b',
    tier1: '#ff6b9d', tier2: '#e91e8c',
    tier1b: '#ff4081', tier2b: '#c2185b',
    cream: '#fff9c4', plate: '#f8bbd0',
    candle: ['#ff6b9d','#ffd700','#a78bfa','#60efff','#ff8c00'],
    flame: '#ffd700', flameTip: '#ff6b00',
    smoke: 'rgba(200,200,200,0.6)',
  };

  /* Build candles */
  const candleSpacing = 22;
  const startX = W / 2 - ((candleCount - 1) * candleSpacing) / 2;
  const candleY = 68;

  let candlesHTML = '';
  for (let i = 0; i < candleCount; i++) {
    const cx = startX + i * candleSpacing;
    const color = cakeColors.candle[i % cakeColors.candle.length];
    candlesHTML += `
      <g class="candle-group" data-candle="${i}">
        <!-- Candle body -->
        <rect x="${cx - 4}" y="${candleY}" width="8" height="22" rx="2" fill="${color}" />
        <!-- Wax drip -->
        <ellipse cx="${cx}" cy="${candleY + 22}" rx="5" ry="3" fill="${color}" opacity="0.6" />
        <!-- Wick -->
        <line x1="${cx}" y1="${candleY - 1}" x2="${cx}" y2="${candleY + 3}" stroke="#333" stroke-width="1.5" />
        <!-- Flame group -->
        <g class="flame-group" data-flame="${i}">
          <!-- Outer flame -->
          <ellipse class="flame" cx="${cx}" cy="${candleY - 10}" rx="5" ry="9"
            fill="${cakeColors.flame}" opacity="0.9" />
          <!-- Inner flame -->
          <ellipse class="flame" cx="${cx}" cy="${candleY - 8}" rx="3" ry="6"
            fill="${cakeColors.flameTip}" opacity="0.8" />
          <!-- Tip glow -->
          <ellipse cx="${cx}" cy="${candleY - 18}" rx="2" ry="2"
            fill="white" opacity="0.7" />
        </g>
        <!-- Smoke (hidden until blown) -->
        <g class="smoke-group" data-smoke="${i}" style="display:none">
          <ellipse class="smoke" cx="${cx}" cy="${candleY - 2}" rx="3" ry="5"
            fill="${cakeColors.smoke}" />
          <ellipse class="smoke" cx="${cx + 2}" cy="${candleY - 8}" rx="3" ry="5"
            fill="${cakeColors.smoke}" opacity="0.7" />
        </g>
      </g>`;
  }

  return `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="cake-svg" id="cake-svg">
      <defs>
        <linearGradient id="cakeGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${cakeColors.tier1}" />
          <stop offset="100%" stop-color="${cakeColors.tier1b}" />
        </linearGradient>
        <linearGradient id="cakeGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${cakeColors.tier2}" />
          <stop offset="100%" stop-color="${cakeColors.tier2b}" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Plate -->
      <ellipse cx="${W/2}" cy="175" rx="88" ry="12" fill="${cakeColors.plate}" opacity="0.7" />

      <!-- Tier 2 (bottom) -->
      <rect x="30" y="130" width="160" height="48" rx="10" fill="url(#cakeGrad2)" />
      <!-- Tier 2 top ellipse -->
      <ellipse cx="${W/2}" cy="130" rx="80" ry="10" fill="${cakeColors.tier2}" />
      <!-- Tier 2 cream dots -->
      <g fill="${cakeColors.cream}" opacity="0.9">
        ${[45,75,105,135,165].map(x => `<circle cx="${x}" cy="128" r="5"/>`).join('')}
      </g>
      <!-- Tier 2 stripes -->
      <g stroke="rgba(255,255,255,0.15)" stroke-width="1">
        ${[50,80,110,140,165].map(x => `<line x1="${x}" y1="130" x2="${x}" y2="178"/>`).join('')}
      </g>

      <!-- Tier 1 (top) -->
      <rect x="55" y="90" width="110" height="44" rx="8" fill="url(#cakeGrad1)" />
      <!-- Tier 1 top ellipse -->
      <ellipse cx="${W/2}" cy="90" rx="55" ry="8" fill="${cakeColors.tier1}" />
      <!-- Tier 1 cream ring -->
      <ellipse cx="${W/2}" cy="88" rx="55" ry="8" fill="none" stroke="${cakeColors.cream}"
        stroke-width="3" stroke-dasharray="6 4" opacity="0.8" />
      <!-- Tier 1 stripes -->
      <g stroke="rgba(255,255,255,0.15)" stroke-width="1">
        ${[70,95,120,145].map(x => `<line x1="${x}" y1="90" x2="${x}" y2="134"/>`).join('')}
      </g>

      <!-- Stars decoration -->
      <g fill="${cakeColors.cream}" opacity="0.7" font-size="10">
        <text x="38" y="158">✦</text>
        <text x="170" y="158">✦</text>
        <text x="60" y="118">✦</text>
        <text x="148" y="118">✦</text>
      </g>

      <!-- Candles -->
      ${candlesHTML}
    </svg>`;
}

class CakeController {
  constructor(wrapEl, candleCount = 5) {
    this.wrapEl = wrapEl;
    this.totalCandles = candleCount;
    this.blownCount = 0;
    this.onAllBlown = null;
    this.render();
  }

  render() {
    this.wrapEl.innerHTML = buildCakeSVG(this.totalCandles);
    this.svg = this.wrapEl.querySelector('#cake-svg');
  }

  blowOne() {
    if (this.blownCount >= this.totalCandles) return;
    const idx = this.blownCount;
    const flameGroup = this.svg.querySelector(`[data-flame="${idx}"]`);
    const smokeGroup = this.svg.querySelector(`[data-smoke="${idx}"]`);

    if (flameGroup) {
      flameGroup.style.transition = 'opacity 0.3s';
      flameGroup.style.opacity = '0';
      setTimeout(() => { flameGroup.style.display = 'none'; }, 350);
    }
    if (smokeGroup) {
      smokeGroup.style.display = '';
      const smokes = smokeGroup.querySelectorAll('.smoke');
      smokes.forEach((s, i) => {
        setTimeout(() => s.classList.add('puffing'), i * 120);
      });
      setTimeout(() => { smokeGroup.style.display = 'none'; }, 1800);
    }

    this.blownCount++;
    if (this.blownCount >= this.totalCandles && this.onAllBlown) {
      setTimeout(() => this.onAllBlown(), 600);
    }
  }

  blowAll() {
    const remaining = this.totalCandles - this.blownCount;
    for (let i = 0; i < remaining; i++) {
      setTimeout(() => this.blowOne(), i * 200);
    }
  }

  isAllBlown() { return this.blownCount >= this.totalCandles; }
  reset() {
    this.blownCount = 0;
    this.render();
  }
}

/* Simple Web Audio birthday jingle */
function playBirthdayChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 523.25, 587.33, 523.25, 698.46, 659.25];
    const durations = [0.25, 0.25, 0.5, 0.5, 0.5, 1.0];
    let time = ctx.currentTime + 0.1;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
      gain.gain.linearRampToValueAtTime(0, time + durations[i] - 0.05);
      osc.start(time);
      osc.stop(time + durations[i]);
      time += durations[i];
    });
  } catch (e) { /* AudioContext not available */ }
}
