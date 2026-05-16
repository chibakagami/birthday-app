/* ===== App Main Controller ===== */

/* ---- Global state ---- */
let currentCountdown = null;
let confettiSys = null;
let fireworksSys = null;
let cakeCtrl = null;

/* ---- Page switching ---- */
function showPage(name, data) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${name}`);
  if (!page) return;
  void page.offsetWidth; /* force reflow to restart animation */
  page.classList.add('active');

  if (currentCountdown) { currentCountdown.stop(); currentCountdown = null; }
  if (name !== 'celebrate') stopCelebration();

  if (name === 'countdown' && data) startCountdown(data);
  if (name === 'celebrate' && data) startCelebration(data);
  if (name === 'home') renderHome();
}

/* ---- Home page ---- */
function renderHome() {
  const list = sortedBirthdays();
  const container = document.getElementById('birthday-list');
  container.innerHTML = '';

  /* Today banner */
  const todayBdays = list.filter(b => isBirthdayToday(b.month, b.day));
  const bannerWrap = document.getElementById('today-banner-wrap');
  if (todayBdays.length > 0) {
    const names = todayBdays.map(b => b.name).join('、');
    bannerWrap.innerHTML = `
      <div class="today-banner" id="today-banner-click">
        <div class="today-banner-icon">🎉</div>
        <div class="today-banner-text">
          <h4>今天是生日！</h4>
          <p>${escapeHTML(names)} 生日快樂 🎂</p>
        </div>
      </div>`;
    document.getElementById('today-banner-click').addEventListener('click', () => {
      showPage('celebrate', todayBdays[0]);
    });
  } else {
    bannerWrap.innerHTML = '';
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🎂</span>
        <h3>還沒有生日紀錄</h3>
        <p>點擊右下角 <strong>+</strong> 開始新增<br>親友的生日吧！</p>
      </div>`;
    return;
  }

  /* Section: today */
  const upcoming = list.filter(b => !isBirthdayToday(b.month, b.day));
  const todays = list.filter(b => isBirthdayToday(b.month, b.day));

  if (todays.length > 0) {
    container.insertAdjacentHTML('beforeend', sectionHeader('🎊 今天生日'));
    todays.forEach((b, i) => container.appendChild(buildCard(b, i)));
  }
  if (upcoming.length > 0) {
    container.insertAdjacentHTML('beforeend', sectionHeader('📅 即將到來'));
    upcoming.forEach((b, i) => container.appendChild(buildCard(b, i + todays.length)));
  }
}

function sectionHeader(title) {
  const div = document.createElement('div');
  div.className = 'section-header';
  div.innerHTML = `<div class="section-title">${title}</div><div class="section-line"></div>`;
  return div.outerHTML;
}

function buildCard(b, idx) {
  const isToday = isBirthdayToday(b.month, b.day);
  const days = isToday ? 0 : daysUntilBirthday(b.month, b.day);
  const dateStr = formatDate(b.month, b.day, null);
  let badgeHTML, daysHTML;

  if (isToday) {
    badgeHTML = `<span class="card-badge badge-today">🎉 今天生日！</span>`;
    daysHTML = `<div class="card-today-text">🎂</div>`;
  } else if (days <= 7) {
    badgeHTML = `<span class="card-badge badge-soon">⏰ ${days} 天後</span>`;
    daysHTML = `<div class="card-days-number"><div class="days-num">${days}</div><div class="days-label">天後</div></div>`;
  } else {
    badgeHTML = `<span class="card-badge badge-later">📅 ${days} 天後</span>`;
    daysHTML = `<div class="card-days-number"><div class="days-num">${days}</div><div class="days-label">天後</div></div>`;
  }

  const card = document.createElement('div');
  card.className = `birthday-card${isToday ? ' is-today' : ''}`;
  card.style.animationDelay = `${idx * 60}ms`;
  card.innerHTML = `
    <div class="card-row">
      <div class="card-avatar">${b.emoji}</div>
      <div class="card-info">
        <div class="card-name">${escapeHTML(b.name)}</div>
        <div class="card-date">${dateStr}</div>
        ${badgeHTML}
      </div>
      ${daysHTML}
    </div>
    <div class="card-actions">
      ${isToday ? `<button class="card-action-btn celebrate" title="慶祝！" data-action="celebrate" data-id="${b.id}">🎉</button>` : ''}
      <button class="card-action-btn" title="倒數" data-action="countdown" data-id="${b.id}">⏱</button>
      <button class="card-action-btn" title="編輯" data-action="edit" data-id="${b.id}">✏️</button>
      <button class="card-action-btn delete" title="刪除" data-action="delete" data-id="${b.id}">🗑</button>
    </div>`;

  /* Card click → countdown (not on action buttons) */
  card.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
      if (isToday) showPage('celebrate', b);
      else showPage('countdown', b);
      return;
    }
    const action = btn.dataset.action;
    if (action === 'countdown') showPage('countdown', b);
    else if (action === 'celebrate') showPage('celebrate', b);
    else if (action === 'edit') openModal(b);
    else if (action === 'delete') confirmDelete(b);
  });

  addRipple(card);
  return card;
}

/* ---- Countdown page ---- */
function startCountdown(birthday) {
  const container = document.getElementById('countdown-content');
  container.innerHTML = '';
  currentCountdown = new CountdownController(birthday);
  currentCountdown.mount(container);
}

/* ---- Celebrate page ---- */
function startCelebration(birthday) {
  const b = birthday;

  /* Heading */
  document.getElementById('cel-title').innerHTML = '🎉 生日快樂！';
  document.getElementById('cel-name').innerHTML = `<span>${escapeHTML(b.name)}</span>`;

  const msg = b.message || '願你的每一天都充滿喜悅和幸福！';
  document.getElementById('cel-message').textContent = msg;

  /* Age */
  const ageEl = document.getElementById('cel-age');
  if (b.year) {
    const age = new Date().getFullYear() - b.year;
    ageEl.innerHTML = `今天 <strong>${age}</strong> 歲生日快樂！`;
    ageEl.style.display = '';
  } else {
    ageEl.style.display = 'none';
  }

  /* Wish reveal */
  document.getElementById('cel-wish').classList.remove('show');

  /* Cake */
  const cakeWrap = document.getElementById('cake-wrap');
  cakeCtrl = new CakeController(cakeWrap, 5);
  cakeCtrl.onAllBlown = () => {
    document.getElementById('cel-wish').classList.add('show');
    playBirthdayChime();
    document.getElementById('blow-btn').disabled = true;
  };

  /* Blow button */
  const blowBtn = document.getElementById('blow-btn');
  blowBtn.disabled = false;
  blowBtn.onclick = () => {
    cakeCtrl.blowOne();
    if (cakeCtrl.isAllBlown()) blowBtn.disabled = true;
  };

  /* Balloons */
  buildBalloons();

  /* Music notes */
  buildNotes();

  /* Start canvas effects */
  confettiSys = new ConfettiSystem(document.getElementById('confetti-canvas'));
  fireworksSys = new FireworksSystem(document.getElementById('fireworks-canvas'));
  confettiSys.start();
  fireworksSys.start();

  /* Sparkles around cake */
  buildSparkles();
}

function stopCelebration() {
  if (confettiSys) { confettiSys.stop(); confettiSys = null; }
  if (fireworksSys) { fireworksSys.stop(); fireworksSys = null; }
}

function buildBalloons() {
  const layer = document.getElementById('balloons-layer');
  layer.innerHTML = '';
  const colors = ['#ff6b9d','#ffd700','#a78bfa','#60efff','#ff8c00','#7fff00','#ff69b4','#00bfff'];
  for (let i = 0; i < 12; i++) {
    const color = colors[i % colors.length];
    const x = 5 + Math.random() * 90;
    const dur = 6 + Math.random() * 6;
    const delay = Math.random() * 8;
    const size = 36 + Math.random() * 24;
    const b = document.createElement('div');
    b.className = 'balloon';
    b.style.cssText = `left:${x}%;--dur:${dur}s;--delay:${delay}s`;
    b.innerHTML = `<svg width="${size}" height="${size * 1.3}" viewBox="0 0 50 65">
      <ellipse cx="25" cy="22" rx="22" ry="20" fill="${color}" opacity="0.85"/>
      <ellipse cx="18" cy="14" rx="7" ry="6" fill="white" opacity="0.25"/>
      <path d="M25 42 Q28 50 25 55 Q22 50 25 42" fill="${color}" opacity="0.7"/>
      <line x1="25" y1="55" x2="25" y2="65" stroke="${color}" stroke-width="1.5" opacity="0.6"/>
    </svg>`;
    layer.appendChild(b);
  }
}

function buildNotes() {
  const layer = document.getElementById('notes-layer');
  layer.innerHTML = '';
  const notes = ['🎵','🎶','🎵','🎶','♪','♫'];
  for (let i = 0; i < 8; i++) {
    const note = document.createElement('span');
    note.className = 'music-note';
    const left = 10 + Math.random() * 80;
    const top = 30 + Math.random() * 50;
    const dur = 3 + Math.random() * 3;
    const delay = Math.random() * 5;
    const size = 1 + Math.random() * 0.6;
    note.style.cssText = `left:${left}%;top:${top}%;--dur:${dur}s;--delay:${delay}s;--size:${size}rem`;
    note.textContent = notes[i % notes.length];
    layer.appendChild(note);
  }
}

function buildSparkles() {
  const ring = document.getElementById('sparkle-ring');
  if (!ring) return;
  ring.innerHTML = '';
  const sparkColors = ['#ffd700','#ff6b9d','#a78bfa','#60efff','#ff8c00','#ffffff'];
  for (let i = 0; i < 6; i++) {
    const dot = document.createElement('div');
    dot.className = 'sparkle-dot';
    const color = sparkColors[i % sparkColors.length];
    const r = 80 + Math.random() * 20;
    const dur = 1.5 + Math.random() * 1.5;
    const delay = (i / 6) * 2;
    const startAngle = (360 / 6) * i;
    dot.style.cssText = `
      background: ${color};
      --r: ${r}px;
      --dur: ${dur}s;
      --delay: ${delay}s;
      top: 50%; left: 50%;
      margin: -4px 0 0 -4px;
      transform: rotate(${startAngle}deg) translateX(${r}px);
      box-shadow: 0 0 6px 2px ${color};
    `;
    ring.appendChild(dot);
  }
}

/* ---- Modal (Add / Edit) ---- */
const EMOJI_OPTIONS = ['🎂','🎈','🎁','⭐','🌸','🦋','🌈','🐱','🐶','🦊','🐸','🌺','🍰','🎀','💝','🌙'];

function openModal(birthday = null) {
  const isEdit = !!birthday;
  const modal = document.getElementById('modal-overlay');
  const form = document.getElementById('modal-form');

  document.getElementById('modal-title').textContent = isEdit ? '編輯生日' : '新增生日';
  document.getElementById('field-name').value = isEdit ? birthday.name : '';
  document.getElementById('field-month').value = isEdit ? birthday.month : '';
  document.getElementById('field-day').value = isEdit ? birthday.day : '';
  document.getElementById('field-year').value = isEdit && birthday.year ? birthday.year : '';
  document.getElementById('field-message').value = isEdit ? birthday.message : '';
  form.dataset.editId = isEdit ? birthday.id : '';

  /* Emoji picker */
  const picker = document.getElementById('emoji-picker');
  const selectedEmoji = isEdit ? birthday.emoji : '🎂';
  picker.innerHTML = EMOJI_OPTIONS.map(e =>
    `<button type="button" class="emoji-option${e === selectedEmoji ? ' selected' : ''}" data-emoji="${e}">${e}</button>`
  ).join('');
  picker.querySelectorAll('.emoji-option').forEach(btn => {
    btn.addEventListener('click', () => {
      picker.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  modal.classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function confirmDelete(birthday) {
  if (confirm(`確定要刪除「${birthday.name}」的生日嗎？`)) {
    deleteBirthday(birthday.id);
    renderHome();
    showToast(`已刪除 ${birthday.name} 的生日`);
  }
}

/* ---- Toast ---- */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ---- Ripple ---- */
function addRipple(el) {
  el.addEventListener('pointerdown', e => {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = size + 'px';
    r.style.left = (e.clientX - rect.left - size / 2) + 'px';
    r.style.top = (e.clientY - rect.top - size / 2) + 'px';
    el.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  });
}

/* ---- Background decorations ---- */
function buildBackgroundEffects() {
  /* Stars */
  const starsLayer = document.getElementById('stars-layer');
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = 1 + Math.random() * 2.5;
    star.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      --dur:${2 + Math.random() * 4}s;
      --delay:${Math.random() * 4}s;
    `;
    starsLayer.appendChild(star);
  }

  /* Floating emojis */
  const emojisLayer = document.getElementById('bg-emojis');
  const bgEmojis = ['🎂','🎈','🎁','⭐','🎀','🌸'];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'bg-emoji';
    const size = 18 + Math.random() * 24;
    el.style.cssText = `
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      --size:${size}px;
      --dur:${6 + Math.random() * 8}s;
      --delay:${Math.random() * 6}s;
    `;
    el.textContent = bgEmojis[i % bgEmojis.length];
    emojisLayer.appendChild(el);
  }

  /* Shooting stars */
  for (let i = 0; i < 4; i++) {
    const ss = document.createElement('div');
    ss.className = 'shooting-star';
    ss.style.cssText = `
      left:${Math.random() * 60}%;
      top:${10 + Math.random() * 40}%;
      --dur:${5 + Math.random() * 8}s;
      --delay:${Math.random() * 12}s;
    `;
    document.body.appendChild(ss);
  }
}

/* ---- Gift boxes jiggle ---- */
function setupGiftBoxes() {
  document.querySelectorAll('.gift-box').forEach(box => {
    box.addEventListener('click', () => {
      box.classList.remove('jiggle');
      void box.offsetWidth;
      box.classList.add('jiggle');
      box.addEventListener('animationend', () => box.classList.remove('jiggle'), { once: true });
    });
  });
}

/* ---- Init ---- */
function init() {
  buildBackgroundEffects();

  /* FAB */
  document.getElementById('fab').addEventListener('click', () => openModal());

  /* Modal form submit */
  document.getElementById('modal-form').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const selectedEmoji = document.querySelector('.emoji-option.selected');
    const data = {
      name: document.getElementById('field-name').value,
      month: document.getElementById('field-month').value,
      day: document.getElementById('field-day').value,
      year: document.getElementById('field-year').value,
      message: document.getElementById('field-message').value,
      emoji: selectedEmoji ? selectedEmoji.dataset.emoji : '🎂',
    };
    if (!data.name || !data.month || !data.day) {
      showToast('請填寫姓名和生日日期');
      return;
    }
    const m = parseInt(data.month), d = parseInt(data.day);
    if (m < 1 || m > 12 || d < 1 || d > 31) {
      showToast('日期格式不正確');
      return;
    }
    if (form.dataset.editId) {
      updateBirthday(form.dataset.editId, data);
      showToast(`已更新 ${data.name} 的生日`);
    } else {
      addBirthday(data);
      showToast(`已新增 ${data.name} 的生日 🎉`);
    }
    closeModal();
    renderHome();
  });

  /* Modal cancel */
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  /* Celebrate back */
  document.getElementById('cel-back').addEventListener('click', () => showPage('home'));

  /* Gift boxes */
  setupGiftBoxes();

  /* Check if today is someone's birthday → auto-go to celebrate */
  const todayBday = sortedBirthdays().find(b => isBirthdayToday(b.month, b.day));
  if (todayBday) {
    showPage('home'); /* show home first so user can navigate back */
  } else {
    showPage('home');
  }

  /* Register service worker */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
