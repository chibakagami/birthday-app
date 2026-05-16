/* ===== Countdown Page Controller ===== */

class CountdownController {
  constructor(birthday) {
    this.birthday = birthday;
    this.timer = null;
    this.prevValues = {};
  }

  mount(container) {
    this.container = container;
    this.render();
    this.start();
  }

  render() {
    const b = this.birthday;
    const age = this.upcomingAge();
    const ageChip = (b.year && age)
      ? `<div class="cd-age-chip">🎂 即將 <strong>${age}</strong> 歲</div>`
      : '';

    const dateStr = formatDate(b.month, b.day, null);

    this.container.innerHTML = `
      <div class="countdown-header">
        <button class="back-btn" id="cd-back">←</button>
      </div>
      <div class="countdown-person">
        <div class="cd-avatar">${b.emoji}</div>
        <div>
          <div class="cd-name">${escapeHTML(b.name)}</div>
          <div class="cd-label">的生日還有 <span id="cd-days-label">...</span></div>
        </div>
        ${ageChip}
        <div class="progress-ring-wrap">
          <svg class="progress-ring-svg" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ff6b9d"/>
                <stop offset="100%" stop-color="#a78bfa"/>
              </linearGradient>
            </defs>
            <circle class="progress-ring-bg" cx="80" cy="80" r="70"/>
            <circle class="progress-ring-fill" id="cd-ring" cx="80" cy="80" r="70"
              stroke-dasharray="439.82" stroke-dashoffset="439.82"/>
          </svg>
          <div class="progress-ring-center">
            <div class="progress-percent" id="cd-pct">0%</div>
            <div class="progress-text">已過去</div>
          </div>
        </div>

        <div class="flip-clock" id="cd-clock">
          ${this.buildClockHTML()}
        </div>

        <div class="cd-date-row">生日日期：<strong>${dateStr}</strong></div>
      </div>`;

    document.getElementById('cd-back').addEventListener('click', () => {
      showPage('home');
    });

    this.updateDisplay();
  }

  buildClockHTML() {
    return `
      <div class="flip-unit days">
        <div class="flip-group">
          <div class="flip-card" id="cd-d0"><div class="flip-card-inner"><div class="flip-front">0</div></div></div>
          <div class="flip-card" id="cd-d1"><div class="flip-card-inner"><div class="flip-front">0</div></div></div>
          <div class="flip-card" id="cd-d2"><div class="flip-card-inner"><div class="flip-front">0</div></div></div>
        </div>
        <div class="flip-unit-label">天</div>
      </div>
      <div class="flip-colon">:</div>
      <div class="flip-unit">
        <div class="flip-group">
          <div class="flip-card" id="cd-h0"><div class="flip-card-inner"><div class="flip-front">0</div></div></div>
          <div class="flip-card" id="cd-h1"><div class="flip-card-inner"><div class="flip-front">0</div></div></div>
        </div>
        <div class="flip-unit-label">時</div>
      </div>
      <div class="flip-colon">:</div>
      <div class="flip-unit">
        <div class="flip-group">
          <div class="flip-card" id="cd-m0"><div class="flip-card-inner"><div class="flip-front">0</div></div></div>
          <div class="flip-card" id="cd-m1"><div class="flip-card-inner"><div class="flip-front">0</div></div></div>
        </div>
        <div class="flip-unit-label">分</div>
      </div>
      <div class="flip-colon">:</div>
      <div class="flip-unit">
        <div class="flip-group">
          <div class="flip-card" id="cd-s0"><div class="flip-card-inner"><div class="flip-front">0</div></div></div>
          <div class="flip-card" id="cd-s1"><div class="flip-card-inner"><div class="flip-front">0</div></div></div>
        </div>
        <div class="flip-unit-label">秒</div>
      </div>`;
  }

  updateDisplay() {
    const ms = msUntilBirthday(this.birthday.month, this.birthday.day);
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    const dStr = String(d).padStart(3, '0');
    const hStr = String(h).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    const sStr = String(s).padStart(2, '0');

    this.setFlip('cd-d0', dStr[0]);
    this.setFlip('cd-d1', dStr[1]);
    this.setFlip('cd-d2', dStr[2]);
    this.setFlip('cd-h0', hStr[0]);
    this.setFlip('cd-h1', hStr[1]);
    this.setFlip('cd-m0', mStr[0]);
    this.setFlip('cd-m1', mStr[1]);
    this.setFlip('cd-s0', sStr[0]);
    this.setFlip('cd-s1', sStr[1]);

    const daysLabel = document.getElementById('cd-days-label');
    if (daysLabel) daysLabel.textContent = `${d} 天`;

    /* Progress ring */
    const ring = document.getElementById('cd-ring');
    const pctEl = document.getElementById('cd-pct');
    const prog = yearProgress(this.birthday.month, this.birthday.day);
    const circumference = 2 * Math.PI * 70;
    if (ring) ring.style.strokeDashoffset = circumference * (1 - prog);
    if (pctEl) pctEl.textContent = Math.round(prog * 100) + '%';
  }

  setFlip(id, digit) {
    const card = document.getElementById(id);
    if (!card) return;
    const front = card.querySelector('.flip-front');
    if (!front) return;

    if (this.prevValues[id] !== digit) {
      front.textContent = digit;
      card.classList.remove('flip');
      void card.offsetWidth; /* reflow to restart animation */
      card.classList.add('flip');
      this.prevValues[id] = digit;
    }
  }

  start() {
    this.timer = setInterval(() => this.updateDisplay(), 1000);
  }

  stop() {
    clearInterval(this.timer);
  }

  upcomingAge() {
    if (!this.birthday.year) return null;
    const nextYear = nextBirthdayDate(this.birthday.month, this.birthday.day).getFullYear();
    return nextYear - this.birthday.year;
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
