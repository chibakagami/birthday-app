/* ===== Birthday Storage (localStorage) ===== */
const STORAGE_KEY = 'birthdays_v1';

function loadBirthdays() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function saveBirthdays(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function addBirthday(data) {
  const list = loadBirthdays();
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    name: data.name.trim(),
    month: parseInt(data.month),
    day: parseInt(data.day),
    year: data.year ? parseInt(data.year) : null,
    emoji: data.emoji || '🎂',
    message: data.message ? data.message.trim() : '',
    createdAt: Date.now(),
  };
  list.push(entry);
  saveBirthdays(list);
  return entry;
}

function updateBirthday(id, data) {
  const list = loadBirthdays();
  const idx = list.findIndex(b => b.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data, id };
  saveBirthdays(list);
  return list[idx];
}

function deleteBirthday(id) {
  const list = loadBirthdays().filter(b => b.id !== id);
  saveBirthdays(list);
}

function getBirthday(id) {
  return loadBirthdays().find(b => b.id === id) || null;
}

/* Days until next birthday from today */
function daysUntilBirthday(month, day) {
  const now = new Date();
  const thisYear = now.getFullYear();
  let next = new Date(thisYear, month - 1, day, 0, 0, 0, 0);
  if (next <= now) next = new Date(thisYear + 1, month - 1, day, 0, 0, 0, 0);
  const diff = next - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* Check if today is the birthday */
function isBirthdayToday(month, day) {
  const now = new Date();
  return now.getMonth() + 1 === month && now.getDate() === day;
}

/* Sort by nearest birthday */
function sortedBirthdays() {
  return loadBirthdays().slice().sort((a, b) => {
    if (isBirthdayToday(a.month, a.day)) return -1;
    if (isBirthdayToday(b.month, b.day)) return 1;
    return daysUntilBirthday(a.month, a.day) - daysUntilBirthday(b.month, b.day);
  });
}

/* Next birthday date object */
function nextBirthdayDate(month, day) {
  const now = new Date();
  const y = now.getFullYear();
  let d = new Date(y, month - 1, day, 0, 0, 0, 0);
  if (d <= now) d = new Date(y + 1, month - 1, day, 0, 0, 0, 0);
  return d;
}

/* Milliseconds until next birthday */
function msUntilBirthday(month, day) {
  return nextBirthdayDate(month, day) - Date.now();
}

/* Format month/day as locale string */
function formatDate(month, day, year) {
  const d = new Date(year || 2000, month - 1, day);
  const opts = { month: 'long', day: 'numeric' };
  if (year) opts.year = 'numeric';
  return d.toLocaleDateString('zh-TW', opts);
}

/* Year progress: how much of the year between last birthday and next birthday has passed */
function yearProgress(month, day) {
  const now = Date.now();
  const next = nextBirthdayDate(month, day).getTime();
  const thisY = new Date().getFullYear();
  const last = new Date(thisY, month - 1, day, 0, 0, 0, 0);
  if (last > now) last.setFullYear(thisY - 1);
  const total = next - last.getTime();
  const elapsed = now - last.getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}
